<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import PageContainer from "@/components/PageContainer/index.vue";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import Printer from "~icons/ep/printer";
import Download from "~icons/ep/download";
import { http } from "@/utils/http";
import { handleApiError } from "@/utils";
import { fenToYuanOrDash as formatMoney } from "@/utils/formatMoney";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import {
  type OtherExpense,
  type OtherExpenseQueryParams,
  EXPENSE_TYPE_OPTIONS,
  OTHER_EXPENSE_STATUS_OPTIONS
} from "./types";
import { columns, getStatusInfo, getExpenseTypeText } from "./columns";
import OtherExpenseForm from "./form.vue";

defineOptions({
  name: "FundOtherExpense"
});

const loading = ref(true);
const dataList = ref<OtherExpense[]>([]);
const selectedRows = ref<OtherExpense[]>([]);
const formRef = ref<{ resetFields: () => void }>();
const pagination = reactive({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

const queryForm = reactive<OtherExpenseQueryParams>({
  providerName: "",
  expenseType: undefined,
  status: undefined,
  startDate: "",
  endDate: "",
  billNo: ""
});

const dialogVisible = ref(false);
const editData = ref<OtherExpense | null>(null);

async function onSearch() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      ...queryForm,
      direction: "OUT"
    };
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === undefined) {
        delete params[key];
      }
    });

    const { data } = await http.get<
      never,
      CommonResult<PaginatedResponseDto<OtherExpense>>
    >(`/expense-order/${pagination.currentPage}`, { params });

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
    expenseType: undefined,
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

function handleEdit(row: OtherExpense) {
  editData.value = row;
  dialogVisible.value = true;
}

async function handleDelete(row: OtherExpense) {
  try {
    await ElMessageBox.confirm(
      `确定删除单据 ${row.billNo || row.uid} 吗？`,
      "删除确认",
      { type: "warning" }
    );
    await http.delete(`/expense-order/${row.uid}`);
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
      await http.delete(`/expense-order/${row.uid}`);
    }
    ElMessage.success("批量删除成功");
    onSearch();
  } catch (e) {
    if ((e as string) !== "cancel") {
      ElMessage.error("批量删除失败");
    }
  }
}

function handlePay(row: OtherExpense) {
  ElMessage.info("请前往付款单进行付款操作");
}

function handleLink(row: OtherExpense) {
  ElMessage.info("关联功能开发中");
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

function handleSelectionChange(rows: OtherExpense[]) {
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
        <el-form-item label="支出类型" prop="expenseType">
          <el-select
            v-model="queryForm.expenseType"
            placeholder="请选择类型"
            clearable
            class="!w-[130px]"
          >
            <el-option
              v-for="item in EXPENSE_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" prop="providerName">
          <el-input
            v-model="queryForm.providerName"
            placeholder="请输入供应商名称"
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

    <PureTableBar title="其他支出单列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新增支出单
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
          <template #expenseType="{ row }">
            <el-tag type="danger" size="small">
              {{ getExpenseTypeText(row.expenseType) || row.type }}
            </el-tag>
          </template>
          <template #amount="{ row }">
            <span class="text-red-500 font-medium">
              -{{ formatMoney(row.amount) }}
            </span>
          </template>
          <template #status="{ row }">
            <el-tag :type="getStatusInfo(row.status).type" size="small">
              {{ getStatusInfo(row.status).label }}
            </el-tag>
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
              @click="handlePay(row)"
            >
              付款
            </el-button>
            <el-button link type="info" :size="size" @click="handleLink(row)">
              关联
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

    <OtherExpenseForm
      v-model="dialogVisible"
      :edit-data="editData"
      @success="handleFormSuccess"
    />
  </PageContainer>
</template>
