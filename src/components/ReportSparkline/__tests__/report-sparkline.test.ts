import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import ReportSparkline from "../index.vue";

const setOption = vi.fn();

vi.mock("@/utils/echarts", () => ({
  getEcharts: vi.fn(async () => ({
    init: () => ({
      setOption,
      resize: vi.fn(),
      dispose: vi.fn()
    })
  }))
}));

const ElCard = defineComponent({
  name: "ElCard",
  setup(_, { slots }) {
    return () =>
      h("div", { class: "el-card" }, [slots.header?.(), slots.default?.()]);
  }
});
const ElTag = defineComponent({
  name: "ElTag",
  setup(_, { slots }) {
    return () => h("span", { class: "el-tag" }, slots.default?.());
  }
});

describe("ReportSparkline", () => {
  beforeEach(() => {
    setOption.mockClear();
  });

  it("renders empty state without points", async () => {
    const wrapper = mount(ReportSparkline, {
      props: { title: "销售趋势", points: [] },
      global: {
        stubs: { ElCard, ElTag, "el-card": ElCard, "el-tag": ElTag },
        directives: { loading: () => undefined }
      }
    });
    await flushPromises();
    expect(wrapper.text()).toContain("销售趋势");
    expect(wrapper.text()).toContain("暂无趋势数据");
  });

  it("renders chart when points provided", async () => {
    mount(ReportSparkline, {
      props: {
        title: "采购金额趋势",
        seriesName: "金额",
        chartType: "line",
        points: [
          { label: "2026-07-01", value: 100 },
          { label: "2026-07-02", value: 220 }
        ]
      },
      global: {
        stubs: { ElCard, ElTag, "el-card": ElCard, "el-tag": ElTag },
        directives: { loading: () => undefined }
      }
    });
    await flushPromises();
    await nextTick();
    expect(setOption).toHaveBeenCalled();
    const option = setOption.mock.calls[0]?.[0] as {
      series?: Array<{ data?: number[] }>;
    };
    expect(option.series?.[0]?.data).toEqual([100, 220]);
  });
});
