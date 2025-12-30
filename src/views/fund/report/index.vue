<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import Download from "~icons/ep/download";
import Printer from "~icons/ep/printer";
import type { FormInstance } from "element-plus";
import { http } from "@/utils/http";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import { getPaymentListApi } from "@/api/payment";
import {
  type FundFlow,
  type AccountBalance,
  type ContactDebt,
  type FundReportQueryParams,
  type TrendDataPoint,
  REPORT_TYPE_OPTIONS
} from "./types";
import {
  fundFlowColumns,
  accountBalanceColumns,
  contactDebtColumns
} from "./columns";
import dayjs from "dayjs";

defineOptions({
  name: "FundReport"
});

const loading = ref(true);
const formRef = ref<FormInstance>();
const paymentList = ref<Array<{ uid: string; name: string }>>([]);

// 当前激活的标签页
const activeTab = ref("flow");

// 资金流水数据
const fundFlowList = ref<FundFlow[]>([]);
const flowPagination = reactive({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

// 账户余额数据
const accountBalanceList = ref<AccountBalance[]>([]);

// 往来欠款数据
const contactDebtList = ref<ContactDebt[]>([]);
const debtPagination = reactive({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

// 趋势数据
const trendData = ref<TrendDataPoint[]>([]);

// 统计汇总
const statistics = reactive({
  totalIncome: 0,
  totalExpense: 0,
  netBalance: 0,
  totalReceivable: 0,
  totalPayable: 0
});

const queryForm = reactive<FundReportQueryParams>({
  reportType: undefined,
  paymentId: undefined,
  targetType: undefined,
  targetName: "",
  startDate: dayjs().subtract(30, "day").format("YYYY-MM-DD"),
  endDate: dayjs().format("YYYY-MM-DD")
});

// 快捷时间范围选项
const dateShortcuts = [
  {
    text: "今天",
    value: () => {
      const today = dayjs().format("YYYY-MM-DD");
      return [today, today];
    }
  },
  {
    text: "本周",
    value: () => {
      const start = dayjs().startOf("week").format("YYYY-MM-DD");
      const end = dayjs().endOf("week").format("YYYY-MM-DD");
      return [start, end];
    }
  },
  {
    text: "本月",
    value: () => {
      const start = dayjs().startOf("month").format("YYYY-MM-DD");
      const end = dayjs().endOf("month").format("YYYY-MM-DD");
      return [start, end];
    }
  },
  {
    text: "最近30天",
    value: () => {
      const start = dayjs().subtract(30, "day").format("YYYY-MM-DD");
      const end = dayjs().format("YYYY-MM-DD");
      return [start, end];
    }
  },
  {
    text: "最近90天",
    value: () => {
      const start = dayjs().subtract(90, "day").format("YYYY-MM-DD");
      const end = dayjs().format("YYYY-MM-DD");
      return [start, end];
    }
  }
];

async function loadPayments() {
  try {
    const res = await getPaymentListApi();
    paymentList.value =
      (res.data as Array<{ uid: string; name: string }>) || [];
  } catch (e) {
    console.error("加载账户列表失败", e);
  }
}

async function fetchFundFlow() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      ...queryForm,
      index: flowPagination.currentPage
    };
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === undefined) {
        delete params[key];
      }
    });

    const { data } = await http.get<
      never,
      CommonResult<PaginatedResponseDto<FundFlow>>
    >(`/statement/${flowPagination.currentPage}`, { params });

    fundFlowList.value = data.list || [];
    flowPagination.total = data.total ?? data.count ?? 0;

    // 计算统计数据
    let income = 0;
    let expense = 0;
    fundFlowList.value.forEach(item => {
      if (item.direction === "IN") {
        income += item.amount || 0;
      } else {
        expense += item.amount || 0;
      }
    });
    statistics.totalIncome = income;
    statistics.totalExpense = expense;
    statistics.netBalance = income - expense;
  } catch (e) {
    console.error("查询资金流水失败", e);
    fundFlowList.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchAccountBalance() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      startDate: queryForm.startDate,
      endDate: queryForm.endDate
    };

    const { data } = await http.get<never, CommonResult<AccountBalance[]>>(
      "/statement/account-balance",
      { params }
    );

    accountBalanceList.value = data || [];
  } catch (e) {
    console.error("查询账户余额失败", e);
    accountBalanceList.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchContactDebt() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      targetType: queryForm.targetType,
      targetName: queryForm.targetName,
      index: debtPagination.currentPage
    };
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === undefined) {
        delete params[key];
      }
    });

    const { data } = await http.get<
      never,
      CommonResult<PaginatedResponseDto<ContactDebt>>
    >(`/statement/contact-debt/${debtPagination.currentPage}`, { params });

    contactDebtList.value = data.list || [];
    debtPagination.total = data.total ?? data.count ?? 0;

    // 计算统计
    let receivable = 0;
    let payable = 0;
    contactDebtList.value.forEach(item => {
      receivable += item.receivableAmount || 0;
      payable += item.payableAmount || 0;
    });
    statistics.totalReceivable = receivable;
    statistics.totalPayable = payable;
  } catch (e) {
    console.error("查询往来欠款失败", e);
    contactDebtList.value = [];
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  if (activeTab.value === "flow") {
    fetchFundFlow();
  } else if (activeTab.value === "balance") {
    fetchAccountBalance();
  } else if (activeTab.value === "debt") {
    fetchContactDebt();
  }
}

