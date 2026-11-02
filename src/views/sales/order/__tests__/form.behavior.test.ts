import { flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick, type PropType } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  getItem: vi.fn(),
  message: vi.fn(),
  getCompanyId: vi.fn(),
  lastHeader: vi.fn(),
  inventoryDefaults: vi.fn(),
  settlementDefaults: vi.fn(),
  readDraft: vi.fn(),
  writeDraft: vi.fn(),
  applyDraft: vi.fn(),
  quote: vi.fn(),
  loggerError: vi.fn()
}));

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  ALL_LIST: { tire: "tire", repo: "repo", manager: "manager" },
  localForage: () => ({ getItem: mocks.getItem }),
  message: mocks.message
}));
vi.mock("@/api/company", () => ({ getCompanyId: mocks.getCompanyId }));
vi.mock("@/composables", () => ({
  applyLastFormHeaderAsync: mocks.lastHeader,
  loadInventoryDefaults: mocks.inventoryDefaults,
  loadSettlementDefaults: mocks.settlementDefaults,
  readFormDraft: mocks.readDraft,
  writeFormDraft: mocks.writeDraft,
  applyFormDraftHeader: mocks.applyDraft
}));
vi.mock("@/api/business/price-list", () => ({
  quoteSalePriceApi: mocks.quote
}));
vi.mock("@/utils/logger", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/logger")>()),
  logger: { error: mocks.loggerError }
}));

import SalesOrderForm from "../form.vue";

function order(overrides: Record<string, unknown> = {}) {
  return {
    uid: "order-1",
    customerId: "customer-1",
    customerName: "客户",
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
        isShipped: false,
        isDelivered: false
      }
    ],
    ...overrides
  };
}

const PopconfirmStub = defineComponent({
  setup(_, { slots }) {
    return () => h("span", { class: "popconfirm-stub" }, slots.reference?.());
  }
});

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

