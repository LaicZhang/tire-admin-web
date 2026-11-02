import { flushPromises } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  approve: vi.fn(),
  exportRows: vi.fn(),
  print: vi.fn(),
  unsupported: vi.fn(),
  confirm: vi.fn(),
  message: vi.fn(),
  handleError: vi.fn(),
  downloadBlob: vi.fn(),
  focus: vi.fn(),
  printWindow: vi.fn(),
  windowOpen: vi.fn()
}));

vi.mock("@/api/document-center", () => ({
  getDocumentCenterListApi: mocks.list,
  approveDocumentCenterApi: mocks.approve,
  exportDocumentCenterApi: mocks.exportRows,
  getDocumentCenterPrintApi: mocks.print
}));
vi.mock("@/api/route-gap", () => ({
  unsupportedBackendRoute: mocks.unsupported
}));
vi.mock("@/composables/useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mocks.confirm })
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.handleError
}));
vi.mock("@/utils/download", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/download")>()),
  downloadBlob: mocks.downloadBlob
}));
vi.mock("@/composables/useOptions", () => ({
  useOptions: () => ({
    customers: ref([{ name: " Alice " }, { name: "" }, { name: "Alice" }, {}]),
    providers: ref([{ name: " Vendor " }, { name: "Alice" }])
  })
}));

const ImportDialogStub = defineComponent({
  props: { visible: Boolean },
  emits: ["success", "update:visible"],
  setup(props, { emit }) {
    return () =>
      h("button", {
        class: "import-dialog-stub",
        "data-visible": String(props.visible),
        onClick: () => emit("success")
      });
  }
});

function records() {
  return [
    {
      id: 1,
      uid: "receipt-1",
      billNo: "SK-001",
      documentType: "RECEIPT",
      targetName: "客户甲",
      amount: "1250",
      status: "DRAFT",
      operatorName: "张三",
      remark: "收款",
      createdAt: "2026-01-01"
    },
    {
      id: 2,
      uid: "payment-1",
      billNo: "FK-001",
      documentType: "PAYMENT",
      targetName: "供应商乙",
      amount: "300",
      status: "APPROVED",
      createdAt: "2026-01-02"
    },
    {
      id: 3,
      uid: "transfer-1",
      billNo: "ZZ-001",
      documentType: "TRANSFER",
      status: "COMPLETED"
    }
  ];
}

function ok(data?: unknown) {
  return Promise.resolve({ code: 200, data });
}

async function mountPage() {
  const wrapper = await mountSmokeComponent(
    () => import("../index.vue"),
    "fund/documents/index.vue",
    {
      keepMounted: true,
      deep: true,
      globalStubs: {
        ImportDialog: ImportDialogStub,
        "import-dialog": ImportDialogStub
      }
    }
  );
  await vi.waitFor(() => expect(mocks.list).toHaveBeenCalled());
  await flushPromises();
  return wrapper;
}

type Wrapper = Awaited<ReturnType<typeof mountPage>>;
const state = (wrapper: Wrapper) =>
  wrapper.vm.$.setupState as Record<string, any>;
const lastListParams = () => mocks.list.mock.calls.at(-1)?.[1];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockImplementation(() => ok({ list: records(), total: 3 }));
  mocks.approve.mockResolvedValue({ code: 200, data: [] });
  mocks.exportRows.mockResolvedValue(new Blob(["xlsx"]));
  mocks.print.mockResolvedValue({
    code: 200,
    data: {
      billNo: "SK-<&\"'>",
      documentType: "收款单",
      status: "草稿",
      targetName: "客户<&>",
      detail: { "金额&": "1<2" }
    }
  });
  mocks.unsupported.mockResolvedValue(undefined);
  mocks.confirm.mockResolvedValue(true);
  mocks.windowOpen.mockReturnValue({
    document: { write: vi.fn(), close: vi.fn() },
    focus: mocks.focus,
    print: mocks.printWindow
  });
  vi.stubGlobal("open", mocks.windowOpen);
});

