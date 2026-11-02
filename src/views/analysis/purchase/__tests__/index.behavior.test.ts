import { flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick, reactive } from "vue";
import dayjs from "dayjs";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";

const mocks = vi.hoisted(() => {
  const chart = () => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn()
  });
  return {
    route: { query: {} as Record<string, string> },
    replace: vi.fn(),
    user: { roles: ["purchaser"] as string[] | null },
    summary: vi.fn(),
    trend: vi.fn(),
    providers: vi.fn(),
    products: vi.fn(),
    tracking: vi.fn(),
    evaluation: vi.fn(),
    dimension: vi.fn(),
    stores: vi.fn(),
    members: vi.fn(),
    error: vi.fn(),
    charts: [] as ReturnType<typeof chart>[],
    chart
  };
});

vi.mock("vue-router", async importOriginal => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return {
    ...actual,
    useRoute: () => mocks.route,
    useRouter: () => ({ replace: mocks.replace })
  };
});

vi.mock("@/api/analysis", () => ({
  getPurchaseSummaryApi: mocks.summary,
  getPurchaseTrendApi: mocks.trend,
  getProviderRankingApi: mocks.providers,
  getProductRankingApi: mocks.products,
  getPurchaseOrderTrackingApi: mocks.tracking,
  getProviderEvaluationApi: mocks.evaluation,
  getPurchaseSummaryByDimensionApi: mocks.dimension,
  getAnalysisMembersApi: mocks.members
}));

vi.mock("@/api/company/store", () => ({ getStoreListApi: mocks.stores }));
vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => reactive({ roles: mocks.user.roles ?? [] })
}));
vi.mock("@/utils/echarts", () => ({
  getEcharts: vi.fn(async () => ({
    init: () => {
      const instance = mocks.chart();
      mocks.charts.push(instance);
      return instance;
    }
  }))
}));
vi.mock("@/utils", async importOriginal => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  handleApiError: mocks.error
}));

const Button = defineComponent({
  emits: ["click"],
  setup(_, { emit, slots }) {
    return () =>
      h("button", { onClick: () => emit("click") }, slots.default?.());
  }
});

const Select = defineComponent({
  props: { modelValue: { type: String, default: "" } },
  emits: ["update:modelValue", "change"],
  setup(props, { emit, slots }) {
    return () =>
      h(
        "select",
        {
          class: "select-stub",
          value: props.modelValue,
          onChange: (event: Event) => {
            const value = (event.target as HTMLSelectElement).value;
            emit("update:modelValue", value);
            emit("change", value);
          }
        },
        slots.default?.()
      );
  }
});

const Option = defineComponent({
  props: {
    value: { type: String, required: true },
    label: { type: String, default: "" }
  },
  setup(props) {
    return () => h("option", { value: props.value }, props.label);
  }
});

const Toolbar = defineComponent({
  emits: ["update:dateRange", "update:groupBy", "change", "refresh"],
  setup(_, { emit }) {
    return () =>
      h("div", [
        h("button", {
          class: "toolbar-date",
          onClick: () =>
            emit("update:dateRange", [
              new Date("2026-01-01"),
              new Date("2026-06-01")
            ])
        }),
        h("button", {
          class: "toolbar-group",
          onClick: () => emit("update:groupBy", "week")
        }),
        h("button", {
          class: "toolbar-change",
          onClick: () => emit("change")
        }),
        h("button", {
          class: "toolbar-refresh",
          onClick: () => emit("refresh")
        })
      ]);
  }
});

const stubs = {
  AnalysisDateToolbar: Toolbar,
  "analysis-date-toolbar": Toolbar,
  ElButton: Button,
  ElSelect: Select,
  ElOption: Option,
  ElSegmented: defineComponent({
    emits: ["change"],
    setup(_, { emit }) {
      return () =>
        h("button", { class: "segment-change", onClick: () => emit("change") });
    }
  }),
  ElCard: defineComponent({
    setup(_, { slots }) {
      return () => h("div", [slots.header?.(), slots.default?.()]);
    }
  }),
  ElRow: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h("div", slots.default?.())
  }),
  ElCol: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h("div", slots.default?.())
  }),
  ElTag: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h("span", slots.default?.())
  }),
  ElTabs: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h("div", slots.default?.())
  }),
  ElTabPane: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h("div", slots.default?.())
  }),
  "pure-table": defineComponent({
    props: { data: { type: Array, default: () => [] } },
    setup(props) {
      return () =>
        h("div", { class: "pure-table-fixture" }, JSON.stringify(props.data));
    }
  })
};

