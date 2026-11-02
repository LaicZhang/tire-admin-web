import type { Component } from "vue";
import { flushPromises } from "@vue/test-utils";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  sources: vi.fn(),
  message: vi.fn(),
  error: vi.fn(),
  logger: vi.fn(),
  localGet: vi.fn(),
  defaults: vi.fn(),
  lastHeader: vi.fn()
}));

vi.mock("@/api/sales", () => ({ getSalesReturnableSourcesApi: mocks.sources }));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.error,
  localForage: () => ({ getItem: mocks.localGet })
}));
vi.mock("@/utils/logger", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/logger")>()),
  logger: { error: mocks.logger }
}));
vi.mock("@/composables", async importOriginal => ({
  ...(await importOriginal<typeof import("@/composables")>()),
  applyCreateDefaults: mocks.defaults,
  applyLastFormHeaderAsync: mocks.lastHeader
}));

type State = Record<string, any>;
type Detail = Record<string, any>;
type Order = Record<string, any>;

const source = (patch: Record<string, any> = {}) => ({
  deliveryNoteLineUid: "line-1",
  deliveryNoteUid: "delivery-1",
  deliveryNoteNo: "DN-1",
  tireId: "tire-1",
  tireName: "Tire 1",
  repoId: "repo-1",
  repoName: "Main",
  quantity: 10,
  returnedQuantity: 2,
  remainingQuantity: 8,
  unitPrice: 50,
  totalAmount: 500,
  remainingAmount: 400,
  shippedAt: "2026-01-01",
  invoicedAmount: 100,
  ...patch
});

const detail = (patch: Detail = {}): Detail => ({
  uid: "detail-1",
  tireId: "tire-1",
  count: 2,
  unitPrice: 50,
  total: 100,
  repoId: "",
  serialNumbers: [],
  serialNosText: "",
  ...patch
});

const order = (patch: Order = {}): Order => ({
  uid: "return-1",
  customerId: "customer-1",
  count: 2,
  total: 100,
  showTotal: 100,
  refundAmount: 0,
  status: true,
  isApproved: false,
  isLocked: false,
  logisticsStatus: 0,
  details: [detail()],
  ...patch
});