describe("fund document center behavior", () => {
  it("loads normalized rows, computes directional totals and deduplicates counterparties", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);

    expect(vm.dataList).toHaveLength(3);
    expect(
      vm.dataList.map((row: any) => [
        row.documentType,
        row.direction,
        row.amount
      ])
    ).toEqual([
      ["RECEIPT", "IN", 1250],
      ["PAYMENT", "OUT", 300],
      ["TRANSFER", "TRANSFER", 0]
    ]);
    expect(vm.statistics).toMatchObject({
      totalIncome: 1250,
      totalExpense: 300,
      netAmount: 950
    });
    expect(vm.targetNameOptions).toEqual(["Alice", "Vendor"]);
    expect(wrapper.text()).toContain("+");
    expect(wrapper.text()).toContain("-");
    expect(wrapper.text()).toContain("转账");
    expect(wrapper.text()).toContain("删除");
    wrapper.unmount();
  });

  it("builds clean query parameters and filters the returned direction locally", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.queryForm.billNo = "SK-001";
    vm.queryForm.documentType = "RECEIPT";
    vm.queryForm.direction = "IN";
    vm.queryForm.targetName = "";
    vm.queryForm.status = undefined;

    await vm.onSearch();
    expect(lastListParams()).toEqual(
      expect.objectContaining({
        keyword: "SK-001",
        documentType: "RECEIPT",
        pageSize: expect.any(Number)
      })
    );
    expect(lastListParams()).not.toHaveProperty("billNo");
    expect(lastListParams()).not.toHaveProperty("direction");
    expect(lastListParams()).not.toHaveProperty("targetName");
    expect(lastListParams()).not.toHaveProperty("status");
    expect(vm.dataList.map((row: any) => row.documentType)).toEqual([
      "RECEIPT"
    ]);

    vm.queryForm.direction = "OUT";
    await vm.onSearch();
    expect(vm.dataList.map((row: any) => row.documentType)).toEqual([
      "PAYMENT"
    ]);
    wrapper.unmount();
  });

  it("handles unsuccessful list responses and reset with or without a form ref", async () => {
    mocks.list.mockResolvedValueOnce({
      code: 500,
      data: { list: records(), total: 3 }
    });
    const wrapper = await mountPage();
    const vm = state(wrapper);
    expect(vm.dataList).toEqual([]);

    vm.resetForm();
    vm.queryForm.billNo = "changed";
    const resetFields = vi.fn();
    vm.resetForm({ resetFields });
    expect(resetFields).toHaveBeenCalledOnce();
    expect(vm.queryForm).toMatchObject({
      targetName: "",
      billNo: "",
      startDate: ""
    });
    wrapper.unmount();
  });

  it.each([
    ["RECEIPT", "/fund/receipt"],
    ["PAYMENT", "/fund/payment"],
    ["WRITE_OFF", "/fund/writeOff"],
    ["OTHER_INCOME", "/fund/otherIncome"],
    ["OTHER_EXPENSE", "/fund/otherExpense"],
    ["TRANSFER", "/fund/transfer"]
  ])(
    "navigates a %s document to its detail page",
    async (documentType, path) => {
      const wrapper = await mountPage();
      const vm = state(wrapper);
      vm.handleView({ documentType, uid: `uid-${documentType}` });
      await flushPromises();
      expect(wrapper.vm.$router.currentRoute.value.path).toBe(path);
      expect(wrapper.vm.$router.currentRoute.value.query).toEqual({
        uid: `uid-${documentType}`
      });
      wrapper.unmount();
    }
  );

  it("ignores navigation for an unknown document type", async () => {
    const wrapper = await mountPage();
    const before = wrapper.vm.$router.currentRoute.value.fullPath;
    state(wrapper).handleView({ documentType: "UNKNOWN", uid: "u1" });
    await flushPromises();
    expect(wrapper.vm.$router.currentRoute.value.fullPath).toBe(before);
    wrapper.unmount();
  });

  it("deletes a single document only after confirmation", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    const row = records()[0];

    mocks.confirm.mockResolvedValueOnce(false);
    await vm.handleDelete(row);
    expect(mocks.unsupported).not.toHaveBeenCalled();

    await vm.handleDelete(row);
    expect(mocks.confirm).toHaveBeenLastCalledWith(
      "确定删除单据 SK-001 吗？",
      "删除确认",
      { type: "warning" }
    );
    expect(mocks.unsupported).toHaveBeenCalledWith(
      "DELETE /fund/documents/RECEIPT/receipt-1"
    );
    expect(mocks.message).toHaveBeenCalledWith("删除成功", { type: "success" });

    mocks.unsupported.mockRejectedValueOnce(new Error("delete"));
    await vm.handleDelete(row);
    expect(mocks.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "删除失败"
    );
    wrapper.unmount();
  });

  it("validates, confirms and reports batch deletion", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);

    await vm.handleBatchDelete();
    expect(mocks.message).toHaveBeenCalledWith("请选择要删除的记录", {
      type: "warning"
    });

    vm.handleSelectionChange(records().slice(0, 2));
    mocks.confirm.mockResolvedValueOnce(false);
    await vm.handleBatchDelete();
    expect(mocks.unsupported).not.toHaveBeenCalled();

    await vm.handleBatchDelete();
    expect(mocks.confirm).toHaveBeenLastCalledWith(
      "确定删除选中的 2 条记录吗？",
      "批量删除确认",
      { type: "warning" }
    );
    expect(mocks.unsupported).toHaveBeenNthCalledWith(
      1,
      "DELETE /fund/documents/RECEIPT/receipt-1"
    );
    expect(mocks.unsupported).toHaveBeenNthCalledWith(
      2,
      "DELETE /fund/documents/PAYMENT/payment-1"
    );
    expect(mocks.message).toHaveBeenCalledWith("批量删除成功", {
      type: "success"
    });

    mocks.unsupported.mockRejectedValueOnce(new Error("batch"));
    await vm.handleBatchDelete();
    expect(mocks.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "批量删除失败"
    );
    wrapper.unmount();
  });

  it("prints selected rows, escapes markup and reports popup or API failures", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);

    vm.handlePrint();
    await flushPromises();
    expect(mocks.message).toHaveBeenCalledWith("请选择要打印的记录", {
      type: "warning"
    });

    vm.handleSelectionChange([records()[0]]);
    mocks.windowOpen.mockReturnValueOnce(null);
    vm.handlePrint();
    await flushPromises();
    expect(mocks.message).toHaveBeenCalledWith(
      "打印窗口打开失败，请检查浏览器弹窗设置",
      { type: "warning" }
    );

    vm.handlePrint();
    await flushPromises();
    expect(mocks.windowOpen).toHaveBeenLastCalledWith(
      "",
      "_blank",
      "noopener,noreferrer,width=960,height=720"
    );
    const popup = mocks.windowOpen.mock.results.at(-1)?.value;
    expect(popup.document.write).toHaveBeenCalledWith(
      expect.stringContaining("客户&lt;&amp;&gt;")
    );
    expect(popup.document.write).toHaveBeenCalledWith(
      expect.stringContaining("金额&amp;")
    );
    expect(popup.document.write).toHaveBeenCalledWith(
      expect.stringContaining("1&lt;2")
    );
    expect(popup.focus).toHaveBeenCalledOnce();
    expect(popup.print).toHaveBeenCalledOnce();

    mocks.print.mockResolvedValueOnce({ code: 500, data: null });
    vm.handlePrint();
    await flushPromises();
    expect(mocks.windowOpen).toHaveBeenCalledTimes(2);

    mocks.print.mockRejectedValueOnce(new Error("print"));
    vm.handlePrint();
    await flushPromises();
    expect(mocks.message).toHaveBeenCalledWith("获取打印数据失败", {
      type: "error"
    });
    wrapper.unmount();
  });

  it("exports current filters and reports download failures", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    vm.queryForm.billNo = "SK-001";

    vm.handleExport();
    await flushPromises();
    expect(mocks.exportRows).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "SK-001" })
    );
    expect(mocks.downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^fund-document-center_.*\.xlsx$/),
      { showMessage: true }
    );

    mocks.exportRows.mockRejectedValueOnce(new Error("export"));
    vm.handleExport();
    await flushPromises();
    expect(mocks.message).toHaveBeenCalledWith("导出失败", { type: "error" });
    wrapper.unmount();
  });

  it("opens the import dialog and refreshes after success", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);
    const before = mocks.list.mock.calls.length;

    vm.handleImport();
    await flushPromises();
    expect(vm.showImportDialog).toBe(true);
    expect(wrapper.find(".import-dialog-stub").attributes("data-visible")).toBe(
      "true"
    );

    await wrapper.find(".import-dialog-stub").trigger("click");
    await flushPromises();
    expect(vm.showImportDialog).toBe(false);
    expect(mocks.list.mock.calls.length).toBeGreaterThan(before);
    wrapper.unmount();
  });

  it("approves only supported selected documents and summarizes the result", async () => {
    const wrapper = await mountPage();
    const vm = state(wrapper);

    vm.handleSelectionChange([
      { documentType: "PURCHASE_ORDER", uid: "purchase-1" }
    ]);
    await vm.handleBatchApprove();
    expect(mocks.approve).not.toHaveBeenCalled();
    expect(mocks.message).toHaveBeenCalledWith("所选单据不支持批量审核", {
      type: "warning"
    });

    const selected = [
      records()[0],
      records()[1],
      { documentType: "SALE_ORDER", uid: "sale-1" }
    ];
    vm.handleSelectionChange(selected);
    mocks.approve.mockResolvedValueOnce({
      code: 200,
      data: [{ success: true }, { success: false }]
    });
    await vm.handleBatchApprove();
    expect(mocks.approve).toHaveBeenCalledWith([
      { documentType: "RECEIPT", uid: "receipt-1" },
      { documentType: "PAYMENT", uid: "payment-1" }
    ]);
    expect(mocks.message).toHaveBeenCalledWith("批量审核完成，失败 1 条", {
      type: "warning"
    });

    mocks.approve.mockResolvedValueOnce({
      code: 200,
      data: [{ success: true }]
    });
    await vm.handleBatchApprove();
    expect(mocks.message).toHaveBeenCalledWith("批量审核成功", {
      type: "success"
    });

    mocks.approve.mockResolvedValueOnce({
      code: 400,
      data: null,
      msg: "状态冲突"
    });
    await vm.handleBatchApprove();
    expect(mocks.message).toHaveBeenCalledWith("状态冲突", { type: "error" });

    mocks.approve.mockResolvedValueOnce({ code: 401, data: null });
    await vm.handleBatchApprove();
    expect(mocks.message).toHaveBeenCalledWith("批量审核失败", {
      type: "error"
    });

    mocks.approve.mockRejectedValueOnce(new Error("approve"));
    await vm.handleBatchApprove();
    expect(mocks.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "批量审核失败"
    );
    wrapper.unmount();
  });
});
