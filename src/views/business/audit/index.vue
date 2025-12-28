<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getPendingAuditOrdersApi } from "@/api/business/order";
import { message } from "@/utils/message";
import { useRouter } from "vue-router";

defineOptions({
  name: "AuditCenter"
});

const router = useRouter();
const loading = ref(false);
const activeTab = ref("sale-order");
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const tableData = ref<any[]>([]);

const tabOptions = [
  { label: "销售订单", value: "sale-order" },
  { label: "采购订单", value: "purchase-order" },
  { label: "理赔单", value: "claim-order" },
  { label: "退货单", value: "return-order" }
];

async function loadData() {
  loading.value = true;
  try {
    const { data, code, msg } = await getPendingAuditOrdersApi(
      activeTab.value,
      currentPage.value,
      { pageSize: pageSize.value }
    );
    if (code === 200) {
      const typedData = data as { list?: unknown[]; total?: number };
      tableData.value = typedData.list || [];
      total.value = typedData.total || 0;
    } else {
      message(msg || "加载失败", { type: "error" });
    }
  } catch {
    message("加载失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleTabChange() {
  currentPage.value = 1;
  loadData();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadData();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  loadData();
}

function viewDetail(row: any) {
  router.push(`/business/order/detail/${row.uid}`);
}

function formatStatus(status: string) {
  const statusMap: Record<
    string,
    {
      text: string;
      type: "success" | "warning" | "danger" | "info" | "primary";
    }
  > = {
    pending: { text: "待审核", type: "warning" },
    approved: { text: "已通过", type: "success" },
    rejected: { text: "已驳回", type: "danger" }
  };
  return statusMap[status] || { text: status, type: "info" };
}

function formatDate(date: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <el-card>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-lg font-medium">审核中心</span>
        <el-button type="primary" @click="loadData">刷新</el-button>
      </div>
    </template>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane
        v-for="tab in tabOptions"
        :key="tab.value"
        :label="tab.label"
        :name="tab.value"
      />
    </el-tabs>

    <el-table v-loading="loading" :data="tableData" stripe border class="mt-4">
      <el-table-column prop="orderNo" label="订单号" min-width="150" />
      <el-table-column prop="customerName" label="客户/供应商" min-width="120">
        <template #default="{ row }">
          {{ row.customerName || row.providerName || "-" }}
        </template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="金额" min-width="100">
        <template #default="{ row }">
          ¥{{ (row.totalAmount / 100).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="creatorName" label="创建人" min-width="100" />
      <el-table-column prop="status" label="状态" min-width="100">
        <template #default="{ row }">
          <el-tag :type="formatStatus(row.auditStatus).type" size="small">
            {{ formatStatus(row.auditStatus).text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="viewDetail(row)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-end mt-4">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </el-card>
</template>
