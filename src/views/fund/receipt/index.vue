<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import {
  deleteAdvancePayment,
  getAdvancePaymentList,
  writeOffAdvancePayment,
  type AdvancePaymentListItem
} from "@/api/business/advance-payment";
import { handleApiError, message } from "@/utils";
import { type ReceiptQueryParams, RECEIPT_STATUS_OPTIONS } from "./types";
import { columns, calcReceiptStatus, getStatusInfo } from "./columns";
import ReceiptForm from "./form.vue";

defineOptions({
  name: "FundReceipt"
});

const loading = ref(false);
const dataList = ref<AdvancePaymentListItem[]>([]);
const selectedRows = ref<AdvancePaymentListItem[]>([]);
const formRef = ref<{ resetFields: () => void }>();
const { confirm } = useConfirmDialog();

const pagination = reactive({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

const queryForm = reactive<ReceiptQueryParams>({
  customerName: "",
  status: undefined
});

const dialogVisible = ref(false);

async function onSearch() {
  loading.value = true;
  try {
    const res = await getAdvancePaymentList({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      type: "RECEIPT",
      targetName: queryForm.customerName || undefined
    });
    if (res.code !== 200) {
      message(res.msg || "查询失败", { type: "error" });
      dataList.value = [];
      pagination.total = 0;
      return;
    }

    const list = res.data?.list || [];
    dataList.value = queryForm.status
      ? list.filter(
          row => calcReceiptStatus(row.remainingAmount) === queryForm.status
        )
      : list;

    pagination.total = res.data?.total ?? res.data?.count ?? 0;
  } catch (error) {
    handleApiError(error, "查询失败");
    dataList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function resetForm(formEl?: { resetFields: () => void }) {
  if (!formEl) return;
  formEl.resetFields();
  queryForm.customerName = "";
  queryForm.status = undefined;
  pagination.currentPage = 1;
  onSearch();
}

function handleAdd() {
  dialogVisible.value = true;
}

function handleSelectionChange(rows: AdvancePaymentListItem[]) {
  selectedRows.value = rows;
}

async function handleDelete(row: AdvancePaymentListItem) {
  const ok = await confirm(`确定删除单据 ${row.billNo} 吗？`, "删除确认");
  if (!ok) return;

  loading.value = true;
  try {
    await deleteAdvancePayment(String(row.id));
    message("删除成功", { type: "success" });
    selectedRows.value = [];
    onSearch();
  } catch (error) {
    handleApiError(error, "删除失败");
  } finally {
    loading.value = false;
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

  loading.value = true;
  try {
    await Promise.all(
      selectedRows.value.map(row => deleteAdvancePayment(String(row.id)))
    );
    message("批量删除成功", { type: "success" });
    selectedRows.value = [];
    onSearch();
  } catch (error) {
    handleApiError(error, "批量删除失败");
  } finally {
    loading.value = false;
  }
}

async function handleWriteOff(row: AdvancePaymentListItem) {
  if (calcReceiptStatus(row.remainingAmount) !== "ACTIVE") {
    message("该单据余额已用完", { type: "info" });
    return;
  }

  try {
    const orderRes = await ElMessageBox.prompt(
      "请输入销售订单 UID",
      "核销预收款",
      {
        confirmButtonText: "下一步",
        cancelButtonText: "取消",
        inputPattern: /.+/,
        inputErrorMessage: "请输入销售订单 UID"
      }
    );
    if (typeof orderRes === "string") return;
    const orderUid = orderRes.value;

    const amountRes = await ElMessageBox.prompt(
      "请输入核销金额(元)",
      "核销预收款",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /^\\d+(\\.\\d{1,2})?$/,
        inputErrorMessage: "请输入正确金额"
      }
    );
    if (typeof amountRes === "string") return;
    const amountYuan = amountRes.value;

    const amountFen = Math.round(Number(amountYuan) * 100);
    const remaining = BigInt(row.remainingAmount || "0");
    if (amountFen <= 0) {
      message("核销金额必须大于0", { type: "warning" });
      return;
    }
    if (BigInt(amountFen) > remaining) {
      message("核销金额不能大于剩余金额", { type: "warning" });
      return;
    }

    loading.value = true;
    await writeOffAdvancePayment({
      advanceId: row.id,
      orderUid,
      amount: amountFen
    });
    message("核销成功", { type: "success" });
    onSearch();
  } catch (error) {
    if ((error as string) !== "cancel") {
      handleApiError(error, "核销失败");
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
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
      <el-form-item label="客户" prop="customerName">
        <el-input
          v-model="queryForm.customerName"
          placeholder="请输入客户名称"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryForm.status"
          placeholder="请选择状态"
          clearable
          class="w-[120px]!"
        >
          <el-option
            v-for="item in RECEIPT_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="预收款列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          :disabled="loading"
          @click="handleAdd"
        >
          新建
        </el-button>
        <el-button
          type="danger"
          :icon="useRenderIcon(Delete)"
          :disabled="loading || selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
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
            <el-tag
              :type="getStatusInfo(calcReceiptStatus(row.remainingAmount)).type"
              size="small"
            >
              {{ getStatusInfo(calcReceiptStatus(row.remainingAmount)).label }}
            </el-tag>
          </template>

          <template #operation="{ row, size: btnSize }">
            <el-button
              v-if="calcReceiptStatus(row.remainingAmount) === 'ACTIVE'"
              link
              type="success"
              :size="btnSize"
              :disabled="loading"
              @click="handleWriteOff(row)"
            >
              核销
            </el-button>
            <el-button
              link
              type="danger"
              :size="btnSize"
              :disabled="loading"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <ReceiptForm v-model="dialogVisible" @success="onSearch" />
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
