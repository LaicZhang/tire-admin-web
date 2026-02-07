<script setup lang="ts">
import { DEFAULT_PAGE_SIZE } from "../../../utils/constants";
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Download from "~icons/ep/download";
import Printer from "~icons/ep/printer";
import Setting from "~icons/ep/setting";
import { PureTableBar } from "@/components/RePureTableBar";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { balanceColumns, detailColumns, summaryColumns } from "./columns";
import {
  type InventoryBalance,
  type InventoryDetail,
  type InventorySummary,
  type ReportQuery,
  ReportType,
  reportTypeMap
} from "./types";
import { http } from "@/utils/http";
import { getRepoListApi } from "@/api/company/repo";
import { useRouter } from "vue-router";
import { logger } from "@/utils/logger";

defineOptions({
  name: "InventoryReport"
});

const router = useRouter();
const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const currentReportType = ref<ReportType>(ReportType.BALANCE);
const balanceList = ref<InventoryBalance[]>([]);
const detailList = ref<InventoryDetail[]>([]);
const summaryList = ref<InventorySummary[]>([]);

const repoList = ref<{ uid: string; name: string }[]>([]);

const queryParams = reactive<ReportQuery>({
  repoId: "",
  tireId: "",
  startDate: "",
  endDate: "",
  showZeroStock: false,
  showNegativeStock: false,
  showDisabledRepo: false
});

const dateRange = ref<[string, string] | null>(null);

const pagination = ref({
  total: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  currentPage: 1,
  background: true
});

const reportTypes = Object.entries(reportTypeMap).map(([value, config]) => ({
  value,
  label: config.label,
  desc: config.desc
}));

const currentColumns = computed(() => {
  switch (currentReportType.value) {
    case ReportType.DETAIL:
      return detailColumns;
    case ReportType.SUMMARY:
      return summaryColumns;
    default:
      return balanceColumns;
  }
});

const currentData = computed(() => {
  switch (currentReportType.value) {
    case ReportType.DETAIL:
      return detailList.value;
    case ReportType.SUMMARY:
      return summaryList.value;
    default:
      return balanceList.value;
  }
});

const loadRepos = async () => {
  try {
    const { data, code } = await getRepoListApi(1, {});
    if (code === 200) {
      repoList.value = data.list;
    }
  } catch (error) {
    logger.error("获取仓库列表失败", error);
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    let endpoint = "";
    switch (currentReportType.value) {
      case ReportType.DETAIL:
        endpoint = "/api/inventory-report/detail";
        break;
      case ReportType.SUMMARY:
        endpoint = "/api/inventory-report/summary";
        break;
      default:
        endpoint = "/api/inventory-report/balance";
    }

    const { data, code } = await http.request<{
      code: number;
      data: { count: number; list: unknown[] };
    }>("get", `${endpoint}/${pagination.value.currentPage}`, {
      params: {
        ...queryParams,
        repoId: queryParams.repoId || undefined,
        startDate: dateRange.value?.[0] || undefined,
        endDate: dateRange.value?.[1] || undefined
      }
    });

    if (code === 200) {
      switch (currentReportType.value) {
        case ReportType.DETAIL:
          detailList.value = data.list as InventoryDetail[];
          break;
        case ReportType.SUMMARY:
          summaryList.value = data.list as InventorySummary[];
          break;
        default:
          balanceList.value = data.list as InventoryBalance[];
      }
      pagination.value.total = data.count;
    }
  } catch (error) {
    logger.error("获取报表数据失败", error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.value.currentPage = 1;
  fetchData();
};

const onReset = () => {
  searchFormRef.value?.resetFields();
  queryParams.repoId = "";
  queryParams.showZeroStock = false;
  queryParams.showNegativeStock = false;
  queryParams.showDisabledRepo = false;
  dateRange.value = null;
  handleSearch();
};

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  fetchData();
};

const handleReportTypeChange = (
  type: string | number | boolean | undefined
) => {
  if (type === undefined) return;
  currentReportType.value = type as ReportType;
  pagination.value.currentPage = 1;
  fetchData();
};

const handleViewDetail = (row: InventoryBalance) => {
  currentReportType.value = ReportType.DETAIL;
  queryParams.tireId = row.tireId;
  queryParams.repoId = row.repoId;
  fetchData();
};

const handleExport = () => {
  ElMessage.info("导出功能开发中");
};

const handlePrint = () => {
  ElMessage.info("打印功能开发中");
};

const handleColumnSetting = () => {
  ElMessage.info("列设置功能开发中");
};

onMounted(() => {
  Promise.all([loadRepos(), fetchData()]);
});
</script>

<template>
  <div class="main">
    <!-- 报表类型切换 -->
    <el-card class="mb-4">
      <el-radio-group
        v-model="currentReportType"
        @change="handleReportTypeChange"
      >
        <el-radio-button
          v-for="type in reportTypes.slice(0, 3)"
          :key="type.value"
          :value="type.value"
        >
          {{ type.label }}
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 查询条件 -->
    <ReSearchForm
      ref="searchFormRef"
      :form="queryParams"
      :loading="loading"
      @search="handleSearch"
      @reset="onReset"
    >
      <el-form-item label="仓库" prop="repoId">
        <el-select
          v-model="queryParams.repoId"
          placeholder="请选择仓库"
          clearable
          class="w-[150px]"
        >
          <el-option
            v-for="repo in repoList"
            :key="repo.uid"
            :label="repo.name"
            :value="repo.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="currentReportType !== ReportType.BALANCE"
        label="日期范围"
      >
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="w-[220px]"
        />
      </el-form-item>
      <el-form-item v-if="currentReportType === ReportType.BALANCE">
        <el-checkbox v-model="queryParams.showZeroStock">
          显示零库存商品
        </el-checkbox>
      </el-form-item>
      <el-form-item v-if="currentReportType === ReportType.BALANCE">
        <el-checkbox v-model="queryParams.showNegativeStock">
          仅显示负库存商品
        </el-checkbox>
      </el-form-item>
      <el-form-item v-if="currentReportType === ReportType.BALANCE">
        <el-checkbox v-model="queryParams.showDisabledRepo">
          显示禁用仓库
        </el-checkbox>
      </el-form-item>
    </ReSearchForm>

    <!-- 报表数据 -->
    <el-card>
      <PureTableBar
        :title="reportTypeMap[currentReportType]?.label || '库存报表'"
        @refresh="fetchData"
      >
        <template #buttons>
          <el-button :icon="useRenderIcon(Download)" @click="handleExport">
            导出
          </el-button>
          <el-button :icon="useRenderIcon(Printer)" @click="handlePrint">
            打印
          </el-button>
          <el-button
            :icon="useRenderIcon(Setting)"
            @click="handleColumnSetting"
          >
            列设置
          </el-button>
        </template>
        <template v-slot="{ size }">
          <pure-table
            row-key="id"
            adaptive
            :size="size"
            :columns="currentColumns"
            border
            :data="currentData"
            :loading="loading"
            showOverflowTooltip
            :pagination="{ ...pagination, size }"
            @page-current-change="handleCurrentChange"
          >
            <template
              v-if="currentReportType === ReportType.BALANCE"
              #operation="{ row }"
            >
              <el-button link type="primary" @click="handleViewDetail(row)">
                收发明细
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.main {
  padding: 16px;
}

.text-red-600 {
  color: #dc2626;
}
</style>