async function mountPage(formTitle = "新增", formInline = order()) {
  const module = await import("../form.vue");
  return mountSmokeComponent(
    async () => module as { default: Component },
    "sales/return/form.vue",
    {
      keepMounted: true,
      allowRenderErrors: true,
      props: { formTitle, formInline }
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
  mocks.sources.mockResolvedValue({ code: 200, data: [source()] });
  mocks.localGet.mockImplementation(async key => {
    if (key === "all_tires") return [{ uid: "tire-1", name: "Tire 1" }];
    if (key === "all_repos") return [{ uid: "repo-1", name: "Main" }];
    if (key === "all_managers") return [{ uid: "manager-1", name: "Manager" }];
    return null;
  });
  mocks.defaults.mockResolvedValue({
    inventory: { defaultWarehouseId: "default-repo" }
  });
  mocks.lastHeader.mockResolvedValue(true);
});

describe("sales return form behavior", () => {
  it("normalizes details as they enter the form", async () => {
    const wrapper = await mountPage(
      "查看",
      order({
        details: [
          detail({ serialNumbers: undefined, serialNosText: undefined }),
          detail({
            serialNumbers: [{ serialNo: "SN-1" }],
            serialNosText: "existing"
          }),
          detail({
            serialNumbers: [{ serialNo: "SN-2" }],
            serialNosText: undefined
          })
        ]
      })
    );
    await settle();
    const vm = state(wrapper);
    expect(vm.formData.details[0].serialNumbers).toEqual([]);
    expect(vm.formData.details[0].serialNosText).toBe("");
    expect(vm.formData.details[1].serialNosText).toBe("existing");
    expect(vm.formData.details[2].serialNosText).toBe("SN-2");
    expect(vm.isReadOnly).toBe(true);
    expect(vm.isEditable).toBe(false);
    wrapper.unmount();
  });

  it("loads cached tire, repo and manager options and reports cache failure", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    expect(vm.allTireList).toEqual([{ uid: "tire-1", name: "Tire 1" }]);
    expect(vm.allRepoList).toEqual([{ uid: "repo-1", name: "Main" }]);
    expect(vm.managerList).toEqual([{ uid: "manager-1", name: "Manager" }]);

    mocks.localGet.mockRejectedValueOnce(new Error("cache"));
    await vm.loadBaseData();
    expect(mocks.message).toHaveBeenCalledWith("加载基础数据失败", {
      type: "error"
    });

    mocks.localGet.mockResolvedValue(null);
    await vm.loadBaseData();
    expect(vm.allTireList).toEqual([]);
    expect(vm.allRepoList).toEqual([]);
    expect(vm.managerList).toEqual([]);
    wrapper.unmount();
  });

  it("filters and resolves returnable sources with safe fallbacks", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.returnableSourceList = [
      source(),
      source({ deliveryNoteLineUid: "line-2", tireId: "tire-2" })
    ];

    expect(vm.findReturnableSource()).toBeUndefined();
    expect(vm.findReturnableSource("missing")).toBeUndefined();
    expect(vm.formatReturnableSourceLabel(source())).toBe(
      "DN-1 | Tire 1 | 剩余8 | Main"
    );
    expect(
      vm.getSourceOptions(
        detail({ sourceDeliveryNoteLineUid: "line-1", tireId: "tire-2" })
      )
    ).toEqual(vm.returnableSourceList);
    expect(vm.getSourceOptions(detail({ tireId: "" }))).toHaveLength(2);
    expect(
      vm.getSourceOptions(detail({ sourceDeliveryNoteLineUid: undefined }))
    ).toEqual([vm.returnableSourceList[0]]);
    expect(
      vm.resolveSourceDisplay(detail({ sourceDeliveryNoteLineUid: "line-1" }))
    ).toBe("DN-1 | Tire 1 | 剩余8 | Main");
    expect(
      vm.resolveSourceDisplay(detail({ sourceDeliveryNoteLineUid: "missing" }))
    ).toBe("missing");
    expect(
      vm.resolveSourceDisplay(detail({ sourceDeliveryNoteLineUid: undefined }))
    ).toBe("-");
    expect(
      vm.resolveDetailCountMax(detail({ sourceDeliveryNoteLineUid: "line-1" }))
    ).toBe(8);
    expect(vm.resolveDetailCountMax(detail())).toBe(9999);
    wrapper.unmount();
  });

  it("applies a source while preserving an explicit repo and clamping count", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.returnableSourceList = [source()];
    const target = detail({
      sourceDeliveryNoteLineUid: "line-1",
      count: 20,
      repoId: "custom",
      total: 0
    });
    vm.applySourceToDetail(target);
    expect(target).toMatchObject({
      tireId: "tire-1",
      tireName: "Tire 1",
      unitPrice: 50,
      repoId: "custom",
      count: 8,
      total: 400
    });

    const blank = detail({
      sourceDeliveryNoteLineUid: "line-1",
      count: 0,
      repoId: ""
    });
    vm.applySourceToDetail(blank);
    expect(blank).toMatchObject({
      repoId: "repo-1",
      repoName: "Main",
      count: 1,
      total: 50
    });

    const fallback = detail({ sourceDeliveryNoteLineUid: "missing", total: 0 });
    vm.applySourceToDetail(fallback);
    expect(fallback.total).toBe(100);
    wrapper.unmount();
  });

  it("clears stale source selections and reapplies valid ones", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.returnableSourceList = [source()];
    vm.formData.details = [
      detail({ sourceDeliveryNoteLineUid: undefined }),
      detail({ sourceDeliveryNoteLineUid: "missing" }),
      detail({ sourceDeliveryNoteLineUid: "line-1", count: 2, total: 100 })
    ];
    vm.syncSourceSelections();
    expect(vm.formData.details[0].sourceDeliveryNoteLineUid).toBeUndefined();
    expect(vm.formData.details[1].sourceDeliveryNoteLineUid).toBeUndefined();
    expect(vm.formData.details[2]).toMatchObject({
      tireId: "tire-1",
      count: 2,
      total: 100
    });
    wrapper.unmount();
  });

  it("loads sources only for a customer and handles API outcomes", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    mocks.sources.mockClear();

    const selected = detail({ sourceDeliveryNoteLineUid: "line-1" });
    vm.formData.details = [selected];
    await vm.loadReturnableSources();
    expect(mocks.sources).not.toHaveBeenCalled();
    expect(vm.returnableSourceList).toEqual([]);
    expect(selected.sourceDeliveryNoteLineUid).toBeUndefined();

    mocks.sources.mockResolvedValueOnce({ code: 500, msg: "" });
    await vm.loadReturnableSources("customer-1");
    expect(mocks.message).toHaveBeenCalledWith("加载可退货来源失败", {
      type: "error"
    });

    mocks.sources.mockResolvedValueOnce({ code: 500, msg: "bad" });
    await vm.loadReturnableSources("customer-1");
    expect(mocks.message).toHaveBeenCalledWith("bad", { type: "error" });

    mocks.sources.mockResolvedValueOnce({ code: 200, data: undefined });
    await vm.loadReturnableSources("customer-1");
    expect(vm.returnableSourceList).toEqual([]);

    mocks.sources.mockRejectedValueOnce(new Error("down"));
    await vm.loadReturnableSources("customer-1");
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "加载可退货来源失败"
    );
    expect(vm.returnableSourceLoading).toBe(false);
    wrapper.unmount();
  });

  it("applies create defaults to create and refund modes", async () => {
    const create = await mountPage("新增");
    await settle();
    const createVm = state(create);
    mocks.defaults.mockResolvedValueOnce({
      inventory: {},
      paymentId: "payment-default"
    });
    await createVm.applyDefaults();
    expect(mocks.defaults).toHaveBeenLastCalledWith(expect.any(Object), {
      isCreate: true,
      detailWarehouse: true,
      settlement: false
    });
    expect(createVm.defaultWarehouseId).toBe("default-repo");

    const refund = await mountPage("退款");
    await settle();
    const refundVm = state(refund);
    await refundVm.applyDefaults();
    expect(mocks.defaults).toHaveBeenLastCalledWith(expect.any(Object), {
      isCreate: true,
      detailWarehouse: false,
      settlement: "receivable"
    });

    mocks.defaults.mockRejectedValueOnce(new Error("defaults"));
    await refundVm.applyDefaults();
    expect(mocks.logger).toHaveBeenCalledWith(
      "[CreateDefaults] sales return failed",
      expect.any(Error)
    );
    create.unmount();
    refund.unmount();
  });

  it("only applies last-used header values in create mode", async () => {
    const readOnly = await mountPage("查看");
    await settle();
    const readOnlyVm = state(readOnly);
    mocks.lastHeader.mockClear();
    await readOnlyVm.applyLastUsedPrefill();
    expect(mocks.lastHeader).not.toHaveBeenCalled();
    readOnly.unmount();

    const create = await mountPage();
    await settle();
    const vm = state(create);
    vm.defaultWarehouseId = "old";
    vm.formData.details = [
      detail({ repoId: "" }),
      detail({ repoId: "explicit" })
    ];
    mocks.lastHeader.mockReset();
    mocks.lastHeader.mockImplementationOnce(async target => {
      target.customerId = "last-customer";
      target.customerName = "Last Customer";
      target.paymentId = "last-payment";
      target.repoId = "last-repo";
      return true;
    });
    await vm.applyLastUsedPrefill();
    expect(vm.formData).toMatchObject({
      customerId: "last-customer",
      customerName: "Last Customer",
      paymentId: "last-payment"
    });
    expect(vm.defaultWarehouseId).toBe("last-repo");
    expect(vm.formData.details.map((row: Detail) => row.repoId)).toEqual([
      "last-repo",
      "explicit"
    ]);

    mocks.lastHeader.mockResolvedValueOnce(false);
    await vm.applyLastUsedPrefill();
    mocks.lastHeader.mockRejectedValueOnce(new Error("last"));
    await vm.applyLastUsedPrefill();
    expect(mocks.logger).toHaveBeenCalledWith(
      "[LastForm] salesReturn prefill failed",
      expect.any(Error)
    );
    create.unmount();
  });

  it("adds and deletes detail rows while keeping totals in sync", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.defaultWarehouseId = "repo-default";
    vm.onAddDetail();
    expect(vm.formData.details).toHaveLength(2);
    expect(vm.formData.details[1]).toMatchObject({
      count: 1,
      repoId: "repo-default"
    });

    vm.formData.count = 5;
    vm.formData.total = 250;
    vm.onDeleteDetail(0);
    expect(vm.formData.details).toHaveLength(1);
    expect(vm.formData).toMatchObject({ count: 3, total: 150, showTotal: 150 });
    wrapper.unmount();
  });

  it("recalculates detail and whole-order totals with zero fallbacks", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const row = detail({ count: 0, unitPrice: 0, total: 999 });
    vm.formData.details = [row];
    vm.calcDetailTotal(row);
    expect(row.total).toBe(0);
    expect(vm.formData).toMatchObject({ count: 0, total: 0, showTotal: 0 });

    row.count = 3;
    row.unitPrice = 7;
    vm.calcDetailTotal(row);
    expect(row.total).toBe(21);
    expect(vm.formData).toMatchObject({ count: 3, total: 21, showTotal: 21 });
    wrapper.unmount();
  });

  it("parses serial numbers and aligns count with their length", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const row = detail({
      serialNosText: "SN-1\nSN-2\n",
      count: 9,
      unitPrice: 4,
      total: 0
    });
    vm.syncDetailSerialNumbers(row);
    expect(row.serialNumbers).toHaveLength(2);
    expect(row.count).toBe(2);
    expect(row.total).toBe(8);

    row.serialNosText = "";
    vm.syncDetailSerialNumbers(row);
    expect(row.serialNumbers).toEqual([]);
    expect(row.count).toBe(2);
    wrapper.unmount();
  });

  it("validates refund payment only in refund mode", async () => {
    const create = await mountPage("新增");
    await settle();
    const createValidator = state(create).formRules.paymentId[0].validator;
    const callback = vi.fn();
    createValidator({}, "", callback);
    expect(callback).toHaveBeenCalledWith();
    create.unmount();

    const refund = await mountPage("退款");
    await settle();
    const refundValidator = state(refund).formRules.paymentId[0].validator;
    const validCallback = vi.fn();
    refundValidator({}, " payment ", validCallback);
    expect(validCallback).toHaveBeenCalledWith();
    const invalidCallback = vi.fn();
    refundValidator({}, " ", invalidCallback);
    expect(invalidCallback.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(invalidCallback.mock.calls[0][0].message).toBe("请选择退款账户");
    refund.unmount();
  });

  it("prepares replaced form props and clears stale source lines", async () => {
    const wrapper = await mountPage();
    await settle();
    state(wrapper).returnableSourceList = [];
    await wrapper.setProps({
      formInline: order({
        uid: "return-2",
        details: [detail({ sourceDeliveryNoteLineUid: "stale" })]
      })
    });
    await settle();
    expect(state(wrapper).formData.uid).toBe("return-2");
    expect(
      state(wrapper).formData.details[0].sourceDeliveryNoteLineUid
    ).toBeUndefined();
    wrapper.unmount();
  });
});
