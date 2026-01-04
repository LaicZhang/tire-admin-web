<script setup lang="ts">
import { onMounted, ref } from "vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { getSalesOrderListApi } from "@/api/sales";
import {
  message,
  ALL_LIST,
  localForage,
  handleApiError,
  formatDate
} from "@/utils";
import type {
  SalesStatistics,
  CustomerRanking,
  TrendData,
  ReportQueryParams
} from "./types";
import { useColumns } from "./columns";

defineOptions({
  name: "SalesReport"
});

const { customerRankingColumns, trendDataColumns } = useColumns();

const loading = ref(false);

const searchForm = ref<ReportQueryParams>({
  startDate: undefined,
  endDate: undefined,
  customerId: undefined,
  groupBy: "month"
});

const dateRange = ref<[string, string] | null>(null);

const customerList = ref<any[]>([]);

const statistics = ref<SalesStatistics>({
  totalOrders: 0,
  totalAmount: 0,
  totalReceived: 0,
  totalUnreceived: 0,
  totalQuantity: 0,
  averageOrderAmount: 0
});

const customerRanking = ref<CustomerRanking[]>([]);
const trendData = ref<TrendData[]>([]);

const groupByOptions = [
  { label: "按日", value: "day" },
  { label: "按周", value: "week" },
  { label: "按月", value: "month" },
  { label: "按年", value: "year" }
];

async function loadSelectData() {
  const customers = await localForage().getItem(ALL_LIST.customer);
  customerList.value = (customers as any[]) || [];
}

async function loadReportData() {
  try {
    loading.value = true;

    if (dateRange.value) {
      searchForm.value.startDate = dateRange.value[0];
      searchForm.value.endDate = dateRange.value[1];
    }

    const res = await getSalesOrderListApi(1, {
      ...searchForm.value,
      pageSize: 1000
    });

    if (res.code === 200) {
      const orders = res.data.list || [];

      let totalAmount = 0;
      let totalReceived = 0;
      let totalQuantity = 0;
      const customerMap = new Map<string, CustomerRanking>();
      const dateMap = new Map<string, TrendData>();

      orders.forEach((order: any) => {
        totalAmount += order.total || 0;
        totalReceived += order.paidAmount || 0;
        totalQuantity += order.count || 0;

        const customerName = order.customer?.name || "未知客户";
        const customerId = order.customerId || "unknown";

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customerId,
            customerName,
            orderCount: 0,
            totalAmount: 0,
            totalQuantity: 0,
            percentage: 0
          });
        }
        const cData = customerMap.get(customerId)!;
        cData.orderCount++;
        cData.totalAmount += order.total || 0;
        cData.totalQuantity += order.count || 0;

        const dateKey = formatDate(order.createdAt, "YYYY-MM");
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            date: dateKey,
            orderCount: 0,
            amount: 0,
            quantity: 0
          });
        }
        const tData = dateMap.get(dateKey)!;
        tData.orderCount++;
        tData.amount += order.total || 0;
        tData.quantity += order.count || 0;
      });

      statistics.value = {
        totalOrders: orders.length,
        totalAmount,
        totalReceived,
        totalUnreceived: totalAmount - totalReceived,
        totalQuantity,
        averageOrderAmount: orders.length > 0 ? totalAmount / orders.length : 0
      };

      const rankings = Array.from(customerMap.values());
      rankings.forEach(r => {
        r.percentage =
          totalAmount > 0 ? (r.totalAmount / totalAmount) * 100 : 0;
      });
      rankings.sort((a, b) => b.totalAmount - a.totalAmount);
      customerRanking.value = rankings.slice(0, 10);

      trendData.value = Array.from(dateMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    }
  } catch (error) {
    handleApiError(error, "加载销售报表数据失败");
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  loadReportData();
}

function onReset() {
  searchForm.value = {
    startDate: undefined,
    endDate: undefined,
    customerId: undefined,
    groupBy: "month"
  };
  dateRange.value = null;
  loadReportData();
}

async function handleExport() {
  message("导出功能开发中", { type: "info" });
}

onMounted(async () => {
  await loadSelectData();
  loadReportData();
});
</script>

<template>
  <div class="main">
    <ReSearchForm
      class="m-1"
      :form="searchForm"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
    >
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="w-[240px]"
        />
      </el-form-item>
      <el-form-item label="客户">
        <el-select
          v-model="searchForm.customerId"
          placeholder="全部客户"
          clearable
          filterable
          class="w-[180px]"
        >
          <el-option
            v-for="item in customerList"
            :key="item.uid"
            :label="item.name"
            :value="item.uid"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="统计维度">
        <el-select v-model="searchForm.groupBy" class="w-[120px]">
          <el-option
            v-for="item in groupByOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <template #extraActions>
        <el-button type="success" @click="handleExport">导出报表</el-button>
      </template>
    </ReSearchForm>

    <el-row :gutter="16" class="m-1">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="销售订单总数" :value="statistics.totalOrders">
            <template #suffix>单</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic
            title="销售总金额"
            :value="statistics.totalAmount"
            :precision="2"
          >
            <template #prefix>¥</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic
            title="已收款金额"
            :value="statistics.totalReceived"
            :precision="2"
          >
            <template #prefix>¥</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic
            title="待收款金额"
            :value="statistics.totalUnreceived"
            :precision="2"
          >
            <template #prefix>¥</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="m-1">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="销售商品总数" :value="statistics.totalQuantity">
            <template #suffix>件</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic
            title="平均订单金额"
            :value="statistics.averageOrderAmount"
            :precision="2"
          >
            <template #prefix>¥</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="m-1">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>客户销售排名 (Top 10)</span>
          </template>
          <pure-table
            border
            stripe
            :loading="loading"
            :data="customerRanking"
            :columns="customerRankingColumns"
            style="width: 100%"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>销售趋势</span>
          </template>
          <pure-table
            border
            stripe
            :loading="loading"
            :data="trendData"
            :columns="trendDataColumns"
            style="width: 100%"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
