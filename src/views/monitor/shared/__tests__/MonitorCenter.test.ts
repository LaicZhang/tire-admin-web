import { flushPromises } from "@vue/test-utils";
import { cloneVNode, defineComponent, h, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/store/modules/user";
import { mountSmokeComponent } from "../../../../../tests/helpers/component-smoke";
import MonitorCenter from "../MonitorCenter.vue";
import { useMonitorPerm } from "../useMonitorPerm";

const fixture = vi.hoisted(() => {
  const row = {
    id: 1,
    username: "operator",
    companyId: "company-1",
    companyName: "Company",
    module: "order",
    method: "POST",
    path: "/orders",
    ip: "127.0.0.1",
    success: true,
    sensitive: true,
    traceId: "trace-1",
    createdAt: "2026-01-01T00:00:00.000Z"
  };
  const ok = async (data: unknown = row) => ({ code: 200, data, msg: "" });
  return {
    row,
    getMonitorOverviewApi: vi.fn(async () =>
      ok({
        kpi: {
          loginCount: 1,
          operationCount: 2,
          failureRate: 0.1,
          sensitiveCount: 1,
          cronFailureCount: 1,
          moneyEventCount: 1
        },
        daily: [{ date: "2026-01-01", loginCount: 1 }],
        activeCompanies: [{ companyId: "company-1", companyName: "Company" }]
      })
    ),
    getMonitorBusinessApi: vi.fn(async () =>
      ok({ saleOrder: 1, purchaseOrder: 2, transferOrder: 3, wasteOrder: 4 })
    ),
    getMonitorCompaniesApi: vi.fn(async () =>
      ok({
        list: [{ uid: "company-1", name: "Company", employeeCount: 2 }],
        total: 1
      })
    ),
    getMonitorCronRunsApi: vi.fn(async () =>
      ok({ list: [{ id: 1, jobName: "sync", status: "FAILED" }], total: 1 })
    ),
    getMonitorEmployeesApi: vi.fn(async () => ok({ list: [row], total: 1 })),
    getMonitorLoginLogsApi: vi.fn(async () => ok({ list: [row], total: 1 })),
    getMonitorMoneyApi: vi.fn(async () => ok({ list: [row], total: 1 })),
    getMonitorOperationLogDetailApi: vi.fn(async () => ok(row)),
    getMonitorOperationLogsApi: vi.fn(async () =>
      ok({ list: [row], total: 1 })
    ),
    getMonitorSensitiveLogsApi: vi.fn(async () =>
      ok({ list: [row], total: 1 })
    ),
    getMonitorSystemHealthApi: vi.fn(async () =>
      ok({ archive: { note: "healthy" }, database: "up" })
    ),
    exportMonitorCsvApi: vi.fn(async () => new Blob(["csv"]))
  };
});

vi.mock("@/api/monitor", () => fixture);

function setupState(wrapper: Awaited<ReturnType<typeof mountSmokeComponent>>) {
  return wrapper.vm.$.setupState as Record<string, any>;
}

async function mount(
  route = "/monitor",
  mode: "platform" | "company" = "platform"
) {
  return mountSmokeComponent(
    async () => ({ default: MonitorCenter }),
    "monitor/shared/MonitorCenter.vue",
    { keepMounted: true, route, allowRenderErrors: true, props: { mode } }
  );
}

describe("MonitorCenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ElMessage, "warning").mockImplementation(() => undefined as never);
    vi.spyOn(ElMessage, "success").mockImplementation(() => undefined as never);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:monitor");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("restores platform filters from the route and loads access logs", async () => {
    const wrapper = await mount("/monitor?tab=logs&companyId=company-1");
    const state = setupState(wrapper);
    useUserStore().setRoles(["admin"]);

    expect(wrapper.text()).toContain("平台监控中心");
    expect(state.companyFilter).toBe("company-1");
    expect(state.activeTab).toBe("logs");
    expect(fixture.getMonitorCompaniesApi).toHaveBeenCalledWith("platform", {
      page: 1,
      pageSize: 100
    });
    expect(fixture.getMonitorOperationLogsApi).toHaveBeenCalledWith(
      "platform",
      expect.objectContaining({ companyId: "company-1" })
    );
    expect(fixture.getMonitorLoginLogsApi).toHaveBeenCalled();
    expect(fixture.getMonitorSensitiveLogsApi).toHaveBeenCalled();

    wrapper.unmount();
  });

  it("loads every monitor tab with active filters", async () => {
    const wrapper = await mount();
    const state = setupState(wrapper);
    useUserStore().setRoles(["admin"]);
    Object.assign(state.logFilters, {
      operator: "alice",
      module: "order",
      method: "POST",
      traceId: "trace-1",
      ip: "127.0.0.1",
      success: "false",
      sensitive: "true",
      keyword: "alice"
    });
    state.dateRange = null;

    for (const tab of [
      "org",
      "logs",
      "business",
      "system",
      "money",
      "overview"
    ]) {
      state.activeTab = tab;
      await flushPromises();
    }

    expect(fixture.getMonitorCompaniesApi).toHaveBeenCalledWith(
      "platform",
      expect.objectContaining({ page: 1, pageSize: 20 })
    );
    expect(fixture.getMonitorEmployeesApi).toHaveBeenCalledWith(
      "platform",
      expect.objectContaining({ keyword: "alice", days: 7 })
    );
    expect(fixture.getMonitorOperationLogsApi).toHaveBeenCalledWith(
      "platform",
      expect.objectContaining({
        operator: "alice",
        module: "order",
        method: "POST",
        traceId: "trace-1",
        ip: "127.0.0.1",
        success: "false",
        sensitive: "true"
      })
    );
    expect(fixture.getMonitorBusinessApi).toHaveBeenCalled();
    expect(fixture.getMonitorSystemHealthApi).toHaveBeenCalledWith("platform");
    expect(fixture.getMonitorCronRunsApi).toHaveBeenCalled();
    expect(fixture.getMonitorMoneyApi).toHaveBeenCalled();
    expect(fixture.getMonitorOverviewApi).toHaveBeenCalled();
    expect(state.pagination.page).toBe(1);

    wrapper.unmount();
  });

  it("falls back to the first visible tab and supports company mode", async () => {
    const wrapper = await mount("/monitor?tab=unknown", "company");
    const state = setupState(wrapper);
    useUserStore().setRoles([]);
    useUserStore().setPerms(["get/monitor/overview"]);

    state.setTabFromRoute();
    expect(state.activeTab).toBe("overview");

    useUserStore().setPerms(["get/monitor/logs"]);
    state.setTabFromRoute();
    expect(state.activeTab).toBe("logs");
    expect(wrapper.text()).toContain("公司审计中心");
    expect(fixture.getMonitorCompaniesApi).not.toHaveBeenCalledWith(
      "platform",
      expect.objectContaining({ pageSize: 100 })
    );

    wrapper.unmount();
  });

  it("opens details with the selected company and falls back to the row on failure", async () => {
    const wrapper = await mount();
    const state = setupState(wrapper);
    state.companyFilter = "company-1";

    await state.openDetail(fixture.row);
    expect(fixture.getMonitorOperationLogDetailApi).toHaveBeenCalledWith(
      "platform",
      1,
      { companyId: "company-1" }
    );
    expect(state.detail).toEqual(fixture.row);
    expect(state.detailVisible).toBe(true);
    expect(state.detailLoading).toBe(false);

    fixture.getMonitorOperationLogDetailApi.mockRejectedValueOnce(
      new Error("boom")
    );
    await state.openDetail(fixture.row);
    expect(state.detail).toEqual(fixture.row);
    expect(state.detailLoading).toBe(false);

    state.onOpenOpDetail(fixture.row);
    await flushPromises();
    expect(fixture.getMonitorOperationLogDetailApi).toHaveBeenCalledTimes(3);

    wrapper.unmount();
  });

  it.each(["operation", "login", "sensitive", "money"] as const)(
    "exports the %s audit target",
    async target => {
      const wrapper = await mount();
      const state = setupState(wrapper);
      useUserStore().setRoles(["admin"]);
      state.logFilters.operator = "alice";
      state.logFilters.module = "order";
      state.logFilters.method = "POST";
      state.logFilters.success = "true";
      const click = vi
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => undefined);

      await state.handleExport(target);

      expect(fixture.exportMonitorCsvApi).toHaveBeenCalledWith(
        "platform",
        expect.objectContaining({
          target,
          operator: "alice",
          module: "order",
          method: "POST",
          success: "true"
        })
      );
      expect(click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:monitor");
      expect(ElMessage.success).toHaveBeenCalledWith("导出成功");

      wrapper.unmount();
    }
  );

  it("blocks unauthorized export and reports export failures", async () => {
    const wrapper = await mount();
    const state = setupState(wrapper);
    useUserStore().setRoles([]);

    await state.handleExport("operation");
    expect(ElMessage.warning).toHaveBeenCalledWith("无导出权限");
    expect(fixture.exportMonitorCsvApi).not.toHaveBeenCalled();

    useUserStore().setRoles(["admin"]);
    fixture.exportMonitorCsvApi.mockRejectedValueOnce(new Error("boom"));
    await expect(state.handleExport("login")).resolves.toBeUndefined();

    wrapper.unmount();
  });

  it("navigates each business card and ignores unknown keys", async () => {
    const wrapper = await mount();
    const state = setupState(wrapper);
    const push = vi.spyOn(wrapper.vm.$router, "push");

    const keys = [
      "saleOrder",
      "purchaseOrder",
      "transferOrder",
      "wasteOrder",
      "surplusOrder",
      "writeOffOrder",
      "receiptOrder",
      "paymentOrder"
    ];
    for (const key of keys) state.jumpBusiness(key);
    state.jumpBusiness("unknown");

    expect(push).toHaveBeenCalledTimes(keys.length);
    expect(push).toHaveBeenCalledWith("/inventory/otherOutbound");
    expect(push).toHaveBeenCalledWith("/fund/payment");

    wrapper.unmount();
  });

  it("drills into a company and resets pagination when filters change", async () => {
    const wrapper = await mount();
    const state = setupState(wrapper);
    state.pagination.page = 4;

    state.drillCompany("company-2");
    await flushPromises();

    expect(state.companyFilter).toBe("company-2");
    expect(state.activeTab).toBe("logs");
    expect(state.pagination.page).toBe(1);
    expect(wrapper.vm.$route.query.companyId).toBe("company-2");
    expect(wrapper.vm.$route.query.tab).toBe("logs");

    wrapper.unmount();
  });

  it("continues rendering after loading and company-list failures", async () => {
    fixture.getMonitorCompaniesApi.mockRejectedValueOnce(
      new Error("companies")
    );
    fixture.getMonitorOverviewApi.mockRejectedValueOnce(new Error("overview"));
    const wrapper = await mount();
    const state = setupState(wrapper);

    expect(state.loading).toBe(false);
    expect(wrapper.text()).toContain("平台监控中心");

    wrapper.unmount();
  });

  it("normalizes time filters for platform and company scopes", async () => {
    const platform = await mount();
    const platformState = setupState(platform);
    platformState.companyFilter = "company-1";
    platformState.dateRange = null;
    expect(platformState.timeParams).toEqual({
      days: 7,
      companyId: "company-1"
    });
    platformState.dateRange = [new Date("2026-01-01"), new Date("2026-01-02")];
    expect(platformState.timeParams).toMatchObject({
      days: 7,
      companyId: "company-1",
      startDate: expect.any(String),
      endDate: expect.any(String)
    });
    platform.unmount();

    const company = await mount("/monitor", "company");
    const companyState = setupState(company);
    companyState.companyFilter = "company-2";
    companyState.dateRange = null;
    expect(companyState.timeParams).toEqual({ days: 7 });
    company.unmount();
  });

  it("loads org and access data with empty and filled filters", async () => {
    const wrapper = await mount();
    const state = setupState(wrapper);

    state.logFilters.keyword = "";
    await state.loadOrg();
    expect(fixture.getMonitorCompaniesApi).toHaveBeenCalledWith(
      "platform",
      expect.objectContaining({ page: 1 })
    );
    expect(fixture.getMonitorEmployeesApi).toHaveBeenCalledWith(
      "platform",
      expect.objectContaining({ keyword: undefined })
    );
    expect(state.employees).toEqual([fixture.row]);
    expect(state.employeeTotal).toBe(1);

    state.logFilters.keyword = "alice";
    await state.loadOrg();
    expect(fixture.getMonitorEmployeesApi).toHaveBeenLastCalledWith(
      "platform",
      expect.objectContaining({ keyword: "alice" })
    );

    fixture.getMonitorEmployeesApi.mockResolvedValueOnce({
      code: 200,
      data: {}
    });
    await state.loadOrg();
    expect(state.employees).toEqual([]);
    expect(state.employeeTotal).toBe(0);

    Object.assign(state.logFilters, {
      operator: "alice",
      module: "order",
      method: "POST",
      traceId: "trace-1",
      ip: "127.0.0.1",
      success: "false",
      sensitive: "true"
    });
    await state.loadLogs();
    expect(fixture.getMonitorOperationLogsApi).toHaveBeenLastCalledWith(
      "platform",
      expect.objectContaining({
        operator: "alice",
        module: "order",
        method: "POST",
        traceId: "trace-1",
        ip: "127.0.0.1",
        success: "false",
        sensitive: "true"
      })
    );

    fixture.getMonitorOperationLogsApi.mockResolvedValueOnce({
      code: 200,
      data: {}
    });
    fixture.getMonitorLoginLogsApi.mockResolvedValueOnce({
      code: 200,
      data: {}
    });
    fixture.getMonitorSensitiveLogsApi.mockResolvedValueOnce({
      code: 200,
      data: {}
    });
    await state.loadLogs();
    expect(state.opLogs).toEqual([]);
    expect(state.loginLogs).toEqual([]);
    expect(state.sensitiveLogs).toEqual([]);
    expect(state.opTotal).toBe(0);
    expect(state.loginTotal).toBe(0);
    expect(state.sensitiveTotal).toBe(0);
    wrapper.unmount();
  });

  it("loads system and money snapshots and falls back to empty lists", async () => {
    const wrapper = await mount();
    const state = setupState(wrapper);
    fixture.getMonitorSystemHealthApi.mockResolvedValueOnce({
      code: 200,
      data: null
    });
    fixture.getMonitorCronRunsApi.mockResolvedValueOnce({
      code: 200,
      data: {}
    });
    await state.loadSystem();
    expect(state.health).toBeNull();
    expect(state.cronRuns).toEqual([]);
    expect(state.cronTotal).toBe(0);

    fixture.getMonitorMoneyApi.mockResolvedValueOnce({ code: 200, data: {} });
    await state.loadMoney();
    expect(state.moneyEvents).toEqual([]);
    expect(state.moneyTotal).toBe(0);

    fixture.getMonitorCompanyCard = undefined;
    wrapper.unmount();
  });

  it("refreshes every active tab and reports a failed refresh", async () => {
    const wrapper = await mount();
    const state = setupState(wrapper);
    for (const tab of [
      "overview",
      "org",
      "logs",
      "business",
      "system",
      "money"
    ]) {
      state.activeTab = tab;
      await state.refreshCurrent();
    }
    expect(fixture.getMonitorOverviewApi).toHaveBeenCalled();
    expect(fixture.getMonitorEmployeesApi).toHaveBeenCalled();
    expect(fixture.getMonitorOperationLogsApi).toHaveBeenCalled();
    expect(fixture.getMonitorBusinessApi).toHaveBeenCalled();
    expect(fixture.getMonitorSystemHealthApi).toHaveBeenCalled();
    expect(fixture.getMonitorMoneyApi).toHaveBeenCalled();

    fixture.getMonitorOverviewApi.mockRejectedValueOnce(new Error("overview"));
    state.activeTab = "overview";
    await state.refreshCurrent();
    expect(state.loading).toBe(false);
    wrapper.unmount();
  });

  it("opens details without a company filter and keeps the fallback row", async () => {
    const wrapper = await mount();
    const state = setupState(wrapper);
    fixture.getMonitorOperationLogDetailApi.mockRejectedValueOnce(
      new Error("detail")
    );
    await state.openDetail(fixture.row);
    expect(fixture.getMonitorOperationLogDetailApi).toHaveBeenLastCalledWith(
      "platform",
      1,
      undefined
    );
    expect(state.detail).toEqual(fixture.row);
    expect(state.detailVisible).toBe(true);
    wrapper.unmount();
  });

  it("sends only populated export filters and reports empty export failures", async () => {
    const wrapper = await mount();
    const state = setupState(wrapper);
    useUserStore().setRoles(["admin"]);
    Object.assign(state.logFilters, {
      operator: "",
      module: "",
      method: "",
      success: ""
    });
    await state.handleExport("money");
    expect(fixture.exportMonitorCsvApi).toHaveBeenLastCalledWith(
      "platform",
      expect.objectContaining({
        target: "money",
        operator: undefined,
        module: undefined,
        method: undefined,
        success: undefined
      })
    );
    fixture.exportMonitorCsvApi.mockRejectedValueOnce(new Error("export"));
    await expect(state.handleExport("sensitive")).resolves.toBeUndefined();
    wrapper.unmount();
  });

  it("renders row variants, detail fallbacks, system health and empty business state", async () => {
    const Table = defineComponent({
      props: { data: { type: Array, default: () => [] } },
      setup(props, { slots }) {
        return () => {
          const columns = slots.default?.() ?? [];
          return h(
            "div",
            (props.data as Record<string, unknown>[]).flatMap(row => [
              ...columns.map(column => cloneVNode(column, { row })),
              ...Object.entries(slots)
                .filter(([name]) => name !== "default")
                .flatMap(([, slot]) => slot?.({ row }) ?? [])
            ])
          );
        };
      }
    });
    const Column = defineComponent({
      props: { row: { type: Object, default: () => ({}) } },
      setup(props, { slots }) {
        return () => h("div", slots.default?.({ row: props.row }) ?? []);
      }
    });
    const wrapper = await mountSmokeComponent(
      async () => ({ default: MonitorCenter }),
      "monitor/shared/MonitorCenter.vue",
      {
        keepMounted: true,
        route: "/monitor?tab=logs",
        allowRenderErrors: true,
        globalStubs: { ElTable: Table, ElTableColumn: Column }
      }
    );
    const state = setupState(wrapper);
    useUserStore().setRoles(["admin"]);
    state.activeTab = "logs";
    await flushPromises();
    state.opLogs = [
      { ...fixture.row, unscoped: true, success: true, sensitive: true },
      {
        ...fixture.row,
        id: 2,
        unscoped: false,
        companyName: "",
        success: false,
        sensitive: false
      }
    ];
    state.loginLogs = [fixture.row];
    state.sensitiveLogs = [fixture.row];
    state.detail = {
      ...fixture.row,
      unscoped: true,
      durationMs: undefined,
      traceId: "",
      params: "",
      result: ""
    };
    await nextTick();
    expect(wrapper.text()).toContain("未归属");
    expect(wrapper.text()).toContain("成功");
    expect(wrapper.text()).toContain("失败");
    expect(wrapper.text()).toContain("是");
    expect(wrapper.text()).toContain("导出登录日志");
    expect(wrapper.text()).toContain("导出敏感操作");
    wrapper.unmount();
  });

  it("renders system health and the empty business state", async () => {
    const wrapper = await mount("/monitor?tab=system");
    const state = setupState(wrapper);
    useUserStore().setRoles(["admin"]);

    fixture.getMonitorSystemHealthApi.mockResolvedValueOnce({
      code: 200,
      data: {
        logQueue: {
          waiting: 1,
          active: 2,
          completed: 3,
          failed: 4,
          delayed: 5
        },
        backup: { recentCount: 1, lastStatus: "ok", lastCompletedAt: "now" },
        archive: { note: "archive" },
        database: "up"
      }
    });
    state.activeTab = "system";
    await state.loadSystem();
    await nextTick();
    expect(wrapper.text()).toContain("waiting: 1");
    expect(wrapper.text()).toContain("archive");

    fixture.getMonitorBusinessApi.mockResolvedValue({ code: 200, data: null });
    state.activeTab = "business";
    await state.loadBusiness();
    await nextTick();
    expect(wrapper.html()).toContain("暂无业务汇总");
    expect(state.businessCards).toEqual([]);
    wrapper.unmount();
  });

  it("covers company permissions, normalization and export visibility", async () => {
    const wrapper = await mount("/monitor", "company");
    const state = setupState(wrapper);
    useUserStore().setRoles([" ADMIN "]);
    useUserStore().setPerms([]);
    await nextTick();
    expect(state.canExport).toBe(true);
    expect(state.visibleTabs).toHaveLength(6);

    useUserStore().setRoles(["boss"]);
    await nextTick();
    expect(useMonitorPerm("company").hasApiPerm(null)).toBe(true);
    expect(useMonitorPerm("company").hasApiPerm("any")).toBe(true);
    expect(state.visibleTabs).toHaveLength(6);

    useUserStore().setRoles(["reader"]);
    useUserStore().setPerms(["get/monitor/overview", "get/monitor/export"]);
    await nextTick();
    expect(useMonitorPerm("company").hasApiPerm(null)).toBe(true);
    expect(useMonitorPerm("company").hasApiPerm("get/monitor/overview")).toBe(
      true
    );
    expect(useMonitorPerm("company").hasApiPerm("get/monitor/logs")).toBe(
      false
    );
    expect(useMonitorPerm("company").canShowTab("overview")).toBe(true);
    expect(useMonitorPerm("company").canShowTab("logs")).toBe(false);
    expect(state.visibleTabs.map((tab: { key: string }) => tab.key)).toEqual([
      "overview"
    ]);
    expect(state.canExport).toBe(true);
    wrapper.unmount();
  });
});