function ok(data: unknown) {
  return Promise.resolve({ code: 200, data });
}

function primeSuccess() {
  mocks.route = reactive({
    query: {
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      groupBy: "day"
    }
  });
  mocks.replace.mockResolvedValue(undefined);
  mocks.user.roles = ["purchaser"];
  mocks.charts.length = 0;
  mocks.summary.mockReturnValue(
    ok({
      totalAmount: "1000.5",
      totalOrders: 3,
      paidAmount: "500",
      unpaidAmount: "500.5",
      averageOrderValue: "333.5",
      arrivalRate: 75
    })
  );
  mocks.trend.mockReturnValue(
    ok({
      data: [
        { period: "03-01", amount: "600", count: 2 },
        { period: "03-02", amount: "400.5", count: 1 }
      ]
    })
  );
  mocks.providers.mockReturnValue(
    ok({
      items: [{ rank: 1, name: "供应商甲", amount: "600", count: 2 }]
    })
  );
  mocks.products.mockReturnValue(
    ok({
      items: [{ rank: 1, name: "轮胎甲", amount: "400", quantity: 3 }]
    })
  );
  mocks.tracking.mockReturnValue(
    ok({
      list: [
        {
          id: 1,
          number: "PO-1",
          providerName: "甲",
          operatorName: "乙",
          total: "100",
          trackingStatus: "pending"
        },
        {
          id: 2,
          number: "PO-2",
          providerName: "甲",
          operatorName: "乙",
          total: "200",
          trackingStatus: "completed"
        }
      ],
      summary: { pending: 1, partial: 0, completed: 1 }
    })
  );
  mocks.evaluation.mockReturnValue(
    ok({
      list: [
        {
          providerId: "p1",
          providerName: "甲",
          completionRate: 90,
          onTimeRate: 80,
          score: 85
        }
      ],
      summary: { totalProviders: 1, avgCompletionRate: 90, avgOnTimeRate: 80 }
    })
  );
  mocks.dimension.mockReturnValue(
    ok({
      items: [
        { id: "p1", name: "供应商甲", amount: "600", quantity: 2, count: 2 },
        { id: "p2", name: "供应商乙", amount: "400.5", quantity: 1, count: 1 }
      ]
    })
  );
  mocks.stores.mockReturnValue(
    ok({ list: [{ id: 1, uid: "s1", name: "门店甲" }] })
  );
  mocks.members.mockReturnValue(
    ok([
      { uid: "u1", name: "成员甲", nickname: null, roleKeys: [] },
      { uid: "u2", name: null, nickname: "成员乙", roleKeys: [] }
    ])
  );
}

async function mountPage(query?: Record<string, string>) {
  if (query) mocks.route.query = query;
  return mountSmokeComponent(
    async () => ({ default: (await import("../index.vue")).default }),
    "analysis/purchase/index.vue",
    {
      keepMounted: true,
      allowRenderErrors: true,
      globalStubs: stubs,
      route: "/analysis/purchase"
    }
  );
}

function stateOf(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  return wrapper.vm.$.setupState as Record<string, any>;
}

function optionWith(predicate: (option: Record<string, any>) => boolean) {
  return mocks.charts.find(chart =>
    chart.setOption.mock.calls.some(([option]) =>
      predicate(option as Record<string, any>)
    )
  );
}

