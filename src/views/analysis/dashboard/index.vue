<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getRepoListApi,
  getRoleOverviewApi,
  getStoreListApi,
  type Repo,
  type RoleDashboardData,
  type Store
} from "@/api";
import { handleApiError } from "@/utils";
import AnalysisDateToolbar from "../components/AnalysisDateToolbar.vue";
import {
  buildAnalysisFilterQuery,
  createDefaultAnalysisFilterState,
  inferGroupBy,
  parseAnalysisFilters,
  toRequiredDateParams,
  type AnalysisDateRange,
  type AnalysisFilterState,
  type AnalysisGroupBy
} from "../shared";
import RoleDashboardContent from "../components/RoleDashboardContent.vue";

defineOptions({
  name: "AnalysisDashboard"
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const stores = ref<Store[]>([]);
const repos = ref<Repo[]>([]);
const dashboardData = ref<RoleDashboardData | null>(null);

const filters = reactive<AnalysisFilterState>(createDefaultAnalysisFilterState());

const dateRange = computed({
  get: () => filters.dateRange,
  set: (v: AnalysisDateRange) => {
    filters.dateRange = v;
    filters.groupBy = inferGroupBy(v);
  }
});

const groupBy = computed({
  get: () => filters.groupBy,
  set: (v: AnalysisGroupBy) => {
    filters.groupBy = v;
  }
});

const currentStore = computed(() =>
  stores.value.find(item => item.uid === filters.storeId)
);

const repoOptions = computed(() => {
  const defaultRepoId = currentStore.value?.defaultRepositoryId;
  if (!defaultRepoId) return repos.value;
  return repos.value.filter(item => item.uid === defaultRepoId);
});

const filterParams = computed(() => ({
  ...toRequiredDateParams(filters.dateRange),
  storeId: filters.storeId || undefined,
  repoId: filters.repoId || undefined
}));

function applyRouteFilters() {
  const parsed = parseAnalysisFilters(route.query);
  filters.dateRange = parsed.dateRange;
  filters.storeId = parsed.storeId;
  filters.repoId = parsed.repoId;
  filters.operatorId = parsed.operatorId;
  filters.groupBy = parsed.groupBy;
  filters.dim = parsed.dim;
}

async function syncRouteQuery() {
  await router.replace({
    query: buildAnalysisFilterQuery(filters)
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

async function loadDashboard() {
  loading.value = true;
  try {
    const { code, data } = await getRoleOverviewApi(filterParams.value);
    if (code === 200 && data) {
      dashboardData.value = data;
    }
  } catch (error) {
    handleApiError(error, "加载经营驾驶舱失败");
  } finally {
    loading.value = false;
  }
}

async function refreshDashboard() {
  await syncRouteQuery();
  await loadDashboard();
}

function handleStoreChange() {
  const defaultRepoId = currentStore.value?.defaultRepositoryId ?? "";
  if (filters.storeId && defaultRepoId) {
    filters.repoId = defaultRepoId;
  }
  void refreshDashboard();
}

watch(
  () => route.query,
  () => {
    applyRouteFilters();
  }
);

onMounted(async () => {
  applyRouteFilters();
  await loadOptions();
  if (filters.storeId && !filters.repoId) {
    filters.repoId = currentStore.value?.defaultRepositoryId ?? "";
  }
  await refreshDashboard();
});
</script>

<template>
  <div class="main p-4">
    <el-card class="mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <AnalysisDateToolbar
          v-model:date-range="dateRange"
          v-model:group-by="groupBy"
          :show-group-by="false"
          :loading="loading"
          @change="refreshDashboard"
          @refresh="refreshDashboard"
        />
        <el-select
          v-model="filters.storeId"
          clearable
          filterable
          placeholder="选择门店"
          class="w-[180px]"
          @change="handleStoreChange"
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
          class="w-[180px]"
          @change="refreshDashboard"
        >
          <el-option
            v-for="item in repoOptions"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </div>
    </el-card>

    <RoleDashboardContent :data="dashboardData" :loading="loading" />
  </div>
</template>
