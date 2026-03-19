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
  fenToYuanNumber,
  fenToYuanOrDash as formatMoney
} from "@/utils/formatMoney";
import {
  type OtherIncome,
  type OtherIncomeQueryParams,
  INCOME_TYPE_OPTIONS,
  OTHER_INCOME_STATUS_OPTIONS
} from "./types";
import { columns, getStatusInfo, getIncomeTypeText } from "./columns";
import OtherIncomeForm from "./form.vue";
import type { StatusConfig } from "@/components/StatusTag/types";
import { useOptions } from "@/composables/useOptions";
import {
  deleteOtherIncomeApi,
  getOtherIncomeListApi
} from "@/api/fund/other-income";
import ReceiptForm from "../receipt/form.vue";
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
  name: "FundOtherIncome"
});

const { confirm } = useConfirmDialog();
const loading = ref(true);
const dataList = ref<OtherIncome[]>([]);
const selectedRows = ref<OtherIncome[]>([]);
const formRef = ref<{ resetFields: () => void }>();
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

const queryForm = reactive<OtherIncomeQueryParams>({
  customerName: undefined,
  incomeType: undefined,
  status: undefined,
  startDate: undefined,
  endDate: undefined,
  billNo: undefined
});

const receiptInitialValues = ref<{
  customerId?: string;
  amount?: number;
  remark?: string;
} | null>(null);
const { openDialog: openIncomeDialog } =
  useManagedSubmitDialog<ManagedSubmitDialogRef>();
const { openDialog: openReceiptDialog } =
  useManagedSubmitDialog<ManagedSubmitDialogRef>();

// Convert status options to StatusTag format
const OTHER_INCOME_STATUS_MAP: Record<string, StatusConfig> =
  Object.fromEntries(
    OTHER_INCOME_STATUS_OPTIONS.map(opt => [
      opt.value,
      { label: opt.label, type: opt.type }
    ])
  );

async function onSearch() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = { ...queryForm };
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === undefined) {
        delete params[key];
      }
    });

    const { data } = await getOtherIncomeListApi(
      pagination.currentPage,
      params
    );

    dataList.value = (data.list || []) as OtherIncome[];
    pagination.total = data.total ?? 0;
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
    customerName: "",
    incomeType: undefined,
    status: undefined,
    startDate: "",
    endDate: "",
    billNo: ""
  });
  onSearch();
}

function handleAdd() {
  openIncomeDialog({
    title: "新建其他收入单",
    width: "600px",
    formComponent: OtherIncomeForm,
    buildProps: () => ({ editData: null }),
    onSuccess: handleFormSuccess
  });
}

function handleEdit(row: OtherIncome) {
  message(`单据 ${row.billNo || row.uid} 的编辑能力暂未接入`, {
    type: "warning"
  });
}

async function handleDelete(row: OtherIncome) {
  const ok = await confirm(
    `确定删除单据 ${row.billNo || row.uid} 吗？`,
    "删除确认",
    { type: "warning" }
  );
  if (!ok) return;

  try {
    await deleteOtherIncomeApi(row.uid);
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
    "批量删除确认",
    { type: "warning" }
  );
  if (!ok) return;

  try {
    for (const row of selectedRows.value) {
      await deleteOtherIncomeApi(row.uid);
    }
    message("批量删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    handleApiError(e, "批量删除失败");
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
    printRows(rows, exportColumns, "其他收入单");
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

  exportRowsAsCsv(rows, exportColumns, "其他收入单");
  message("导出成功", { type: "success" });
}

function handleSelectionChange(rows: OtherIncome[]) {
  selectedRows.value = rows;
}

function handleFormSuccess() {
  onSearch();
}

function handleReceive(row: OtherIncome) {
  const unpaidAmount = Number(row.unpaidAmount ?? 0);
  if (unpaidAmount <= 0) {
    message("该单据已无待收金额", { type: "info" });
    return;
  }

  receiptInitialValues.value = {
    customerId: row.customerId,
    amount: fenToYuanNumber(unpaidAmount),
    remark: `其他收入单 ${row.billNo || row.uid} 收款`
  };
  openReceiptDialog({
    title: "登记收款",
    width: "800px",
    formComponent: ReceiptForm,
    buildProps: () => ({
      initialValues: receiptInitialValues.value || undefined
    }),
    onSuccess: handleFormSuccess
  });
}

const exportColumns: PresentationColumn<OtherIncome>[] = [
  { label: "单据编号", value: row => row.billNo },
  {
    label: "收入类型",
    value: row => getIncomeTypeText(row.incomeType) || row.incomeType
  },
  { label: "客户", value: row => row.customerName || "-" },
  { label: "金额", value: row => formatMoney(row.amount) },
  { label: "本次收款", value: row => formatMoney(row.receivedAmount) },
  { label: "未收款", value: row => formatMoney(row.unpaidAmount) },
  { label: "收款账户", value: row => row.paymentName || "-" },
  { label: "状态", value: row => getStatusInfo(row.status).label },
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
        <el-form-item label="收入类型" prop="incomeType">
          <el-select
            v-model="queryForm.incomeType"
            placeholder="请选择类型"
            clearable
            class="!w-[130px]"
          >
            <el-option
              v-for="item in INCOME_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="客户" prop="customerName">
          <el-select
            v-model="queryForm.customerName"
            placeholder="请选择或输入客户名称"
            filterable
            clearable
            allow-create
            default-first-option
            class="!w-[140px]"
          >
            <el-option
              v-for="name in customerNameOptions"
              :key="name"
              :label="name"
              :value="name"
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

    <PureTableBar title="其他收入单列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新增收入单
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
          <template #incomeType="{ row }">
            <el-tag type="success" size="small">
              {{ getIncomeTypeText(row.incomeType) || row.type }}
            </el-tag>
          </template>
          <template #amount="{ row }">
            <span class="text-green-600 font-medium">
              +{{ formatMoney(row.amount) }}
            </span>
          </template>
          <template #status="{ row }">
            <StatusTag
              :status="row.status"
              :status-map="OTHER_INCOME_STATUS_MAP"
            />
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
              v-if="row.unpaidAmount && row.unpaidAmount > 0"
              link
              type="success"
              :size="size"
              @click="handleReceive(row)"
            >
              收款
            </el-button>
            <el-button
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
