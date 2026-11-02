import { flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick, type PropType } from "vue";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  getItem: vi.fn(),
  message: vi.fn(),
  lastHeader: vi.fn(),
  inventoryDefaults: vi.fn(),
  settlementDefaults: vi.fn(),
  loggerError: vi.fn()
}));

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  ALL_LIST: { tire: "tire", repo: "repo", manager: "manager" },
  localForage: () => ({ getItem: mocks.getItem }),
  message: mocks.message
}));
vi.mock("@/composables", () => ({
  applyLastFormHeaderAsync: mocks.lastHeader,
  loadInventoryDefaults: mocks.inventoryDefaults,
  loadSettlementDefaults: mocks.settlementDefaults
}));
vi.mock("@/utils/logger", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/logger")>()),
  logger: { error: mocks.loggerError }
}));

import PurchaseOrderForm from "../form.vue";

function order(overrides: Record<string, unknown> = {}) {
  return {
    uid: "order-1",
    providerId: "provider-1",
    providerName: "供应商",
    count: 2,
    total: 300,
    showTotal: 300,
    paidAmount: 100,
    status: true,
    orderStatus: 0,
    logisticsStatus: 0,
    isApproved: true,
    isLocked: false,
    details: [
      {
        uid: "detail-1",
        tireId: "tire-1",
        count: 2,
        unitPrice: 150,
        total: 300,
        repoId: "",
        isArrival: false,
        desc: ""
      }
    ],
    ...overrides
  };
}

const Table = defineComponent({
  props: {
    data: {
      type: Array as PropType<Record<string, unknown>[]>,
      default: () => []
    }
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        (props.data || [])
          .flatMap((row, index) =>
            Object.entries(slots)
              .filter(([name]) => name !== "default" && name !== "append")
              .flatMap(([, slot]) => slot?.({ row, $index: index }) ?? [])
          )
          .concat(slots.append?.() ?? [])
      );
  }
});
const PopconfirmStub = defineComponent({
  emits: ["confirm"],
  setup(_, { slots }) {
    return () => h("span", { class: "popconfirm" }, slots.reference?.());
  }
});
const FormItemStub = defineComponent({
  props: { label: { type: String, default: "" } },
  setup(props, { slots }) {
    return () =>
      h("div", { class: "form-item" }, [
        props.label ? h("span", props.label) : null,
        slots.default?.()
      ]);
  }
});

async function mountForm(title = "新增", value = order()) {
  return mountSmokeComponent(
    async () => ({ default: PurchaseOrderForm }),
    "purchase/order/form.vue",
    {
      keepMounted: true,
      props: { formTitle: title, formInline: value },
      globalStubs: {
        "pure-table": Table,
        ElPopconfirm: PopconfirmStub,
        "el-popconfirm": PopconfirmStub,
        ElFormItem: FormItemStub,
        "el-form-item": FormItemStub
      }
    }
  );
}

