<script setup lang="ts">
import { onMounted, ref } from "vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import dayjs from "dayjs";
import { getPurchaseOrderListApi } from "@/api/purchase";
import { message, ALL_LIST, localForage, handleApiError } from "@/utils";
import type {
  PurchaseStatistics,
  ProviderRanking,
  TrendData,
  ReportQueryParams
} from "./types";
import { useColumns } from "./columns";

defineOptions({
  name: "PurchaseReport"
});

const { providerRankingColumns, trendDataColumns } = useColumns();

const loading = ref(false);
const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);

const searchForm = ref<ReportQueryParams>({
  startDate: undefined,
  endDate: undefined,
  providerId: undefined,
  groupBy: "month"
});

const dateRange = ref<[string, string] | null>(null);

interface SelectItem {
  uid: string;
  name: string;
}

interface OrderItem {
  total?: number;
  paidAmount?: number;
  count?: number;
  provider?: { name?: string };
  providerId?: string;
  createdAt?: string;
}

const providerList = ref<SelectItem[]>([]);

const statistics = ref<PurchaseStatistics>({
  totalOrders: 0,
  totalAmount: 0,
  totalPaid: 0,
  totalUnpaid: 0,
  totalQuantity: 0,
  averageOrderAmount: 0
});

const providerRanking = ref<ProviderRanking[]>([]);
const trendData = ref<TrendData[]>([]);

const groupByOptions = [
  { label: "按日", value: "day" },
  { label: "按周", value: "week" },
  { label: "按月", value: "month" },
  { label: "按年", value: "year" }
];

async function loadSelectData() {
  try {
    const providers = await localForage().getItem(ALL_LIST.provider);
    providerList.value = (providers as SelectItem[]) || [];
  } catch (error) {
    handleApiError(error, "加载下拉数据失败");
  }
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function getGroupKey(date: string) {
  const groupBy = searchForm.value.groupBy || "month";
  const d = dayjs(date);
  switch (groupBy) {
    case "day":
      return d.format("YYYY-MM-DD");
    case "week":
      return d.startOf("week").format("YYYY-MM-DD");
    case "month":
      return d.format("YYYY-MM");
    case "year":
      return d.format("YYYY");
    default:
      return d.format("YYYY-MM");
  }
}

async function loadReportData() {
  try {
    loading.value = true;

    const startDate = dateRange.value?.[0];
    const endDate = dateRange.value?.[1];
    searchForm.value.startDate = startDate;
    searchForm.value.endDate = endDate;

    const orders: unknown[] = [];
    let pageIndex = 1;
    const pageSize = 200;

    while (true) {
      const res = await getPurchaseOrderListApi(pageIndex, {
        ...searchForm.value,
        pageSize
      });
      if (res.code !== 200) {
        message(res.msg, { type: "error" });
        break;
      }
      const list = res.data.list || [];
      orders.push(...list);

      const total = toNumber(res.data.count);
      if (list.length < pageSize) break;
      if (total > 0 && orders.length >= total) break;
      pageIndex += 1;
    }

    let totalAmount = 0;
    let totalPaid = 0;
    let totalQuantity = 0;
    const providerMap = new Map<string, ProviderRanking>();
    const dateMap = new Map<string, TrendData>();

    (orders as OrderItem[]).forEach((order: OrderItem) => {
      const orderTotal = toNumber(order.total);
      const paidAmount = toNumber(order.paidAmount);
      const quantity = toNumber(order.count);

      totalAmount += orderTotal;
      totalPaid += paidAmount;
      totalQuantity += quantity;

      const providerName = order.provider?.name || "未知供应商";
      const providerId = order.providerId || "unknown";

      if (!providerMap.has(providerId)) {
        providerMap.set(providerId, {
          providerId,
          providerName,
          orderCount: 0,
          totalAmount: 0,
          totalQuantity: 0,
          percentage: 0
        });
      }
      const pData = providerMap.get(providerId)!;
      pData.orderCount += 1;
      pData.totalAmount += orderTotal;
      pData.totalQuantity += quantity;

      const dateKey = getGroupKey(order.createdAt);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          orderCount: 0,
          amount: 0,
          quantity: 0
        });
      }
      const tData = dateMap.get(dateKey)!;
      tData.orderCount += 1;
      tData.amount += orderTotal;
      tData.quantity += quantity;
    });

    statistics.value = {
      totalOrders: orders.length,
      totalAmount,
      totalPaid,
      totalUnpaid: totalAmount - totalPaid,
      totalQuantity,
      averageOrderAmount: orders.length > 0 ? totalAmount / orders.length : 0
    };

    const rankings = Array.from(providerMap.values());
    rankings.forEach(r => {
      r.percentage = totalAmount > 0 ? (r.totalAmount / totalAmount) * 100 : 0;
    });
    rankings.sort((a, b) => b.totalAmount - a.totalAmount);
    providerRanking.value = rankings.slice(0, 10);

    trendData.value = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  } catch (error) {
    handleApiError(error, "加载采购报表数据失败");
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  loadReportData();
}

function onReset() {
  searchFormRef.value?.resetFields();
  searchForm.value = {
    startDate: undefined,
    endDate: undefined,
    providerId: undefined,
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
      ref="searchFormRef"
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
      <el-form-item label="供应商">
        <el-select
          v-model="searchForm.providerId"
          placeholder="全部供应商"
          clearable
          filterable
          class="w-[180px]"
        >
          <el-option
            v-for="item in providerList"
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
        <el-button type="success" @click="handleExport"> 导出报表 </el-button>
      </template>
    </ReSearchForm>

    <el-row :gutter="16" class="m-1">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="采购订单总数" :value="statistics.totalOrders">
            <template #suffix>单</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic
            title="采购总金额"
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
            title="已付款金额"
            :value="statistics.totalPaid"
            :precision="2"
          >
            <template #prefix>¥</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic
            title="待付款金额"
            :value="statistics.totalUnpaid"
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
          <el-statistic title="采购商品总数" :value="statistics.totalQuantity">
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
            <span>供应商采购排名 (Top 10)</span>
          </template>
          <pure-table
            border
            stripe
            :loading="loading"
            :data="providerRanking"
            :columns="providerRankingColumns"
            style="width: 100%"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>采购趋势</span>
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
