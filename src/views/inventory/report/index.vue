<script setup lang="ts">
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import { ref, reactive, onMounted, computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Download from "~icons/ep/download";
import Printer from "~icons/ep/printer";
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
import { logger } from "@/utils/logger";
import RepoSelect from "@/components/EntitySelect/RepoSelect.vue";
import { fenToYuan } from "@/utils/formatMoney";
import {
  exportRowsAsCsv,
  printRows,
  type PresentationColumn
} from "@/utils/tablePresentation";

defineOptions({
  name: "InventoryReport"
});

const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const currentReportType = ref<ReportType>(ReportType.BALANCE);
const balanceList = ref<InventoryBalance[]>([]);
const detailList = ref<InventoryDetail[]>([]);
const summaryList = ref<InventorySummary[]>([]);

const queryParams = reactive<ReportQuery>({
  repoId: undefined,
  tireId: undefined,
  startDate: undefined,
  endDate: undefined,
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

const balanceExportColumns: PresentationColumn<InventoryBalance>[] = [
  { label: "商品名称", value: row => row.tireName },
  { label: "商品编码", value: row => row.tireBarcode || "-" },
  { label: "仓库", value: row => row.repoName },
  { label: "库存数量", value: row => row.quantity },
  {
    label: "单位成本",
    value: row => (row.unitCost ? `¥${fenToYuan(row.unitCost)}` : "-")
  },
  {
    label: "库存金额",
    value: row => (row.totalCost ? `¥${fenToYuan(row.totalCost)}` : "-")
  },
  { label: "最近入库", value: row => row.lastInboundDate || "-" },
  { label: "最近出库", value: row => row.lastOutboundDate || "-" }
];

const detailExportColumns: PresentationColumn<InventoryDetail>[] = [
  { label: "单据编号", value: row => row.orderNumber },
  { label: "单据类型", value: row => row.orderType },
  { label: "商品名称", value: row => row.tireName },
  { label: "仓库", value: row => row.repoName },
  { label: "方向", value: row => (row.direction === "in" ? "入库" : "出库") },
  { label: "数量", value: row => row.quantity },
  {
    label: "单位成本",
    value: row => (row.unitCost ? `¥${fenToYuan(row.unitCost)}` : "-")
  },
  {
    label: "金额",
    value: row => (row.totalCost ? `¥${fenToYuan(row.totalCost)}` : "-")
  },
  { label: "操作人", value: row => row.operatorName || "-" },
  { label: "日期", value: row => row.orderDate || "-" },
  { label: "备注", value: row => row.remark || "-" }
];

const summaryExportColumns: PresentationColumn<InventorySummary>[] = [
  { label: "商品名称", value: row => row.tireName },
  { label: "商品编码", value: row => row.tireBarcode || "-" },
  { label: "仓库", value: row => row.repoName || "-" },
  { label: "期初数量", value: row => row.openingQuantity },
  {
    label: "期初金额",
    value: row => (row.openingCost ? `¥${fenToYuan(row.openingCost)}` : "-")
  },
  { label: "入库数量", value: row => row.inboundQuantity },
  {
    label: "入库金额",
    value: row => (row.inboundCost ? `¥${fenToYuan(row.inboundCost)}` : "-")
  },
  { label: "出库数量", value: row => row.outboundQuantity },
  {
    label: "出库金额",
    value: row => (row.outboundCost ? `¥${fenToYuan(row.outboundCost)}` : "-")
  },
  { label: "期末数量", value: row => row.closingQuantity },
  {
    label: "期末金额",
    value: row => (row.closingCost ? `¥${fenToYuan(row.closingCost)}` : "-")
  }
];

const fetchData = async () => {
  loading.value = true;
  try {
    let endpoint = "";
    switch (currentReportType.value) {
      case ReportType.DETAIL:
        endpoint = "/api/v1/inventory-report/detail";
        break;
      case ReportType.SUMMARY:
        endpoint = "/api/v1/inventory-report/summary";
        break;
      default:
        endpoint = "/api/v1/inventory-report/balance";
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
  if (currentReportType.value === ReportType.DETAIL) {
    exportRowsAsCsv(
      detailList.value,
      detailExportColumns,
      "inventory-detail-report"
    );
    return;
  }
  if (currentReportType.value === ReportType.SUMMARY) {
    exportRowsAsCsv(
      summaryList.value,
      summaryExportColumns,
      "inventory-summary-report"
    );
    return;
  }
  exportRowsAsCsv(
    balanceList.value,
    balanceExportColumns,
    "inventory-balance-report"
  );
};

const handlePrint = () => {
  try {
    if (currentReportType.value === ReportType.DETAIL) {
      printRows(detailList.value, detailExportColumns, "商品收发明细表");
      return;
    }
    if (currentReportType.value === ReportType.SUMMARY) {
      printRows(summaryList.value, summaryExportColumns, "商品收发汇总表");
      return;
    }
    printRows(balanceList.value, balanceExportColumns, "商品库存余额表");
  } catch (error) {
    logger.error("打印库存报表失败", error);
  }
};

onMounted(() => {
  fetchData();
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
        <RepoSelect
          v-model="queryParams.repoId"
          placeholder="请选择仓库"
          class="w-[150px]"
        />
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
        :columns="currentColumns"
        @refresh="fetchData"
      >
        <template #buttons>
          <el-button :icon="useRenderIcon(Download)" @click="handleExport">
            导出
          </el-button>
          <el-button :icon="useRenderIcon(Printer)" @click="handlePrint">
            打印
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            row-key="id"
            adaptive
            :size="size"
            :columns="dynamicColumns"
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
