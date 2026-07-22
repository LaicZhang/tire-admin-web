<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import { handleApiError } from "@/utils";
import {
  exportMonitorCsvApi,
  getMonitorBusinessApi,
  getMonitorCompaniesApi,
  getMonitorCronRunsApi,
  getMonitorEmployeesApi,
  getMonitorLoginLogsApi,
  getMonitorMoneyApi,
  getMonitorOperationLogDetailApi,
  getMonitorOperationLogsApi,
  getMonitorOverviewApi,
  getMonitorSensitiveLogsApi,
  getMonitorSystemHealthApi,
  type MonitorBusinessSummary,
  type MonitorCompanyCard,
  type MonitorCronRunItem,
  type MonitorEmployeeItem,
  type MonitorLoginLogItem,
  type MonitorMoneyEventItem,
  type MonitorOperationLogItem,
  type MonitorOverview,
  type MonitorSensitiveItem,
  type MonitorSystemHealth
} from "@/api/monitor";
import { useMonitorPerm } from "./useMonitorPerm";
import type { MonitorCenterMode, MonitorTabKey } from "./types";

const props = defineProps<{
  mode: MonitorCenterMode;
}>();

defineOptions({ name: "MonitorCenter" });

const route = useRoute();
const router = useRouter();
const { canExport, visibleTabs } = useMonitorPerm(props.mode);

const activeTab = ref<MonitorTabKey>("overview");
const loading = ref(false);
const companyFilter = ref<string>("");
const companyOptions = ref<MonitorCompanyCard[]>([]);

const dateRange = ref<[Date, Date] | null>([
  dayjs().subtract(6, "day").toDate(),
  dayjs().toDate()
]);

const overview = ref<MonitorOverview | null>(null);
const business = ref<MonitorBusinessSummary | null>(null);
const health = ref<MonitorSystemHealth | null>(null);

const opLogs = ref<MonitorOperationLogItem[]>([]);
const opTotal = ref(0);
const loginLogs = ref<MonitorLoginLogItem[]>([]);
const loginTotal = ref(0);
const sensitiveLogs = ref<MonitorSensitiveItem[]>([]);
const sensitiveTotal = ref(0);
const employees = ref<MonitorEmployeeItem[]>([]);
const employeeTotal = ref(0);
const moneyEvents = ref<MonitorMoneyEventItem[]>([]);
const moneyTotal = ref(0);
const cronRuns = ref<MonitorCronRunItem[]>([]);
const cronTotal = ref(0);

const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<MonitorOperationLogItem | null>(null);

const logFilters = reactive({
  operator: "",
  module: "",
  method: "",
  traceId: "",
  ip: "",
  success: "" as "" | "true" | "false",
  sensitive: "" as "" | "true" | "false",
  keyword: ""
});

const pagination = reactive({
  page: 1,
  pageSize: 20
});

const isPlatform = computed(() => props.mode === "platform");

const timeParams = computed(() => {
  const params: Record<string, unknown> = { days: 7 };
  if (dateRange.value?.length === 2) {
    params.startDate = dayjs(dateRange.value[0]).startOf("day").toISOString();
    params.endDate = dayjs(dateRange.value[1]).endOf("day").toISOString();
  }
  if (isPlatform.value && companyFilter.value) {
    params.companyId = companyFilter.value;
  }
  return params;
});

const pageParams = computed(() => ({
  ...timeParams.value,
  page: pagination.page,
  pageSize: pagination.pageSize
}));

function setTabFromRoute() {
  const tab = String(route.query.tab || "overview") as MonitorTabKey;
  const keys = visibleTabs.value.map(t => t.key);
  activeTab.value = keys.includes(tab) ? tab : (keys[0] ?? "overview");
}

async function syncRoute() {
  const query: Record<string, string> = { tab: activeTab.value };
  if (isPlatform.value && companyFilter.value) {
    query.companyId = companyFilter.value;
  }
  await router.replace({ query: { ...route.query, ...query } });
}

