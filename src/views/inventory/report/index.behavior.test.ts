import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import Index from "./index.vue";
import { ReportType } from "./types";

const mocks = vi.hoisted(() => ({
  unsupported: vi.fn(),
  exportRows: vi.fn(),
  printRows: vi.fn(),
  logError: vi.fn()
}));

vi.mock("@/api/route-gap", () => ({
  unsupportedBackendRoute: mocks.unsupported
}));
vi.mock("@/utils/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }),
  logger: { error: mocks.logError }
}));
vi.mock("@/utils/tablePresentation", () => ({
  exportRowsAsCsv: mocks.exportRows,
  printRows: mocks.printRows
}));
vi.mock("@/components/ReIcon/src/hooks", () => ({
  useRenderIcon: () => "icon"
}));

const ReSearchFormStub = defineComponent({
  emits: ["search", "reset"],
  setup(_, { expose, slots }) {
    const resetFields = vi.fn();
    expose({ resetFields });
    return () => h("div", { "data-testid": "search" }, slots.default?.());
  }
});
const PureTableBarStub = defineComponent({
  emits: ["refresh"],
  setup(_, { slots }) {
    return () =>
      h("div", { "data-testid": "bar" }, [
        slots.buttons?.(),
        slots.default?.({ size: "default", dynamicColumns: [] })
      ]);
  }
});
const PureTableStub = defineComponent({
  props: {
    data: { type: Array, default: () => [] },
    pagination: { type: Object, default: () => ({}) },
    columns: { type: Array, default: () => [] }
  },
  emits: ["page-current-change"],
  setup(props, { slots }) {
    return () =>
      h("div", { "data-testid": "table" }, [
        JSON.stringify(props.data),
        ...(props.data as any[]).flatMap(
          (row, index) => slots.operation?.({ row, $index: index }) ?? []
        )
      ]);
  }
});
const RepoSelectStub = defineComponent({
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup(_, { emit }) {
    return () =>
      h("button", {
        "data-testid": "repo",
        onClick: () => emit("update:modelValue", "repo-2")
      });
  }
});
const SparklineStub = defineComponent({
  props: ["title", "points", "loading"],
  setup(props) {
    return () =>
      h(
        "div",
        { "data-testid": "spark" },
        JSON.stringify({
          title: props.title,
          points: props.points,
          loading: props.loading
        })
      );
  }
});

async function mountPage() {
  return mount(Index, {
    global: {
      stubs: {
        ReSearchForm: ReSearchFormStub,
        PureTableBar: PureTableBarStub,
        "pure-table": PureTableStub,
        RepoSelect: RepoSelectStub,
        ReportSparkline: SparklineStub,
        "el-card": { template: "<section><slot /></section>" },
        "el-form-item": { template: "<div><slot /></div>" },
        "el-checkbox": true,
        "el-date-picker": true,
        "el-button": {
          template: "<button @click=\"$emit('click')\"><slot /></button>"
        },
        "el-radio-group": { template: "<div><slot /></div>" },
        "el-radio-button": { template: "<button><slot /></button>" }
      }
    }
  });
}

function stateOf(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  return (wrapper.vm.$ as unknown as { setupState: Record<string, any> })
    .setupState;
}

function balance(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    tireId: "tire-1",
    tireName: "Tire 1",
    tireBarcode: "BAR-1",
    repoId: "repo-1",
    repoName: "Repo 1",
    quantity: 3,
    unitCost: 100,
    totalCost: 300,
    lastInboundDate: "2026-01-01",
    lastOutboundDate: "2026-01-02",
    ...overrides
  };
}

function detail(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    orderNumber: "IN-1",
    orderType: "入库",
    tireId: "tire-1",
    tireName: "Tire 1",
    repoId: "repo-1",
    repoName: "Repo 1",
    quantity: 2,
    direction: "in",
    unitCost: 100,
    totalCost: 200,
    operatorName: "Operator",
    orderDate: "2026-01-01",
    remark: "remark",
    ...overrides
  };
}

function summary(overrides: Record<string, unknown> = {}) {
  return {
    tireId: "tire-1",
    tireName: "Tire 1",
    tireBarcode: "BAR-1",
    repoId: "repo-1",
    repoName: "Repo 1",
    openingQuantity: 1,
    openingCost: 100,
    inboundQuantity: 2,
    inboundCost: 200,
    outboundQuantity: 1,
    outboundCost: 100,
    closingQuantity: 2,
    closingCost: 200,
    ...overrides
  };
}

