import { flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick, type Component } from "vue";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";
import { ORDER_TYPE } from "@/utils";
import ClaimAttachmentUpload from "../components/ClaimAttachmentUpload.vue";
import CustomerSelect from "@/components/EntitySelect/CustomerSelect.vue";
import PaymentSelect from "@/components/EntitySelect/PaymentSelect.vue";
import ProviderSelect from "@/components/EntitySelect/ProviderSelect.vue";
import OrderForm from "../form.vue";

const mocks = vi.hoisted(() => ({
  scanBarcodeApi: vi.fn(),
  createSupplierClaimOrderFromClaimApi: vi.fn(),
  getCompanySettingGroupApi: vi.fn(),
  message: vi.fn(),
  loggerError: vi.fn(),
  storage: new Map<string, unknown>(),
  loadInventoryDefaults: vi.fn()
}));

vi.mock("@/utils/http", () => import("../../../../../tests/mocks/http-rich"));
vi.mock("@/api", () => ({ scanBarcodeApi: mocks.scanBarcodeApi }));
vi.mock("@/api/business/order", () => ({
  createSupplierClaimOrderFromClaimApi:
    mocks.createSupplierClaimOrderFromClaimApi
}));
vi.mock("@/api/setting/company-setting", () => ({
  getCompanySettingGroupApi: mocks.getCompanySettingGroupApi
}));
vi.mock("@/utils/logger", async importOriginal => {
  const actual = await importOriginal<typeof import("@/utils/logger")>();
  return { ...actual, logger: { ...actual.logger, error: mocks.loggerError } };
});
vi.mock("@/composables", () => ({
  loadInventoryDefaults: mocks.loadInventoryDefaults
}));
vi.mock("@/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@/utils")>();
  return {
    ...actual,
    message: mocks.message,
    localForage: () => ({
      getItem: async (key: string) => mocks.storage.get(key) ?? null
    })
  };
});

function detail(overrides: Record<string, unknown> = {}) {
  return {
    index: 1,
    tireId: "tire-1",
    repoId: "repo-1",
    count: 1,
    total: 0,
    ...overrides
  };
}

async function mountForm(
  orderType = ORDER_TYPE.purchase,
  globalStubs?: Record<string, Component | boolean>
) {
  mocks.storage.set("curOrderType", orderType);
  mocks.storage.set("curFormTitle", "新增");
  mocks.loadInventoryDefaults.mockResolvedValue({
    defaultWarehouseId: "repo-1"
  });
  mocks.getCompanySettingGroupApi.mockResolvedValue({
    code: 200,
    data: []
  });
  const wrapper = await mountSmokeComponent(
    async () => ({ default: OrderForm }),
    "../business/order/form.vue",
    { keepMounted: true, fillSlots: true, globalStubs }
  );
  const state = wrapper.vm.$.setupState as Record<string, any>;
  state.orderType = orderType;
  state.formTitle = "新增";
  state.newFormInline = {
    uid: "order-1",
    count: 0,
    total: 0,
    showTotal: 0,
    details: []
  };
  return { wrapper, state };
}

function configureRules(state: Record<string, any>) {
  state.setDetailsColumnsAndFormRules();
  return state.formRules.details[0].validator as (
    _rule: unknown,
    _value: unknown,
    callback: (error?: Error) => void
  ) => void;
}