async function mountForm(title = "新增", value = order()) {
  return mountSmokeComponent(
    async () => ({ default: SalesOrderForm }),
    "sales/order/form.vue",
    {
      allowRenderErrors: true,
      keepMounted: true,
      props: { formTitle: title, formInline: value },
      globalStubs: {
        "pure-table": Table,
        ElPopconfirm: PopconfirmStub,
        "el-popconfirm": PopconfirmStub
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
  mocks.getCompanyId.mockReturnValue("company-1");
  mocks.lastHeader.mockResolvedValue(null);
  mocks.readDraft.mockResolvedValue(null);
  mocks.inventoryDefaults.mockResolvedValue({ defaultWarehouseId: "repo-1" });
  mocks.settlementDefaults.mockResolvedValue({
    defaultReceivableAccount: "payment-1"
  });
  mocks.quote.mockResolvedValue({
    code: 200,
    data: {
      lines: [{ tireId: "tire-1", count: 2, unitPrice: 120, totalAmount: 240 }],
      totalAmount: 240
    }
  });
});

describe("sales order form data and pricing", () => {
  it("normalizes details and loads scoped base data and warehouse defaults", async () => {
    const wrapper = await mountForm(
      "新增",
      order({
        details: [
          {
            tireId: "tire-1",
            count: 1,
            unitPrice: 1,
            total: 1,
            isShipped: false,
            isDelivered: false
          }
        ]
      })
    );
    const vm = state(wrapper);

    expect(vm.formData.details[0]).toMatchObject({
      serialNumbers: [],
      dotCodeMin: "",
      dotCodeMax: "",
      dotRequirementRemark: "",
      serialNosText: ""
    });
    expect(vm.allTireList).toEqual([{ uid: "tire-1", name: "轮胎" }]);
    expect(vm.allRepoList).toEqual([{ uid: "repo-1", name: "主仓" }]);
    expect(vm.managerList).toEqual([{ uid: "manager-1", name: "负责人" }]);
    expect(vm.defaultWarehouseId).toBe("repo-1");

    mocks.getItem.mockRejectedValueOnce(new Error("storage"));
    await vm.loadBaseData();
    expect(mocks.message).toHaveBeenCalledWith("加载基础数据失败", {
      type: "error"
    });
    wrapper.unmount();
  });

  it("applies last-used and draft header values only to blank compatible fields", async () => {
    mocks.lastHeader.mockImplementation(
      async (target: Record<string, unknown>) => {
        target.customerId = "last-customer";
        return { customerId: "last-customer" };
      }
    );
    mocks.readDraft.mockResolvedValue({
      paymentId: "draft-payment",
      repoId: "draft-repo"
    });
    mocks.applyDraft.mockImplementation((target: Record<string, unknown>) => {
      target.paymentId = "draft-payment";
      target.repoId = "draft-repo";
      target.customerName = 42;
    });
    const wrapper = await mountForm(
      "新增",
      order({
        customerId: "",
        customerName: "",
        paymentId: "",
        details: [
          {
            tireId: "tire-1",
            count: 2,
            unitPrice: 1,
            total: 1,
            isShipped: false,
            isDelivered: false,
            repoId: ""
          }
        ]
      })
    );
    const vm = state(wrapper);
    await vm.applyLastUsedPrefill();

    expect(vm.formData.customerId).toBe("last-customer");
    expect(vm.formData.paymentId).toBe("draft-payment");
    expect(vm.formData.details[0].repoId).toBe("draft-repo");
    expect(vm.formData.customerName).toBe("");

    mocks.lastHeader.mockRejectedValueOnce(new Error("last"));
    await vm.applyLastUsedPrefill();
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "[LastForm] saleOrder prefill failed",
      expect.any(Error)
    );
    wrapper.unmount();
  });

  it("skips prefill and settlement defaults outside create and receipt modes", async () => {
    const wrapper = await mountForm("修改");
    const vm = state(wrapper);
    await vm.applyLastUsedPrefill();
    await vm.applyDefaultReceivableAccount();

    expect(mocks.lastHeader).not.toHaveBeenCalled();
    expect(mocks.settlementDefaults).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("computes receive fee and loads a blank settlement account", async () => {
    const wrapper = await mountForm("收款", order({ paymentId: "" }));
    const vm = state(wrapper);
    vm.formData.total = "300.50";
    vm.formData.paidAmount = "100.25";
    await nextTick();

    expect(vm.receiveFee).toBe(200.25);
    expect(vm.getReceiveFee()).toBe(200.25);
    expect(vm.formData.paymentId).toBe("payment-1");

    mocks.settlementDefaults.mockRejectedValueOnce(new Error("defaults"));
    vm.formData.paymentId = "";
    await vm.applyDefaultReceivableAccount();
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "[SettlementDefaults] load failed",
      expect.any(Error)
    );
    wrapper.unmount();
  });

  it("refreshes valid quotes and updates totals and quantity", async () => {
    const wrapper = await mountForm("修改");
    const vm = state(wrapper);

    await expect(vm.refreshPriceQuote()).resolves.toBe(true);
    expect(mocks.quote).toHaveBeenCalledWith({
      customerId: "customer-1",
      lines: [{ tireId: "tire-1", count: 2 }]
    });
    expect(vm.formData.total).toBe(240);
    expect(vm.formData.showTotal).toBe(240);
    expect(vm.formData.count).toBe(2);
    expect(vm.quoteLoading).toBe(false);
    wrapper.unmount();
  });

  it("skips invalid quotes and surfaces server and network failures", async () => {
    const wrapper = await mountForm("修改", order({ customerId: " " }));
    const vm = state(wrapper);

    await expect(vm.refreshPriceQuote()).resolves.toBe(false);
    vm.formData.customerId = "customer-1";
    vm.formData.details = [];
    await expect(vm.refreshPriceQuote()).resolves.toBe(false);
    vm.formData.details = [
      {
        tireId: "",
        count: 0,
        unitPrice: 0,
        total: 0,
        isShipped: false,
        isDelivered: false
      }
    ];
    await expect(vm.refreshPriceQuote()).resolves.toBe(false);

    vm.formData.details = [
      {
        tireId: "tire-1",
        count: 2,
        unitPrice: 0,
        total: 0,
        isShipped: false,
        isDelivered: false
      }
    ];
    mocks.quote.mockResolvedValueOnce({ code: 500, msg: "报价失败" });
    await expect(vm.refreshPriceQuote()).rejects.toThrow("报价失败");
    mocks.quote.mockRejectedValueOnce(new Error("network"));
    await expect(vm.refreshPriceQuote()).rejects.toThrow("network");
    expect(vm.quoteLoading).toBe(false);
    wrapper.unmount();
  });

  it("adds, edits and deletes detail rows while keeping totals consistent", async () => {
    const wrapper = await mountForm("新增");
    const vm = state(wrapper);
    vm.formData.details = [];
    vm.formData.count = 0;
    vm.formData.total = 0;

    vm.onAddDetail();
    Object.assign(vm.formData.details[0], {
      serialNosText: "A,1,2026,1,\nB,2,2026,2,",
      count: 4
    });
    vm.syncDetailSerialNumbers(vm.formData.details[0]);
    expect(vm.formData.details[0].serialNumbers).toHaveLength(2);
    expect(vm.formData.details[0].count).toBe(2);

    vm.formData.count = 2;
    vm.formData.total = 300;
    vm.formData.details[0].total = 300;
    vm.onDeleteDetail(0);
    expect(vm.formData.details).toEqual([]);
    expect(vm.formData.count).toBe(0);
    expect(vm.formData.total).toBe(0);
    expect(vm.formData.showTotal).toBe(0);
    wrapper.unmount();
  });

  it("saves draft data after the debounce and ignores non-create modes", async () => {
    vi.useFakeTimers();
    const wrapper = await mountForm("新增");
    const vm = state(wrapper);
    vm.formData.remark = "备注";
    await nextTick();
    await vi.advanceTimersByTimeAsync(800);

    expect(mocks.writeDraft).toHaveBeenCalledWith(
      "saleOrder",
      expect.objectContaining({ remark: "备注", repoId: "repo-1" })
    );
    wrapper.unmount();

    mocks.writeDraft.mockClear();
    const readonly = await mountForm("查看");
    state(readonly).scheduleDraftSave();
    await vi.advanceTimersByTimeAsync(800);
    expect(mocks.writeDraft).not.toHaveBeenCalled();
    readonly.unmount();
    vi.useRealTimers();
  });
});

describe("sales order form rendering", () => {
  it.each([
    ["查看", true, false],
    ["新增", false, true],
    ["修改", false, true],
    ["审核", true, false]
  ])("maps %s mode to editable controls", async (title, readOnly, editable) => {
    const wrapper = await mountForm(title, order({ isApproved: false }));
    const vm = state(wrapper);

    expect(vm.isReadOnly).toBe(readOnly);
    expect(vm.isEditable).toBe(editable);
    const html = wrapper.html();
    expect(html.includes("拒绝原因"), html).toBe(title === "审核");
    expect(html.includes("添加商品明细"), html).toBe(editable);
    expect(/>\s*删除\s*</.test(html), html).toBe(editable);
    wrapper.unmount();
  });

  it("renders quote progress and receipt fields", async () => {
    const wrapper = await mountForm("收款", order({ paymentId: "" }));
    expect(wrapper.html()).toContain("本次收款金额");
    expect(wrapper.html()).toContain("收款账户");

    await wrapper.setProps({ formTitle: "修改" });
    const vm = state(wrapper);
    expect(vm.isEditable).toBe(true);
    let resolveQuote!: (value: unknown) => void;
    mocks.quote.mockReturnValueOnce(
      new Promise(resolve => {
        resolveQuote = resolve;
      })
    );
    const quotePromise = vm.refreshPriceQuote();
    expect(mocks.quote).toHaveBeenCalledOnce();
    expect(vm.quoteLoading).toBe(true);
    await flushPromises();

    expect(wrapper.text(), wrapper.html()).toContain("正在刷新报价");
    resolveQuote({
      code: 200,
      data: {
        lines: [
          { tireId: "tire-1", count: 2, unitPrice: 150, totalAmount: 300 }
        ],
        totalAmount: 300
      }
    });
    await quotePromise;
    expect(wrapper.text()).not.toContain("正在刷新报价");
    wrapper.unmount();
  });
});
