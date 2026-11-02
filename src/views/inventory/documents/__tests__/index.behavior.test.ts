import type { Component } from "vue";
import { flushPromises } from "@vue/test-utils";
import { ElMessageBox } from "element-plus";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  confirm: vi.fn(),
  message: vi.fn(),
  error: vi.fn(),
  addDialog: vi.fn(),
  downloadBlob: vi.fn(),
  filename: vi.fn((prefix: string, ext: string) => `${prefix}.${ext}`),
  list: vi.fn(),
  print: vi.fn(),
  approve: vi.fn(),
  reverse: vi.fn(),
  exportRows: vi.fn(),
  deleteOrder: vi.fn(),
  deleteStocktaking: vi.fn(),
  deleteInbound: vi.fn(),
  deleteOutbound: vi.fn(),
  deleteAssembly: vi.fn(),
  deleteDisassembly: vi.fn(),
  deleteCostAdjust: vi.fn()
}));

vi.mock("vue-router", async importOriginal => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRouter: () => ({ push: mocks.push })
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.error
}));
vi.mock("@/utils/download", () => ({
  downloadBlob: mocks.downloadBlob,
  generateFilenameWithTimestamp: mocks.filename
}));
vi.mock("@/composables/useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mocks.confirm })
}));
vi.mock("@/composables/useDialogService", () => ({
  addDialog: mocks.addDialog
}));
vi.mock("@/utils/viewport", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/viewport")>()),
  resolveDialogFullscreen: () => true
}));
vi.mock("@/api/document-center", () => ({
  getDocumentCenterListApi: mocks.list,
  getDocumentCenterPrintApi: mocks.print,
  approveDocumentCenterApi: mocks.approve,
  reverseAuditDocumentCenterApi: mocks.reverse,
  exportDocumentCenterApi: mocks.exportRows
}));
vi.mock("@/api", () => ({ deleteOrderApi: mocks.deleteOrder }));
vi.mock("@/api/business/inventory-check", () => ({
  deleteInventoryCheckTaskApi: mocks.deleteStocktaking
}));
vi.mock("@/api/business/assembly", () => ({
  deleteAssemblyOrderApi: mocks.deleteAssembly
}));
vi.mock("@/api/business/costAdjust", () => ({
  deleteCostAdjustOrder: mocks.deleteCostAdjust
}));
vi.mock("@/api/inventory", () => ({
  deleteDisassemblyOrderApi: mocks.deleteDisassembly,
  deleteOtherInboundOrderApi: mocks.deleteInbound,
  deleteOtherOutboundOrderApi: mocks.deleteOutbound
}));
vi.mock("@/views/inventory/stocktaking/StocktakingDetailForm.vue", () => ({
  default: { name: "StocktakingDetailForm", render: () => null }
}));

type State = Record<string, any>;
type Row = {
  id: number;
  uid: string;
  billNo?: string;
  documentType?: string;
  targetName?: string;
  amount?: number | string;
  status: string;
  createdAt?: string;
  operatorName?: string;
};

const row = (patch: Partial<Row> = {}): Row => ({
  id: 1,
  uid: "doc-1",
  billNo: "BILL-1",
  documentType: "STOCKTAKING",
  targetName: "Main",
  amount: 12,
  status: "DRAFT",
  createdAt: "2026-01-01",
  operatorName: "Operator",
  ...patch
});

async function mountPage() {
  const module = await import("../index.vue");
  return mountSmokeComponent(
    async () => module as { default: Component },
    "inventory/documents/index.vue",
    {
      keepMounted: true,
      allowRenderErrors: true
    }
  );
}
const state = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
  wrapper.vm.$.setupState as State;
const settle = async () => {
  await flushPromises();
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue({ code: 200, data: { list: [], total: 0 } });
  mocks.confirm.mockResolvedValue(true);
  mocks.print.mockResolvedValue({
    code: 200,
    data: {
      billNo: "BILL-1",
      documentType: "STOCKTAKING",
      status: "DRAFT",
      targetName: "Main",
      detail: { 轮胎: "A&B" }
    }
  });
  mocks.approve.mockResolvedValue({ data: [{ success: true }] });
  mocks.reverse.mockResolvedValue({ data: [{ success: true }] });
  mocks.exportRows.mockResolvedValue(new Blob(["xlsx"]));
});

