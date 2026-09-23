import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import SalesHotspotCharts from "../components/SalesHotspotCharts.vue";
import {
  getSalesProvinceApi,
  getSalesRegionApi,
  getSalesSummaryByDimensionApi
} from "@/api/analysis";

vi.mock("@/api/analysis", () => ({
  getSalesRegionApi: vi.fn(),
  getSalesProvinceApi: vi.fn(),
  getSalesSummaryByDimensionApi: vi.fn()
}));

vi.mock("@/utils/echarts", () => ({
  getEcharts: vi.fn(async () => ({
    init: () => ({
      setOption: vi.fn(),
      resize: vi.fn(),
      dispose: vi.fn()
    })
  }))
}));

vi.mock("@/utils", () => ({
  handleApiError: vi.fn()
}));

const ElCard = defineComponent({
  name: "ElCard",
  setup(_, { slots }) {
    return () =>
      h("div", { class: "el-card" }, [slots.header?.(), slots.default?.()]);
  }
});
const ElRow = defineComponent({
  name: "ElRow",
  setup(_, { slots }) {
    return () => h("div", { class: "el-row" }, slots.default?.());
  }
});
const ElCol = defineComponent({
  name: "ElCol",
  setup(_, { slots }) {
    return () => h("div", { class: "el-col" }, slots.default?.());
  }
});
const ElTag = defineComponent({
  name: "ElTag",
  setup(_, { slots }) {
    return () => h("span", { class: "el-tag" }, slots.default?.());
  }
});
const ElSegmented = defineComponent({
  name: "ElSegmented",
  props: {
    modelValue: { type: String, default: "tire" },
    options: { type: Array, default: () => [] }
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h(
        "select",
        {
          value: props.modelValue,
          onChange: (e: Event) =>
            emit("update:modelValue", (e.target as HTMLSelectElement).value)
        },
        (props.options as Array<{ label: string; value: string }>).map(opt =>
          h("option", { value: opt.value }, opt.label)
        )
      );
  }
});

describe("SalesHotspotCharts", () => {
  beforeEach(() => {
    vi.mocked(getSalesRegionApi).mockReset();
    vi.mocked(getSalesProvinceApi).mockReset();
    vi.mocked(getSalesSummaryByDimensionApi).mockReset();

    vi.mocked(getSalesRegionApi).mockResolvedValue({
      code: 200,
      data: {
        summary: [
          {
            regionId: 1,
            regionName: "华东",
            amount: "10000",
            count: 2,
            customerCount: 1
          }
        ],
        trend: [
          {
            period: "2026-07",
            regions: [
              {
                regionId: 1,
                regionName: "华东",
                amount: "10000",
                count: 2,
                customerCount: 1
              }
            ]
          }
        ]
      }
    } as never);

    vi.mocked(getSalesProvinceApi).mockResolvedValue({
      code: 200,
      data: {
        summary: [
          {
            province: "广东省",
            amount: "8000",
            count: 1,
            customerCount: 1
          }
        ]
      }
    } as never);

    vi.mocked(getSalesSummaryByDimensionApi).mockResolvedValue({
      code: 200,
      data: {
        items: [
          {
            id: "t1",
            name: "轮胎A",
            quantity: 10,
            amount: "5000",
            count: 3
          }
        ],
        totalQuantity: 10,
        totalAmount: "5000",
        total: 1
      }
    } as never);
  });

  it("loads region, province and dimension endpoints", async () => {
    const wrapper = mount(SalesHotspotCharts, {
      props: {
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        groupBy: "month",
        dimension: "tire"
      },
      global: {
        stubs: {
          ElCard,
          ElRow,
          ElCol,
          ElTag,
          ElSegmented,
          "el-card": ElCard,
          "el-row": ElRow,
          "el-col": ElCol,
          "el-tag": ElTag,
          "el-segmented": ElSegmented
        },
        directives: {
          loading: () => undefined
        }
      }
    });

    await flushPromises();
    await nextTick();

    expect(getSalesRegionApi).toHaveBeenCalledWith({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      groupBy: "month"
    });
    expect(getSalesProvinceApi).toHaveBeenCalledWith({
      startDate: "2026-07-01",
      endDate: "2026-07-31"
    });
    expect(getSalesSummaryByDimensionApi).toHaveBeenCalledWith({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      groupBy: "tire",
      limit: 15
    });

    expect(wrapper.text()).toContain("区域销售（B1a）");
    expect(wrapper.text()).toContain("省份销售（B1c）");
    expect(wrapper.text()).toContain("销售维度构成（B2）");
  });
});