function drillCompany(companyId: string) {
  companyFilter.value = companyId;
  activeTab.value = "logs";
  void refreshCurrent();
}

async function loadCompanies() {
  if (!isPlatform.value) return;
  try {
    const { data } = await getMonitorCompaniesApi("platform", {
      page: 1,
      pageSize: 100
    });
    companyOptions.value = data?.list ?? [];
  } catch (e) {
    handleApiError(e, "加载公司列表失败");
  }
}

async function loadOverview() {
  const { data } = await getMonitorOverviewApi(props.mode, timeParams.value);
  overview.value = data;
}

async function loadBusiness() {
  const { data } = await getMonitorBusinessApi(props.mode, timeParams.value);
  business.value = data;
}

async function loadOrg() {
  if (isPlatform.value) {
    const { data } = await getMonitorCompaniesApi("platform", {
      ...pageParams.value
    });
    companyOptions.value = data?.list ?? [];
  }
  const emp = await getMonitorEmployeesApi(props.mode, {
    ...pageParams.value,
    keyword: logFilters.keyword || undefined
  });
  employees.value = emp.data?.list ?? [];
  employeeTotal.value = emp.data?.total ?? 0;
}

async function loadLogs() {
  const base = {
    ...pageParams.value,
    operator: logFilters.operator || undefined,
    module: logFilters.module || undefined,
    method: logFilters.method || undefined,
    traceId: logFilters.traceId || undefined,
    ip: logFilters.ip || undefined,
    success: logFilters.success || undefined,
    sensitive: logFilters.sensitive || undefined
  };
  const [ops, logins, sens] = await Promise.all([
    getMonitorOperationLogsApi(props.mode, base),
    getMonitorLoginLogsApi(props.mode, base),
    getMonitorSensitiveLogsApi(props.mode, base)
  ]);
  opLogs.value = ops.data?.list ?? [];
  opTotal.value = ops.data?.total ?? 0;
  loginLogs.value = logins.data?.list ?? [];
  loginTotal.value = logins.data?.total ?? 0;
  sensitiveLogs.value = sens.data?.list ?? [];
  sensitiveTotal.value = sens.data?.total ?? 0;
}

async function loadSystem() {
  const [h, c] = await Promise.all([
    getMonitorSystemHealthApi(props.mode),
    getMonitorCronRunsApi(props.mode, pageParams.value)
  ]);
  health.value = h.data;
  cronRuns.value = c.data?.list ?? [];
  cronTotal.value = c.data?.total ?? 0;
}

async function loadMoney() {
  const { data } = await getMonitorMoneyApi(props.mode, pageParams.value);
  moneyEvents.value = data?.list ?? [];
  moneyTotal.value = data?.total ?? 0;
}

async function refreshCurrent() {
  loading.value = true;
  try {
    await syncRoute();
    switch (activeTab.value) {
      case "overview":
        await loadOverview();
        break;
      case "org":
        await loadOrg();
        break;
      case "logs":
        await loadLogs();
        break;
      case "business":
        await loadBusiness();
        break;
      case "system":
        await loadSystem();
        break;
      case "money":
        await loadMoney();
        break;
    }
  } catch (e) {
    handleApiError(e, "加载监控数据失败");
  } finally {
    loading.value = false;
  }
}

function onOpenOpDetail(row: unknown) {
  void openDetail(row as MonitorOperationLogItem);
}

async function openDetail(row: MonitorOperationLogItem) {
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    const { data } = await getMonitorOperationLogDetailApi(
      props.mode,
      row.id,
      isPlatform.value && companyFilter.value
        ? { companyId: companyFilter.value }
        : undefined
    );
    detail.value = data;
  } catch (e) {
    handleApiError(e, "加载日志详情失败");
    detail.value = row;
  } finally {
    detailLoading.value = false;
  }
}

