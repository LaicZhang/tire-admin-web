<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import dayjs from "dayjs";
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
import {
  buildAnalysisQuery,
  parseAnalysisFilters,
  toDateParams
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

const filters = reactive({
  dateRange: null as [Date, Date] | null,
  storeId: "",
  repoId: ""
});

const shortcuts = [
  {
    text: "最近一周",
    value: () => [dayjs().subtract(6, "day").toDate(), dayjs().toDate()]
  },
  {
    text: "最近一个月",
    value: () => [dayjs().subtract(29, "day").toDate(), dayjs().toDate()]
  },
  {
    text: "最近三个月",
    value: () => [dayjs().subtract(89, "day").toDate(), dayjs().toDate()]
  }
];

const currentStore = computed(() =>
  stores.value.find(item => item.uid === filters.storeId)
);

const repoOptions = computed(() => {
  const defaultRepoId = currentStore.value?.defaultRepositoryId;
  if (!defaultRepoId) return repos.value;
  return repos.value.filter(item => item.uid === defaultRepoId);
});

const filterParams = computed(() => ({
  ...toDateParams(filters.dateRange),
  storeId: filters.storeId || undefined,
  repoId: filters.repoId || undefined
}));

function applyRouteFilters() {
  const parsed = parseAnalysisFilters(route.query);
  filters.dateRange = parsed.dateRange;
  filters.storeId = parsed.storeId;
  filters.repoId = parsed.repoId;
}

async function syncRouteQuery() {
  await router.replace({
    query: buildAnalysisQuery({
      dateRange: filters.dateRange,
      storeId: filters.storeId || undefined,
      repoId: filters.repoId || undefined
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
  if (!filters.dateRange) {
    filters.dateRange = [
      dayjs().subtract(29, "day").toDate(),
      dayjs().toDate()
    ];
  }
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
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="shortcuts"
          @change="refreshDashboard"
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
