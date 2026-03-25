<script setup lang="ts">
import { ElMessageBox } from "element-plus";
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import { ref, onMounted, reactive } from "vue";
import { columns, AuditOrder } from "./columns";
import { getPendingAuditOrdersApi, auditOrderApi } from "@/api/business/order";
import { confirmBox, message } from "@/utils/message";
import { useRouter } from "vue-router";
import type { PaginatedResponseDto } from "@/api/type";
import { PureTableBar } from "@/components/RePureTableBar";

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
  pageSize: DEFAULT_PAGE_SIZE,
  currentPage: 1,
  background: true
});

const tableData = ref<AuditOrder[]>([]);

const tabOptions = [
  { label: "销售订单", value: "sale-order" },
  { label: "采购订单", value: "purchase-order" },
  { label: "退货订单", value: "return-order" },
  { label: "理赔订单", value: "claim-order" },
  { label: "供应商索赔单", value: "supplier-claim-order" },
  { label: "调拨单", value: "transfer-order" },
  { label: "报损单", value: "waste-order" },
  { label: "报溢单", value: "surplus-order" },
  { label: "组装单", value: "assembly-order" }
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
      total.value = typedData.total ?? 0;
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

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function reloadAfterAudit() {
  if (tableData.value.length === 1 && currentPage.value > 1) {
    currentPage.value -= 1;
  }
  await loadData();
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
  router.push({
    path: "/business/order",
    query: {
      keyword: row.uid,
      orderType: activeTab.value
    }
  });
}

async function submitAudit(
  row: AuditOrder,
  isApproved: boolean,
  desc: string | null
) {
  await auditOrderApi(row.uid, {
    type: activeTab.value,
    isApproved,
    desc
  });
}

async function handleApprove(row: AuditOrder) {
  const ok = await confirmBox("确认审核通过该单据？", "确认审核", {
    type: "warning"
  });
  if (!ok) return;

  try {
    await submitAudit(row, true, null);
    message("审核成功", { type: "success" });
    await reloadAfterAudit();
  } catch (error) {
    message(resolveErrorMessage(error, "审核失败"), { type: "error" });
  }
}

async function handleReject(row: AuditOrder) {
  try {
    const result = await ElMessageBox.prompt("请输入拒绝原因", "拒绝审核", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /.+/,
      inputErrorMessage: "请输入拒绝原因"
    });
    if (typeof result === "string") return;
    const { value } = result as { value: string };
    await submitAudit(row, false, value);
    message("已拒绝", { type: "success" });
    await reloadAfterAudit();
  } catch (error) {
    if (error !== "cancel") {
      message(resolveErrorMessage(error, "操作失败"), { type: "error" });
    }
  }
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

    <PureTableBar :columns="columns" title="" class="mt-4" @refresh="loadData">
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
            <el-button
              type="primary"
              link
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="handleReject(row)"
            >
              驳回
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </el-card>
</template>
