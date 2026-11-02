import { flushPromises } from "@vue/test-utils";
import { defineComponent, ref, type Ref, type VNode } from "vue";
import { ElMessageBox } from "element-plus";
import { ORDER_TYPE } from "@/utils";
import { useOrderActions, type OrderRow } from "../useOrderActions";

const fixture = vi.hoisted(() => {
  const api = Object.fromEntries(
    [
      "confirmSaleAllocationApi",
      "confirmSalePickingApi",
      "deleteOrderApi",
      "confirmSaleOrderDeliveryApi",
      "confirmReturnOrderArrivalApi",
      "confirmReturnOrderShipmentApi",
      "confirmReturnOrderDeliveryApi",
      "confirmTransferOrderShipmentApi",
      "confirmTransferOrderArrivalApi",
      "cancelTransferOrderApi",
      "createSaleAllocationFromOrderApi",
      "createSalePickingFromAllocationApi",
      "reverseSaleOrderApi",
      "reversePurchaseOrderApi",
      "reverseReturnOrderApi",
      "reverseWasteOrderApi",
      "reverseClaimOrderApi",
      "reverseSupplierClaimOrderApi",
      "reverseSurplusOrderApi",
      "sendPurchaseInquiryApi",
      "convertSaleQuotationApi",
      "getOrderListApi",
      "createSupplierClaimOrderFromClaimApi",
      "postSalePickingApi"
    ].map(name => [name, vi.fn()])
  ) as Record<string, ReturnType<typeof vi.fn>>;
  return {
    api,
    addDialog: vi.fn(),
    confirm: vi.fn(),
    message: vi.fn(),
    setItem: vi.fn(),
    openDialog: vi.fn(),
    openPlan: vi.fn(),
    openQuotation: vi.fn(),
    form: null as any
  };
});

vi.mock("@/api", async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...fixture.api
}));
vi.mock("@/composables/useDialogService", () => ({
  addDialog: fixture.addDialog
}));
vi.mock("@/composables/useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: fixture.confirm })
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  message: fixture.message,
  localForage: () => ({ setItem: fixture.setItem })
}));
vi.mock("../../table", () => ({ openDialog: fixture.openDialog }));
vi.mock("../../../purchase/plan/usePurchasePlanConvertDialog", () => ({
  openPurchasePlanConvertDialog: fixture.openPlan
}));
vi.mock("../../../purchase/inquiry/usePurchaseQuotationDialogs", () => ({
  openPurchaseQuotationManagerDialog: fixture.openQuotation
}));
vi.mock("../components/ConfirmOrderDetailAction.vue", () => ({
  default: defineComponent({ render: () => null })
}));
vi.mock("../components/ClaimDefectCategoryManager.vue", () => ({
  default: defineComponent({ render: () => null })
}));
vi.mock("../components/ClaimInspectionDialog.vue", () => ({
  default: defineComponent({ render: () => null })
}));

const row: OrderRow = {
  uid: "order-1",
  id: 10,
  name: "订单",
  orderNo: "SO-1",
  customerId: "customer-1",
  payStatus: 0,
  count: 2,
  orders: []
};

function setup(type = ORDER_TYPE.sale) {
  const orderType = ref(type);
  const onSearch = vi.fn(async () => undefined);
  return { actions: useOrderActions(orderType, onSearch), orderType, onSearch };
}

function dialogAt(index = fixture.addDialog.mock.calls.length - 1) {
  return fixture.addDialog.mock.calls[index][0] as {
    contentRenderer: () => VNode;
    beforeSure: (done: () => void) => Promise<void>;
    closeCallBack?: () => void;
  };
}

async function invokeConfirm(
  handler: () => Promise<void>,
  options: { valid?: boolean; payload?: Record<string, unknown> } = {}
) {
  await handler();
  const dialog = dialogAt();
  const vnode = dialog.contentRenderer();
  const refTarget = ((vnode.ref as { r?: Ref }).r ?? vnode.ref) as Ref;
  refTarget.value = {
    validate: vi.fn(async () => options.valid ?? true),
    getPayload: vi.fn(() => options.payload ?? { detailUid: "detail-1" })
  };
  const done = vi.fn();
  await dialog.beforeSure(done);
  await flushPromises();
  return { done, dialog };
}

