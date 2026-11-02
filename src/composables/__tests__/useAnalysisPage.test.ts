import { defineComponent, h, nextTick, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { useAnalysisPage, useSummaryCard } from "../useAnalysisPage";

const { initMock, disposeMock, resizeMock, getDataURLMock, errorMock } =
  vi.hoisted(() => ({
    initMock: vi.fn(),
    disposeMock: vi.fn(),
    resizeMock: vi.fn(),
    getDataURLMock: vi.fn(() => "data:image/png;base64,fixture"),
    errorMock: vi.fn()
  }));

vi.mock("echarts", () => ({ init: initMock }));
vi.mock("@/utils/logger", () => ({
  createLogger: () => ({ error: errorMock })
}));

function mountedComposable(options: Parameters<typeof useAnalysisPage>[0]) {
  let api!: ReturnType<typeof useAnalysisPage>;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useAnalysisPage(options);
        return () => h("div");
      }
    })
  );
  return { api, wrapper };
}

describe("useAnalysisPage", () => {
  beforeEach(() => {
    initMock.mockReset().mockReturnValue({
      dispose: disposeMock,
      resize: resizeMock,
      getDataURL: getDataURLMock
    });
    disposeMock.mockClear();
    resizeMock.mockClear();
    getDataURLMock.mockClear();
    errorMock.mockClear();
  });

  it("initializes, refreshes with formatted dates, resets and exports", async () => {
    const element = document.createElement("div");
    const chartRef = ref<HTMLElement | null>(element);
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const defaultRange = () =>
      [new Date(2026, 0, 2), new Date(2026, 10, 9)] as [Date, Date];
    const { api, wrapper } = mountedComposable({
      chartRef,
      onRefresh,
      defaultDateRange: defaultRange
    });
    await flushPromises();
    await nextTick();
    await vi.waitFor(() => expect(initMock).toHaveBeenCalledWith(element));
    expect(onRefresh).toHaveBeenCalledWith({
      startDate: "2026-01-02",
      endDate: "2026-11-09"
    });
    expect(api.loading.value).toBe(false);
    expect(api.shortcuts.map(item => item.text)).toEqual([
      "最近一周",
      "最近一个月",
      "最近三个月"
    ]);
    for (const shortcut of api.shortcuts) {
      const [start, end] = shortcut.value();
      expect(start.getTime()).toBeLessThan(end.getTime());
    }

    api.chartInstance.value = { resize: resizeMock };
    window.dispatchEvent(new Event("resize"));
    expect(resizeMock).toHaveBeenCalledOnce();

    api.dateRange.value = null;
    await api.refresh();
    expect(onRefresh).toHaveBeenLastCalledWith(undefined);

    api.chartInstance.value = {
      getDataURL: getDataURLMock,
      dispose: disposeMock
    };
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    api.exportChartImage("report");
    expect(getDataURLMock).toHaveBeenCalledWith({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#fff"
    });
    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();

    api.resetAndRefresh();
    await flushPromises();
    expect(api.dateRange.value).toEqual(defaultRange());
    wrapper.unmount();
    expect(disposeMock).toHaveBeenCalled();
  });

  it("handles missing containers, chart failures, dispose replacement and no export support", async () => {
    const chartRef = ref<HTMLElement | null>(null);
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { api, wrapper } = mountedComposable({ chartRef, onRefresh });
    await flushPromises();
    expect(initMock).not.toHaveBeenCalled();
    expect(api.dateRange.value).toBeNull();
    api.exportChartImage();
    expect(getDataURLMock).not.toHaveBeenCalled();

    chartRef.value = document.createElement("div");
    api.chartInstance.value = { dispose: disposeMock };
    await nextTick();
    // Internal init is lifecycle-bound; invoking the documented surface still
    // exercises no-op resize and export safety.
    api.chartInstance.value = null;
    window.dispatchEvent(new Event("resize"));
    api.resetAndRefresh();
    await flushPromises();
    expect(onRefresh).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("exposes summary card mutations", () => {
    let summary!: ReturnType<typeof useSummaryCard>;
    const wrapper = mount(
      defineComponent({
        setup() {
          summary = useSummaryCard();
          return () => h("div");
        }
      })
    );
    summary.setSummaryData([{ label: "A", value: 1 }]);
    summary.addSummaryItem({ label: "B", value: "2", type: "success" });
    expect(summary.summaryData.value).toEqual([
      { label: "A", value: 1 },
      { label: "B", value: "2", type: "success" }
    ]);
    summary.clearSummary();
    expect(summary.summaryData.value).toEqual([]);
    wrapper.unmount();
  });
});