function resetForm(formEl?: FormInstance) {
  if (!formEl) return;
  formEl.resetFields();
  Object.assign(queryForm, {
    reportType: undefined,
    paymentId: undefined,
    targetType: undefined,
    targetName: "",
    startDate: dayjs().subtract(30, "day").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD")
  });
  onSearch();
}

function handleTabChange(tab: string) {
  activeTab.value = tab;
  onSearch();
}

function handleExport() {
  ElMessage.info("导出功能开发中");
}

function handlePrint() {
  ElMessage.info("打印功能开发中");
}

/** 格式化金额 */
function formatMoney(amount?: number): string {
  if (amount === undefined || amount === null) return "-";
  return (amount / 100).toFixed(2);
}

watch(
  () => activeTab.value,
  () => {
    onSearch();
  }
);

onMounted(() => {
  loadPayments();
  onSearch();
});
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="queryForm"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="日期范围" prop="dateRange">
        <el-date-picker
          v-model="queryForm.startDate"
          type="date"
          placeholder="开始日期"
          value-format="YYYY-MM-DD"
          class="!w-[140px]"
        />
        <span class="mx-2">-</span>
        <el-date-picker
          v-model="queryForm.endDate"
          type="date"
          placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="!w-[140px]"
        />
      </el-form-item>
      <el-form-item v-if="activeTab === 'flow'" label="账户" prop="paymentId">
        <el-select
          v-model="queryForm.paymentId"
          placeholder="全部账户"
          clearable
          class="!w-[140px]"
        >
          <el-option
            v-for="item in paymentList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="activeTab === 'debt'"
        label="单位类型"
        prop="targetType"
      >
        <el-select
          v-model="queryForm.targetType"
          placeholder="全部"
          clearable
          class="!w-[120px]"
        >
          <el-option label="客户" value="CUSTOMER" />
          <el-option label="供应商" value="PROVIDER" />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="activeTab === 'debt'"
        label="单位名称"
        prop="targetName"
      >
        <el-input
          v-model="queryForm.targetName"
          placeholder="请输入名称"
          clearable
          class="!w-[140px]"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearch"
        >
          查询
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 统计卡片 -->
    <div class="statistics-cards mb-4 flex gap-4 px-4">
      <el-card shadow="never" class="flex-1">
        <div class="text-gray-500 text-sm">
          {{ activeTab === "debt" ? "应收合计" : "收入合计" }}
        </div>
        <div class="text-xl font-bold text-green-600">
          ¥{{
            formatMoney(
              activeTab === "debt"
                ? statistics.totalReceivable
                : statistics.totalIncome
            )
          }}
        </div>
      </el-card>
      <el-card shadow="never" class="flex-1">
        <div class="text-gray-500 text-sm">
          {{ activeTab === "debt" ? "应付合计" : "支出合计" }}
        </div>
        <div class="text-xl font-bold text-red-500">
          ¥{{
            formatMoney(
              activeTab === "debt"
                ? statistics.totalPayable
                : statistics.totalExpense
            )
          }}
        </div>
      </el-card>
      <el-card shadow="never" class="flex-1">
        <div class="text-gray-500 text-sm">
          {{ activeTab === "debt" ? "净欠款" : "净额" }}
        </div>
        <div
          class="text-xl font-bold"
          :class="
            (activeTab === 'debt'
              ? statistics.totalReceivable - statistics.totalPayable
              : statistics.netBalance) >= 0
              ? 'text-green-600'
              : 'text-red-500'
          "
        >
          ¥{{
            formatMoney(
              activeTab === "debt"
                ? statistics.totalReceivable - statistics.totalPayable
                : statistics.netBalance
            )
          }}
        </div>
      </el-card>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="px-4" @tab-change="handleTabChange">
      <el-tab-pane label="资金流水" name="flow">
        <PureTableBar
          title="资金流水明细"
          :columns="fundFlowColumns"
          @refresh="onSearch"
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
              border
              align-whole="center"
              showOverflowTooltip
              table-layout="auto"
              :loading="loading"
              :size="size"
              :data="fundFlowList"
              :columns="dynamicColumns"
              :pagination="flowPagination"
              :paginationSmall="size === 'small'"
              :header-cell-style="{
                background: 'var(--el-fill-color-light)',
                color: 'var(--el-text-color-primary)'
              }"
              @page-size-change="
                val => {
                  flowPagination.pageSize = val;
                  fetchFundFlow();
                }
              "
              @page-current-change="
                val => {
                  flowPagination.currentPage = val;
                  fetchFundFlow();
                }
              "
            >
              <template #direction="{ row }">
                <el-tag
                  :type="row.direction === 'IN' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.direction === "IN" ? "收入" : "支出" }}
                </el-tag>
              </template>
              <template #amount="{ row }">
                <span
                  :class="
                    row.direction === 'IN' ? 'text-green-600' : 'text-red-500'
                  "
                  class="font-medium"
                >
                  {{ row.direction === "IN" ? "+" : "-"
                  }}{{ formatMoney(row.amount) }}
                </span>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </el-tab-pane>

      <el-tab-pane label="账户余额" name="balance">
        <PureTableBar
          title="账户余额统计"
          :columns="accountBalanceColumns"
          @refresh="onSearch"
        >
          <template #buttons>
            <el-button :icon="useRenderIcon(Download)" @click="handleExport">
              导出
            </el-button>
          </template>
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              border
              align-whole="center"
              showOverflowTooltip
              table-layout="auto"
              :loading="loading"
              :size="size"
              :data="accountBalanceList"
              :columns="dynamicColumns"
              :header-cell-style="{
                background: 'var(--el-fill-color-light)',
                color: 'var(--el-text-color-primary)'
              }"
            >
              <template #income="{ row }">
                <span class="text-green-600 font-medium">
                  +{{ formatMoney(row.periodIncome) }}
                </span>
              </template>
              <template #expense="{ row }">
                <span class="text-red-500 font-medium">
                  -{{ formatMoney(row.periodExpense) }}
                </span>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </el-tab-pane>

      <el-tab-pane label="往来欠款" name="debt">
        <PureTableBar
          title="往来单位欠款表"
          :columns="contactDebtColumns"
          @refresh="onSearch"
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
              border
              align-whole="center"
              showOverflowTooltip
              table-layout="auto"
              :loading="loading"
              :size="size"
              :data="contactDebtList"
              :columns="dynamicColumns"
              :pagination="debtPagination"
              :paginationSmall="size === 'small'"
              :header-cell-style="{
                background: 'var(--el-fill-color-light)',
                color: 'var(--el-text-color-primary)'
              }"
              @page-size-change="
                val => {
                  debtPagination.pageSize = val;
                  fetchContactDebt();
                }
              "
              @page-current-change="
                val => {
                  debtPagination.currentPage = val;
                  fetchContactDebt();
                }
              "
            >
              <template #targetType="{ row }">
                <el-tag
                  :type="row.targetType === 'CUSTOMER' ? 'primary' : 'warning'"
                  size="small"
                >
                  {{ row.targetType === "CUSTOMER" ? "客户" : "供应商" }}
                </el-tag>
              </template>
              <template #receivable="{ row }">
                <span class="text-green-600 font-medium">
                  {{ formatMoney(row.receivableAmount) }}
                </span>
              </template>
              <template #payable="{ row }">
                <span class="text-red-500 font-medium">
                  {{ formatMoney(row.payableAmount) }}
                </span>
              </template>
              <template #netDebt="{ row }">
                <span
                  :class="row.netDebt >= 0 ? 'text-green-600' : 'text-red-500'"
                  class="font-medium"
                >
                  {{ formatMoney(row.netDebt) }}
                </span>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.main {
  padding: 16px;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.statistics-cards {
  :deep(.el-card__body) {
    padding: 16px;
  }
}
</style>
