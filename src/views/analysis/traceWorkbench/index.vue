<script setup lang="ts">
import dayjs from "dayjs";
import { computed, h, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { deviceDetection } from "@pureadmin/utils";
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import {
  getRepoListApi,
  getStoreListApi,
  getTraceWorkbenchDetailApi,
  getTraceWorkbenchListApi,
  type Repo,
  type Store,
  type TraceWorkbenchDetailResponse,
  type TraceWorkbenchIncident,
  type TraceWorkbenchSummary
} from "@/api";
import { addDialog } from "@/composables/useDialogService";
import { handleApiError } from "@/utils";
import RollbackTraceDialog from "@/views/system/log/RollbackTraceDialog.vue";
import TraceIncidentDetail from "./components/TraceIncidentDetail.vue";
import TraceIncidentList from "./components/TraceIncidentList.vue";
import {
  TRACE_WORKBENCH_INCIDENT_TYPE_OPTIONS,
  TRACE_WORKBENCH_MODULE_OPTIONS,
  TRACE_WORKBENCH_STATUS_OPTIONS
} from "./options";
import {
  buildTraceWorkbenchQuery,
  parseTraceWorkbenchFilters,
  toTraceWorkbenchParams
} from "./query";

defineOptions({
  name: "TraceWorkbenchPage"
});

const route = useRoute();
const router = useRouter();

const stores = ref<Store[]>([]);
const repos = ref<Repo[]>([]);
const listLoading = ref(false);
const detailLoading = ref(false);
const incidents = ref<TraceWorkbenchIncident[]>([]);
const detail = ref<TraceWorkbenchDetailResponse | null>(null);
const selectedIncidentId = ref("");
const summary = ref<TraceWorkbenchSummary>(createEmptySummary());

const pagination = reactive({
  total: 0,
  pageSize: PAGE_SIZE_SMALL,
  currentPage: 1,
  background: true
});

const filters = reactive(parseTraceWorkbenchFilters(route.query));

const shortcuts = [
  {
    text: "最近 7 天",
    value: () => [dayjs().subtract(6, "day").toDate(), dayjs().toDate()]
  },
  {
    text: "最近 30 天",
    value: () => [dayjs().subtract(29, "day").toDate(), dayjs().toDate()]
  },
  {
    text: "最近 90 天",
    value: () => [dayjs().subtract(89, "day").toDate(), dayjs().toDate()]
  }
];

const repoOptions = computed(() => repos.value);

function createEmptySummary(): TraceWorkbenchSummary {
  return {
    openIncidentCount: 0,
    highRiskCount: 0,
    rollbackRecommendedCount: 0,
    resolvedTodayCount: 0
  };
}

function ensureDefaultDateRange() {
  if (filters.dateRange) return;
  filters.dateRange = [dayjs().subtract(6, "day").toDate(), dayjs().toDate()];
}

function pickIncidentId(
  list: TraceWorkbenchIncident[],
  preferredId?: string
): string {
  if (!list.length) return "";
  if (preferredId && list.some(item => item.incidentId === preferredId)) {
    return preferredId;
  }
  return list[0].incidentId;
}

async function syncRouteQuery() {
  await router.replace({
    query: buildTraceWorkbenchQuery({
      ...filters,
      incidentId: selectedIncidentId.value
    })
  });
}

async function loadOptions() {
  const [storeRes, repoRes] = await Promise.all([
    getStoreListApi(1, { pageSize: 100 }),
    getRepoListApi(1, { pageSize: 100 })
  ]);
  stores.value = storeRes.data?.list ?? [];
  repos.value = repoRes.data?.list ?? [];
}

async function loadDetail(incidentId: string) {
  detailLoading.value = true;
  try {
    const { code, data } = await getTraceWorkbenchDetailApi(incidentId);
    if (code === 200) {
      detail.value = data;
    }
  } catch (error) {
    detail.value = null;
    handleApiError(error, "加载溯源详情失败");
  } finally {
    detailLoading.value = false;
  }
}

async function loadIncidents(preferredIncidentId?: string) {
  listLoading.value = true;
  detail.value = null;
  try {
    const { code, data } = await getTraceWorkbenchListApi(
      pagination.currentPage,
      toTraceWorkbenchParams(filters)
    );

    if (code !== 200) return;

    incidents.value = data.list ?? [];
    summary.value = data.summary ?? createEmptySummary();
    pagination.total = data.total ?? 0;
    filters.incidentId = "";
    selectedIncidentId.value = pickIncidentId(
      incidents.value,
      preferredIncidentId
    );
    await syncRouteQuery();
    if (selectedIncidentId.value) {
      await loadDetail(selectedIncidentId.value);
    }
  } catch (error) {
    incidents.value = [];
    detail.value = null;
    summary.value = createEmptySummary();
    pagination.total = 0;
    handleApiError(error, "加载溯源工作台失败");
  } finally {
    listLoading.value = false;
  }
}

async function refreshWorkbench(preferredIncidentId?: string) {
  await loadIncidents(preferredIncidentId || filters.incidentId);
}

async function handleSearch() {
  pagination.currentPage = 1;
  await refreshWorkbench(selectedIncidentId.value);
}

async function handleReset() {
  filters.storeId = "";
  filters.repoId = "";
  filters.module = "";
  filters.incidentType = "";
  filters.status = "";
  filters.keyword = "";
  filters.incidentId = "";
  filters.dateRange = [dayjs().subtract(6, "day").toDate(), dayjs().toDate()];
  selectedIncidentId.value = "";
  pagination.currentPage = 1;
  await refreshWorkbench();
}

async function handleSelectIncident(incidentId: string) {
  if (incidentId === selectedIncidentId.value) return;
  selectedIncidentId.value = incidentId;
  filters.incidentId = incidentId;
  await syncRouteQuery();
  await loadDetail(incidentId);
}

async function handlePageChange(page: number) {
  pagination.currentPage = page;
  await refreshWorkbench(selectedIncidentId.value);
}

function openLogDetail() {
  const traceId = detail.value?.incident.traceId;
  if (!traceId) return;
  void router.push({
    path: "/system/log",
    query: { traceId }
  });
}

function openTraceDialog(initialSection: "plan" | "execute") {
  const incident = detail.value?.incident;
  if (!incident?.traceId) return;

  addDialog({
    title: initialSection === "execute" ? "溯源与回滚" : "溯源预览",
    width: "70%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(RollbackTraceDialog, {
        traceId: incident.traceId,
        initialSection,
        logSummary: {
          module: incident.module,
          method: incident.incidentType,
          operator: incident.operatorName,
          createdAt: incident.occurredAt,
          success: incident.status === "resolved"
        },
        onSuccess: () => refreshWorkbench(selectedIncidentId.value)
      })
  });
}