describe("inventory document center behavior", () => {
  it("loads, maps, searches, paginates and resets document data", async () => {
    mocks.list.mockResolvedValueOnce({
      code: 200,
      data: {
        list: [
          row({ amount: undefined }),
          row({ id: 2, uid: "doc-2", amount: "", status: "UNKNOWN" }),
          row({ id: 3, uid: "doc-3", amount: "12.5", documentType: undefined })
        ],
        total: 0
      }
    });
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    expect(vm.dataList.map((item: Row) => item.amount)).toEqual([
      undefined,
      undefined,
      12.5
    ]);
    expect(vm.pagination.total).toBe(0);
    expect(vm.getTypeColor({})).toBe("info");
    expect(vm.getTypeLabel({})).toBe("-");
    expect(vm.getTypeColor({ documentType: "UNKNOWN" })).toBe("info");
    expect(vm.getTypeLabel({ documentType: "UNKNOWN" })).toBe("UNKNOWN");
    expect(wrapper.find(".pure-table-stub").text()).toContain("UNKNOWN");
    expect(wrapper.find(".pure-table-stub").text()).toContain("-");

    Object.assign(vm.queryParams, {
      documentType: "STOCKTAKING",
      status: "DRAFT",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      keyword: "B"
    });
    vm.pagination.currentPage = 3;
    vm.handleSearch();
    expect(vm.pagination.currentPage).toBe(1);
    expect(mocks.list).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({
        documentType: "STOCKTAKING",
        status: "DRAFT",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        keyword: "B"
      })
    );

    const resetFields = vi.fn();
    vm.searchFormRef = { resetFields };
    vm.handleReset();
    expect(resetFields).toHaveBeenCalledOnce();
    expect(vm.queryParams).toMatchObject({
      documentType: undefined,
      status: undefined,
      startDate: undefined,
      endDate: undefined,
      keyword: undefined
    });

    vm.handleCurrentChange(4);
    expect(vm.pagination.currentPage).toBe(4);
    expect(mocks.list).toHaveBeenLastCalledWith(4, expect.any(Object));
    wrapper.unmount();
  });

  it("reports unsuccessful and thrown list requests", async () => {
    mocks.list.mockResolvedValueOnce({ code: 500, msg: "" });
    const wrapper = await mountPage();
    await settle();
    expect(mocks.message).toHaveBeenCalledWith("获取库存单据列表失败", {
      type: "error"
    });
    expect(state(wrapper).loading).toBe(false);

    mocks.list.mockRejectedValueOnce(new Error("down"));
    await state(wrapper).fetchData();
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "获取库存单据列表失败"
    );
    wrapper.unmount();
  });

  it("opens the in-progress stocktaking import and falls back for other selections", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const target = row({
      status: "IN_PROGRESS",
      billNo: "",
      targetName: "",
      createdAt: "",
      operatorName: ""
    });
    vm.handleSelectionChange([target]);
    vm.handleUnifiedImport();

    expect(mocks.addDialog).toHaveBeenCalledOnce();
    const options = mocks.addDialog.mock.calls[0][0];
    expect(options).toMatchObject({
      title: "盘点单导入 - doc-1",
      fullscreen: true,
      width: "80%",
      hideFooter: true
    });
    expect(options.props.formInline.task).toMatchObject({
      id: 1,
      uid: "doc-1",
      repoId: "",
      startedAt: "",
      createdBy: ""
    });
    expect(options.contentRenderer({ options })).toBeTruthy();

    vm.handleSelectionChange([row({ status: "COMPLETED" })]);
    vm.handleUnifiedImport();
    expect(mocks.message).toHaveBeenCalledWith("仅进行中的盘点单支持直接导入", {
      type: "warning"
    });

    vm.handleSelectionChange([
      row({ id: 1 }),
      row({ id: 2 }),
      row({ documentType: "ASSEMBLY" })
    ]);
    vm.handleUnifiedImport();
    expect(mocks.push).toHaveBeenCalledWith("/inventory/stocktaking");
    expect(mocks.message).toHaveBeenCalledWith(
      "统一导入当前接入盘点单导入，请在盘点单页面选择任务后继续导入",
      { type: "info" }
    );
    wrapper.unmount();
  });

  it("navigates typed documents and ignores documents without a type", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    vm.handleView(row({ documentType: undefined }));
    expect(mocks.push).not.toHaveBeenCalled();
    vm.handleView(row({ documentType: "COST_ADJUST", uid: "adjust-9" }));
    expect(mocks.push).toHaveBeenCalledWith({
      path: "/inventory/costAdjust",
      query: { uid: "adjust-9" }
    });
    wrapper.unmount();
  });

  it("prints escaped detail and reports blocked popup or API failures", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const write = vi.fn();
    const close = vi.fn();
    const focus = vi.fn();
    const print = vi.fn();
    const open = vi.spyOn(window, "open").mockReturnValue({
      document: { write, close },
      focus,
      print
    } as never);

    vm.openPrintPreview({
      billNo: "<BILL&>",
      documentType: "STOCK'TAKING",
      status: "DRAFT",
      targetName: 'A"B',
      detail: { "<轮胎>": "A&B" }
    });
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining("&lt;BILL&amp;&gt;")
    );
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining("STOCK&#39;TAKING")
    );
    expect(write).toHaveBeenCalledWith(expect.stringContaining("A&quot;B"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("&lt;轮胎&gt;"));
    expect(close).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
    expect(print).toHaveBeenCalledOnce();

    open.mockReturnValueOnce(null);
    vm.openPrintPreview({
      billNo: "B",
      documentType: "STOCKTAKING",
      status: "DRAFT",
      detail: {}
    });
    expect(mocks.message).toHaveBeenCalledWith(
      "打印窗口打开失败，请检查浏览器弹窗设置",
      { type: "warning" }
    );

    vm.handleSelectionChange([]);
    await vm.handlePrint();
    expect(mocks.message).toHaveBeenCalledWith("请先选择要打印的单据", {
      type: "warning"
    });
    vm.handleSelectionChange([row(), row({ documentType: undefined })]);
    mocks.print.mockResolvedValueOnce({ code: 500 }).mockResolvedValueOnce({
      code: 200,
      data: {
        billNo: "B",
        documentType: "STOCKTAKING",
        status: "DRAFT",
        detail: {}
      }
    });
    await vm.handlePrint();
    expect(mocks.print).toHaveBeenLastCalledWith("STOCKTAKING", "doc-1");

    mocks.print.mockRejectedValueOnce(new Error("down"));
    await vm.handlePrint();
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "获取打印数据失败"
    );
    open.mockRestore();
    wrapper.unmount();
  });

  it("uses the matching delete endpoint for every document type", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const rows = [
      ["INVENTORY_TRANSFER", mocks.deleteOrder],
      ["STOCKTAKING", mocks.deleteStocktaking],
      ["OTHER_INBOUND", mocks.deleteInbound],
      ["OTHER_OUTBOUND", mocks.deleteOutbound],
      ["ASSEMBLY", mocks.deleteAssembly],
      ["DISASSEMBLY", mocks.deleteDisassembly],
      ["COST_ADJUST", mocks.deleteCostAdjust]
    ] as const;

    for (const [documentType, api] of rows) {
      await vm.deleteByType(row({ documentType, uid: "u-1", id: 9 }));
      expect(api).toHaveBeenCalledOnce();
    }
    expect(mocks.deleteOrder).toHaveBeenCalledWith("transfer-order", "u-1");
    expect(mocks.deleteStocktaking).toHaveBeenCalledWith(9);
    expect(mocks.deleteInbound).toHaveBeenCalledWith("u-1");
    expect(mocks.deleteOutbound).toHaveBeenCalledWith("u-1");
    expect(mocks.deleteAssembly).toHaveBeenCalledWith("u-1");
    expect(mocks.deleteDisassembly).toHaveBeenCalledWith("u-1");
    expect(mocks.deleteCostAdjust).toHaveBeenCalledWith(9);
    wrapper.unmount();
  });

  it("handles approved, cancelled, successful and failed deletions", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const deleteCalls = mocks.list.mock.calls.length;

    await vm.handleDelete(row({ status: "APPROVED" }));
    expect(mocks.message).toHaveBeenCalledWith(
      "已审核的单据需要先反审核后才能删除",
      {
        type: "warning"
      }
    );
    mocks.confirm.mockResolvedValueOnce(false);
    await vm.handleDelete(row());
    expect(mocks.deleteStocktaking).not.toHaveBeenCalled();
    mocks.confirm.mockResolvedValueOnce(true);
    await vm.handleDelete(row());
    expect(mocks.deleteStocktaking).toHaveBeenCalledWith(1);
    expect(mocks.message).toHaveBeenCalledWith("删除成功", { type: "success" });
    expect(mocks.list.mock.calls.length).toBeGreaterThan(deleteCalls);

    mocks.deleteStocktaking.mockRejectedValueOnce(new Error("down"));
    await vm.handleDelete(row());
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "删除失败");
    wrapper.unmount();
  });

  it("validates and executes batch deletion", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    await vm.handleBatchDelete();
    expect(mocks.message).toHaveBeenCalledWith("请先选择要删除的单据", {
      type: "warning"
    });

    vm.handleSelectionChange([row({ status: "APPROVED" })]);
    await vm.handleBatchDelete();
    expect(mocks.message).toHaveBeenCalledWith(
      "已审核的单据需要先反审核后才能删除",
      {
        type: "warning"
      }
    );

    vm.handleSelectionChange([row(), row({ id: 2, uid: "doc-2" })]);
    mocks.confirm.mockResolvedValueOnce(false);
    await vm.handleBatchDelete();
    expect(mocks.deleteStocktaking).not.toHaveBeenCalled();
    mocks.confirm.mockResolvedValueOnce(true);
    await vm.handleBatchDelete();
    expect(mocks.confirm).toHaveBeenLastCalledWith(
      "确认删除选中的 2 条单据吗？",
      "批量删除",
      {
        type: "warning"
      }
    );
    expect(mocks.deleteStocktaking).toHaveBeenCalledTimes(2);
    expect(vm.selectedRows).toEqual([]);
    expect(mocks.message).toHaveBeenCalledWith("批量删除成功", {
      type: "success"
    });

    vm.handleSelectionChange([row()]);
    mocks.deleteStocktaking.mockRejectedValueOnce(new Error("down"));
    await vm.handleBatchDelete();
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "批量删除失败");
    wrapper.unmount();
  });

  it("exports with current filters and reports failures", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.queryParams.keyword = "tire";
    await vm.handleExport();
    expect(mocks.exportRows).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "tire" })
    );
    expect(mocks.filename).toHaveBeenCalledWith(
      "inventory-document-center",
      "xlsx"
    );
    expect(mocks.downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      "inventory-document-center.xlsx",
      {
        showMessage: true
      }
    );

    mocks.exportRows.mockRejectedValueOnce(new Error("down"));
    await vm.handleExport();
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "导出失败");
    wrapper.unmount();
  });

  it("batch approves eligible rows and reports partial failure", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    vm.handleSelectionChange([
      row({ documentType: undefined }),
      row({ id: 2, uid: "approved", status: "APPROVED" }),
      row({ id: 3, uid: "void", status: "VOID" }),
      row({ id: 4, uid: "eligible", documentType: "ASSEMBLY" })
    ]);
    await vm.handleBatchApprove();
    expect(mocks.approve).toHaveBeenCalledWith([
      { documentType: "ASSEMBLY", uid: "eligible" }
    ]);
    expect(mocks.message).toHaveBeenCalledWith("批量审核成功", {
      type: "success"
    });

    mocks.approve.mockResolvedValueOnce({
      data: [{ success: true }, { success: false }, {}]
    });
    await vm.handleBatchApprove();
    expect(mocks.message).toHaveBeenCalledWith("批量审核完成，失败 2 条", {
      type: "warning"
    });

    vm.handleSelectionChange([row({ status: "APPROVED" })]);
    await vm.handleBatchApprove();
    expect(mocks.message).toHaveBeenCalledWith("所选单据不支持批量审核", {
      type: "warning"
    });
    mocks.approve.mockRejectedValueOnce(new Error("down"));
    vm.handleSelectionChange([row()]);
    await vm.handleBatchApprove();
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "批量审核失败");
    wrapper.unmount();
  });

  it("prompts only when a document type requires a reverse reason", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const prompt = vi.spyOn(ElMessageBox, "prompt");

    prompt.mockResolvedValueOnce("reason" as never);
    expect(
      await vm.requestReverseReason([row({ documentType: "OTHER_INBOUND" })])
    ).toBeUndefined();
    prompt.mockResolvedValueOnce({ value: "reason-2" } as never);
    expect(
      await vm.requestReverseReason([row({ documentType: "OTHER_OUTBOUND" })])
    ).toBe("reason-2");
    expect(
      await vm.requestReverseReason([row({ documentType: "STOCKTAKING" })])
    ).toBeUndefined();
    expect(
      await vm.requestReverseReason([row({ documentType: undefined })])
    ).toBeUndefined();
    prompt.mockRestore();
    wrapper.unmount();
  });

  it("batch reverses approved items, including partial failure and cancellation", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const prompt = vi
      .spyOn(ElMessageBox, "prompt")
      .mockResolvedValue({ value: "reason" } as never);
    vm.handleSelectionChange([
      row({ status: "APPROVED", documentType: "OTHER_INBOUND", uid: "in-1" }),
      row({
        id: 2,
        status: "APPROVED",
        documentType: "STOCKTAKING",
        uid: "stock-2"
      })
    ]);
    await vm.handleBatchReverseAudit();
    expect(prompt).toHaveBeenCalledOnce();
    expect(mocks.reverse).toHaveBeenCalledWith(
      [
        { documentType: "OTHER_INBOUND", uid: "in-1" },
        { documentType: "STOCKTAKING", uid: "stock-2" }
      ],
      "reason"
    );
    expect(mocks.message).toHaveBeenCalledWith("批量反审核成功", {
      type: "success"
    });

    mocks.reverse.mockResolvedValueOnce({ data: [{ success: false }] });
    await vm.handleBatchReverseAudit();
    expect(mocks.message).toHaveBeenCalledWith("批量反审核完成，失败 1 条", {
      type: "warning"
    });

    vm.handleSelectionChange([row({ status: "DRAFT" })]);
    await vm.handleBatchReverseAudit();
    expect(mocks.message).toHaveBeenCalledWith("所选单据不支持批量反审核", {
      type: "warning"
    });

    vm.handleSelectionChange([
      row({ status: "APPROVED", documentType: "STOCKTAKING" })
    ]);
    prompt.mockRejectedValueOnce("cancel");
    await vm.handleBatchReverseAudit();
    expect(mocks.error).not.toHaveBeenCalledWith("cancel", "批量反审核失败");
    mocks.reverse.mockRejectedValueOnce(new Error("down"));
    await vm.handleBatchReverseAudit();
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "批量反审核失败"
    );
    prompt.mockRestore();
    wrapper.unmount();
  });

  it("approves a single row and reports failures", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    await vm.handleApprove(row({ uid: "singleton" }));
    expect(mocks.approve).toHaveBeenCalledWith([
      { documentType: "STOCKTAKING", uid: "singleton" }
    ]);
    expect(mocks.message).toHaveBeenCalledWith("审核成功", { type: "success" });

    await vm.handleApprove(row({ documentType: undefined, uid: "fallback" }));
    expect(mocks.approve).toHaveBeenLastCalledWith([
      { documentType: "STOCKTAKING", uid: "fallback" }
    ]);
    mocks.approve.mockRejectedValueOnce(new Error("down"));
    await vm.handleApprove(row());
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "审核失败");
    wrapper.unmount();
  });

  it("reverses a single row with reason and ignores prompt cancellation", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const prompt = vi
      .spyOn(ElMessageBox, "prompt")
      .mockResolvedValue({ value: "single-reason" } as never);
    await vm.handleReverseAudit(
      row({ status: "APPROVED", documentType: "OTHER_INBOUND" })
    );
    expect(mocks.reverse).toHaveBeenCalledWith(
      [{ documentType: "OTHER_INBOUND", uid: "doc-1" }],
      "single-reason"
    );
    expect(mocks.message).toHaveBeenCalledWith("反审核成功", {
      type: "success"
    });

    prompt.mockRejectedValueOnce("cancel");
    await vm.handleReverseAudit(
      row({ status: "APPROVED", documentType: undefined })
    );
    const before = mocks.error.mock.calls.filter(
      call => call[1] === "反审核失败"
    ).length;
    expect(before).toBe(0);

    mocks.reverse.mockRejectedValueOnce(new Error("down"));
    await vm.handleReverseAudit(row());
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "反审核失败");
    prompt.mockRestore();
    wrapper.unmount();
  });
});