beforeEach(() => {
  Object.values(fixture.api).forEach(spy => spy.mockReset());
  Object.values(fixture.api).forEach(spy =>
    spy.mockResolvedValue({ code: 200, data: {} })
  );
  fixture.addDialog.mockClear();
  fixture.confirm.mockReset();
  fixture.confirm.mockResolvedValue(true);
  fixture.message.mockClear();
  fixture.setItem.mockReset();
  fixture.openDialog.mockClear();
  fixture.openPlan.mockReset();
  fixture.openQuotation.mockReset();
  fixture.form = { validated: true };
  vi.spyOn(ElMessageBox, "prompt").mockResolvedValue({ value: "原因" } as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useOrderActions", () => {
  it("stores the current form title before opening an order dialog", async () => {
    const { actions, onSearch } = setup();

    await actions.handleOpenDialog("修改订单", ORDER_TYPE.sale, row);

    expect(fixture.setItem).toHaveBeenCalledWith("curFormTitle", "修改订单");
    expect(fixture.openDialog).toHaveBeenCalledWith(
      "修改订单",
      ORDER_TYPE.sale,
      row
    );
    expect(actions.formTitle.value).toBe("修改订单");
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("deletes only unpaid confirmed orders and reports both error shapes", async () => {
    const { actions, onSearch } = setup();

    await actions.handleDelete({ ...row, payStatus: 1 });
    expect(fixture.confirm).not.toHaveBeenCalled();

    fixture.confirm.mockResolvedValueOnce(false);
    await actions.handleDelete(row);
    expect(fixture.api.deleteOrderApi).not.toHaveBeenCalled();

    await actions.handleDelete(row);
    expect(fixture.api.deleteOrderApi).toHaveBeenCalledWith(
      ORDER_TYPE.sale,
      row.uid
    );
    expect(fixture.message).toHaveBeenCalledWith("订单已删除", {
      type: "success"
    });
    expect(onSearch).toHaveBeenCalledTimes(1);

    fixture.api.deleteOrderApi.mockRejectedValueOnce(new Error("删除异常"));
    await actions.handleDelete(row);
    expect(fixture.message).toHaveBeenCalledWith("删除异常", { type: "error" });

    fixture.api.deleteOrderApi.mockRejectedValueOnce("删除异常字符串");
    await actions.handleDelete(row);
    expect(fixture.message).toHaveBeenCalledWith("删除失败", { type: "error" });
  });

  it("runs the sale shipment allocation, picking and posting sequence", async () => {
    fixture.api.createSaleAllocationFromOrderApi.mockResolvedValue({
      data: { uid: "allocation-1" }
    });
    fixture.api.createSalePickingFromAllocationApi.mockResolvedValue({
      data: {
        uid: "picking-1",
        lines: [
          { uid: "line-1", saleOrderDetailUid: "detail-1", pickedQuantity: 3 }
        ]
      }
    });
    const { actions, onSearch } = setup();

    const { done } = await invokeConfirm(
      () => actions.handleConfirmSaleShipment(row),
      {
        payload: { detailUid: "detail-1", serialNos: ["SN-1", "SN-2"] }
      }
    );

    expect(fixture.api.createSaleAllocationFromOrderApi).toHaveBeenCalledWith(
      row.uid,
      {
        detailUid: "detail-1",
        allocatedQuantity: 2
      }
    );
    expect(fixture.api.confirmSaleAllocationApi).toHaveBeenCalledWith(
      "allocation-1"
    );
    expect(fixture.api.confirmSalePickingApi).toHaveBeenCalledWith(
      "picking-1",
      {
        lines: [
          { uid: "line-1", pickedQuantity: 2, serialNos: ["SN-1", "SN-2"] }
        ]
      }
    );
    expect(fixture.api.postSalePickingApi).toHaveBeenCalledWith("picking-1");
    expect(done).toHaveBeenCalled();
    expect(onSearch).toHaveBeenCalled();
  });

  it("uses explicit count and picked quantity fallbacks for shipment", async () => {
    fixture.api.createSaleAllocationFromOrderApi.mockResolvedValue({
      data: { uid: "allocation-1" }
    });
    fixture.api.createSalePickingFromAllocationApi.mockResolvedValue({
      data: {
        uid: "picking-1",
        lines: [
          { uid: "line-1", saleOrderDetailUid: "detail-1", pickedQuantity: 3 }
        ]
      }
    });
    const { actions } = setup();

    await invokeConfirm(() => actions.handleConfirmSaleShipment(row), {
      payload: { detailUid: "detail-1", shipCount: 5 }
    });
    expect(
      fixture.api.createSaleAllocationFromOrderApi
    ).toHaveBeenLastCalledWith(row.uid, {
      detailUid: "detail-1",
      allocatedQuantity: 5
    });

    await invokeConfirm(() => actions.handleConfirmSaleShipment(row), {
      payload: { detailUid: "detail-1" }
    });
    expect(fixture.api.confirmSalePickingApi).toHaveBeenLastCalledWith(
      "picking-1",
      {
        lines: [{ uid: "line-1", pickedQuantity: 3, serialNos: undefined }]
      }
    );
  });

  it("rejects incomplete shipment results and reports their messages", async () => {
    const { actions } = setup();
    fixture.api.createSaleAllocationFromOrderApi.mockResolvedValueOnce({
      data: {}
    });
    await invokeConfirm(() => actions.handleConfirmSaleShipment(row));
    expect(fixture.message).toHaveBeenLastCalledWith("创建分配单失败", {
      type: "error"
    });

    fixture.api.createSaleAllocationFromOrderApi.mockResolvedValueOnce({
      data: { uid: "allocation-1" }
    });
    fixture.api.createSalePickingFromAllocationApi.mockResolvedValueOnce({
      data: {}
    });
    await invokeConfirm(() => actions.handleConfirmSaleShipment(row));
    expect(fixture.message).toHaveBeenLastCalledWith("创建拣货单失败", {
      type: "error"
    });

    fixture.api.createSaleAllocationFromOrderApi.mockResolvedValueOnce({
      data: { uid: "allocation-1" }
    });
    fixture.api.createSalePickingFromAllocationApi.mockResolvedValueOnce({
      data: { uid: "picking-1", lines: [] }
    });
    await invokeConfirm(() => actions.handleConfirmSaleShipment(row));
    expect(fixture.message).toHaveBeenLastCalledWith("拣货单缺少对应明细", {
      type: "error"
    });

    fixture.api.createSaleAllocationFromOrderApi.mockResolvedValueOnce({
      data: { uid: "allocation-1" }
    });
    fixture.api.createSalePickingFromAllocationApi.mockResolvedValueOnce({
      data: {
        uid: "picking-1",
        lines: [{ uid: "line-1", saleOrderDetailUid: "detail-1" }]
      }
    });
    fixture.api.postSalePickingApi.mockRejectedValueOnce("post failed");
    await invokeConfirm(() => actions.handleConfirmSaleShipment(row));
    expect(fixture.message).toHaveBeenLastCalledWith("确认发货失败", {
      type: "error"
    });
  });

  it("does not submit confirmation dialogs for invalid forms or missing details", async () => {
    const { actions, onSearch } = setup();

    const invalid = await invokeConfirm(
      () => actions.handleConfirmSaleDelivery(row),
      { valid: false }
    );
    expect(invalid.done).not.toHaveBeenCalled();
    expect(fixture.api.confirmSaleOrderDeliveryApi).not.toHaveBeenCalled();

    await invokeConfirm(() => actions.handleConfirmSaleDelivery(row), {
      payload: {}
    });
    expect(fixture.api.confirmSaleOrderDeliveryApi).not.toHaveBeenCalled();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it.each([
    ["handleConfirmSaleDelivery", "confirmSaleOrderDeliveryApi"],
    ["handleConfirmReturnCustomerArrival", "confirmReturnOrderArrivalApi"],
    ["handleConfirmReturnProviderShipment", "confirmReturnOrderShipmentApi"],
    ["handleConfirmReturnProviderDelivery", "confirmReturnOrderDeliveryApi"],
    ["handleConfirmTransferShipment", "confirmTransferOrderShipmentApi"],
    ["handleConfirmTransferArrival", "confirmTransferOrderArrivalApi"]
  ] as const)("submits %s through %s", async (handler, api) => {
    const { actions } = setup();
    const { done } = await invokeConfirm(
      () => actions[handler](row) as Promise<void>,
      { payload: { detailUid: "detail-1", shipCount: 1 } }
    );

    expect(fixture.api[api]).toHaveBeenCalledWith(row.uid, {
      detailUid: "detail-1",
      shipCount: 1
    });
    expect(done).toHaveBeenCalled();
  });

  it("opens claim, refund and category dialogs", async () => {
    const { actions } = setup(ORDER_TYPE.claim);

    await actions.handleProcessClaimPayment(row);
    expect(fixture.openDialog).toHaveBeenCalledWith(
      "处理理赔费用",
      ORDER_TYPE.claim,
      row
    );

    await actions.handleRefundReturnOrder(row);
    expect(fixture.openDialog).toHaveBeenCalledWith(
      "退款",
      ORDER_TYPE.claim,
      row
    );

    await actions.handleManageClaimDefectCategories();
    expect(fixture.addDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "缺陷类别管理", hideFooter: true })
    );
    fixture.addDialog.mock.calls.at(-1)?.[0].contentRenderer();

    await actions.handleManageClaimInspections(row);
    expect(fixture.addDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "检测记录", hideFooter: true })
    );
    fixture.addDialog.mock.calls.at(-1)?.[0].contentRenderer();
  });

  it("creates supplier claims and reports known and unknown failures", async () => {
    const { actions, onSearch } = setup();

    await actions.handleCreateSupplierClaim(row);
    expect(
      fixture.api.createSupplierClaimOrderFromClaimApi
    ).toHaveBeenCalledWith(row.uid);
    expect(onSearch).toHaveBeenCalled();

    fixture.api.createSupplierClaimOrderFromClaimApi.mockRejectedValueOnce(
      new Error("已存在")
    );
    await actions.handleCreateSupplierClaim(row);
    expect(fixture.message).toHaveBeenLastCalledWith("已存在", {
      type: "error"
    });

    fixture.api.createSupplierClaimOrderFromClaimApi.mockRejectedValueOnce(
      "unknown"
    );
    await actions.handleCreateSupplierClaim(row);
    expect(fixture.message).toHaveBeenLastCalledWith("生成供应商索赔单失败", {
      type: "error"
    });
  });

  it("dispatches every reverse API and its prompt text", async () => {
    const cases = [
      [ORDER_TYPE.sale, "reverseSaleOrderApi", "订单作废"],
      [ORDER_TYPE.purchase, "reversePurchaseOrderApi", "订单作废"],
      [ORDER_TYPE.return, "reverseReturnOrderApi", "订单作废"],
      [ORDER_TYPE.waste, "reverseWasteOrderApi", "订单作废"],
      [ORDER_TYPE.claim, "reverseClaimOrderApi", "订单作废"],
      [
        ORDER_TYPE.supplierClaim,
        "reverseSupplierClaimOrderApi",
        "供应商索赔冲销"
      ],
      [ORDER_TYPE.transfer, "cancelTransferOrderApi", "调拨单取消"],
      [ORDER_TYPE.surplus, "reverseSurplusOrderApi", "订单作废"]
    ] as const;

    for (const [type, api, title] of cases) {
      const { actions, onSearch } = setup(type);
      await actions.handleReverseOrder(row);
      expect(vi.mocked(ElMessageBox.prompt).mock.lastCall?.[1]).toBe(title);
      expect(fixture.api[api]).toHaveBeenCalledWith(row.uid, "原因");
      expect(onSearch).toHaveBeenCalled();
    }

    const supplier = setup(ORDER_TYPE.supplierClaim);
    await supplier.actions.handleReverseOrder(row);
    expect(fixture.message).toHaveBeenLastCalledWith("供应商索赔已冲销", {
      type: "success"
    });

    const transfer = setup(ORDER_TYPE.transfer);
    await transfer.actions.handleReverseOrder(row);
    expect(fixture.message).toHaveBeenLastCalledWith("调拨单已取消", {
      type: "success"
    });
  });

  it("accepts string prompt values and ignores empty, unknown and cancelled reverses", async () => {
    const current = setup();
    vi.mocked(ElMessageBox.prompt).mockResolvedValueOnce("字符串原因" as any);
    await current.actions.handleReverseOrder(row);
    expect(fixture.api.reverseSaleOrderApi).toHaveBeenCalledWith(
      row.uid,
      "字符串原因"
    );

    vi.mocked(ElMessageBox.prompt).mockResolvedValueOnce({ value: "" } as any);
    await current.actions.handleReverseOrder(row);
    expect(fixture.api.reverseSaleOrderApi).toHaveBeenCalledTimes(1);

    current.orderType.value = ORDER_TYPE.assembly;
    await current.actions.handleReverseOrder(row);
    expect(current.onSearch).toHaveBeenCalledTimes(1);

    fixture.message.mockClear();
    vi.mocked(ElMessageBox.prompt).mockRejectedValueOnce("cancel");
    await current.actions.handleReverseOrder(row);
    expect(fixture.message).not.toHaveBeenCalled();
  });

  it("sends inquiries with the row id and reports failures", async () => {
    const { actions, onSearch } = setup();

    await actions.handleSendInquiry(row);
    expect(fixture.api.sendPurchaseInquiryApi).toHaveBeenCalledWith(10);
    expect(onSearch).toHaveBeenCalled();

    await actions.handleSendInquiry({ ...row, id: undefined });
    expect(fixture.api.sendPurchaseInquiryApi).toHaveBeenLastCalledWith(0);

    fixture.api.sendPurchaseInquiryApi.mockRejectedValueOnce(new Error("断网"));
    await actions.handleSendInquiry(row);
    expect(fixture.message).toHaveBeenLastCalledWith("断网", { type: "error" });

    fixture.api.sendPurchaseInquiryApi.mockRejectedValueOnce("error");
    await actions.handleSendInquiry(row);
    expect(fixture.message).toHaveBeenLastCalledWith("发送失败", {
      type: "error"
    });
  });

  it("guards and opens purchase conversions with normalized counts", async () => {
    const { actions, onSearch } = setup();

    await actions.handleConvertPurchasePlan({ ...row, id: undefined });
    expect(fixture.message).toHaveBeenCalledWith(
      "采购计划缺少主键，无法转订单",
      { type: "warning" }
    );

    await actions.handleConvertPurchasePlan({
      ...row,
      count: null,
      repo: { uid: "repo", name: "仓库" },
      tire: { name: "轮胎" }
    });
    expect(fixture.openPlan).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10, count: 0 }),
      onSearch
    );

    await actions.handleManagePurchaseQuotations({ ...row, id: undefined });
    expect(fixture.message).toHaveBeenCalledWith(
      "询价单缺少主键，无法加载报价",
      { type: "warning" }
    );

    await actions.handleManagePurchaseQuotations(row);
    expect(fixture.openQuotation).toHaveBeenCalledWith(row, onSearch);
  });

  it("converts quotations after selecting an unlinked sales order", async () => {
    fixture.api.getOrderListApi.mockResolvedValue({
      code: 200,
      data: {
        list: [
          { uid: "linked", number: "SO-LINKED", desc: null },
          { uid: 9 },
          { uid: "candidate-1", number: 100, desc: "订单描述" },
          { uid: "candidate-2" }
        ]
      }
    });
    const { actions, onSearch } = setup();

    const pending = actions.handleConvertQuotation({
      ...row,
      orders: [{ saleOrderUid: "linked" }]
    });
    await flushPromises();
    const dialog = dialogAt();
    const vnode = dialog.contentRenderer();
    expect(fixture.api.getOrderListApi).toHaveBeenCalledWith("sale-order", 1, {
      customerId: "customer-1",
      pageSize: 100
    });

    const select = vnode.children?.[1] as VNode;
    const update = select.props?.["onUpdate:modelValue"] as (
      value: string
    ) => void;
    update("");
    const done = vi.fn();
    await dialog.beforeSure(done);
    expect(fixture.message).toHaveBeenCalledWith("请选择销售订单", {
      type: "warning"
    });
    expect(done).not.toHaveBeenCalled();

    update("candidate-2");
    await dialog.beforeSure(done);
    await pending;
    expect(done).toHaveBeenCalled();
    expect(fixture.api.convertSaleQuotationApi).toHaveBeenCalledWith(
      10,
      "candidate-2"
    );
    expect(onSearch).toHaveBeenCalled();
    dialog.closeCallBack?.();
  });

  it("reports quotation conversion validation failures", async () => {
    const { actions } = setup();

    await actions.handleConvertQuotation({
      ...row,
      customerId: undefined,
      customer: null
    });
    expect(fixture.message).toHaveBeenLastCalledWith(
      "报价单缺少客户信息，无法匹配销售订单",
      { type: "error" }
    );

    fixture.api.getOrderListApi.mockResolvedValueOnce({
      code: 500,
      data: { list: [] }
    });
    await actions.handleConvertQuotation(row);
    expect(fixture.message).toHaveBeenLastCalledWith("加载销售订单失败", {
      type: "error"
    });

    fixture.api.getOrderListApi.mockResolvedValueOnce({
      code: 500,
      msg: "接口异常",
      data: { list: [] }
    });
    await actions.handleConvertQuotation(row);
    expect(fixture.message).toHaveBeenLastCalledWith("接口异常", {
      type: "error"
    });

    fixture.api.getOrderListApi.mockResolvedValueOnce({
      code: 200,
      data: { list: [{ uid: "linked" }] }
    });
    await actions.handleConvertQuotation({
      ...row,
      orders: [{ saleOrderUid: "linked" }]
    });
    expect(fixture.message).toHaveBeenLastCalledWith(
      "未找到可关联的销售订单，请先创建销售订单",
      { type: "error" }
    );
  });
});
