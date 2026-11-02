import { flushPromises } from "@vue/test-utils";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  providerBatch: vi.fn(),
  balanceBatch: vi.fn(),
  create: vi.fn(),
  importData: vi.fn(),
  exportData: vi.fn(),
  schema: vi.fn(),
  message: vi.fn(),
  addDialog: vi.fn(),
  resetFields: vi.fn(),
  downloadBlob: vi.fn(),
  filename: vi.fn(() => "supplier-balance.xlsx")
}));

vi.mock("@/api/business/provider", () => ({
  getProviderListApi: mocks.list,
  getProviderBatchApi: mocks.providerBatch
}));
vi.mock("@/api/data/initial-balance", () => ({
  createInitialBalanceApi: mocks.create,
  getInitialBalanceBatchApi: mocks.balanceBatch
}));
vi.mock("@/api/tools", () => ({
  exportDataApi: mocks.exportData,
  getExportSchemaApi: mocks.schema,
  importDataApi: mocks.importData
}));
vi.mock("@/composables/useDialogService", () => ({
  addDialog: mocks.addDialog
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message
}));
vi.mock("@/utils/download", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/download")>()),
  downloadBlob: mocks.downloadBlob,
  generateFilenameWithTimestamp: mocks.filename
}));

import SupplierBalance from "../index.vue";

function suppliers() {
  return [
    { id: 1, uid: "p1", name: "供应商一" },
    { uid: "p2", name: "供应商二" }
  ];
}

function prime() {
  mocks.list.mockResolvedValue({
    code: 200,
    data: { list: suppliers(), total: 2 }
  });
  mocks.providerBatch.mockResolvedValue({
    code: 200,
    data: [
      {
        id: 1,
        uid: "p1",
        name: "供应商详情",
        code: "S-1",
        phone: "13800000000"
      },
      { uid: "", name: "无标识供应商" },
      null
    ]
  });
  mocks.balanceBatch.mockResolvedValue({
    code: 200,
    data: [
      {
        id: 10,
        providerId: "p1",
        type: "provider-payable",
        amount: "12345",
        date: "2026-01-02T10:00:00.000Z",
        remark: "期初",
        createdAt: "2026-01-01"
      },
      {
        id: 11,
        providerId: "p1",
        type: "provider-prepaid",
        amount: null,
        date: null,
        remark: null,
        createdAt: null
      },
      {
        id: 12,
        providerId: null,
        type: "provider-prepaid",
        amount: 1,
        date: "2026-01-03"
      },
      { id: 13, providerId: "p2", type: "other", amount: 0 }
    ]
  });
  mocks.create.mockResolvedValue({ code: 200 });
  mocks.schema.mockResolvedValue({
    code: 200,
    data: {
      fields: [
        { key: "required", required: true },
        { key: "default", defaultSelected: true },
        { key: "optional" }
      ]
    }
  });
  mocks.exportData.mockResolvedValue(new Blob(["export"]));
  mocks.importData.mockResolvedValue({ code: 200 });
}

async function mountPage() {
  const wrapper = await mountSmokeComponent(
    () => import("../index.vue"),
    "data/supplierBalance/index.vue",
    {
      keepMounted: true,
      deep: true,
      globalStubs: {
        ReSearchForm: {
          expose: { resetFields: mocks.resetFields },
          template: "<div><slot /></div>"
        }
      }
    }
  );
  await flushPromises();
  return wrapper;
}

type Wrapper = Awaited<ReturnType<typeof mountPage>>;
const state = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;

