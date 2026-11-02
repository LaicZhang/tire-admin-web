import type { Component } from "vue";
import { flushPromises } from "@vue/test-utils";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => {
  const cache = new Map<string, unknown>();
  return {
    cache,
    message: vi.fn(),
    error: vi.fn(),
    list: vi.fn(),
    detail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    addLine: vi.fn(),
    addPackage: vi.fn(),
    removeLine: vi.fn(),
    generate: vi.fn(),
    checkout: vi.fn(),
    stores: vi.fn(),
    tires: vi.fn(),
    packages: vi.fn(),
    payments: vi.fn()
  };
});

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.error
}));
vi.mock("@/utils/localforage", () => ({
  localForage: () => ({
    getItem: vi.fn(async (key: string) => mocks.cache.get(key)),
    setItem: vi.fn(async (key: string, value: unknown) => {
      mocks.cache.set(key, value);
    })
  })
}));
vi.mock("@/api/business/service-work-order", () => ({
  getServiceWorkOrderListApi: mocks.list,
  getServiceWorkOrderApi: mocks.detail,
  createServiceWorkOrderApi: mocks.create,
  updateServiceWorkOrderApi: mocks.update,
  addServiceWorkOrderLineApi: mocks.addLine,
  addPackageToServiceWorkOrderApi: mocks.addPackage,
  removeServiceWorkOrderLineApi: mocks.removeLine,
  generateSaleOrderFromWorkOrderApi: mocks.generate,
  checkoutServiceWorkOrderApi: mocks.checkout
}));
vi.mock("@/api/business/service-package", () => ({
  getServicePackageListApi: mocks.packages
}));
vi.mock("@/api/business/tire", () => ({
  getTireListApi: mocks.tires
}));
vi.mock("@/api/company/store", () => ({
  getStoreListApi: mocks.stores
}));
vi.mock("@/api/payment", () => ({
  getPaymentListApi: mocks.payments
}));

const order = (overrides: Record<string, unknown> = {}) => ({
  uid: "order-1",
  billNo: "SWO-1",
  status: "DRAFT",
  storeId: "store-1",
  store: { name: "Main store" },
  vehiclePlateNo: "沪A12345",
  saleOrderUid: "sale-1",
  receiptOrderUid: "receipt-1",
  lines: [],
  ...overrides
});

type State = Record<string, any>;

async function mountPage(variant = 0) {
  const module = await import("../index.vue");
  return mountSmokeComponent(
    async () => module as { default: Component },
    "business/serviceWorkOrder/index.vue",
    {
      keepMounted: true,
      allowRenderErrors: true,
      variant
    }
  );
}

function state(wrapper: Awaited<ReturnType<typeof mountPage>>): State {
  return wrapper.vm.$.setupState as State;
}

async function settle() {
  await flushPromises();
  await flushPromises();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cache.clear();
  mocks.list.mockResolvedValue({
    code: 200,
    data: { list: [order()], total: 1 }
  });
  mocks.detail.mockResolvedValue({
    code: 200,
    data: order({ status: "QUOTED" })
  });
  mocks.create.mockResolvedValue({ code: 200, data: { uid: "created-1" } });
  mocks.update.mockResolvedValue({ code: 200 });
  mocks.addLine.mockResolvedValue({ code: 200 });
  mocks.addPackage.mockResolvedValue({ code: 200 });
  mocks.removeLine.mockResolvedValue({ code: 200 });
  mocks.generate.mockResolvedValue({
    code: 200,
    data: { saleOrderUid: "sale-2" }
  });
  mocks.checkout.mockResolvedValue({ code: 200 });
  mocks.stores.mockResolvedValue({
    code: 200,
    data: { list: [{ uid: "store-1", name: "Main store" }] }
  });
  mocks.tires.mockResolvedValue({
    code: 200,
    data: {
      list: [
        { uid: "tire-1", name: "Tire" },
        { uid: "tire-2", name: "" }
      ]
    }
  });
  mocks.packages.mockResolvedValue({
    code: 200,
    data: { list: [{ uid: "package-1", name: "Package" }] }
  });
  mocks.payments.mockResolvedValue({
    data: [{ uid: "pay-1", name: "Cash" }, { uid: "pay-2" }]
  });
});