describe("InventoryReport behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.unsupported.mockResolvedValue(undefined);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("loads data and resets failure state", async () => {
    const wrapper = await mountPage();
    const state = stateOf(wrapper);
    try {
      await flushPromises();
      expect(mocks.unsupported).toHaveBeenCalledWith(
        "GET /inventory-report/{detail,summary,balance}"
      );
      expect(state.loading).toBe(false);

      state.balanceList = [balance()];
      state.detailList = [detail()];
      state.summaryList = [summary()];
      state.pagination.total = 3;
      mocks.unsupported.mockRejectedValueOnce(new Error("offline"));
      await state.fetchData();
      expect(mocks.logError).toHaveBeenCalledWith(
        "获取报表数据失败",
        expect.any(Error)
      );
      expect(state.balanceList).toEqual([]);
      expect(state.detailList).toEqual([]);
      expect(state.summaryList).toEqual([]);
      expect(state.pagination.total).toBe(0);
      expect(state.loading).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it("handles search, reset, pagination and type selection", async () => {
    const wrapper = await mountPage();
    const state = stateOf(wrapper);
    const form = wrapper.findComponent(ReSearchFormStub);
    try {
      await flushPromises();
      mocks.unsupported.mockClear();

      state.pagination.currentPage = 4;
      state.queryParams.repoId = "repo-1";
      state.queryParams.showZeroStock = true;
      state.queryParams.showNegativeStock = true;
      state.queryParams.showDisabledRepo = true;
      state.dateRange = ["2026-01-01", "2026-01-02"];
      state.handleSearch();
      await flushPromises();
      expect(state.pagination.currentPage).toBe(1);
      expect(mocks.unsupported).toHaveBeenCalledTimes(1);

      state.pagination.currentPage = 7;
      state.onReset();
      await flushPromises();
      const exposed = form.vm.$.exposed as {
        resetFields: ReturnType<typeof vi.fn>;
      };
      expect(exposed.resetFields).toHaveBeenCalled();
      expect(state.queryParams.repoId).toBe("");
      expect(state.queryParams.showZeroStock).toBe(false);
      expect(state.queryParams.showNegativeStock).toBe(false);
      expect(state.queryParams.showDisabledRepo).toBe(false);
      expect(state.dateRange).toBe(null);
      expect(state.pagination.currentPage).toBe(1);

      state.handleCurrentChange(3);
      await flushPromises();
      expect(state.pagination.currentPage).toBe(3);

      state.handleReportTypeChange(undefined);
      expect(mocks.unsupported).not.toHaveBeenCalledTimes(4);
      state.handleReportTypeChange(ReportType.SUMMARY);
      await flushPromises();
      expect(state.currentReportType).toBe(ReportType.SUMMARY);
      expect(state.pagination.currentPage).toBe(1);

      state.handleViewDetail(balance({ tireId: "tire-9", repoId: "repo-9" }));
      await flushPromises();
      expect(state.currentReportType).toBe(ReportType.DETAIL);
      expect(state.queryParams.tireId).toBe("tire-9");
      expect(state.queryParams.repoId).toBe("repo-9");
    } finally {
      wrapper.unmount();
    }
  });

  it("resets safely without a mounted search form", async () => {
    const wrapper = await mountPage();
    const state = stateOf(wrapper);
    try {
      await flushPromises();
      state.searchFormRef = null;
      expect(() => state.onReset()).not.toThrow();
    } finally {
      wrapper.unmount();
    }
  });

  it("exports and prints each report type with its own rows", async () => {
    const wrapper = await mountPage();
    const state = stateOf(wrapper);
    try {
      await flushPromises();
      state.balanceList = [balance()];
      state.detailList = [detail()];
      state.summaryList = [summary()];

      state.handleExport();
      expect(mocks.exportRows).toHaveBeenLastCalledWith(
        state.balanceList,
        expect.any(Array),
        "inventory-balance-report"
      );
      state.handlePrint();
      expect(mocks.printRows).toHaveBeenLastCalledWith(
        state.balanceList,
        expect.any(Array),
        "商品库存余额表"
      );

      state.currentReportType = ReportType.DETAIL;
      state.handleExport();
      expect(mocks.exportRows).toHaveBeenLastCalledWith(
        state.detailList,
        expect.any(Array),
        "inventory-detail-report"
      );
      state.handlePrint();
      expect(mocks.printRows).toHaveBeenLastCalledWith(
        state.detailList,
        expect.any(Array),
        "商品收发明细表"
      );

      state.currentReportType = ReportType.SUMMARY;
      state.handleExport();
      expect(mocks.exportRows).toHaveBeenLastCalledWith(
        state.summaryList,
        expect.any(Array),
        "inventory-summary-report"
      );
      state.handlePrint();
      expect(mocks.printRows).toHaveBeenLastCalledWith(
        state.summaryList,
        expect.any(Array),
        "商品收发汇总表"
      );

      mocks.printRows.mockImplementationOnce(() => {
        throw new Error("printer");
      });
      state.handlePrint();
      expect(mocks.logError).toHaveBeenCalledWith(
        "打印库存报表失败",
        expect.any(Error)
      );
    } finally {
      wrapper.unmount();
    }
  });

  it("maps export values for populated and empty rows", async () => {
    const wrapper = await mountPage();
    const state = stateOf(wrapper);
    try {
      await flushPromises();
      const balanceValues = state.balanceExportColumns.map((column: any) =>
        column.value(
          balance({
            unitCost: 0,
            totalCost: 0,
            tireBarcode: "",
            lastInboundDate: "",
            lastOutboundDate: ""
          })
        )
      );
      expect(balanceValues).toContain("-");
      const detailValues = state.detailExportColumns.map((column: any) =>
        column.value(
          detail({
            direction: "out",
            unitCost: 0,
            totalCost: 0,
            operatorName: "",
            orderDate: "",
            remark: ""
          })
        )
      );
      expect(detailValues).toContain("出库");
      expect(detailValues).toContain("-");
      const summaryValues = state.summaryExportColumns.map((column: any) =>
        column.value(
          summary({
            repoName: "",
            openingCost: 0,
            inboundCost: 0,
            outboundCost: 0,
            closingCost: 0
          })
        )
      );
      expect(summaryValues).toContain("-");
    } finally {
      wrapper.unmount();
    }
  });

  it("selects columns, data and sparkline series for every report type", async () => {
    const wrapper = await mountPage();
    const state = stateOf(wrapper);
    try {
      await flushPromises();
      state.balanceList = [
        balance({ id: 1, tireName: "Low", quantity: 1 }),
        balance({ id: 2, tireName: "", quantity: 9 })
      ];
      state.detailList = [
        detail({ orderDate: "", orderNumber: "IN-2", quantity: 0 })
      ];
      state.summaryList = [summary({ tireName: "", closingQuantity: 0 })];

      expect(state.currentColumns).toEqual(expect.any(Array));
      expect(state.currentData).toBe(state.balanceList);
      expect(state.sparklineTitle).toBe("库存余额 Top 数量（E19）");
      expect(state.sparklinePoints[0].label).toBe("SKU");
      expect(state.sparklinePoints[0].value).toBe(9);

      state.currentReportType = ReportType.DETAIL;
      expect(state.currentData).toBe(state.detailList);
      expect(state.sparklineTitle).toBe("库存明细数量小图（E19）");
      expect(state.sparklinePoints[0]).toEqual({ label: "IN-2", value: 0 });

      state.currentReportType = ReportType.SUMMARY;
      expect(state.currentData).toBe(state.summaryList);
      expect(state.sparklineTitle).toBe("收发汇总小图（E19）");
      expect(state.sparklinePoints[0]).toEqual({ label: "SKU", value: 0 });
    } finally {
      wrapper.unmount();
    }
  });

  it("renders balance detail actions when the table emits a row", async () => {
    const wrapper = await mountPage();
    const state = stateOf(wrapper);
    try {
      await flushPromises();
      state.balanceList = [balance()];
      await wrapper.vm.$nextTick();
      const action = wrapper.find("button");
      expect(action.exists()).toBe(true);
      expect(wrapper.text()).toContain("收发明细");
    } finally {
      wrapper.unmount();
    }
  });
});