async function handleExport(
  target: "operation" | "login" | "money" | "sensitive"
) {
  if (!canExport.value) {
    ElMessage.warning("无导出权限");
    return;
  }
  try {
    const blob = await exportMonitorCsvApi(props.mode, {
      ...timeParams.value,
      target,
      operator: logFilters.operator || undefined,
      module: logFilters.module || undefined,
      method: logFilters.method || undefined,
      success: logFilters.success || undefined
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitor-${target}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("导出成功");
  } catch (e) {
    handleApiError(e, "导出失败");
  }
}

function jumpBusiness(type: keyof MonitorBusinessSummary) {
  const map: Record<string, string> = {
    saleOrder: "/sales/order",
    purchaseOrder: "/purchase/order",
    transferOrder: "/inventory/transfer",
    wasteOrder: "/inventory/otherOutbound",
    surplusOrder: "/inventory/otherInbound",
    writeOffOrder: "/fund/writeOff",
    receiptOrder: "/fund/receipt",
    paymentOrder: "/fund/payment"
  };
  const path = map[type];
  if (path) void router.push(path);
}

const businessCards = computed(() => {
  const b = business.value;
  if (!b) return [];
  return [
    { key: "saleOrder" as const, label: "销售单", value: b.saleOrder },
    { key: "purchaseOrder" as const, label: "采购单", value: b.purchaseOrder },
    { key: "transferOrder" as const, label: "调拨单", value: b.transferOrder },
    { key: "wasteOrder" as const, label: "报损单", value: b.wasteOrder },
    { key: "surplusOrder" as const, label: "报溢单", value: b.surplusOrder },
    { key: "writeOffOrder" as const, label: "核销单", value: b.writeOffOrder },
    { key: "receiptOrder" as const, label: "收款单", value: b.receiptOrder },
    { key: "paymentOrder" as const, label: "付款单", value: b.paymentOrder }
  ];
});

onMounted(async () => {
  if (typeof route.query.companyId === "string") {
    companyFilter.value = route.query.companyId;
  }
  setTabFromRoute();
  await loadCompanies();
  await refreshCurrent();
});

watch(activeTab, () => {
  pagination.page = 1;
  void refreshCurrent();
});

watch(companyFilter, () => {
  pagination.page = 1;
  void refreshCurrent();
});
</script>

<template>
  <div v-loading="loading" class="monitor-center p-4">
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <h2 class="m-0 text-lg font-semibold">
        {{ isPlatform ? "平台监控中心" : "公司审计中心" }}
      </h2>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始"
        end-placeholder="结束"
        value-format=""
        @change="refreshCurrent"
      />
      <el-select
        v-if="isPlatform"
        v-model="companyFilter"
        clearable
        filterable
        placeholder="筛选公司"
        class="w-56"
        @change="refreshCurrent"
      >
        <el-option
          v-for="c in companyOptions"
          :key="c.uid"
          :label="c.name"
          :value="c.uid"
        />
      </el-select>
      <el-button @click="refreshCurrent">刷新</el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane
        v-for="tab in visibleTabs"
        :key="tab.key"
        :label="tab.label"
        :name="tab.key"
      />
    </el-tabs>

    <!-- 概览 -->
    <div v-if="activeTab === 'overview'" class="space-y-4">
      <el-row :gutter="12">
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <div class="text-gray-500 text-sm">登录次数</div>
            <div class="text-2xl font-semibold">
              {{ overview?.kpi.loginCount ?? "-" }}
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <div class="text-gray-500 text-sm">操作次数</div>
            <div class="text-2xl font-semibold">
              {{ overview?.kpi.operationCount ?? "-" }}
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <div class="text-gray-500 text-sm">失败率</div>
            <div class="text-2xl font-semibold">
              {{
                overview
                  ? `${((overview.kpi.failureRate || 0) * 100).toFixed(2)}%`
                  : "-"
              }}
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <div class="text-gray-500 text-sm">敏感操作</div>
            <div class="text-2xl font-semibold">
              {{ overview?.kpi.sensitiveCount ?? "-" }}
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <div class="text-gray-500 text-sm">任务失败</div>
            <div class="text-2xl font-semibold">
              {{ overview?.kpi.cronFailureCount ?? "-" }}
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <div class="text-gray-500 text-sm">资金审计</div>
            <div class="text-2xl font-semibold">
              {{ overview?.kpi.moneyEventCount ?? "-" }}
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card
        v-if="isPlatform && overview?.activeCompanies?.length"
        shadow="never"
      >
        <template #header>活跃公司排行</template>
        <el-table :data="overview.activeCompanies" size="small">
          <el-table-column prop="companyName" label="公司" min-width="160" />
          <el-table-column prop="operationCount" label="操作数" width="100" />
          <el-table-column prop="loginCount" label="登录数" width="100" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                @click="drillCompany(row.companyId)"
              >
                钻取
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never">
        <template #header>按日趋势</template>
        <el-table
          v-if="overview?.daily?.length"
          :data="overview.daily"
          size="small"
          max-height="360"
        >
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="loginCount" label="登录" width="90" />
          <el-table-column prop="operationCount" label="操作" width="90" />
          <el-table-column prop="failureCount" label="失败" width="90" />
          <el-table-column prop="sensitiveCount" label="敏感" width="90" />
          <el-table-column prop="moneyEventCount" label="资金" width="90" />
        </el-table>
        <el-empty v-else description="暂无趋势数据" />
      </el-card>
    </div>

    <!-- 身份组织 -->
    <div v-else-if="activeTab === 'org'" class="space-y-4">
      <el-card v-if="isPlatform" shadow="never">
        <template #header>公司列表</template>
        <el-table :data="companyOptions" size="small">
          <el-table-column prop="name" label="公司" min-width="160" />
          <el-table-column prop="uid" label="UID" min-width="220" />
          <el-table-column prop="employeeCount" label="员工数" width="100" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button link type="primary" @click="drillCompany(row.uid)">
                钻取
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="flex items-center justify-between">
            <span>员工活跃</span>
            <div class="flex gap-2">
              <el-input
                v-model="logFilters.keyword"
                clearable
                placeholder="姓名/用户名"
                class="w-48"
                @keyup.enter="refreshCurrent"
              />
              <el-button type="primary" @click="refreshCurrent">查询</el-button>
            </div>
          </div>
        </template>
        <el-table :data="employees" size="small">
          <el-table-column prop="name" label="姓名" min-width="120" />
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column
            v-if="isPlatform"
            prop="companyName"
            label="公司"
            min-width="140"
          />
          <el-table-column prop="operationCount" label="操作次数" width="100" />
          <el-table-column prop="loginCount" label="登录次数" width="100" />
          <el-table-column prop="activeDays" label="窗口(天)" width="90" />
        </el-table>
        <div class="mt-3 flex justify-end">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="employeeTotal"
            layout="total, prev, pager, next"
            @current-change="refreshCurrent"
          />
        </div>
      </el-card>
    </div>

    <!-- 访问与操作 -->
    <div v-else-if="activeTab === 'logs'" class="space-y-4">
      <el-card shadow="never">
        <div class="mb-3 flex flex-wrap gap-2">
          <el-input
            v-model="logFilters.operator"
            clearable
            placeholder="操作人"
            class="w-36"
          />
          <el-input
            v-model="logFilters.module"
            clearable
            placeholder="模块"
            class="w-32"
          />
          <el-input
            v-model="logFilters.method"
            clearable
            placeholder="方法"
            class="w-28"
          />
          <el-input
            v-model="logFilters.ip"
            clearable
            placeholder="IP"
            class="w-36"
          />
          <el-input
            v-model="logFilters.traceId"
            clearable
            placeholder="traceId"
            class="w-44"
          />
          <el-select
            v-model="logFilters.success"
            clearable
            placeholder="成功/失败"
            class="w-32"
          >
            <el-option label="成功" value="true" />
            <el-option label="失败" value="false" />
          </el-select>
          <el-select
            v-model="logFilters.sensitive"
            clearable
            placeholder="敏感"
            class="w-28"
          >
            <el-option label="是" value="true" />
            <el-option label="否" value="false" />
          </el-select>
          <el-button type="primary" @click="refreshCurrent">查询</el-button>
          <el-button v-if="canExport" @click="handleExport('operation')">
            导出操作日志
          </el-button>
        </div>

        <el-tabs>
          <el-tab-pane :label="`操作日志 (${opTotal})`">
            <el-table
              :data="opLogs"
              size="small"
              @row-dblclick="onOpenOpDetail"
            >
              <el-table-column prop="createdAt" label="时间" min-width="160" />
              <el-table-column prop="username" label="用户" width="110" />
              <el-table-column
                v-if="isPlatform"
                prop="companyName"
                label="公司"
                min-width="120"
              >
                <template #default="{ row }">
                  <span v-if="row.unscoped" class="text-orange-500"
                    >未归属</span
                  >
                  <span v-else>{{ row.companyName || "-" }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="module" label="模块" width="100" />
              <el-table-column prop="method" label="方法" width="80" />
              <el-table-column prop="ip" label="IP" width="120" />
              <el-table-column prop="success" label="结果" width="80">
                <template #default="{ row }">
                  <el-tag
                    :type="row.success ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ row.success ? "成功" : "失败" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="sensitive" label="敏感" width="70">
                <template #default="{ row }">
                  <el-tag v-if="row.sensitive" type="warning" size="small"
                    >是</el-tag
                  >
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="traceId" label="traceId" min-width="140" />
              <el-table-column label="操作" width="90" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="onOpenOpDetail(row)"
                    >详情</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane :label="`登录日志 (${loginTotal})`">
            <el-table :data="loginLogs" size="small">
              <el-table-column prop="createdAt" label="时间" min-width="160" />
              <el-table-column prop="username" label="用户" width="120" />
              <el-table-column
                v-if="isPlatform"
                prop="companyName"
                label="公司"
                min-width="140"
              />
              <el-table-column prop="ip" label="IP" width="140" />
            </el-table>
            <div v-if="canExport" class="mt-2">
              <el-button size="small" @click="handleExport('login')"
                >导出登录日志</el-button
              >
            </div>
          </el-tab-pane>
          <el-tab-pane :label="`敏感操作 (${sensitiveTotal})`">
            <el-table :data="sensitiveLogs" size="small">
              <el-table-column prop="createdAt" label="时间" min-width="160" />
              <el-table-column prop="username" label="用户" width="110" />
              <el-table-column prop="path" label="路径" min-width="180" />
              <el-table-column prop="traceId" label="traceId" min-width="140" />
            </el-table>
            <div v-if="canExport" class="mt-2">
              <el-button size="small" @click="handleExport('sensitive')"
                >导出敏感操作</el-button
              >
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="mt-3 flex justify-end">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="opTotal"
            layout="total, prev, pager, next"
            @current-change="refreshCurrent"
          />
        </div>
      </el-card>
    </div>

    <!-- 业务动态 -->
    <div v-else-if="activeTab === 'business'">
      <el-row :gutter="12">
        <el-col
          v-for="card in businessCards"
          :key="card.key"
          :xs="12"
          :sm="8"
          :md="6"
          class="mb-3"
        >
          <el-card
            shadow="hover"
            class="cursor-pointer"
            @click="jumpBusiness(card.key)"
          >
            <div class="text-gray-500 text-sm">{{ card.label }}</div>
            <div class="text-2xl font-semibold">{{ card.value }}</div>
            <div class="text-xs text-blue-500 mt-1">点击跳转列表</div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-if="!business" description="暂无业务汇总" />
    </div>

    <!-- 系统健康 -->
    <div v-else-if="activeTab === 'system'" class="space-y-4">
      <el-row :gutter="12">
        <el-col :md="8">
          <el-card shadow="never">
            <template #header>日志队列</template>
            <template v-if="health?.logQueue">
              <div>waiting: {{ health.logQueue.waiting }}</div>
              <div>active: {{ health.logQueue.active }}</div>
              <div>completed: {{ health.logQueue.completed }}</div>
              <div>failed: {{ health.logQueue.failed }}</div>
              <div>delayed: {{ health.logQueue.delayed }}</div>
            </template>
            <el-empty v-else description="队列不可用" :image-size="60" />
          </el-card>
        </el-col>
        <el-col :md="8">
          <el-card shadow="never">
            <template #header>备份摘要</template>
            <div>近 7 日任务: {{ health?.backup.recentCount ?? "-" }}</div>
            <div>最近状态: {{ health?.backup.lastStatus ?? "-" }}</div>
            <div>完成时间: {{ health?.backup.lastCompletedAt ?? "-" }}</div>
          </el-card>
        </el-col>
        <el-col :md="8">
          <el-card shadow="never">
            <template #header>归档说明</template>
            <div class="text-sm text-gray-600">
              {{ health?.archive.note || "-" }}
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never">
        <template #header>定时任务运行</template>
        <el-table :data="cronRuns" size="small">
          <el-table-column prop="jobName" label="任务" min-width="160" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column prop="startedAt" label="开始" min-width="160" />
          <el-table-column prop="finishedAt" label="结束" min-width="160" />
          <el-table-column prop="durationMs" label="耗时(ms)" width="100" />
          <el-table-column
            prop="errorMessage"
            label="错误"
            min-width="200"
            show-overflow-tooltip
          />
        </el-table>
      </el-card>
    </div>

    <!-- 资金合规 -->
    <div v-else-if="activeTab === 'money'">
      <el-card shadow="never">
        <template #header>
          <div class="flex justify-between items-center">
            <span>资金审计事件</span>
            <el-button
              v-if="canExport"
              size="small"
              @click="handleExport('money')"
              >导出</el-button
            >
          </div>
        </template>
        <el-table :data="moneyEvents" size="small">
          <el-table-column prop="createdAt" label="时间" min-width="160" />
          <el-table-column
            v-if="isPlatform"
            prop="companyName"
            label="公司"
            min-width="120"
          />
          <el-table-column prop="entityType" label="实体类型" width="120" />
          <el-table-column prop="entityId" label="实体ID" min-width="140" />
          <el-table-column prop="operationType" label="操作" width="120" />
          <el-table-column prop="operatorName" label="操作人" width="120" />
        </el-table>
        <div class="mt-3 flex justify-end">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="moneyTotal"
            layout="total, prev, pager, next"
            @current-change="refreshCurrent"
          />
        </div>
      </el-card>
    </div>

    <el-drawer v-model="detailVisible" title="操作日志详情" size="40%">
      <div v-loading="detailLoading">
        <el-descriptions v-if="detail" :column="1" border>
          <el-descriptions-item label="时间">{{
            detail.createdAt
          }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{
            detail.username
          }}</el-descriptions-item>
          <el-descriptions-item label="公司">
            <span v-if="detail.unscoped">未归属</span>
            <span v-else>{{ detail.companyName || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="模块">{{
            detail.module
          }}</el-descriptions-item>
          <el-descriptions-item label="方法">{{
            detail.method
          }}</el-descriptions-item>
          <el-descriptions-item label="路径">{{
            detail.path
          }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{
            detail.ip
          }}</el-descriptions-item>
          <el-descriptions-item label="耗时(ms)">{{
            detail.durationMs ?? "-"
          }}</el-descriptions-item>
          <el-descriptions-item label="traceId">{{
            detail.traceId || "-"
          }}</el-descriptions-item>
          <el-descriptions-item label="参数">
            <pre class="m-0 whitespace-pre-wrap break-all text-xs">{{
              detail.params || "-"
            }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="结果">
            <pre class="m-0 whitespace-pre-wrap break-all text-xs">{{
              detail.result || "-"
            }}</pre>
          </el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="无详情" />
      </div>
    </el-drawer>
  </div>
</template>