const state = (wrapper: Awaited<ReturnType<typeof mountForm>>) =>
  wrapper.vm.$.setupState as Record<string, any>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getItem.mockImplementation(async (key: string) =>
    key.includes("tire")
      ? [{ uid: "tire-1", name: "轮胎" }]
      : key.includes("repo")
        ? [{ uid: "repo-1", name: "主仓" }]
        : [{ uid: "manager-1", name: "负责人" }]
  );
  mocks.lastHeader.mockResolvedValue(null);
  mocks.inventoryDefaults.mockResolvedValue({ defaultWarehouseId: "repo-1" });
  mocks.settlementDefaults.mockResolvedValue({
    defaultPayableAccount: "payment-1"
  });
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("purchase order form behavior", () => {
  it("loads base data, warehouse defaults and safe prefill fields", async () => {
    mocks.lastHeader.mockImplementation(
      async (target: Record<string, unknown>) => {
        target.providerId = "provider-2";
        target.providerName = "新供应商";
        target.paymentId = "payment-2";
        target.repoId = "repo-2";
        return target;
      }
    );
    const value = order({ providerId: "", providerName: "", paymentId: "" });
    const wrapper = await mountForm("新增", value);
    const vm = state(wrapper);
    try {
      await flushPromises();
      expect(mocks.getItem).toHaveBeenCalledWith("tire");
      expect(mocks.getItem).toHaveBeenCalledWith("repo");
      expect(mocks.getItem).toHaveBeenCalledWith("manager");
      expect(vm.allTireList).toEqual([{ uid: "tire-1", name: "轮胎" }]);
      expect(vm.allRepoList).toEqual([{ uid: "repo-1", name: "主仓" }]);
      expect(vm.managerList).toEqual([{ uid: "manager-1", name: "负责人" }]);
      expect(vm.defaultWarehouseId).toBe("repo-2");
      expect(vm.formData.providerId).toBe("provider-2");
      expect(vm.formData.providerName).toBe("新供应商");
      expect(vm.formData.paymentId).toBe("payment-2");
      expect(vm.formData.details[0].repoId).toBe("repo-2");
    } finally {
      wrapper.unmount();
    }
  });

  it("falls back for empty base data and logs independent loading failures", async () => {
    const wrapper = await mountForm("新增");
    const vm = state(wrapper);
    try {
      await flushPromises();
      vm.allTireList = [];
      vm.allRepoList = [];
      vm.managerList = [];
      mocks.getItem
        .mockReset()
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(new Error("base"))
        .mockResolvedValueOnce(null);
      await vm.loadBaseData();
      expect(mocks.message).toHaveBeenCalledWith("加载基础数据失败", {
        type: "error"
      });
      expect(vm.allTireList).toEqual([]);
      expect(vm.allRepoList).toEqual([]);
      expect(vm.managerList).toEqual([]);

      mocks.inventoryDefaults.mockRejectedValueOnce(new Error("defaults"));
      await vm.loadDefaultWarehouseId();
      expect(mocks.loggerError).toHaveBeenCalledWith(
        "[InventoryDefaults] load failed",
        expect.any(Error)
      );

      mocks.lastHeader.mockRejectedValueOnce(new Error("last"));
      vm.formData = order({ providerId: "", providerName: "", paymentId: "" });
      await vm.applyLastUsedPrefill();
      expect(mocks.loggerError).toHaveBeenCalledWith(
        "[LastForm] purchaseOrder prefill failed",
        expect.any(Error)
      );
    } finally {
      wrapper.unmount();
    }
  });

  it("skips prefill when no header exists, outside create mode and for invalid fields", async () => {
    const wrapper = await mountForm("修改");
    const vm = state(wrapper);
    try {
      await vm.applyLastUsedPrefill();
      expect(mocks.lastHeader).not.toHaveBeenCalled();

      const create = await mountForm(
        "新增",
        order({ providerId: "", paymentId: "" })
      );
      const createState = state(create);
      mocks.lastHeader.mockImplementationOnce(
        async (target: Record<string, unknown>) => {
          target.providerId = 42;
          target.providerName = "";
          target.paymentId = 9;
          target.repoId = "";
          return {};
        }
      );
      await createState.applyLastUsedPrefill();
      expect(createState.formData.providerId).toBe("");
      expect(createState.formData.paymentId).toBe("");
      expect(createState.defaultWarehouseId).toBe("repo-1");
      create.unmount();
    } finally {
      wrapper.unmount();
    }
  });

  it("loads payable defaults only for payment mode when blank", async () => {
    const wrapper = await mountForm("付款", order({ paymentId: "" }));
    const vm = state(wrapper);
    try {
      await flushPromises();
      expect(vm.formData.paymentId).toBe("payment-1");
      mocks.settlementDefaults.mockClear();
      await vm.applyDefaultPayableAccount();
      expect(mocks.settlementDefaults).not.toHaveBeenCalled();

      vm.formData.paymentId = "";
      mocks.settlementDefaults.mockRejectedValueOnce(new Error("settlement"));
      await vm.applyDefaultPayableAccount();
      expect(mocks.loggerError).toHaveBeenCalledWith(
        "[SettlementDefaults] load failed",
        expect.any(Error)
      );

      const modify = await mountForm("修改", order({ paymentId: "" }));
      await flushPromises();
      expect(state(modify).formData.paymentId).toBe("");
      modify.unmount();
    } finally {
      wrapper.unmount();
    }
  });

  it("tracks remaining payable and refreshes payment fee for payment mode", async () => {
    const wrapper = await mountForm("付款", order());
    const vm = state(wrapper);
    try {
      expect(vm.remainingPayable).toBe(200);
      expect(vm.payFee).toBe(200);
      vm.formData.total = "150.25";
      vm.formData.paidAmount = "200";
      await nextTick();
      expect(vm.remainingPayable).toBe(0);
      expect(vm.payFee).toBe(0);
      expect(vm.getPayFee()).toBe(0);

      const modify = await mountForm("修改", order());
      expect(state(modify).payFee).toBe(0);
      modify.unmount();
    } finally {
      wrapper.unmount();
    }
  });

  it("adds, calculates and deletes detail rows while maintaining totals", async () => {
    const wrapper = await mountForm("新增");
    const vm = state(wrapper);
    try {
      vm.formData.details = [];
      vm.formData.count = 0;
      vm.formData.total = 0;
      vm.formData.showTotal = 0;
      vm.onAddDetail();
      expect(vm.formData.details[0]).toMatchObject({
        tireId: "",
        count: 1,
        unitPrice: 0,
        total: 0,
        repoId: "repo-1",
        isArrival: false
      });

      Object.assign(vm.formData.details[0], { count: 3, unitPrice: 2.5 });
      vm.calcDetailTotal(vm.formData.details[0]);
      expect(vm.formData.total).toBe(7.5);
      expect(vm.formData.showTotal).toBe(7.5);
      expect(vm.formData.count).toBe(3);

      vm.formData.details.push({
        tireId: "tire-2",
        count: 2,
        unitPrice: 5,
        total: 10,
        isArrival: false
      });
      vm.recalcOrderTotal();
      expect(vm.formData.total).toBe(17.5);
      expect(vm.formData.count).toBe(5);

      vm.onDeleteDetail(1);
      expect(vm.formData.details).toHaveLength(1);
      expect(vm.formData.count).toBe(3);
      expect(vm.formData.total).toBe(7.5);
      vm.onDeleteDetail(0);
      expect(vm.formData.details).toEqual([]);
      expect(vm.formData.count).toBe(0);
      expect(vm.formData.total).toBe(0);
    } finally {
      wrapper.unmount();
    }
  });

  it("derives read-only and editable modes and renders all editor slots", async () => {
    const editable = await mountForm("新增");
    try {
      await flushPromises();
      expect(state(editable).isEditable).toBe(true);
      expect(state(editable).isReadOnly).toBe(false);
      expect(editable.text()).toContain("添加商品明细");
      expect(editable.text()).toContain("删除");
    } finally {
      editable.unmount();
    }

    const readOnly = await mountForm("查看", order({ isApproved: false }));
    try {
      await flushPromises();
      expect(state(readOnly).isReadOnly).toBe(true);
      expect(state(readOnly).isEditable).toBe(false);
      expect(readOnly.text()).not.toContain("添加商品明细");
    } finally {
      readOnly.unmount();
    }

    const audit = await mountForm("审核", order({ isApproved: false }));
    try {
      expect(audit.text()).toContain("拒绝原因");
      await audit.setProps({ formInline: order({ isApproved: true }) });
      await flushPromises();
      expect(audit.text()).not.toContain("拒绝原因");
    } finally {
      audit.unmount();
    }
  });
});
