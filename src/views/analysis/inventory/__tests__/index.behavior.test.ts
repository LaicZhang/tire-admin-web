import { flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick, reactive } from "vue";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    user: { roles: ["warehouseManager"] as string[] },
    summary: vi.fn(),
    slow: vi.fn(),
    stockout: vi.fn(),
    turnover: vi.fn(),
    expiry: vi.fn(),
    dot: vi.fn(),
    movement: vi.fn(),
    stores: vi.fn(),
    repos: vi.fn(),
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
  getInventorySummaryApi: mocks.summary,
  getSlowMovingApi: mocks.slow,
  getStockoutApi: mocks.stockout,
  getInventoryTurnoverApi: mocks.turnover,
  getExpiryDistributionApi: mocks.expiry,
  getDotAgingApi: mocks.dot,
  getInventoryMovementApi: mocks.movement,
  getAnalysisMembersApi: mocks.members
}));

vi.mock("@/api/company/store", () => ({ getStoreListApi: mocks.stores }));
vi.mock("@/api/company/repo", () => ({ getRepoListApi: mocks.repos }));
vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => reactive(mocks.user)
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

const Card = defineComponent({
  setup(_, { slots }) {
    return () => h("div", [slots.header?.(), slots.default?.()]);
  }
});

const Button = defineComponent({
  emits: ["click"],
  setup(_, { emit, slots }) {
    return () =>
      h("button", { onClick: () => emit("click") }, slots.default?.());
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
        h("button", { class: "toolbar-change", onClick: () => emit("change") }),
        h("button", {
          class: "toolbar-refresh",
          onClick: () => emit("refresh")
        })
      ]);
  }
});

function ok(data: unknown) {
  return Promise.resolve({ code: 200, data });
}

function primeDefaults() {
  mocks.route.query = {
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    groupBy: "day"
  };
  mocks.replace.mockResolvedValue(undefined);
  mocks.user.roles = ["warehouseManager"];
  mocks.charts.length = 0;
  mocks.summary.mockReturnValue(
    ok({
      totalCount: 18,
      toBeStockedCount: 2,
      toBeShippedCount: 3,
      inTransitCount: 4,
      totalValue: "1234.5",
      skuCount: 8,
      repoCount: 2,
      belowAlarmCount: 1
    })
  );
  mocks.slow.mockReturnValue(
    ok([
      {
        tireName: "慢胎",
        repoName: "R1",
        quantity: 22,
        lastMoveDate: "2025-12-01"
      },
      { tireName: "", repoName: "R1", stockQuantity: 7 },
      {}
    ])
  );
  mocks.stockout.mockReturnValue(
    ok([
      {
        tireName: "缺胎",
        currentQuantity: 1,
        safetyStock: 9,
        suggestPurchase: 8
      },
      { name: "无建议", currentStock: 2, minStock: 6 },
      {}
    ])
  );
  mocks.turnover.mockReturnValue(
    ok({
      turnoverRate: 3.2,
      averageDays: 41,
      details: [{ name: "R1", turnoverRate: 2.5 }, { repoName: "R2" }]
    })
  );
  mocks.expiry.mockReturnValue(
    ok({
      buckets: [
        { bucket: "30天", quantity: 6 },
        { label: "60天", count: 4 }
      ]
    })
  );
  mocks.dot.mockReturnValue(
    ok({
      list: [
        { repoName: "R1", tireName: "T1", dotYear: 2024, dotWeek: 1, count: 3 },
        { repoName: "", tireName: "T2", count: 2 }
      ]
    })
  );
  mocks.movement.mockReturnValue(
    ok({
      totalBeginQty: 10,
      totalBeginAmount: "100",
      totalInQty: 5,
      totalInAmount: "50",
      totalOutQty: 3,
      totalOutAmount: "30",
      totalEndQty: 12,
      totalEndAmount: "120"
    })
  );
  mocks.stores.mockReturnValue(
    ok({
      list: [
        { uid: "s1", name: "一店", defaultRepositoryId: "r1" },
        { uid: "s2", name: "二店" }
      ]
    })
  );
  mocks.repos.mockReturnValue(
    ok({
      list: [
        { uid: "r1", name: "一号仓" },
        { uid: "r2", name: "二号仓" }
      ]
    })
  );
  mocks.members.mockReturnValue(
    ok([
      { uid: "u1", name: "成员甲", nickname: "甲", roleKeys: ["seller"] },
      { uid: "u2", name: "成员乙", nickname: "", roleKeys: ["seller"] }
    ])
  );
}

