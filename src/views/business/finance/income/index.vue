<script setup lang="ts">
import { h, ref, reactive, onMounted } from "vue";
import { http } from "@/utils/http";
import { formatMoney } from "@/utils/formatMoney";
import dayjs from "dayjs";
import { columns } from "./columns";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import { PureTable } from "@pureadmin/table";
import type { PaginationProps } from "@pureadmin/table";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import IncomeForm from "./IncomeForm.vue";

defineOptions({
  name: "Income"
});

interface OtherTransaction {
  id: number;
  uid: string;
  type: string;
  amount: bigint;
  direction: "IN" | "OUT";
  category?: string;
  remark?: string;
  createdAt: string;
  payment?: {
    name: string;
  };
}

// 列表数据
const tableData = ref<OtherTransaction[]>([]);
const loading = ref(false);

// 查询参数
const queryParams = reactive({
  index: 1,
  size: 20
});

const pagination = reactive<PaginationProps>({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

// 获取列表数据（仅收入）
const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await http.get<
      never,
      CommonResult<PaginatedResponseDto<OtherTransaction>>
    >(`/finance-extension/other-transaction/${queryParams.index}`, {
      params: { direction: "IN", size: queryParams.size }
    });
    tableData.value = data.list;
    pagination.total = data.total ?? data.count;
    pagination.currentPage = queryParams.index;
    pagination.pageSize = queryParams.size;
  } catch (error) {
    console.error("获取收入单列表失败", error);
  } finally {
    loading.value = false;
  }
};

// 翻页
const onPageChange = (val: PaginationProps) => {
  queryParams.index = val.currentPage;
  queryParams.size = val.pageSize;
  fetchData();
};

// 打开新增对话框
const handleAdd = () => {
  addDialog({
    title: "新增收入单",
    width: "500px",
    draggable: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(IncomeForm, {
        onSuccess: () => {
          closeAllDialog();
          fetchData();
        },
        onClose: () => closeAllDialog()
      })
  });
};

// 格式化金额
const formatAmount = (amount: bigint | number) => {
  return formatMoney(Number(amount));
};

// 格式化日期
const formatDate = (date?: string) => {
  return date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-";
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="main">
    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>其他收入单列表</span>
          <el-button type="primary" size="small" @click="handleAdd">
            <template #icon>
              <i class="ep:plus" />
            </template>
            新增收入单
          </el-button>
        </div>
      </template>

      <PureTable
        border
        stripe
        :loading="loading"
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        @page-current-change="
          val => onPageChange({ ...pagination, currentPage: val })
        "
        @page-size-change="
          val => onPageChange({ ...pagination, pageSize: val })
        "
      >
        <template #type="{ row }">
          <el-tag type="success" size="small">{{ row.type }}</el-tag>
        </template>
        <template #amount="{ row }">
          <span class="text-success">+{{ formatAmount(row.amount) }}</span>
        </template>
        <template #payment="{ row }">
          {{ row.payment?.name || "-" }}
        </template>
        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </PureTable>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.main {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-success {
  font-weight: 500;
  color: var(--el-color-success);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
