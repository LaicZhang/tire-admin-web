import { flushPromises } from "@vue/test-utils";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  customerBatch: vi.fn(),
  balanceBatch: vi.fn(),
  create: vi.fn(),
  importData: vi.fn(),
  exportData: vi.fn(),
  schema: vi.fn(),
  message: vi.fn(),
  addDialog: vi.fn(),
  resetFields: vi.fn(),
  downloadBlob: vi.fn(),
  filename: vi.fn(() => "customer-balance.xlsx")
}));

vi.mock("@/api/business/customer", () => ({
  getCustomerListApi: mocks.list,
  getCustomerBatchApi: mocks.customerBatch
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

import CustomerBalance from "../index.vue";

function customers() {
  return [
    { id: 1, uid: "c1", name: "客户一" },
    { uid: "c2", name: "客户二" }
  ];
}

function prime() {
  mocks.list.mockResolvedValue({
    code: 200,
    data: { list: customers(), total: 2 }
  });
  mocks.customerBatch.mockResolvedValue({
    code: 200,
    data: [
      {
        id: 1,
        uid: "c1",
        name: "客户详情",
        code: "C-1",
        info: { phone: "13800000000" }
      },
      { uid: "", name: "无标识客户" },
      null
    ]
  });
  mocks.balanceBatch.mockResolvedValue({
    code: 200,
    data: [
      {
        id: 10,
        customerId: "c1",
        type: "customer-receivable",
        amount: "12345",
        date: "2026-01-02T10:00:00.000Z",
        remark: "期初",
        createdAt: "2026-01-01"
      },
      {
        id: 11,
        customerId: "c1",
        type: "customer-advance",
        amount: null,
        date: null,
        remark: null,
        createdAt: null
      },
      {
        id: 12,
        customerId: null,
        type: "customer-advance",
        amount: 1,
        date: "2026-01-03"
      },
      { id: 13, customerId: "c2", type: "other", amount: 0 }
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
    "data/customerBalance/index.vue",
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

describe("customer balance page behavior", () => {
  it("maps customers and both balance types with fallbacks", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    expect(mocks.list).toHaveBeenCalledWith(1, { keyword: undefined });
    expect(mocks.customerBatch).toHaveBeenCalledWith(["c1", "c2"]);
    expect(mocks.balanceBatch).toHaveBeenCalledWith({
      customerIds: ["c1", "c2"],
      types: ["customer-receivable", "customer-advance"]
    });
    expect(vm.dataList).toHaveLength(2);
    expect(vm.dataList[0]).toMatchObject({
      customerName: "客户详情",
      customerCode: "C-1",
      phone: "13800000000",
      receivableBalance: 123.45,
      advanceBalance: 0,
      balanceDate: "2026-01-02",
      remark: "期初"
    });
    expect(vm.dataList[1]).toMatchObject({
      id: 0,
      customerCode: "-",
      phone: "-",
      balanceDate: undefined,
      remark: "",
      createdAt: ""
    });
    expect(vm.statistics).toEqual({
      totalReceivable: 123.45,
      totalAdvance: 0,
      customerCount: 2
    });
    wrapper.unmount();
  });

  it.each([
    ["customer list", () => mocks.list],
    ["customer batch", () => mocks.customerBatch],
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
    mocks.customerBatch
      .mockReset()
      .mockRejectedValue(new Error("customer batch"));
    mocks.balanceBatch
      .mockReset()
      .mockRejectedValue(new Error("balance batch"));
    await vm.getList();
    expect(vm.dataList).toHaveLength(2);
    expect(vm.dataList[0]).toMatchObject({
      customerName: "客户一",
      receivableBalance: 0
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
    expect(mocks.message).toHaveBeenLastCalledWith("获取客户列表失败", {
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

    vm.onReset();
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
    vm.handleSelectionChange([{ uid: "c1", customerId: "c1" }]);
    expect(vm.selectedRows).toHaveLength(1);

    vm.openDialog();
    let options = mocks.addDialog.mock.calls[0][0];
    expect(options.title).toBe("新增客户期初余额");
    expect(options.props).toMatchObject({
      isEdit: false,
      formInline: {
        customerId: "",
        receivableBalance: 0,
        advanceBalance: 0,
        remark: ""
      }
    });

    vm.openDialog("编辑", {
      id: 1,
      uid: "c1",
      customerId: "c1",
      customerName: "客户一",
      receivableBalance: 10,
      advanceBalance: 2,
      balanceDate: "2026-01-01",
      remark: "edit"
    });
    options = mocks.addDialog.mock.calls[1][0];
    expect(options.title).toBe("编辑客户期初余额");
    expect(options.props).toMatchObject({
      isEdit: true,
      formInline: { customerId: "c1", receivableBalance: 10, advanceBalance: 2 }
    });

    const done = vi.fn();
    options.beforeSure(done, { options });
    expect(done).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("saves both balances, uses the configured date and handles success or failure", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.openDialog("编辑", { customerId: "c1", balanceDate: "2026-02-03" });
    const options = mocks.addDialog.mock.calls[0][0];
    vm.dialogFormRef = {
      formRef: { validate: (cb: (valid: boolean) => void) => cb(true) }
    };
    const done = vi.fn();
    await options.beforeSure(done, { options });
    await flushPromises();
    await flushPromises();
    expect(mocks.create).toHaveBeenNthCalledWith(1, {
      type: "customer-receivable",
      amount: 0,
      date: "2026-02-03",
      remark: "",
      customerId: "c1"
    });
    expect(mocks.create).toHaveBeenNthCalledWith(2, {
      type: "customer-advance",
      amount: 0,
      date: "2026-02-03",
      remark: "",
      customerId: "c1"
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
    const row = { customerId: "c1", customerName: "客户一" };
    await vm.handleDelete(row);
    expect(mocks.message).toHaveBeenCalledWith("清空客户一的期初余额成功", {
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
    vm.handleSelectionChange([{ customerId: "c1" }, { customerId: "c2" }]);
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
      "customer-balance",
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
    expect(mocks.exportData).toHaveBeenLastCalledWith("customer-balance", {
      ids: undefined,
      fields: ["required", "default"],
      filters: { keyword: undefined }
    });

    vm.form.hasBalance = true;
    await vm.handleExport();
    expect(mocks.exportData.mock.calls.at(-1)?.[1].ids).toEqual(["c1", "c2"]);

    vm.handleSelectionChange([{ uid: "selected" }]);
    await vm.handleExport();
    expect(mocks.exportData.mock.calls.at(-1)?.[1].ids).toEqual(["selected"]);
    expect(mocks.downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      "customer-balance.xlsx",
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