describe("purchase analysis behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    primeSuccess();
  });

  afterEach(() => {
    window.dispatchEvent(new Event("resize"));
  });

  it("renders the purchaser workflow and maps summary, rankings, tracking and charts", async () => {
    const wrapper = await mountPage();
    await vi.waitFor(() => expect(mocks.charts).toHaveLength(2));
    const state = stateOf(wrapper);

    expect(wrapper.text()).toContain("采购作战视角");
    expect(wrapper.text()).toContain("公司视角");
    expect(wrapper.text()).toContain("1,000.50");
    expect(wrapper.text()).toContain("供应商甲");
    expect(wrapper.text()).toContain("供应商履约评估");
    expect(wrapper.text()).toContain("到货履约概览");
    expect(state.summaryData).toMatchObject({
      totalOrders: 3,
      arrivalRate: 75
    });
    expect(state.providerRanking).toHaveLength(1);
    expect(state.productRanking).toHaveLength(1);
    expect(state.trackingList).toHaveLength(2);
    expect(state.exceptionTrackingList.map((item: any) => item.number)).toEqual(
      ["PO-1"]
    );
    expect(state.providerEvaluationList).toHaveLength(1);
    expect(state.activeRankingTab).toBe("provider");
    expect(mocks.summary).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        storeId: undefined,
        operatorId: undefined,
        groupBy: "day"
      })
    );
    expect(mocks.tracking).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 10 })
    );
    expect(mocks.dimension).toHaveBeenCalledWith(
      expect.objectContaining({ groupBy: "provider", limit: 15 })
    );

    expect(
      optionWith(option => Array.isArray(option.yAxis))?.setOption
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        xAxis: expect.objectContaining({ data: ["03-01", "03-02"] }),
        series: expect.arrayContaining([
          expect.objectContaining({ name: "采购金额" })
        ])
      })
    );
    expect(
      optionWith(
        option =>
          option.yAxis?.type === "category" &&
          option.series?.[0]?.name === "采购金额"
      )?.setOption
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        yAxis: expect.objectContaining({ data: ["供应商乙", "供应商甲"] }),
        series: [expect.objectContaining({ data: [400.5, 600] })]
      })
    );
    wrapper.unmount();
  });

  it("loads executive member choices and keeps filters synchronized with the URL", async () => {
    mocks.user.roles = ["admin"];
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(mocks.members).toHaveBeenCalledWith({ module: "purchase" })
    );
    const state = stateOf(wrapper);

    expect(wrapper.findAll("select.select-stub")).toHaveLength(2);
    expect(wrapper.findAll("option")).toHaveLength(3);
    await wrapper.findAll("select.select-stub")[0].setValue("s1");
    await wrapper.findAll("select.select-stub")[1].setValue("u1");
    expect(state.selectedStoreId).toBe("s1");
    expect(state.selectedOperatorId).toBe("u1");
    expect(wrapper.text()).toContain("成员甲");
    await state.handleFilterChange();
    expect(mocks.replace).toHaveBeenLastCalledWith({
      query: expect.objectContaining({ storeId: "s1", operatorId: "u1" })
    });
    await state.loadData();
    expect(mocks.summary).toHaveBeenLastCalledWith(
      expect.objectContaining({ storeId: "s1", operatorId: "u1" })
    );

    state.selectedOperatorId = "u2";
    expect(wrapper.text()).toContain("成员乙");
    state.selectedOperatorId = "missing";
    await nextTick();
    expect(wrapper.text()).toContain("成员视角");
    await state.clearMemberFilter();
    expect(state.selectedOperatorId).toBe("");
    expect(mocks.replace).toHaveBeenLastCalledWith({
      query: expect.not.objectContaining({ operatorId: expect.anything() })
    });
    wrapper.unmount();
  });

  it("applies route filters and reacts to toolbar v-model and refresh", async () => {
    const wrapper = await mountPage({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      storeId: "s2",
      operatorId: "u1",
      groupBy: "week"
    });
    await flushPromises();
    const state = stateOf(wrapper);

    expect(state.selectedStoreId).toBe("s2");
    expect(state.selectedOperatorId).toBe("u1");
    expect(
      state.dateRange.map((date: Date) => dayjs(date).format("YYYY-MM-DD"))
    ).toEqual(["2026-02-01", "2026-02-28"]);
    await wrapper.find(".toolbar-date").trigger("click");
    expect(state.groupBy).toBe("month");
    await wrapper.find(".toolbar-group").trigger("click");
    expect(state.groupBy).toBe("week");
    await wrapper.find(".toolbar-change").trigger("click");
    expect(mocks.replace).toHaveBeenCalled();

    const before = mocks.summary.mock.calls.length;
    await wrapper.find(".toolbar-refresh").trigger("click");
    await vi.waitFor(() =>
      expect(mocks.summary.mock.calls.length).toBeGreaterThan(before)
    );
    await wrapper.find(".segment-change").trigger("click");
    expect(mocks.dimension).toHaveBeenCalledTimes(3);
    wrapper.unmount();
  });

  it("reloads from route changes and applies the new member filter", async () => {
    const wrapper = await mountPage();
    await flushPromises();
    const state = stateOf(wrapper);
    state.userStore.roles = ["admin"];
    mocks.route.query = {
      startDate: "2026-04-01",
      endDate: "2026-04-02",
      storeId: "s3",
      operatorId: "u2",
      groupBy: "day"
    };
    await nextTick();
    await flushPromises();

    expect(state.selectedStoreId).toBe("s3");
    expect(state.selectedOperatorId).toBe("u2");
    expect(mocks.summary).toHaveBeenLastCalledWith(
      expect.objectContaining({
        storeId: "s3",
        operatorId: "u2",
        startDate: "2026-04-01"
      })
    );
    wrapper.unmount();
  });

  it("renders finance sections and fills summary fallbacks", async () => {
    mocks.user.roles = ["finance"];
    mocks.summary.mockResolvedValueOnce({ code: 200, data: {} });
    mocks.tracking.mockResolvedValueOnce({ code: 200, data: {} });
    mocks.evaluation.mockResolvedValueOnce({ code: 200, data: {} });
    mocks.trend.mockResolvedValueOnce({ code: 200, data: null });
    mocks.dimension.mockResolvedValueOnce({ code: 200, data: null });
    const wrapper = await mountPage();
    await flushPromises();
    const state = stateOf(wrapper);

    expect(wrapper.text()).toContain("经营分析视角");
    expect(wrapper.text()).not.toContain("采购排行");
    expect(wrapper.text()).toContain("供应商履约评估");
    expect(state.summaryData).toEqual({
      totalAmount: "0",
      totalOrders: 0,
      paidAmount: "0",
      unpaidAmount: "0",
      averageOrderValue: "0",
      arrivalRate: 0
    });
    expect(state.trendData).toEqual([]);
    expect(state.trackingList).toEqual([]);
    expect(state.trackingSummary).toEqual({
      pending: 0,
      partial: 0,
      completed: 0
    });
    expect(state.providerEvaluationSummary).toEqual({
      totalProviders: 0,
      avgCompletionRate: 0,
      avgOnTimeRate: 0
    });
    expect(state.dimensionItems).toEqual([]);
    wrapper.unmount();
  });

  it("handles empty and non-200 envelopes without overwriting existing data", async () => {
    const wrapper = await mountPage();
    await flushPromises();
    const state = stateOf(wrapper);
    Object.assign(state.summaryData, { totalOrders: 99 });
    Object.assign(state.trackingSummary, { pending: 8 });
    Object.assign(state.providerEvaluationSummary, { totalProviders: 7 });

    mocks.summary.mockResolvedValueOnce({
      code: 500,
      data: { totalOrders: 1 }
    });
    mocks.trend.mockResolvedValueOnce({
      code: 500,
      data: { data: [{ period: "x", amount: "1", count: 1 }] }
    });
    mocks.providers.mockResolvedValueOnce({
      code: 500,
      data: { items: [{ name: "x" }] }
    });
    mocks.products.mockResolvedValueOnce({ code: 200, data: {} });
    mocks.tracking.mockResolvedValueOnce({
      code: 500,
      data: { list: [{ id: 9 }] }
    });
    mocks.evaluation.mockResolvedValueOnce({
      code: 500,
      data: { list: [{ id: 9 }] }
    });
    mocks.dimension.mockResolvedValueOnce({
      code: 500,
      data: { items: [{ id: "x" }] }
    });
    await state.loadData();

    expect(state.summaryData.totalOrders).toBe(99);
    expect(state.trendData[0].period).toBe("03-01");
    expect(state.providerRanking).toHaveLength(1);
    expect(state.productRanking).toEqual([]);
    expect(state.trackingSummary.pending).toBe(8);
    expect(state.providerEvaluationSummary.totalProviders).toBe(7);
    expect(state.dimensionItems).toEqual([]);
    wrapper.unmount();
  });

  it("handles null option branches and missing chart containers", async () => {
    const wrapper = await mountPage();
    await flushPromises();
    const state = stateOf(wrapper);

    state.chartRef = null;
    state.dimChartRef = null;
    await state.updateChart();
    await state.updateDimChart();
    expect(mocks.charts).toHaveLength(2);

    state.trendData = [];
    state.dimensionItems = [
      { name: "空值", amount: "bad", quantity: 0, count: 0 }
    ];
    state.chartRef = document.createElement("div");
    state.dimChartRef = document.createElement("div");
    await state.updateChart();
    await state.updateDimChart();
    const trendOption = mocks.charts[0].setOption.mock.calls.at(-1)?.[0];
    const dimensionOption = mocks.charts[1].setOption.mock.calls.at(-1)?.[0];
    expect(trendOption.xAxis.data).toEqual([]);
    expect(dimensionOption.series[0].data).toEqual([0]);
    expect(
      dimensionOption.tooltip.formatter([{ name: "空值", value: null }])
    ).toContain("0.00");
    expect(dimensionOption.tooltip.formatter([undefined])).toBe("");
    expect(
      dimensionOption.tooltip.formatter({ name: "单项", value: 12 })
    ).toContain("12.00");
    wrapper.unmount();
  });

  it("reports aggregate failures and always settles loading", async () => {
    mocks.summary.mockRejectedValueOnce(new Error("summary down"));
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith(
        expect.any(Error),
        "加载采购分析失败"
      )
    );
    expect(stateOf(wrapper).loading).toBe(false);
    wrapper.unmount();
  });

  it("loads stores and members defensively and skips members for non-executives", async () => {
    const wrapper = await mountPage();
    await flushPromises();
    const state = stateOf(wrapper);

    mocks.stores.mockResolvedValueOnce({ code: 200, data: null });
    await state.loadStores();
    expect(state.stores).toEqual([]);

    mocks.stores.mockRejectedValueOnce(new Error("stores down"));
    await expect(state.loadStores()).rejects.toThrow("stores down");

    state.userStore.roles = ["purchaser"];
    await state.loadAnalysisMembers();
    expect(state.analysisMembers).toEqual([]);

    state.userStore.roles = ["admin"];
    mocks.members.mockResolvedValueOnce({
      code: 500,
      data: [{ uid: "ignored" }]
    });
    await state.loadAnalysisMembers();
    expect(state.analysisMembers).toEqual([]);

    mocks.members.mockResolvedValueOnce({ code: 200, data: null });
    await state.loadAnalysisMembers();
    expect(state.analysisMembers).toEqual([]);
    mocks.members.mockResolvedValueOnce({ code: 200, data: [{ uid: "u9" }] });
    await state.loadAnalysisMembers();
    expect(state.analysisMembers).toEqual([{ uid: "u9" }]);
    wrapper.unmount();
  });

  it("resizes existing charts and disposes both on unmount", async () => {
    const wrapper = await mountPage();
    await vi.waitFor(() => expect(mocks.charts).toHaveLength(2));
    window.dispatchEvent(new Event("resize"));
    expect(
      mocks.charts.every(chart => chart.resize.mock.calls.length === 1)
    ).toBe(true);
    wrapper.unmount();
    expect(
      mocks.charts.every(chart => chart.dispose.mock.calls.length === 1)
    ).toBe(true);
    window.dispatchEvent(new Event("resize"));
    expect(
      mocks.charts.every(chart => chart.resize.mock.calls.length === 1)
    ).toBe(true);
  });

  it("tolerates null user roles", async () => {
    mocks.user.roles = null;
    const wrapper = await mountPage();
    await flushPromises();
    const state = stateOf(wrapper);
    expect(state.canSelectMember).toBe(false);
    expect(state.roleView).toBe("executive");
    expect(state.visibleSections.has("evaluation")).toBe(true);
    wrapper.unmount();
  });
});
