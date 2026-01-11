<script setup lang="ts">
import { ref, onMounted, h, reactive } from "vue";
import { getPendingAuditOrdersApi } from "@/api/business/order";
import { message } from "@/utils/message";
import { useRouter } from "vue-router";
import type { PaginatedResponseDto } from "@/api/type";
import { PureTableBar } from "@/components/RePureTableBar";
import StatusTag from "@/components/StatusTag/index.vue";
import { DOCUMENT_STATUS_MAP } from "@/components/StatusTag/types";

defineOptions({
  name: "AuditCenter"
});

const router = useRouter();
const loading = ref(false);
const activeTab = ref("sale-order");
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const pagination = reactive({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});
interface AuditOrder {
  orderNo: string;
  customerName?: string;
  providerName?: string;
  totalAmount: number;
  createdAt: string;
  creatorName: string;
  auditStatus: string;
  uid: string;
}

const tableData = ref<AuditOrder[]>([]);

const tabOptions = [
  { label: "销售订单", value: "sale-order" },
  { label: "采购订单", value: "purchase-order" },
  { label: "理赔单", value: "claim-order" },
  { label: "退货单", value: "return-order" }
];

const columns: TableColumnList = [
  {
    label: "订单号",
    prop: "orderNo",
    minWidth: 150
  },
  {
    label: "客户/供应商",
    minWidth: 120,
    cellRenderer: ({ row }) =>
      (row as AuditOrder).customerName ||
      (row as AuditOrder).providerName ||
      "-"
  },
  {
    label: "金额",
    minWidth: 100,
    cellRenderer: ({ row }) =>
      `¥${(((row as AuditOrder).totalAmount || 0) / 100).toFixed(2)}`
  },
  {
    label: "创建时间",
    minWidth: 160,
    cellRenderer: ({ row }) => formatDate((row as AuditOrder).createdAt)
  },
  {
    label: "创建人",
    prop: "creatorName",
    minWidth: 100
  },
  {
    label: "状态",
    minWidth: 100,
    cellRenderer: ({ row }) =>
      h(StatusTag, {
        status: (row as AuditOrder).auditStatus,
        statusMap: DOCUMENT_STATUS_MAP
      })
  },
  {
    label: "操作",
    fixed: "right",
    width: 120,
    slot: "operation"
  }
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
      const typedData = data as PaginatedResponseDto<AuditOrder>;
      tableData.value = typedData.list || [];
      total.value = typedData.total ?? typedData.count ?? 0;
      pagination.total = total.value;
      pagination.currentPage = currentPage.value;
      pagination.pageSize = pageSize.value;
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

function handlePageSizeChange(size: number) {
  handleSizeChange(size);
}

function handlePageCurrentChange(page: number) {
  handlePageChange(page);
}

function viewDetail(row: AuditOrder) {
  router.push(`/business/order/detail/${row.uid}`);
}

// Status mapping is now handled by DOCUMENT_STATUS_MAP from StatusTag

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

    <PureTableBar title="" class="mt-4" @refresh="loadData">
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          stripe
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :columns="dynamicColumns"
          :data="tableData"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="handlePageSizeChange"
          @page-current-change="handlePageCurrentChange"
        >
          <template #operation="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="viewDetail(row)"
            >
              查看详情
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </el-card>
</template>