describe("order form behavior", () => {
  beforeEach(() => {
    mocks.storage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("validates detail rows across purchase and claim constraints", async () => {
    const { wrapper, state } = await mountForm();
    try {
      const validator = configureRules(state);
      const errors: Array<string | undefined> = [];
      const validate = async (details: unknown, setup?: () => void) => {
        state.newFormInline.details = details;
        setup?.();
        await new Promise<void>(resolve => {
          validator({}, details, error => {
            errors.push(error?.message);
            resolve();
          });
        });
      };

      await validate(null);
      await validate([]);
      await validate([detail({ tireId: "" })]);
      await validate([detail({ count: 0 })]);
      await validate([detail({ count: 1.5 })]);
      state.detailsColumns = [{ prop: "repoId" }];
      await validate([detail({ repoId: "" })]);
      state.detailsColumns = [];
      await validate([detail()]);

      state.orderType = ORDER_TYPE.claim;
      state.serialFeatureEnabled = true;
      await validate([detail({ claimType: 2, serialNo: " " })]);
      await validate([detail({ claimType: 2, serialNo: "S".repeat(101) })]);
      await validate([
        detail({ claimType: 2, serialNo: "SN-1", oldTireDisposition: " " })
      ]);
      await validate([
        detail({
          claimType: 2,
          serialNo: "SN-1",
          oldTireDisposition: "报废"
        })
      ]);

      state.formTitle = "确认到货";
      await validate([detail()]);
      await validate([detail({ batchNo: "B-1" })]);
      await validate([detail({ batchNo: "B-1", expiryDate: "2027-01-01" })]);

      expect(errors).toEqual([
        "请至少添加 1 行明细",
        "请至少添加 1 行明细",
        "明细第 1 行：请选择轮胎",
        "明细第 1 行：数量需为不小于 1 的整数",
        "明细第 1 行：数量需为不小于 1 的整数",
        "明细第 1 行：请选择仓库",
        undefined,
        "明细第 1 行：启用序列号后，退胎扣库必须填写胎号",
        "明细第 1 行：胎号最多 100 个字符",
        "明细第 1 行：退胎扣库必须填写旧胎去向",
        undefined,
        "明细第 1 行：请输入批次号",
        "明细第 1 行：请选择过期时间",
        undefined
      ]);
    } finally {
      wrapper.unmount();
    }
  });

  it("adds and removes rows while maintaining totals", async () => {
    const { wrapper, state } = await mountForm(ORDER_TYPE.claim);
    try {
      await flushPromises();
      const initial = state.newFormInline.details.length;
      state.onAdd();
      state.onAdd({ uid: "tire-2", name: "Tire 2", id: 2 });
      expect(state.newFormInline.details).toHaveLength(initial + 2);
      expect(state.newFormInline.count).toBe(2);
      expect(state.newFormInline.details[0]).toMatchObject({
        count: 1,
        repoId: "repo-1",
        isArrival: false
      });

      state.newFormInline.details[0].total = 50;
      state.newFormInline.total = 50;
      state.newFormInline.showTotal = 50;
      state.onDel(state.newFormInline.details[0]);
      expect(state.newFormInline.count).toBe(1);
      expect(state.newFormInline.total).toBe(0);

      const absent = detail({ count: 99, total: 99 });
      state.onDel(absent);
      expect(state.newFormInline.count).toBe(-98);
      expect(state.newFormInline.total).toBe(-99);
      expect(state.newFormInline.showTotal).toBe(-99);
    } finally {
      wrapper.unmount();
    }
  });

  it("creates a supplier claim and renders its returned summary", async () => {
    const { wrapper, state } = await mountForm(ORDER_TYPE.claim);
    try {
      state.formTitle = "查看";
      state.newFormInline.isApproved = true;
      state.newFormInline.supplierClaimOrders = [];
      mocks.createSupplierClaimOrderFromClaimApi.mockResolvedValue({
        code: 200,
        data: {
          uid: "claim-1",
          docNo: "SC-1",
          isApproved: true,
          isReversed: false,
          createdAt: "2026-01-01"
        }
      });

      await state.handleCreateSupplierClaim();
      await nextTick();

      expect(mocks.createSupplierClaimOrderFromClaimApi).toHaveBeenCalledWith(
        "order-1"
      );
      expect(state.newFormInline.supplierClaimOrders).toEqual([
        {
          uid: "claim-1",
          docNo: "SC-1",
          isApproved: true,
          isReversed: false,
          createdAt: "2026-01-01"
        }
      ]);
      expect(state.creatingSupplierClaim).toBe(false);
      expect(mocks.message).toHaveBeenLastCalledWith("已生成供应商索赔单", {
        type: "success"
      });
      expect(wrapper.text()).toContain("SC-1");
    } finally {
      wrapper.unmount();
    }
  });

  it("handles supplier claim guards and failures", async () => {
    const { wrapper, state } = await mountForm(ORDER_TYPE.claim);
    try {
      state.newFormInline.uid = undefined;
      await state.handleCreateSupplierClaim();
      expect(mocks.createSupplierClaimOrderFromClaimApi).not.toHaveBeenCalled();

      state.newFormInline.uid = "order-1";
      state.creatingSupplierClaim = true;
      await state.handleCreateSupplierClaim();
      expect(mocks.createSupplierClaimOrderFromClaimApi).not.toHaveBeenCalled();

      state.creatingSupplierClaim = false;
      mocks.createSupplierClaimOrderFromClaimApi.mockResolvedValueOnce({
        code: 500,
        msg: ""
      });
      await state.handleCreateSupplierClaim();
      expect(mocks.message).toHaveBeenLastCalledWith("生成供应商索赔单失败", {
        type: "error"
      });

      mocks.createSupplierClaimOrderFromClaimApi.mockRejectedValueOnce(
        new Error("network")
      );
      await state.handleCreateSupplierClaim();
      expect(mocks.message).toHaveBeenLastCalledWith("network", {
        type: "error"
      });

      mocks.createSupplierClaimOrderFromClaimApi.mockRejectedValueOnce("bad");
      await state.handleCreateSupplierClaim();
      expect(mocks.message).toHaveBeenLastCalledWith("生成供应商索赔单失败", {
        type: "error"
      });
    } finally {
      wrapper.unmount();
    }
  });

  it("loads optional settings and base data with fallbacks", async () => {
    const { wrapper, state } = await mountForm();
    try {
      mocks.storage.set("all_managers", [
        { id: 1, uid: "m-1", name: "Manager" }
      ]);
      mocks.storage.set("all_repos", [{ id: 1, uid: "r-1", name: "Repo" }]);
      mocks.storage.set("all_tires", [{ id: 1, uid: "t-1", name: "Tire" }]);
      await state.getALlList();
      expect(state.managerList).toHaveLength(1);
      expect(state.allRepoList).toHaveLength(1);
      expect(state.allTireList).toHaveLength(1);

      mocks.getCompanySettingGroupApi.mockResolvedValueOnce({
        code: 500,
        data: []
      });
      await state.loadFuncSettings();
      expect(state.serialFeatureEnabled).toBe(false);
      mocks.getCompanySettingGroupApi.mockResolvedValueOnce({
        code: 200,
        data: [{ key: "enableSerialNumber", value: "true" }]
      });
      await state.loadFuncSettings();
      expect(state.serialFeatureEnabled).toBe(true);
      mocks.getCompanySettingGroupApi.mockRejectedValueOnce(
        new Error("offline")
      );
      await state.loadFuncSettings();
      expect(state.serialFeatureEnabled).toBe(false);

      mocks.loadInventoryDefaults.mockRejectedValueOnce(new Error("storage"));
      await state.loadDefaultWarehouseId();
      expect(mocks.loggerError).toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
  });

  it("scans barcodes for each add, duplicate and failure path", async () => {
    const { wrapper, state } = await mountForm();
    try {
      await flushPromises();
      state.newFormInline.details = [];
      state.allTireList = [
        { id: 1, uid: "tire-1", name: "Tire 1" },
        { id: 2, uid: "tire-2", name: "Tire 2" }
      ];

      state.barcodeInput = " ";
      await state.handleScan();
      expect(mocks.scanBarcodeApi).not.toHaveBeenCalled();

      mocks.scanBarcodeApi.mockResolvedValueOnce({ data: null });
      state.barcodeInput = "missing";
      await state.handleScan();
      expect(mocks.message).toHaveBeenLastCalledWith("未找到对应条码的商品", {
        type: "warning"
      });

      mocks.scanBarcodeApi.mockResolvedValueOnce({ data: { uid: "" } });
      state.barcodeInput = "no-uid";
      await state.handleScan();
      expect(mocks.message).toHaveBeenLastCalledWith(
        "条码商品缺少 uid，无法添加到明细",
        { type: "warning" }
      );

      mocks.scanBarcodeApi.mockResolvedValueOnce({
        data: { uid: "tire-1", name: "Tire 1" }
      });
      state.barcodeInput = "known";
      await state.handleScan();
      expect(state.newFormInline.details).toHaveLength(1);
      mocks.scanBarcodeApi.mockResolvedValueOnce({
        data: { uid: "tire-1", name: "Tire 1" }
      });
      state.barcodeInput = "known-again";
      await state.handleScan();
      expect(state.newFormInline.details[0].count).toBe(2);
      expect(mocks.message).toHaveBeenLastCalledWith(
        "已增加商品 [Tire 1] 数量",
        { type: "success" }
      );

      mocks.scanBarcodeApi.mockResolvedValueOnce({
        data: { uid: "tire-3", name: "Tire 3", code: "C-3" }
      });
      state.barcodeInput = "outside";
      await state.handleScan();
      expect(mocks.message).toHaveBeenCalledWith(
        "商品 [Tire 3] 不在当前可选列表中",
        { type: "warning" }
      );
      expect(state.newFormInline.details.at(-1)).toMatchObject({
        tireId: "tire-3"
      });

      mocks.scanBarcodeApi.mockRejectedValueOnce(new Error("offline"));
      state.barcodeInput = "failure";
      await state.handleScan();
      expect(mocks.message).toHaveBeenLastCalledWith("扫码查询失败", {
        type: "error"
      });
      expect(state.barcodeLoading).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });
});

describe("order form field and row branches", () => {
  beforeEach(() => {
    mocks.storage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("covers direct fallback paths without changing order state", async () => {
    const { wrapper, state } = await mountForm();
    try {
      state.formTitle = "审核";
      state.setDetailsColumnsAndFormRules();
      expect(
        state.detailsColumns.every((column: any) => column.prop !== "batchNo")
      ).toBe(true);

      state.onAdd();
      expect(state.newFormInline.details.at(-1)).toMatchObject({
        count: 0,
        tireId: undefined
      });
      expect(state.newFormInline.count).toBe(0);

      delete state.newFormInline.showTotal;
      state.onDel(state.newFormInline.details.at(-1));
      expect("showTotal" in state.newFormInline).toBe(false);

      state.newFormInline.details = null;
      expect(state.getDetails()).toEqual([]);

      delete state.newFormInline.supplierClaimOrders;
      expect(state.getSupplierClaimOrders()).toEqual([]);

      mocks.storage.set("curOrderType", "");
      mocks.storage.set("curFormTitle", "");
      expect(await state.getOrderType()).toBe(ORDER_TYPE.purchase);
      expect(await state.getFormTitle()).toBe("新增");
      expect(state.formTitle).toBe("新增");

      const getItem = mocks.storage.get.bind(mocks.storage);
      vi.spyOn(mocks.storage, "get").mockImplementationOnce(() => {
        throw new Error("storage unavailable");
      });
      await state.getALlList();
      expect(mocks.message).toHaveBeenLastCalledWith("storage unavailable", {
        type: "error"
      });
      vi.spyOn(mocks.storage, "get").mockImplementationOnce(() => {
        throw "bad-storage";
      });
      await state.getALlList();
      expect(mocks.message).toHaveBeenLastCalledWith("加载基础数据失败", {
        type: "error"
      });
      vi.mocked(mocks.storage.get).mockImplementation(getItem);
    } finally {
      wrapper.unmount();
    }
  });

  it("validates non-object rows and supplier claim quantities", async () => {
    const { wrapper, state } = await mountForm();
    try {
      const validator = configureRules(state);
      state.serialFeatureEnabled = true;
      const errors: Array<string | undefined> = [];
      const validate = async (details: unknown) => {
        state.newFormInline.details = details;
        await new Promise<void>(resolve => {
          validator({}, details, error => {
            errors.push(error?.message);
            resolve();
          });
        });
      };

      await validate([null]);
      state.orderType = ORDER_TYPE.claim;
      await validate([
        detail({
          claimType: 2,
          serialNo: "SN-1",
          oldTireDisposition: 7
        })
      ]);
      state.orderType = ORDER_TYPE.supplierClaim;
      await validate([detail({ count: null })]);
      expect(errors).toEqual([
        "明细第 1 行：请选择轮胎",
        "明细第 1 行：退胎扣库必须填写旧胎去向",
        undefined
      ]);
    } finally {
      wrapper.unmount();
    }
  });

  it("renders each order type-specific section and synchronizes fields", async () => {
    const purchase = await mountForm(ORDER_TYPE.purchase);
    try {
      const barcode = purchase.wrapper
        .findAllComponents({ name: "ElInput" })
        .find(input => input.props("placeholder")?.includes("扫描或输入条码"));
      await barcode!.trigger("keyup.enter");
      purchase.state.formTitle = "付款";
      await nextTick();
      expect(purchase.wrapper.findComponent(ProviderSelect).exists()).toBe(
        true
      );
      expect(purchase.wrapper.findComponent(PaymentSelect).exists()).toBe(true);
      expect(purchase.wrapper.findComponent(CustomerSelect).exists()).toBe(
        false
      );

      await purchase.wrapper
        .findComponent(ProviderSelect)
        .vm.$emit("update:modelValue", "provider-1");
      await purchase.wrapper
        .findComponent(PaymentSelect)
        .vm.$emit("update:modelValue", "payment-1");
      const remark = purchase.wrapper
        .findAllComponents({ name: "ElInput" })
        .find(input => input.props("placeholder") === "请输入备注信息");
      await remark!.vm.$emit("update:modelValue", "updated remark");

      expect(purchase.state.newFormInline.providerId).toBe("provider-1");
      expect(purchase.state.newFormInline.paymentId).toBe("payment-1");
      expect(purchase.state.newFormInline.desc).toBe("updated remark");
      expect(mocks.scanBarcodeApi).not.toHaveBeenCalled();
    } finally {
      purchase.wrapper.unmount();
    }

    const sale = await mountForm(ORDER_TYPE.sale);
    try {
      sale.state.formTitle = "收款";
      await nextTick();
      expect(sale.wrapper.findComponent(CustomerSelect).exists()).toBe(true);
      expect(sale.wrapper.findComponent(ProviderSelect).exists()).toBe(false);
      await sale.wrapper
        .findComponent(CustomerSelect)
        .vm.$emit("update:modelValue", "customer-1");
      expect(sale.state.newFormInline.customerId).toBe("customer-1");
    } finally {
      sale.wrapper.unmount();
    }

    const claim = await mountForm(ORDER_TYPE.claim);
    try {
      claim.state.formTitle = "处理理赔费用";
      await nextTick();
      expect(claim.wrapper.findComponent(ClaimAttachmentUpload).exists()).toBe(
        true
      );
      expect(claim.wrapper.text()).toContain("收到理赔金");
      expect(
        claim.wrapper
          .findAllComponents({ name: "ElInputNumber" })
          .some(input => input.props("precision") === 2)
      ).toBe(true);
      await claim.wrapper
        .findComponent(ClaimAttachmentUpload)
        .vm.$emit("update:modelValue", ["claim.png"]);
      const radios = claim.wrapper.findAllComponents({ name: "ElRadioGroup" });
      await radios[0]!.vm.$emit("update:modelValue", true);
      expect(claim.state.newFormInline.attachments).toEqual(["claim.png"]);
      expect(claim.state.newFormInline.isReceive).toBe(true);
    } finally {
      claim.wrapper.unmount();
    }

    const supplierClaim = await mountForm(ORDER_TYPE.supplierClaim);
    try {
      supplierClaim.state.formTitle = "结算";
      await nextTick();
      expect(supplierClaim.wrapper.findComponent(ProviderSelect).exists()).toBe(
        true
      );
      expect(
        supplierClaim.wrapper
          .findAllComponents({ name: "ElInputNumber" })
          .some(input => input.props("disabled"))
      ).toBe(true);
      expect(supplierClaim.wrapper.text()).not.toContain("应付货款");
    } finally {
      supplierClaim.wrapper.unmount();
    }

    const returned = await mountForm(ORDER_TYPE.return);
    try {
      returned.state.formTitle = "退款";
      await nextTick();
      expect(
        returned.wrapper
          .findAllComponents({ name: "ElInputNumber" })
          .some(input => input.props("precision") === 2)
      ).toBe(true);
      expect(
        returned.wrapper.findAllComponents({ name: "ElInputNumber" }).length
      ).toBeGreaterThan(2);
      expect(returned.wrapper.findComponent(ProviderSelect).exists()).toBe(
        false
      );
    } finally {
      returned.wrapper.unmount();
    }

    for (const type of [ORDER_TYPE.surplus, ORDER_TYPE.waste]) {
      const excluded = await mountForm(type);
      try {
        expect(excluded.wrapper.text()).not.toContain("应付货款");
      } finally {
        excluded.wrapper.unmount();
      }
    }
  });

  it("renders the approval rejection field only for rejected orders", async () => {
    const { wrapper, state } = await mountForm();
    try {
      state.formTitle = "审核";
      state.newFormInline.isApproved = false;
      await nextTick();
      const findReason = () =>
        wrapper
          .findAllComponents({ name: "ElInput" })
          .find(input => input.props("placeholder") === "请输入拒绝原因");
      expect(findReason()).toBeDefined();
      await findReason()!.vm.$emit("update:modelValue", "missing invoice");
      expect(state.newFormInline.rejectReason).toBe("missing invoice");

      const radio = wrapper.findComponent({ name: "ElRadioGroup" });
      await radio.vm.$emit("update:modelValue", true);
      await nextTick();
      expect(state.newFormInline.isApproved).toBe(true);
      expect(findReason()).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  it("renders supplier claim summaries and creation states", async () => {
    const { wrapper, state } = await mountForm(ORDER_TYPE.claim);
    try {
      state.formTitle = "查看";
      state.newFormInline.isApproved = true;
      delete state.newFormInline.supplierClaimOrders;
      await nextTick();
      expect(wrapper.text()).toContain("暂无");
      expect(wrapper.text()).toContain("生成供应商索赔单");

      state.newFormInline.supplierClaimOrders = [
        {
          uid: "claim-2",
          docNo: "SC-2",
          isApproved: true,
          isReversed: true,
          createdAt: "2026-02-01"
        }
      ];
      await nextTick();
      expect(wrapper.text()).toContain("SC-2 · 已作废");
      expect(wrapper.text()).not.toContain("暂无");
      expect(wrapper.text()).toContain("生成供应商索赔单");

      state.newFormInline.isApproved = false;
      await nextTick();
      expect(wrapper.text()).not.toContain("生成供应商索赔单");
    } finally {
      wrapper.unmount();
    }
  });

  it("renders editable table actions and recalculates row totals", async () => {
    const PopconfirmStub = defineComponent({
      setup(_props, { slots }) {
        return () =>
          h("div", { class: "popconfirm-stub" }, slots.reference?.());
      }
    });
    const { wrapper, state } = await mountForm(ORDER_TYPE.purchase, {
      ElPopconfirm: PopconfirmStub
    });
    try {
      state.allTireList = [
        { id: 1, uid: "tire-1", name: "Tire 1" },
        { id: 2, uid: "tire-2", name: "Tire 2" }
      ];
      state.allRepoList = [{ id: 1, uid: "repo-1", name: "Repo 1" }];
      state.newFormInline.details = [detail({ count: 1 })];
      state.newFormInline.count = 1;
      await nextTick();

      expect(
        wrapper
          .findAllComponents({ name: "ElOption" })
          .map(option => option.props("label"))
      ).toEqual(["Tire 1", "Tire 2", "Repo 1"]);
      expect(wrapper.findAll(".reset-margin")).toHaveLength(1);

      const numbers = wrapper.findAllComponents({ name: "ElInputNumber" });
      await numbers[0]!.vm.$emit("update:modelValue", 3);
      await numbers[0]!.vm.$emit("change", 3);
      expect(state.newFormInline.count).toBe(3);

      const append = wrapper
        .findAllComponents({ name: "ElButton" })
        .find(button => button.html().includes("添加一行数据"));
      await append!.trigger("click");
      expect(state.newFormInline.details).toHaveLength(2);

      await wrapper.findAll(".reset-margin")[0]!.trigger("click");
      await wrapper.findComponent(PopconfirmStub).vm.$emit("confirm");
      expect(state.newFormInline.details).toHaveLength(1);

      const table = wrapper.findComponent(".pure-table-stub");
      await table.vm.$emit("update:modelValue", []);
      expect(state.newFormInline.details).toEqual([]);

      state.formTitle = "查看";
      await nextTick();
      expect(wrapper.text()).not.toContain("添加一行数据");
      expect(wrapper.findAll(".reset-margin")).toHaveLength(0);
    } finally {
      wrapper.unmount();
    }
  });

  it("synchronizes settlement fields and supplier claim status", async () => {
    const { wrapper, state } = await mountForm(ORDER_TYPE.purchase);
    try {
      state.newFormInline.paidAmount = 4;
      state.newFormInline.total = 10;
      state.newFormInline.showTotal = 12;
      await nextTick();
      const numbers = wrapper.findAllComponents({ name: "ElInputNumber" });
      const paid = numbers.find(input => input.props("modelValue") === 4);
      const total = numbers.find(input => input.props("modelValue") === 10);
      await paid!.vm.$emit("update:modelValue", 5);
      await total!.vm.$emit("update:modelValue", 11);
      expect(state.newFormInline.paidAmount).toBe(5);
      expect(state.newFormInline.total).toBe(11);
    } finally {
      wrapper.unmount();
    }

    for (const [isApproved, isReversed, label] of [
      [false, false, "待审核"],
      [true, false, "已审核"],
      [true, true, "已作废"]
    ] as const) {
      const { wrapper, state } = await mountForm(ORDER_TYPE.supplierClaim);
      try {
        state.newFormInline.isApproved = isApproved;
        state.newFormInline.isReversed = isReversed;
        await nextTick();
        expect(
          wrapper
            .findAllComponents({ name: "ElInput" })
            .some(input => input.props("modelValue") === label)
        ).toBe(true);
      } finally {
        wrapper.unmount();
      }
    }
  });
});
