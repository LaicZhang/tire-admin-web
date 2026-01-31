<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import type { TabPaneName } from "element-plus";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { http } from "@/utils/http";
import { handleApiError } from "@/utils";
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
import ReportStatisticsCards from "./components/ReportStatisticsCards.vue";
import FundFlowTab from "./components/FundFlowTab.vue";
import AccountBalanceTab from "./components/AccountBalanceTab.vue";
import ContactDebtTab from "./components/ContactDebtTab.vue";

defineOptions({
  name: "FundReport"
});

const loading = ref(true);
const formRef = ref<{ resetFields: () => void }>();
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
    handleApiError(e, "加载账户列表失败");
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
    handleApiError(e, "查询资金流水失败");
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
    handleApiError(e, "查询账户余额失败");
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
    handleApiError(e, "查询往来欠款失败");
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

function resetForm(formEl?: { resetFields: () => void }) {
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

function handleTabChange(tab: TabPaneName) {
  activeTab.value = String(tab) as typeof activeTab.value;
  onSearch();
}

function handleExport() {
  ElMessage.info("导出功能开发中");
}

function handlePrint() {
  ElMessage.info("打印功能开发中");
}

onMounted(() => {
  loadPayments();
  onSearch();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      ref="formRef"
      :form="queryForm"
      :loading="loading"
      @search="onSearch"
      @reset="resetForm(formRef)"
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
          class="w-[120px]!"
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
    </ReSearchForm>

    <ReportStatisticsCards :active-tab="activeTab" :statistics="statistics" />

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="px-4" @tab-change="handleTabChange">
      <el-tab-pane label="资金流水" name="flow">
        <FundFlowTab
          :loading="loading"
          :columns="fundFlowColumns"
          :data="fundFlowList"
          :pagination="flowPagination"
          @refresh="onSearch"
          @export="handleExport"
          @print="handlePrint"
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
        />
      </el-tab-pane>

      <el-tab-pane label="账户余额" name="balance">
        <AccountBalanceTab
          :loading="loading"
          :columns="accountBalanceColumns"
          :data="accountBalanceList"
          @refresh="onSearch"
          @export="handleExport"
        />
      </el-tab-pane>

      <el-tab-pane label="往来欠款" name="debt">
        <ContactDebtTab
          :loading="loading"
          :columns="contactDebtColumns"
          :data="contactDebtList"
          :pagination="debtPagination"
          @refresh="onSearch"
          @export="handleExport"
          @print="handlePrint"
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
        />
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
</style>
