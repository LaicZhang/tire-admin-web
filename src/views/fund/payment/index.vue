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
import { http } from "@/utils/http";
import { handleApiError, message } from "@/utils";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import {
  type PaymentOrder,
  type PaymentOrderQueryParams,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  paymentStatusMap
} from "./types";
import { columns } from "./columns";
import PaymentForm from "./form.vue";
import { useOptions } from "@/composables/useOptions";

defineOptions({
  name: "FundPayment"
});

const loading = ref(true);
const dataList = ref<PaymentOrder[]>([]);
const selectedRows = ref<PaymentOrder[]>([]);
const formRef = ref<{ resetFields: () => void }>();
const { confirm } = useConfirmDialog();
const { providers } = useOptions();

const providerNameOptions = computed(() => {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of providers.value) {
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

const queryForm = reactive<PaymentOrderQueryParams>({
  providerName: "",
  status: undefined,
  startDate: "",
  endDate: "",
  billNo: ""
});

const dialogVisible = ref(false);
const editData = ref<PaymentOrder | null>(null);

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
      CommonResult<PaginatedResponseDto<PaymentOrder>>
    >(`/payment-order/${pagination.currentPage}`, { params });

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
    providerName: "",
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

function handleEdit(row: PaymentOrder) {
  editData.value = row;
  dialogVisible.value = true;
}

async function handleDelete(row: PaymentOrder) {
  const ok = await confirm(`确定删除单据 ${row.billNo} 吗？`, "删除确认");
  if (!ok) return;

  try {
    await http.delete(`/payment-order/${row.uid}`);
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
      await http.delete(`/payment-order/${row.uid}`);
    }
    message("批量删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    handleApiError(e, "批量删除失败");
  }
}

async function handleApprove(row: PaymentOrder) {
  const ok = await confirm("确定审核通过该付款单吗？", "审核确认");
  if (!ok) return;

  try {
    await http.post(`/payment-order/${row.uid}/approve`);
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

function handleExport() {
  message("导出功能开发中");
}

function handleSelectionChange(rows: PaymentOrder[]) {
  selectedRows.value = rows;
}

function handleFormSuccess() {
  onSearch();
}

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
        <el-form-item label="供应商" prop="providerName">
          <el-select
            v-model="queryForm.providerName"
            placeholder="请选择或输入供应商名称"
            filterable
            clearable
            class="w-[160px]"
            allow-create
            default-first-option
          >
            <el-option
              v-for="name in providerNameOptions"
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
              v-for="item in PAYMENT_STATUS_OPTIONS"
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

    <PureTableBar title="付款单列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新建付款单
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
            <StatusTag :status="row.status" :status-map="paymentStatusMap" />
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

    <PaymentForm
      v-model="dialogVisible"
      :edit-data="editData"
      @success="handleFormSuccess"
    />
  </PageContainer>
</template>
