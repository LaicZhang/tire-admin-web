import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRouter: () => ({ push })
  };
});

vi.mock("@/api/analysis", () => ({
  getProfitStatementApi: vi.fn(),
  getReceivableAgingApi: vi.fn()
}));

import CockpitDecisionCards from "../components/CockpitDecisionCards.vue";
import { getProfitStatementApi, getReceivableAgingApi } from "@/api/analysis";

describe("CockpitDecisionCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProfitStatementApi).mockResolvedValue({
      code: 200,
      data: {
        salesRevenue: "1000",
        salesCost: "400",
        grossProfit: "600",
        grossProfitRate: 60,
        operatingExpense: "100",
        otherIncome: "0",
        netProfit: "500",
        salesOrderCount: 12,
        unknownCostQuantity: 0,
        startDate: "2026-07-01",
        endDate: "2026-07-31"
      }
    } as never);
    vi.mocked(getReceivableAgingApi).mockResolvedValue({
      code: 200,
      data: {
        totalAmount: "20000",
        buckets: [
          { label: "0-30", amount: "10000", count: 2 },
          { label: "31-60", amount: "10000", count: 1 }
        ],
        details: []
      }
    } as never);
  });

  it("loads profit and aging decision cards with date filter", async () => {
    const wrapper = mount(CockpitDecisionCards, {
      props: {
        startDate: "2026-07-01",
        endDate: "2026-07-31"
      },
      global: {
        stubs: {
          ElCard: defineComponent({
            name: "ElCard",
            template:
              "<div class='el-card' @click=\"$attrs.onClick?.()\"><slot /></div>"
          }),
          ElEmpty: true
        }
      }
    });

    await flushPromises();

    expect(getProfitStatementApi).toHaveBeenCalledWith({
      startDate: "2026-07-01",
      endDate: "2026-07-31"
    });
    expect(getReceivableAgingApi).toHaveBeenCalledWith({
      startDate: "2026-07-01",
      endDate: "2026-07-31"
    });
    expect(wrapper.text()).toContain("利润健康");
    expect(wrapper.text()).toContain("应收逾期风险");
    expect(wrapper.text()).toContain("600");
    expect(wrapper.text()).toContain("500");
  });
});
