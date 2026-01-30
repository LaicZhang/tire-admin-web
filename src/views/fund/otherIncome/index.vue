<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import PageContainer from "@/components/PageContainer/index.vue";
import StatusTag from "@/components/StatusTag/index.vue";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import Printer from "~icons/ep/printer";
import Download from "~icons/ep/download";
import { http } from "@/utils/http";
import { handleApiError } from "@/utils";
import { fenToYuanOrDash as formatMoney } from "@/utils/formatMoney";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import {
  type OtherIncome,
  type OtherIncomeQueryParams,
  INCOME_TYPE_OPTIONS,
  OTHER_INCOME_STATUS_OPTIONS
} from "./types";
import { columns, getStatusInfo, getIncomeTypeText } from "./columns";
import OtherIncomeForm from "./form.vue";
import type { StatusConfig } from "@/components/StatusTag/types";

defineOptions({
  name: "FundOtherIncome"
});

const loading = ref(true);
const dataList = ref<OtherIncome[]>([]);
const selectedRows = ref<OtherIncome[]>([]);
const formRef = ref<{ resetFields: () => void }>();
const pagination = reactive({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

const queryForm = reactive<OtherIncomeQueryParams>({
  customerName: "",
  incomeType: undefined,
  status: undefined,
  startDate: "",
  endDate: "",
  billNo: ""
});

const dialogVisible = ref(false);
const editData = ref<OtherIncome | null>(null);

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
    const params: Record<string, unknown> = {
      ...queryForm,
      direction: "IN"
    };
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === undefined) {
        delete params[key];
      }
    });

    const { data } = await http.get<
      never,
      CommonResult<PaginatedResponseDto<OtherIncome>>
    >(`/finance-extension/other-transaction/${pagination.currentPage}`, {
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
  editData.value = null;
  dialogVisible.value = true;
}

function handleEdit(row: OtherIncome) {
  editData.value = row;
  dialogVisible.value = true;
}

async function handleDelete(row: OtherIncome) {
  try {
    await ElMessageBox.confirm(
      `确定删除单据 ${row.billNo || row.uid} 吗？`,
      "删除确认",
      { type: "warning" }
    );
    await http.delete(`/finance-extension/other-transaction/${row.id}`);
    ElMessage.success("删除成功");
    onSearch();
  } catch (e) {
    if ((e as string) !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要删除的记录");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 条记录吗？`,
      "批量删除确认",
      { type: "warning" }
    );
    for (const row of selectedRows.value) {
      await http.delete(`/finance-extension/other-transaction/${row.id}`);
    }
    ElMessage.success("批量删除成功");
    onSearch();
  } catch (e) {
    if ((e as string) !== "cancel") {
      ElMessage.error("批量删除失败");
    }
  }
}

function handleReceive(row: OtherIncome) {
  // 跳转到收款单页面或打开收款弹窗
  ElMessage.info("请前往收款单进行收款操作");
}

function handlePrint() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要打印的记录");
    return;
  }
  ElMessage.info("打印功能开发中");
}

function handleExport() {
  ElMessage.info("导出功能开发中");
}

function handleSelectionChange(rows: OtherIncome[]) {
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
          <el-input
            v-model="queryForm.customerName"
            placeholder="请输入客户名称"
            clearable
            class="!w-[140px]"
          />
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

    <OtherIncomeForm
      v-model="dialogVisible"
      :edit-data="editData"
      @success="handleFormSuccess"
    />
  </PageContainer>
</template>
