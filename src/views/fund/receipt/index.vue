<script setup lang="ts">
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import { ref, reactive, onMounted, computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import PageContainer from "@/components/PageContainer/index.vue";
import StatusTag from "@/components/StatusTag/index.vue";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import Printer from "~icons/ep/printer";
import Download from "~icons/ep/download";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { handleApiError, message } from "@/utils";
import {
  approveReceiptApi,
  deleteReceiptApi,
  getReceiptListApi
} from "@/api/fund/receipt";
import {
  type ReceiptOrder,
  type ReceiptQueryParams,
  RECEIPT_STATUS_OPTIONS,
  receiptStatusMap
} from "./types";
import { columns } from "./columns";
import ReceiptForm from "./form.vue";
import { useOptions } from "@/composables/useOptions";
import {
  exportRowsAsCsv,
  printRows,
  type PresentationColumn
} from "../utils/tablePresentation";
import {
  useManagedSubmitDialog,
  type ManagedSubmitDialogRef
} from "@/composables/useManagedSubmitDialog";

defineOptions({
  name: "FundReceipt"
});

const loading = ref(true);
const dataList = ref<ReceiptOrder[]>([]);
const selectedRows = ref<ReceiptOrder[]>([]);
const formRef = ref<{ resetFields: () => void }>();
const { confirm } = useConfirmDialog();
const { customers } = useOptions();

const customerNameOptions = computed(() => {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of customers.value) {
    const name = String(item.name || "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
});

const pagination = reactive({
  total: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  currentPage: 1,
  background: true
});

const queryForm = reactive<ReceiptQueryParams>({
  customerName: undefined,
  status: undefined,
  startDate: undefined,
  endDate: undefined,
  billNo: undefined
});

const { openDialog: openReceiptDialog } =
  useManagedSubmitDialog<ManagedSubmitDialogRef>();

async function onSearch() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = { ...queryForm };
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === undefined) {
        delete params[key];
      }
    });

    const { data } = await getReceiptListApi(pagination.currentPage, params);
    dataList.value = (data.list || []) as ReceiptOrder[];
    pagination.total = data.total ?? 0;
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
  Object.assign(queryForm, {
    customerName: "",
    status: undefined,
    startDate: "",
    endDate: "",
    billNo: ""
  });
  onSearch();
}

function handleAdd() {
  openReceiptDialog({
    title: "新建收款单",
    width: "800px",
    formComponent: ReceiptForm,
    buildProps: () => ({ editData: null }),
    onSuccess: handleFormSuccess
  });
}

function handleEdit(row: ReceiptOrder) {
  openReceiptDialog({
    title: "编辑收款单",
    width: "800px",
    formComponent: ReceiptForm,
    buildProps: () => ({ editData: row }),
    onSuccess: handleFormSuccess
  });
}

async function handleDelete(row: ReceiptOrder) {
  const ok = await confirm(`确定删除单据 ${row.billNo} 吗？`, "删除确认");
  if (!ok) return;

  try {
    await deleteReceiptApi(row.uid);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (error) {
    handleApiError(error, "删除失败");
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
      await deleteReceiptApi(row.uid);
    }
    message("批量删除成功", { type: "success" });
    onSearch();
  } catch (error) {
    handleApiError(error, "批量删除失败");
  }
}

async function handleApprove(row: ReceiptOrder) {
  const ok = await confirm("确定审核通过该收款单吗？", "审核确认");
  if (!ok) return;

  try {
    await approveReceiptApi(row.uid);
    message("审核成功", { type: "success" });
    onSearch();
  } catch (error) {
    handleApiError(error, "审核失败");
  }
}

function handlePrint() {
  const rows =
    selectedRows.value.length > 0 ? selectedRows.value : dataList.value;
  if (rows.length === 0) {
    message("当前没有可打印的记录", { type: "warning" });
    return;
  }

  try {
    printRows(rows, exportColumns, "收款单");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "打印失败";
    message(msg, { type: "error" });
  }
}

function handleExport() {
  const rows =
    selectedRows.value.length > 0 ? selectedRows.value : dataList.value;
  if (rows.length === 0) {
    message("当前没有可导出的记录", { type: "warning" });
    return;
  }

  exportRowsAsCsv(rows, exportColumns, "收款单");
  message("导出成功", { type: "success" });
}

function handleSelectionChange(rows: ReceiptOrder[]) {
  selectedRows.value = rows;
}

function handleFormSuccess() {
  onSearch();
}

const exportColumns: PresentationColumn<ReceiptOrder>[] = [
  { label: "单据编号", value: row => row.billNo },
  { label: "客户", value: row => row.customerName || "-" },
  { label: "收款金额", value: row => row.amount / 100 },
  { label: "本次核销", value: row => (row.writeOffAmount || 0) / 100 },
  { label: "本次预收", value: row => (row.advanceAmount || 0) / 100 },
  { label: "结算账户", value: row => row.paymentName || "-" },
  { label: "收款方式", value: row => row.paymentMethod || "-" },
  {
    label: "状态",
    value: row => receiptStatusMap[row.status]?.label || row.status
  },
  { label: "备注", value: row => row.remark || "-" }
];

onMounted(() => {
  onSearch();
});
</script>

<template>
  <PageContainer>
    <template #search>
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
        <el-form-item label="客户" prop="customerName">
          <el-select
            v-model="queryForm.customerName"
            placeholder="请选择或输入客户名称"
            filterable
            clearable
            class="w-[160px]"
            allow-create
            default-first-option
          >
            <el-option
              v-for="name in customerNameOptions"
              :key="name"
              :label="name"
              :value="name"
            />
          </el-select>
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
    </template>

    <PureTableBar title="收款单列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新建收款单
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
            <StatusTag :status="row.status" :status-map="receiptStatusMap" />
          </template>
          <template #operation="{ row, size }">
            <el-button
              link
              type="primary"
              :size="size"
              @click="handleEdit(row)"
            >
              编辑
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
  </PageContainer>
</template>