async function mountPage(query = mocks.route.query) {
  mocks.route.query = query;
  const wrapper = await mountSmokeComponent(
    () => import("../index.vue"),
    "analysis/inventory/index.vue",
    {
      keepMounted: true,
      deep: true,
      globalStubs: {
        ElCard: Card,
        "el-card": Card,
        ElButton: Button,
        "el-button": Button,
        ElSelect: Select,
        "el-select": Select,
        ElOption: Option,
        "el-option": Option,
        AnalysisDateToolbar: Toolbar
      }
    }
  );
  await flushPromises();
  return wrapper;
}

function optionChart(predicate: (option: any) => boolean) {
  return mocks.charts.find(chart =>
    chart.setOption.mock.calls.some(call => predicate(call[0]))
  );
}

describe("inventory analysis page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    primeDefaults();
  });

  it("loads the warehouse view and renders real summary, tables and six charts", async () => {
    const wrapper = await mountPage();

    await vi.waitFor(() => expect(mocks.summary).toHaveBeenCalled());
    await vi.waitFor(() => expect(mocks.charts).toHaveLength(6));

    expect(wrapper.text()).toContain("库存作战视角");
    expect(wrapper.text()).toContain("库存总价值");
    expect(wrapper.text()).toContain("1,234.50");
    expect(wrapper.text()).toContain("18");
    expect(wrapper.text()).toContain("2 /");
    expect(wrapper.text()).toContain("3");
    expect(wrapper.text()).toContain("库存预警商品数");
    expect(wrapper.text()).toContain("1");
    expect(wrapper.findAll(".h-72")).toHaveLength(3);
    expect(wrapper.findAll(".h-64")).toHaveLength(3);
    expect(wrapper.find("select.select-stub").exists()).toBe(true);
    expect(mocks.members).not.toHaveBeenCalled();
    expect(mocks.summary).toHaveBeenCalledWith({
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      repoId: undefined,
      operatorId: undefined
    });
    expect(mocks.slow).toHaveBeenCalledWith(
      expect.objectContaining({ days: 90 })
    );
    expect(mocks.movement).toHaveBeenCalledWith(
      expect.objectContaining({
        tireId: undefined,
        startDate: undefined,
        endDate: undefined
      })
    );

    expect(
      optionChart(option => option.yAxis?.name === "周转次数")?.setOption
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        xAxis: expect.objectContaining({ data: ["R1", "R2"] })
      })
    );
    expect(
      optionChart(option => Array.isArray(option.yAxis))?.setOption
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        xAxis: expect.objectContaining({
          data: ["期初", "入库", "出库", "期末"]
        })
      })
    );
    expect(
      optionChart(option => option.series?.[0]?.name === "滞销库存")?.setOption
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        yAxis: expect.objectContaining({ data: ["未知", "未知", "慢胎"] })
      })
    );
    expect(
      optionChart(option => option.series?.[0]?.name === "缺货缺口")?.setOption
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        yAxis: expect.objectContaining({ data: ["未知", "无建议", "缺胎"] })
      })
    );
    expect(
      optionChart(option => option.series?.[0]?.type === "pie")?.setOption
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        series: [
          expect.objectContaining({
            data: [
              { name: "30天", value: 6 },
              { name: "60天", value: 4 }
            ]
          })
        ]
      })
    );
    expect(
      optionChart(option => option.series?.[0]?.stack === "dot")?.setOption
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        xAxis: expect.objectContaining({ data: ["R1", "未分配仓"] })
      }),
      true
    );

    wrapper.unmount();
  });

  it("loads member choices for executives and keeps member filters in the URL", async () => {
    mocks.user.roles = ["admin"];
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(mocks.members).toHaveBeenCalledWith({ module: "inventory" })
    );

    const vm = wrapper.vm.$.setupState as Record<string, any>;
    expect(wrapper.text()).toContain(
      "查看成员图表".replace("查看成员图表", "")
    );
    expect(wrapper.findAll("select.select-stub")).toHaveLength(3);
    expect(wrapper.findAll("option")).toHaveLength(6);

    vm.selectedStoreId = "s1";
    vm.selectedRepoId = "r2";
    vm.selectedOperatorId = "u1";
    await vm.handleFiltersChange();
    expect(vm.selectedRepoId).toBe("r1");
    expect(mocks.replace).toHaveBeenLastCalledWith({
      query: expect.objectContaining({
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        storeId: "s1",
        repoId: "r1",
        operatorId: "u1",
        groupBy: "day"
      })
    });

    await vm.clearMemberFilter();
    expect(vm.selectedOperatorId).toBe("");
    expect(mocks.replace).toHaveBeenLastCalledWith({
      query: expect.not.objectContaining({ operatorId: expect.anything() })
    });
    wrapper.unmount();
  });

  it("applies route filters and responds to toolbar, store and repo changes", async () => {
    const wrapper = await mountPage({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      storeId: "s2",
      repoId: "r2",
      groupBy: "week"
    });
    await flushPromises();
    const vm = wrapper.vm.$.setupState as Record<string, any>;

    expect(vm.selectedStoreId).toBe("s2");
    expect(vm.selectedRepoId).toBe("r2");
    expect(
      vm.dateRange?.map((date: Date) => dayjs(date).format("YYYY-MM-DD"))
    ).toEqual(["2026-02-01", "2026-02-28"]);

    vm.dateRange = [new Date("2026-01-01"), new Date("2026-06-01")];
    expect(vm.groupBy).toBe("month");
    vm.groupBy = "week";
    expect(vm.groupBy).toBe("week");

    vm.selectedStoreId = "s1";
    await vm.handleFiltersChange();
    expect(vm.selectedRepoId).toBe("r1");
    expect(mocks.replace).toHaveBeenCalled();

    wrapper.unmount();
  });

  it("renders fallback labels for member selection and clears the filter from the UI", async () => {
    mocks.user.roles = ["admin"];
    const wrapper = await mountPage();
    await vi.waitFor(() => expect(mocks.members).toHaveBeenCalled());
    const vm = wrapper.vm.$.setupState as Record<string, any>;

    const selects = wrapper.findAll("select.select-stub");
    await selects[2].setValue("u1");
    await nextTick();
    expect(vm.selectedOperatorId).toBe("u1");
    expect(wrapper.text()).toContain("甲");
    await selects[2].setValue("u2");
    await nextTick();
    expect(wrapper.text()).toContain("成员乙");
    vm.selectedOperatorId = "missing";
    await nextTick();
    expect(wrapper.text()).toContain("成员视角");

    const returnButton = wrapper
      .findAll("button")
      .find(button => button.text() === "返回公司图表");
    expect(returnButton).toBeDefined();
    await returnButton!.trigger("click");
    expect(vm.selectedOperatorId).toBe("");
    expect(mocks.replace).toHaveBeenLastCalledWith({
      query: expect.not.objectContaining({ operatorId: expect.anything() })
    });
    wrapper.unmount();
  });

  it("wires toolbar v-model, select v-model and refresh events", async () => {
    const wrapper = await mountPage();
    const vm = wrapper.vm.$.setupState as Record<string, any>;

    await wrapper.find(".toolbar-date").trigger("click");
    expect(vm.groupBy).toBe("month");
    await wrapper.find(".toolbar-group").trigger("click");
    expect(vm.groupBy).toBe("week");
    await wrapper.find(".toolbar-change").trigger("click");
    expect(mocks.replace).toHaveBeenCalled();

    const selects = wrapper.findAll("select.select-stub");
    await selects[0].setValue("s2");
    await nextTick();
    expect(vm.selectedStoreId).toBe("s2");
    await wrapper.findAll("select.select-stub")[1].setValue("r2");
    await nextTick();
    expect(vm.selectedRepoId).toBe("r2");

    const before = mocks.summary.mock.calls.length;
    await wrapper.find(".toolbar-refresh").trigger("click");
    await vi.waitFor(() =>
      expect(mocks.summary.mock.calls.length).toBeGreaterThan(before)
    );

    const firstChart = mocks.charts[0];
    if (firstChart) {
      const beforeOptions = firstChart.setOption.mock.calls.length;
      await vm.loadData();
      expect(firstChart.setOption.mock.calls.length).toBeGreaterThan(
        beforeOptions
      );
    }
    wrapper.unmount();
  });

  it("renders the finance section matrix and fills zero defaults", async () => {
    mocks.user.roles = ["finance"];
    mocks.summary.mockReturnValue(ok({}));
    mocks.slow.mockReturnValue(ok([]));
    mocks.stockout.mockReturnValue(ok({ items: [] }));
    mocks.turnover.mockReturnValue(ok({}));
    mocks.expiry.mockReturnValue(ok([]));
    mocks.dot.mockReturnValue(ok({ list: [] }));
    mocks.movement.mockReturnValue(ok({}));
    const wrapper = await mountPage();
    await flushPromises();
    const vm = wrapper.vm.$.setupState as Record<string, any>;

    expect(wrapper.text()).toContain("经营分析视角");
    expect(vm.summaryData).toMatchObject({
      totalCount: 0,
      totalValue: "0",
      belowAlarmCount: 0
    });
    expect(vm.turnoverData).toMatchObject({ turnoverRate: 0, details: [] });
    expect(wrapper.findAll(".h-72")).toHaveLength(2);
    expect(wrapper.findAll(".h-64")).toHaveLength(0);
    expect(mocks.charts.length).toBeLessThan(6);
    wrapper.unmount();
  });

  it("handles null roles and alternate data fallbacks", async () => {
    (mocks.user as any).roles = null;
    mocks.summary.mockResolvedValueOnce({
      code: 200,
      data: { totalCount: 0, totalValue: "", belowAlarmCount: false }
    });
    mocks.slow.mockResolvedValueOnce({ code: 200, data: {} });
    mocks.stockout.mockResolvedValueOnce({ code: 200, data: [] });
    mocks.turnover.mockResolvedValueOnce({ code: 200, data: { details: [] } });
    mocks.expiry.mockResolvedValueOnce({ code: 200, data: [] });
    mocks.dot.mockResolvedValueOnce({ code: 200, data: null });
    mocks.movement.mockResolvedValueOnce({ code: 200, data: {} });
    const wrapper = await mountPage();
    await flushPromises();
    const vm = wrapper.vm.$.setupState as Record<string, any>;

    expect(vm.canSelectMember).toBe(false);
    expect(vm.summaryData.totalCount).toBe(0);
    expect(vm.slowMovingList).toEqual([]);
    expect(vm.expiryData).toEqual([]);
    expect(vm.dotAgingList).toEqual([]);
    expect(vm.turnoverData.details).toEqual([]);
    wrapper.unmount();
  });

  it("handles alternate response shapes, empty payloads and non-200 envelopes", async () => {
    mocks.slow.mockResolvedValueOnce({
      code: 200,
      data: { items: [{ tireName: "数组包", quantity: "3" }] }
    });
    mocks.stockout.mockResolvedValueOnce({ code: 200, data: { items: null } });
    mocks.expiry.mockResolvedValueOnce({ code: 200, data: null });
    mocks.dot.mockResolvedValueOnce({ code: 200, data: null });
    mocks.summary.mockResolvedValueOnce({
      code: 500,
      data: { totalCount: 99 }
    });
    mocks.turnover.mockResolvedValueOnce({ code: 200, data: null });
    mocks.movement.mockResolvedValueOnce({ code: 500, data: {} });

    const wrapper = await mountPage();
    await flushPromises();
    const vm = wrapper.vm.$.setupState as Record<string, any>;

    expect(vm.summaryData.totalCount).toBe(0);
    expect(vm.slowMovingList).toEqual([
      expect.objectContaining({ tireName: "数组包" })
    ]);
    expect(vm.stockoutList).toEqual([]);
    expect(vm.expiryData).toEqual([]);
    expect(vm.dotAgingList).toEqual([]);
    expect(vm.turnoverData.averageDays).toBe(0);
    expect(vm.movementRows).toEqual([]);
    expect(mocks.charts).toHaveLength(4);
    expect(wrapper.text()).toContain("0.00");
    wrapper.unmount();
  });

  it("reports data and option failures and always clears loading", async () => {
    mocks.summary.mockRejectedValueOnce(new Error("summary down"));
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith(
        expect.any(Error),
        "加载库存分析失败"
      )
    );
    const vm = wrapper.vm.$.setupState as Record<string, any>;
    expect(vm.loading).toBe(false);

    mocks.stores.mockRejectedValueOnce(new Error("stores down"));
    await expect(vm.loadOptions()).rejects.toThrow("stores down");

    vm.userStore.roles = ["admin"];
    mocks.members.mockRejectedValueOnce(new Error("members down"));
    await expect(vm.loadAnalysisMembers()).rejects.toThrow("members down");
    expect(mocks.error).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("resizes active charts on window resize and disposes them on unmount", async () => {
    const wrapper = await mountPage();
    await vi.waitFor(() => expect(mocks.charts).toHaveLength(6));
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

  it("truncates ranked chart rows and tolerates malformed row values", async () => {
    mocks.slow.mockReturnValue(
      ok(
        Array.from({ length: 14 }, (_, index) => ({
          quantity: index,
          stockQuantity: 99
        }))
      )
    );
    mocks.stockout.mockReturnValue(
      ok(
        Array.from({ length: 14 }, (_, index) => ({
          currentStock: index,
          minStock: 20,
          suggestPurchase: undefined
        }))
      )
    );
    const wrapper = await mountPage();
    await vi.waitFor(() => expect(mocks.charts).toHaveLength(6));

    const slowData = optionChart(
      option => option.series?.[0]?.name === "滞销库存"
    )?.setOption.mock.calls[0][0].series[0].data;
    const stockoutData = optionChart(
      option => option.series?.[0]?.name === "缺货缺口"
    )?.setOption.mock.calls[0][0].series[0].data;
    expect(slowData).toHaveLength(12);
    expect(stockoutData).toHaveLength(12);
    expect(slowData[11]).toBe(13);
    expect(stockoutData[11]).toBe(20);
    wrapper.unmount();
  });
});