describe("service work order page", () => {
  it("loads the list, options, and maps fallback names", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    expect(vm.list).toHaveLength(1);
    expect(vm.total).toBe(1);
    expect(vm.tireOptions).toEqual([
      { uid: "tire-1", name: "Tire" },
      { uid: "tire-2", name: "tire-2" }
    ]);
    expect(vm.paymentOptions[1].name).toBe("pay-2");
    expect(mocks.list).toHaveBeenCalledWith(1, { status: undefined });
    wrapper.unmount();
  });

  it("uses cached stores and accepts array payment data", async () => {
    mocks.cache.set("all_stores", [{ uid: "cached", name: "Cached" }]);
    mocks.payments.mockResolvedValueOnce([{ uid: "array-pay" }]);
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    expect(vm.storeOptions[0].name).toBe("Cached");
    expect(vm.paymentOptions[0].name).toBe("array-pay");
    expect(mocks.stores).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("surfaces list failures and recovers from thrown loads", async () => {
    mocks.list.mockResolvedValueOnce({ code: 500, msg: "list failed" });
    const wrapper = await mountPage();
    await settle();
    expect(mocks.message).toHaveBeenCalledWith("list failed", {
      type: "error"
    });

    mocks.list.mockRejectedValueOnce(new Error("down"));
    await state(wrapper).loadList();
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "加载服务工单失败"
    );
    expect(state(wrapper).loading).toBe(false);
    wrapper.unmount();
  });

  it("opens a prefilled create form and omits blank optional fields", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.formRef = { validate: vi.fn().mockResolvedValue(true) };
    vm.openCreate();
    Object.assign(vm.createForm, {
      storeId: "store-1",
      vehiclePlateNo: " 沪A1 ",
      vehicleModel: " ",
      contactPhone: " 138 ",
      mileageKm: 2,
      remark: " note "
    });

    await vm.submitCreate();

    expect(mocks.create).toHaveBeenCalledWith({
      storeId: "store-1",
      customerId: undefined,
      vehiclePlateNo: "沪A1",
      vehicleModel: undefined,
      contactPhone: "138",
      mileageKm: 2,
      remark: "note"
    });
    expect(vm.createVisible).toBe(false);
    expect(mocks.detail).toHaveBeenCalledWith("created-1");
    wrapper.unmount();
  });

  it("blocks invalid creates and reports creation failures", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.formRef = { validate: vi.fn().mockRejectedValue(new Error("invalid")) };
    await vm.submitCreate();
    expect(mocks.create).not.toHaveBeenCalled();

    vm.formRef = { validate: vi.fn().mockResolvedValue(true) };
    mocks.create.mockResolvedValueOnce({ code: 500, msg: "create failed" });
    await vm.submitCreate();
    expect(mocks.message).toHaveBeenCalledWith("create failed", {
      type: "error"
    });

    mocks.create.mockRejectedValueOnce(new Error("down"));
    await vm.submitCreate();
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "创建服务工单失败"
    );
    expect(vm.saving).toBe(false);
    wrapper.unmount();
  });

  it("handles detail success, absent detail, and API failure", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    await vm.openDetail("order-1");
    expect(vm.current.uid).toBe("order-1");
    expect(vm.detailLoading).toBe(false);

    mocks.detail.mockResolvedValueOnce({
      code: 200,
      data: null,
      msg: "missing"
    });
    await vm.openDetail("missing");
    expect(mocks.message).toHaveBeenCalledWith("missing", { type: "error" });

    mocks.detail.mockRejectedValueOnce(new Error("down"));
    await vm.openDetail("broken");
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "加载工单详情失败"
    );
    wrapper.unmount();
  });

  it("moves through statuses and saves trimmed notes", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.current = order({ status: "DRAFT", remark: " ", mileageKm: 0 });
    expect(vm.editable).toBe(true);

    await vm.changeStatus("RECEIVED");
    expect(mocks.update).toHaveBeenCalledWith("order-1", {
      status: "RECEIVED"
    });
    expect(mocks.message).toHaveBeenCalledWith("已流转至 已接车", {
      type: "success"
    });

    mocks.update.mockResolvedValueOnce({ code: 500, msg: "status failed" });
    await vm.changeStatus("CANCELLED");
    expect(mocks.message).toHaveBeenCalledWith("status failed", {
      type: "error"
    });

    mocks.update.mockResolvedValueOnce({ code: 200 });
    vm.current = order({ status: "DRAFT", remark: " ", mileageKm: 0 });
    await vm.saveNotes();
    expect(mocks.update).toHaveBeenLastCalledWith(
      "order-1",
      expect.objectContaining({ mileageKm: 0, remark: " " })
    );

    mocks.update.mockResolvedValueOnce({ code: 500, msg: "save failed" });
    vm.current = order({ status: "DRAFT" });
    await vm.saveNotes();
    expect(mocks.message).toHaveBeenCalledWith("save failed", {
      type: "error"
    });

    mocks.update.mockRejectedValueOnce(new Error("down"));
    await vm.changeStatus("RECEIVED");
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "状态更新失败");
    wrapper.unmount();
  });

  it("adds tire lines and validates missing or failed submissions", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.current = order();

    await vm.addLine();
    expect(mocks.message).toHaveBeenCalledWith("请选择商品/服务", {
      type: "warning"
    });

    Object.assign(vm.lineForm, {
      lineType: "SERVICE",
      tireId: "tire-1",
      qty: 2,
      unitPriceYuan: 12.34
    });
    await vm.addLine();
    expect(mocks.addLine).toHaveBeenCalledWith("order-1", {
      lineType: "SERVICE",
      tireId: "tire-1",
      qty: 2,
      unitPrice: 1234
    });

    mocks.addLine.mockResolvedValueOnce({ code: 500, msg: "line failed" });
    Object.assign(vm.lineForm, {
      lineType: "SERVICE",
      tireId: "tire-1",
      qty: 2,
      unitPriceYuan: 12.34
    });
    await vm.addLine();
    expect(mocks.message).toHaveBeenCalledWith("line failed", {
      type: "error"
    });

    mocks.addLine.mockRejectedValueOnce(new Error("down"));
    Object.assign(vm.lineForm, {
      lineType: "SERVICE",
      tireId: "tire-1",
      qty: 2,
      unitPriceYuan: 12.34
    });
    await vm.addLine();
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "添加工单行失败"
    );
    wrapper.unmount();
  });

  it("adds packages with a default multiplier and handles failures", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.current = order();

    vm.lineForm.lineType = "PACKAGE";
    await vm.addLine();
    expect(mocks.message).toHaveBeenCalledWith("请选择套餐", {
      type: "warning"
    });

    vm.lineForm.packageUid = "package-1";
    vm.lineForm.qty = 0;
    await vm.addLine();
    expect(mocks.addPackage).toHaveBeenCalledWith("order-1", {
      packageUid: "package-1",
      multiplier: 1
    });

    mocks.addPackage.mockResolvedValueOnce({
      code: 500,
      msg: "package failed"
    });
    Object.assign(vm.lineForm, {
      lineType: "PACKAGE",
      packageUid: "package-1",
      qty: 1
    });
    await vm.addLine();
    expect(mocks.message).toHaveBeenCalledWith("package failed", {
      type: "error"
    });

    mocks.addPackage.mockRejectedValueOnce(new Error("down"));
    Object.assign(vm.lineForm, {
      lineType: "PACKAGE",
      packageUid: "package-1",
      qty: 1
    });
    await vm.addLine();
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "添加工单行失败"
    );
    wrapper.unmount();
  });

  it("removes lines, generates a sale order, and checks out", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.current = order();

    vm.current = order();
    await vm.removeLine("line-1");
    expect(mocks.removeLine).toHaveBeenCalledWith("order-1", "line-1");
    vm.current = order();
    await vm.generateSaleOrder();
    expect(mocks.generate).toHaveBeenCalledWith("order-1");

    Object.assign(vm.checkoutForm, {
      paymentId: "",
      paymentMethod: "CASH",
      remark: ""
    });
    await vm.checkout();
    expect(mocks.checkout).toHaveBeenCalledWith("order-1", {
      paymentId: undefined,
      paymentMethod: "CASH",
      remark: null
    });

    mocks.removeLine.mockResolvedValueOnce({ code: 500, msg: "remove failed" });
    vm.current = order();
    await vm.removeLine("line-1");
    expect(mocks.message).toHaveBeenCalledWith("remove failed", {
      type: "error"
    });
    mocks.generate.mockResolvedValueOnce({ code: 500, msg: "generate failed" });
    vm.current = order();
    await vm.generateSaleOrder();
    expect(mocks.message).toHaveBeenCalledWith("generate failed", {
      type: "error"
    });
    mocks.checkout.mockResolvedValueOnce({ code: 500, msg: "checkout failed" });
    vm.current = order();
    await vm.checkout();
    expect(mocks.message).toHaveBeenCalledWith("checkout failed", {
      type: "error"
    });

    mocks.removeLine.mockRejectedValueOnce(new Error("down"));
    vm.current = order();
    await vm.removeLine("line-1");
    mocks.generate.mockRejectedValueOnce(new Error("down"));
    vm.current = order();
    await vm.generateSaleOrder();
    mocks.checkout.mockRejectedValueOnce(new Error("down"));
    vm.current = order();
    await vm.checkout();
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "删除工单行失败"
    );
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "生成销售单失败"
    );
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "收银失败");
    wrapper.unmount();
  });

  it("guards actions without a current order and navigates related documents", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const push = vi.spyOn(wrapper.vm.$router, "push");

    await vm.changeStatus("RECEIVED");
    await vm.saveNotes();
    await vm.addLine();
    await vm.removeLine("line");
    await vm.generateSaleOrder();
    await vm.checkout();
    vm.goSaleOrder();
    vm.goReceipt();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    vm.current = order();
    vm.goSaleOrder();
    vm.goReceipt();
    expect(push).toHaveBeenCalledWith({
      path: "/business/order/sale",
      query: { uid: "sale-1" }
    });
    expect(push).toHaveBeenCalledWith({
      path: "/fund/receipt",
      query: { uid: "receipt-1" }
    });

    vm.searchForm.status = "QUOTED";
    vm.handlePageChange(3);
    vm.onSearch();
    expect(mocks.list).toHaveBeenLastCalledWith(1, { status: "QUOTED" });
    expect(vm.lineAmount({ qty: 2, unitPrice: 50 })).toContain("1");
    expect(vm.lineAmount({})).toContain("0");
    wrapper.unmount();
  });

  it("maps cached statuses and exposes read-only completed details", async () => {
    mocks.detail.mockResolvedValue({
      code: 200,
      data: order({
        status: "COMPLETED",
        vehiclePlateNo: "",
        saleOrderUid: "",
        receiptOrderUid: ""
      })
    });
    const wrapper = await mountPage(1);
    await settle();
    const vm = state(wrapper);
    await vm.openDetail("order-1");
    await flushPromises();

    expect(vm.editable).toBe(false);
    expect(vm.nextStatuses).toEqual([]);
    expect(wrapper.text()).toContain("已完成");
    expect(wrapper.text()).toContain("—");
    wrapper.unmount();
  });
});
