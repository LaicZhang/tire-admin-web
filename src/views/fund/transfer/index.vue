<script setup lang="ts">
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import { ref, reactive, onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import StatusTag from "@/components/StatusTag/index.vue";
import type { StatusConfig } from "@/components/StatusTag/types";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import Printer from "~icons/ep/printer";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { http } from "@/utils/http";
import { handleApiError, message } from "@/utils";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import { getPaymentListApi } from "@/api/payment";
import {
  type Transfer,
  type TransferQueryParams,
  TRANSFER_STATUS_OPTIONS
} from "./types";
import { columns } from "./columns";
import TransferForm from "./form.vue";

defineOptions({
  name: "FundTransfer"
});

// Convert status options to StatusTag format
const TRANSFER_STATUS_MAP: Record<string, StatusConfig> = Object.fromEntries(
  TRANSFER_STATUS_OPTIONS.map(opt => [
    opt.value,
    { label: opt.label, type: opt.type }
  ])
);

const loading = ref(true);
const dataList = ref<Transfer[]>([]);
const selectedRows = ref<Transfer[]>([]);
const formRef = ref<{ resetFields: () => void }>();
const { confirm } = useConfirmDialog();
const paymentList = ref<Array<{ uid: string; name: string }>>([]);
const pagination = reactive({
  total: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  currentPage: 1,
  background: true
});

const queryForm = reactive<TransferQueryParams>({
  fromPaymentId: undefined,
  toPaymentId: undefined,
  status: undefined,
  startDate: "",
  endDate: "",
  billNo: ""
});

const dialogVisible = ref(false);
const editData = ref<Transfer | null>(null);

async function loadPayments() {
  try {
    const res = await getPaymentListApi();
    paymentList.value =
      (res.data as Array<{ uid: string; name: string }>) || [];
  } catch (e) {
    handleApiError(e, "加载账户列表失败");
  }
}

async function onSearch() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      ...queryForm,
      index: pagination.currentPage
    };
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === undefined) {
        delete params[key];
      }
    });

    const { data } = await http.get<
      never,
      CommonResult<PaginatedResponseDto<Transfer>>
    >(`/finance-extension/account-transfer/${pagination.currentPage}`, {
      params
    });

    dataList.value = data.list || [];
    pagination.total = data.total ?? data.count ?? 0;
  } catch (e) {
    handleApiError(e, "查询失败");
    dataList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function resetForm(formEl?: { resetFields: () => void }) {
  if (!formEl) return;
  formEl.resetFields();
  Object.assign(queryForm, {
    fromPaymentId: undefined,
    toPaymentId: undefined,
    status: undefined,
    startDate: "",
    endDate: "",
    billNo: ""
  });
  onSearch();
}

function handleAdd() {
  editData.value = null;
  dialogVisible.value = true;
}

function handleEdit(row: Transfer) {
  editData.value = row;
  dialogVisible.value = true;
}

async function handleDelete(row: Transfer) {
  const ok = await confirm(
    `确定删除单据 ${row.billNo || row.uid} 吗？`,
    "删除确认"
  );
  if (!ok) return;

  try {
    await http.delete(`/finance-extension/account-transfer/${row.uid}`);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    handleApiError(e, "删除失败");
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    message("请选择要删除的记录", { type: "warning" });
    return;
  }
  const ok = await confirm(
    `确定删除选中的 ${selectedRows.value.length} 条记录吗？`,
    "批量删除确认"
  );
  if (!ok) return;

  try {
    for (const row of selectedRows.value) {
      await http.delete(`/finance-extension/account-transfer/${row.uid}`);
    }
    message("批量删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    handleApiError(e, "批量删除失败");
  }
}

async function handleApprove(row: Transfer) {
  const ok = await confirm("确定审核通过该转账单吗？", "审核确认");
  if (!ok) return;

  try {
    await http.post(`/finance-extension/account-transfer/${row.uid}/approve`);
    message("审核成功", { type: "success" });
    onSearch();
  } catch (e) {
    handleApiError(e, "审核失败");
  }
}

function handlePrint() {
  if (selectedRows.value.length === 0) {
    message("请选择要打印的记录", { type: "warning" });
    return;
  }
  message("打印功能开发中");
}

function handleSelectionChange(rows: Transfer[]) {
  selectedRows.value = rows;
}

function handleFormSuccess() {
  onSearch();
  loadPayments(); // 刷新账户余额
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
      <el-form-item label="单据编号" prop="billNo">
        <el-input
          v-model="queryForm.billNo"
          placeholder="请输入单据编号"
          clearable
          class="w-[160px]"
        />
      </el-form-item>
      <el-form-item label="转出账户" prop="fromPaymentId">
        <el-select
          v-model="queryForm.fromPaymentId"
          placeholder="请选择"
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
      <el-form-item label="转入账户" prop="toPaymentId">
        <el-select
          v-model="queryForm.toPaymentId"
          placeholder="请选择"
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
    </ReSearchForm>

    <PureTableBar title="转账单列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新建转账单
        </el-button>
        <el-button
          type="danger"
          :icon="useRenderIcon(Delete)"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
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
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @selection-change="handleSelectionChange"
          @page-size-change="
            val => {
              pagination.pageSize = val;
              onSearch();
            }
          "
          @page-current-change="
            val => {
              pagination.currentPage = val;
              onSearch();
            }
          "
        >
          <template #status="{ row }">
            <StatusTag :status="row.status" :status-map="TRANSFER_STATUS_MAP" />
          </template>
          <template #operation="{ row, size }">
            <el-button
              link
              type="primary"
              :size="size"
              @click="handleEdit(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="row.status === 'DRAFT'"
              link
              type="success"
              :size="size"
              @click="handleApprove(row)"
            >
              审核
            </el-button>
            <el-button
              v-if="row.status === 'DRAFT'"
              link
              type="danger"
              :size="size"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <TransferForm
      v-model="dialogVisible"
      :edit-data="editData"
      @success="handleFormSuccess"
    />
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