onMounted(async () => {
  ensureDefaultDateRange();
  selectedIncidentId.value = filters.incidentId;
  await loadOptions();
  await refreshWorkbench(filters.incidentId);
});
</script>

<template>
  <div class="trace-workbench main p-4">
    <section class="trace-hero rounded-3xl p-6 text-white">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="space-y-2">
          <div class="text-sm uppercase tracking-[0.24em] text-sky-100">
            Trace Workbench
          </div>
          <h1 class="text-3xl font-semibold">经营溯源台</h1>
          <p class="max-w-3xl text-sm text-sky-50/90">
            面向管理层的异常追因入口，聚焦高危事件、链路摘要和处置动作。
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class="trace-stat-card">
            <div class="trace-stat-label">待处理异常</div>
            <div class="trace-stat-value">{{ summary.openIncidentCount }}</div>
          </div>
          <div class="trace-stat-card">
            <div class="trace-stat-label">高危事件</div>
            <div class="trace-stat-value">{{ summary.highRiskCount }}</div>
          </div>
          <div class="trace-stat-card">
            <div class="trace-stat-label">建议回滚</div>
            <div class="trace-stat-value">
              {{ summary.rollbackRecommendedCount }}
            </div>
          </div>
          <div class="trace-stat-card">
            <div class="trace-stat-label">今日已解决</div>
            <div class="trace-stat-value">{{ summary.resolvedTodayCount }}</div>
          </div>
        </div>
      </div>
    </section>

    <el-card class="mt-4">
      <div class="grid gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="shortcuts"
          class="xl:col-span-2"
        />
        <el-select
          v-model="filters.storeId"
          clearable
          filterable
          placeholder="选择门店"
        >
          <el-option
            v-for="item in stores"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
        <el-select
          v-model="filters.repoId"
          clearable
          filterable
          placeholder="选择仓库"
        >
          <el-option
            v-for="item in repoOptions"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
        <el-select v-model="filters.module" clearable placeholder="业务模块">
          <el-option
            v-for="item in TRACE_WORKBENCH_MODULE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          v-model="filters.incidentType"
          clearable
          placeholder="异常类型"
        >
          <el-option
            v-for="item in TRACE_WORKBENCH_INCIDENT_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="filters.status" clearable placeholder="处理状态">
          <el-option
            v-for="item in TRACE_WORKBENCH_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>

      <div class="mt-3 flex flex-wrap gap-3">
        <el-input
          v-model="filters.keyword"
          clearable
          placeholder="搜索标题、单号、traceId 或摘要"
          class="max-w-md"
        />
        <el-button type="primary" @click="handleSearch">查询异常</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <div class="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <div class="space-y-4">
        <TraceIncidentList
          :incidents="incidents"
          :selected-id="selectedIncidentId"
          :loading="listLoading"
          @select="handleSelectIncident"
        />
        <div
          v-if="pagination.total > pagination.pageSize"
          class="flex justify-end"
        >
          <el-pagination
            layout="prev, pager, next"
            :total="pagination.total"
            :page-size="pagination.pageSize"
            :current-page="pagination.currentPage"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <TraceIncidentDetail
        :detail="detail"
        :loading="detailLoading"
        @open-log="openLogDetail"
        @preview="openTraceDialog('plan')"
        @execute="openTraceDialog('execute')"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.trace-workbench {
  --trace-hero-start: #0f3c72;
  --trace-hero-end: #0b172a;
}

.trace-hero {
  background:
    radial-gradient(
      circle at top right,
      rgb(56 189 248 / 28%),
      transparent 28%
    ),
    linear-gradient(135deg, var(--trace-hero-start), var(--trace-hero-end));
}

.trace-stat-card {
  min-width: 140px;
  padding: 0.875rem 1rem;
  background: rgb(255 255 255 / 10%);
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
}

.trace-stat-label {
  font-size: 0.75rem;
  color: rgb(224 242 254 / 90%);
}

.trace-stat-value {
  margin-top: 0.375rem;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
}
</style>
