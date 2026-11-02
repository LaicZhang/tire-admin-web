import type { Component } from "vue";
import { flushPromises } from "@vue/test-utils";
import { ref } from "vue";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => ({
  message: vi.fn(),
  error: vi.fn(),
  payments: vi.fn(),
  flow: vi.fn(),
  balances: vi.fn(),
  debts: vi.fn(),
  exportRows: vi.fn(),
  printRows: vi.fn()
}));

vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  message: mocks.message,
  handleApiError: mocks.error
}));
vi.mock("@/api/payment", () => ({ getPaymentListApi: mocks.payments }));
vi.mock("@/api/fund/statement", () => ({
  getFundFlowListApi: mocks.flow,
  getAccountBalanceApi: mocks.balances,
  getContactDebtListApi: mocks.debts
}));
vi.mock("@/utils/tablePresentation", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils/tablePresentation")>()),
  exportRowsAsCsv: mocks.exportRows,
  printRows: mocks.printRows
}));
vi.mock("@/composables/useOptions", () => ({
  useOptions: () => ({
    customers: ref([{ name: " Alice " }, { name: "" }, { name: "Alice" }, {}]),
    providers: ref([{ name: " Vendor " }, { name: "Alice" }])
  })
}));

type State = Record<string, any>;
async function mountPage(variant = 0) {
  const module = await import("../index.vue");
  return mountSmokeComponent(
    async () => module as { default: Component },
    "fund/report/index.vue",
    {
      keepMounted: true,
      allowRenderErrors: true,
      variant
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
  mocks.payments.mockResolvedValue({ data: [{ uid: "pay-1", name: "Cash" }] });
  mocks.flow.mockResolvedValue({
    data: {
      list: [
        { direction: "IN", amount: 100, transactionTime: "2026-01-01" },
        { direction: "OUT", amount: 30, createdAt: "2026-01-02" },
        { direction: "OUT" }
      ],
      total: 3
    }
  });
  mocks.balances.mockResolvedValue({
    data: [{ paymentName: "Cash", closingBalance: 1000 }]
  });
  mocks.debts.mockResolvedValue({
    data: {
      list: [
        {
          targetName: "Vendor",
          targetType: "PROVIDER",
          netDebt: -500,
          receivableAmount: 10,
          payableAmount: 20
        }
      ],
      total: 1
    }
  });
});

describe("fund report behavior", () => {
  it("loads and summarizes fund flow while ignoring missing amounts", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    expect(vm.paymentList).toEqual([{ uid: "pay-1", name: "Cash" }]);
    expect(vm.fundFlowList).toHaveLength(3);
    expect(vm.statistics).toMatchObject({
      totalIncome: 100,
      totalExpense: 30,
      netBalance: 70
    });
    expect(vm.sparklinePoints).toEqual([
      { label: "2026-01-01", value: 1 },
      { label: "2026-01-02", value: -0.3 },
      { label: "未知", value: 0 }
    ]);
    expect(vm.sparklineMeta.chartType).toBe("line");
    wrapper.unmount();
  });

  it("deduplicates debt target names by selected party type", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    expect(vm.debtTargetNameOptions).toEqual(["Alice", "Vendor"]);

    vm.queryForm.targetType = "CUSTOMER";
    expect(vm.debtTargetNameOptions).toEqual(["Alice"]);
    vm.queryForm.targetType = "PROVIDER";
    expect(vm.debtTargetNameOptions).toEqual(["Vendor", "Alice"]);
    wrapper.unmount();
  });

  it("clears flow data and reports query failures", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.fundFlowList = [{}];

    mocks.flow.mockRejectedValueOnce(new Error("down"));
    await vm.fetchFundFlow();
    expect(vm.fundFlowList).toEqual([]);
    expect(vm.loading).toBe(false);
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "查询资金流水失败"
    );
    wrapper.unmount();
  });

  it("loads and clears balance reports on failure", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.activeTab = "balance";
    vm.queryForm.paymentId = "pay-1";

    await vm.onSearch();
    expect(mocks.balances).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "pay-1" })
    );
    expect(vm.accountBalanceList).toHaveLength(1);
    expect(vm.sparklinePoints).toEqual([{ label: "Cash", value: 10 }]);
    expect(vm.sparklineMeta).toMatchObject({
      chartType: "bar",
      color: "#0f766e"
    });

    mocks.balances.mockRejectedValueOnce(new Error("down"));
    await vm.fetchAccountBalance();
    expect(vm.accountBalanceList).toEqual([]);
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "查询账户余额失败"
    );
    wrapper.unmount();
  });

  it("loads and totals debt reports, then clears them on failure", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    vm.activeTab = "debt";

    await vm.onSearch();
    expect(vm.statistics).toMatchObject({
      totalReceivable: 10,
      totalPayable: 20
    });
    expect(vm.sparklinePoints).toEqual([{ label: "Vendor", value: -5 }]);
    expect(vm.sparklineMeta).toMatchObject({
      chartType: "bar",
      color: "#ef4444"
    });

    mocks.debts.mockRejectedValueOnce(new Error("down"));
    await vm.fetchContactDebt();
    expect(vm.contactDebtList).toEqual([]);
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "查询往来欠款失败"
    );
    wrapper.unmount();
  });

  it("exports the report matching the active tab", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    vm.handleExport();
    vm.activeTab = "balance";
    vm.handleExport();
    vm.activeTab = "debt";
    vm.handleExport();

    expect(mocks.exportRows).toHaveBeenNthCalledWith(
      1,
      expect.any(Array),
      expect.any(Array),
      "fund-flow-report"
    );
    expect(mocks.exportRows).toHaveBeenNthCalledWith(
      2,
      expect.any(Array),
      expect.any(Array),
      "account-balance-report"
    );
    expect(mocks.exportRows).toHaveBeenNthCalledWith(
      3,
      expect.any(Array),
      expect.any(Array),
      "contact-debt-report"
    );
    wrapper.unmount();
  });

  it("prints supported tabs and reports unsupported or failing print", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);

    vm.handlePrint();
    expect(mocks.printRows).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Array),
      "资金流水明细"
    );
    vm.activeTab = "debt";
    vm.handlePrint();
    expect(mocks.printRows).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Array),
      "往来单位欠款表"
    );
    vm.activeTab = "balance";
    vm.handlePrint();
    expect(mocks.message).toHaveBeenCalledWith("当前标签页不支持打印", {
      type: "warning"
    });

    mocks.printRows.mockImplementationOnce(() => {
      throw new Error("printer");
    });
    vm.activeTab = "flow";
    vm.handlePrint();
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), "打印失败");
    wrapper.unmount();
  });

  it("resets filters and searches the new tab", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const resetFields = vi.fn();
    const beforeDebts = mocks.debts.mock.calls.length;

    vm.resetForm();
    expect(vm.queryForm.targetName).toBeUndefined();
    vm.queryForm.targetName = "Alice";
    vm.activeTab = "debt";
    vm.resetForm({ resetFields });

    expect(resetFields).toHaveBeenCalledOnce();
    expect(vm.queryForm).toMatchObject({
      targetName: "",
      targetType: undefined,
      paymentId: undefined
    });
    expect(mocks.debts.mock.calls.length).toBeGreaterThan(beforeDebts);

    vm.handleTabChange("balance");
    expect(vm.activeTab).toBe("balance");
    await settle();
    expect(mocks.balances).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("provides deterministic date range shortcuts", async () => {
    const wrapper = await mountPage();
    await settle();
    const vm = state(wrapper);
    const today = vm.dateShortcuts[0].value();
    expect(today).toHaveLength(2);
    expect(today[0]).toBe(today[1]);
    expect(
      vm.dateShortcuts.every(
        (item: { value: () => unknown[] }) => item.value().length === 2
      )
    ).toBe(true);
    wrapper.unmount();
  });

  it("reports payment load failures without discarding other data", async () => {
    mocks.payments.mockRejectedValueOnce(new Error("down"));
    const wrapper = await mountPage();
    await settle();
    expect(mocks.error).toHaveBeenCalledWith(
      expect.any(Error),
      "加载账户列表失败"
    );
    expect(state(wrapper).fundFlowList).toHaveLength(3);
    wrapper.unmount();
  });
});