function uploadOptions(overrides: Record<string, unknown> = {}) {
  return {
    file: new File(["row"], "rows.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    method: "POST",
    action: "/upload",
    onProgress: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
    ...overrides
  } as Record<string, any>;
}

beforeEach(() => {
  vi.clearAllMocks();
  prime();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("supplier balance page behavior", () => {
  it("maps suppliers and both balance types with fallbacks", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    expect(mocks.list).toHaveBeenCalledWith(1, { keyword: undefined });
    expect(mocks.providerBatch).toHaveBeenCalledWith(["p1", "p2"]);
    expect(mocks.balanceBatch).toHaveBeenCalledWith({
      providerIds: ["p1", "p2"],
      types: ["provider-payable", "provider-prepaid"]
    });
    expect(vm.dataList).toHaveLength(2);
    expect(vm.dataList[0]).toMatchObject({
      supplierName: "供应商详情",
      supplierCode: "S-1",
      phone: "13800000000",
      payableBalance: 123.45,
      prepaidBalance: 0,
      balanceDate: "2026-01-02",
      remark: "期初"
    });
    expect(vm.dataList[1]).toMatchObject({
      id: 0,
      supplierCode: "-",
      phone: "-",
      balanceDate: undefined,
      remark: "",
      createdAt: ""
    });
    expect(vm.statistics).toEqual({
      totalPayable: 123.45,
      totalPrepaid: 0,
      supplierCount: 2
    });
    wrapper.unmount();
  });

  it.each([
    ["supplier list", () => mocks.list],
    ["supplier batch", () => mocks.providerBatch],
    ["balance batch", () => mocks.balanceBatch]
  ])("uses safe fallbacks when %s fails", async (_name, getMock) => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    getMock().mockReset().mockResolvedValue({ code: 500, data: null });
    await vm.getList();
    expect(vm.loading).toBe(false);
    expect(vm.dataList.length).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it("falls back to list records when both batch lookups reject", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    mocks.providerBatch
      .mockReset()
      .mockRejectedValue(new Error("supplier batch"));
    mocks.balanceBatch
      .mockReset()
      .mockRejectedValue(new Error("balance batch"));
    await vm.getList();
    expect(vm.dataList).toHaveLength(2);
    expect(vm.dataList[0]).toMatchObject({
      supplierName: "供应商一",
      payableBalance: 0
    });
    wrapper.unmount();
  });

  it("handles error envelopes, empty pages and missing list data", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    mocks.list.mockResolvedValueOnce({ code: 500, msg: "server down" });
    await vm.getList();
    expect(mocks.message).toHaveBeenCalledWith("server down", {
      type: "error"
    });

    mocks.list.mockResolvedValueOnce({ code: 500 });
    await vm.getList();
    expect(mocks.message).toHaveBeenLastCalledWith("获取供应商列表失败", {
      type: "error"
    });

    vm.dataList = [{ uid: "stale" }];
    mocks.list.mockResolvedValueOnce({ code: 200, data: {} });
    await vm.getList();
    expect(vm.dataList).toEqual([]);
    expect(vm.pagination.total).toBe(0);
    wrapper.unmount();
  });

  it.each([
    [true, 1],
    [false, 1]
  ])("filters rows with hasBalance=%s", async (hasBalance, expected) => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.form.hasBalance = hasBalance;
    await vm.getList();
    expect(vm.dataList).toHaveLength(expected);
    wrapper.unmount();
  });

  it("searches, resets and pages through the normalized list", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    Object.assign(vm.searchFormRef, { resetFields: mocks.resetFields });
    vm.form.keyword = "客户";
    vm.pagination.currentPage = 4;
    vm.onSearch();
    await flushPromises();
    expect(vm.pagination.currentPage).toBe(1);
    expect(mocks.list).toHaveBeenLastCalledWith(1, { keyword: "客户" });

    vm.resetForm();
    await flushPromises();
    expect(mocks.resetFields).toHaveBeenCalled();
    expect(vm.pagination.currentPage).toBe(1);

    vm.handleCurrentChange(3);
    await flushPromises();
    expect(vm.pagination.currentPage).toBe(3);
    expect(mocks.list).toHaveBeenLastCalledWith(3, { keyword: "客户" });
    wrapper.unmount();
  });

  it("prepares add/edit dialog state and validates before saving", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.handleSelectionChange([{ uid: "p1", supplierId: "p1" }]);
    expect(vm.selectedRows).toHaveLength(1);

    vm.openDialog();
    let options = mocks.addDialog.mock.calls[0][0];
    expect(options.title).toBe("新增供应商期初余额");
    expect(options.props).toMatchObject({
      isEdit: false,
      formInline: {
        supplierId: "",
        payableBalance: 0,
        prepaidBalance: 0,
        remark: ""
      }
    });

    vm.openDialog("编辑", {
      id: 1,
      uid: "p1",
      supplierId: "p1",
      supplierName: "供应商一",
      payableBalance: 10,
      prepaidBalance: 2,
      balanceDate: "2026-01-01",
      remark: "edit"
    });
    options = mocks.addDialog.mock.calls[1][0];
    expect(options.title).toBe("编辑供应商期初余额");
    expect(options.props).toMatchObject({
      isEdit: true,
      formInline: { supplierId: "p1", payableBalance: 10, prepaidBalance: 2 }
    });

    const done = vi.fn();
    options.beforeSure(done, { options });
    expect(done).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("saves both balances, uses the configured date and handles success or failure", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.openDialog("编辑", { supplierId: "p1", balanceDate: "2026-02-03" });
    const options = mocks.addDialog.mock.calls[0][0];
    vm.dialogFormRef = {
      formRef: { validate: (cb: (valid: boolean) => void) => cb(true) }
    };
    const done = vi.fn();
    await options.beforeSure(done, { options });
    await flushPromises();
    await flushPromises();
    expect(mocks.create).toHaveBeenNthCalledWith(1, {
      type: "provider-payable",
      amount: 0,
      date: "2026-02-03",
      remark: "",
      providerId: "p1"
    });
    expect(mocks.create).toHaveBeenNthCalledWith(2, {
      type: "provider-prepaid",
      amount: 0,
      date: "2026-02-03",
      remark: "",
      providerId: "p1"
    });
    expect(done).toHaveBeenCalled();
    expect(mocks.message).toHaveBeenCalledWith("编辑成功", { type: "success" });

    mocks.create.mockReset();
    mocks.create.mockResolvedValue({ code: 500, msg: "save failed" });
    await options.beforeSure(done, { options });
    await flushPromises();
    await flushPromises();
    expect(mocks.message).toHaveBeenLastCalledWith("save failed", {
      type: "error"
    });

    mocks.create.mockResolvedValue({ code: 500 });
    await options.beforeSure(done, { options });
    await flushPromises();
    await flushPromises();
    expect(mocks.message).toHaveBeenLastCalledWith("编辑失败", {
      type: "error"
    });
    wrapper.unmount();
  });

  it("ignores invalid forms and supplies today's date when absent", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.openDialog();
    const options = mocks.addDialog.mock.calls[0][0];
    vm.dialogFormRef = {
      formRef: { validate: (cb: (valid: boolean) => void) => cb(false) }
    };
    await options.beforeSure(vi.fn(), { options });
    expect(mocks.create).not.toHaveBeenCalled();

    vm.dialogFormRef = {
      formRef: { validate: (cb: (valid: boolean) => void) => cb(true) }
    };
    vm.form.hasBalance = undefined;
    await options.beforeSure(vi.fn(), { options });
    expect(mocks.create.mock.calls[0][0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    wrapper.unmount();
  });

  it("clears one balance and handles success, envelopes and rejection", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    const row = { supplierId: "p1", supplierName: "供应商一" };
    await vm.handleDelete(row);
    expect(mocks.message).toHaveBeenCalledWith("清空供应商一的期初余额成功", {
      type: "success"
    });

    mocks.create
      .mockResolvedValueOnce({ code: 200 })
      .mockResolvedValueOnce({ code: 500 });
    await vm.handleDelete(row);
    expect(mocks.message).toHaveBeenLastCalledWith("清空失败", {
      type: "error"
    });

    mocks.create.mockRejectedValueOnce(new Error("network"));
    await expect(vm.handleDelete(row)).resolves.toBeUndefined();
    wrapper.unmount();
  });

  it("warns for empty batch delete and clears selected balances", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.handleBatchDelete();
    expect(mocks.message).toHaveBeenCalledWith("请选择要删除的数据", {
      type: "warning"
    });

    mocks.create.mockReset();
    mocks.create.mockResolvedValue({ code: 200 });
    vm.handleSelectionChange([{ supplierId: "p1" }, { supplierId: "p2" }]);
    vm.handleBatchDelete();
    await flushPromises();
    expect(mocks.create).toHaveBeenCalledTimes(4);
    expect(mocks.message).toHaveBeenCalledWith("批量清空2条数据成功", {
      type: "success"
    });

    mocks.create.mockRejectedValue(new Error("network"));
    await vm.handleBatchDelete();
    await flushPromises();
    expect(vm.selectedRows).toHaveLength(2);
    wrapper.unmount();
  });

  it("validates upload types and imports progress, envelopes and exceptions", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    expect(vm.beforeUpload(new File(["x"], "ok.xlsx"))).toBe(true);
    expect(
      vm.beforeUpload(new File(["x"], "bad.txt", { type: "text/plain" }))
    ).toBe(false);

    let options = uploadOptions();
    await vm.handleImportRequest(options);
    expect(mocks.importData).toHaveBeenCalledWith(
      "supplier-balance",
      expect.any(FormData),
      expect.any(Function)
    );
    mocks.importData.mock.calls[0][2](55);
    expect(options.onProgress).toHaveBeenCalledWith({ percent: 55 });
    expect(options.onSuccess).toHaveBeenCalledWith({ code: 200 });

    options = uploadOptions();
    mocks.importData.mockResolvedValueOnce({ code: 422, msg: "bad rows" });
    await vm.handleImportRequest(options);
    expect(options.onError.mock.calls[0][0]).toMatchObject({
      message: "bad rows",
      status: 0,
      method: "POST",
      url: "/upload"
    });

    options = uploadOptions({ method: undefined, action: undefined });
    mocks.importData.mockResolvedValueOnce({ code: 422 });
    await vm.handleImportRequest(options);
    expect(options.onError.mock.calls[0][0]).toMatchObject({
      message: "导入失败",
      method: undefined,
      url: undefined
    });

    options = uploadOptions();
    mocks.importData.mockRejectedValueOnce("plain");
    await vm.handleImportRequest(options);
    expect(options.onError.mock.calls[0][0]).toMatchObject({
      message: "plain",
      status: 0
    });
    expect(vm.importLoading).toBe(false);
    wrapper.unmount();
  });

  it("exports selected, filtered and all ids and handles schema failures", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    await vm.handleExport();
    expect(mocks.exportData).toHaveBeenLastCalledWith("supplier-balance", {
      ids: undefined,
      fields: ["required", "default"],
      filters: { keyword: undefined }
    });

    vm.form.hasBalance = true;
    await vm.handleExport();
    expect(mocks.exportData.mock.calls.at(-1)?.[1].ids).toEqual(["p1", "p2"]);

    vm.handleSelectionChange([{ uid: "selected" }]);
    await vm.handleExport();
    expect(mocks.exportData.mock.calls.at(-1)?.[1].ids).toEqual(["selected"]);
    expect(mocks.downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      "supplier-balance.xlsx",
      { showMessage: true }
    );

    mocks.schema.mockResolvedValueOnce({ code: 500, msg: "schema failed" });
    await vm.handleExport();
    expect(mocks.message).toHaveBeenLastCalledWith("导出失败", {
      type: "error"
    });
    mocks.schema.mockResolvedValueOnce({ code: 200 });
    await vm.handleExport();
    expect(mocks.message).toHaveBeenLastCalledWith("导出失败", {
      type: "error"
    });
    expect(vm.exportLoading).toBe(false);
    wrapper.unmount();
  });
});
