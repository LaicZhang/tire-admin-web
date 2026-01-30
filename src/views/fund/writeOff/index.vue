<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import StatusTag from "@/components/StatusTag/index.vue";
import { APPROVAL_STATUS_MAP } from "@/components/StatusTag/types";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import Printer from "~icons/ep/printer";
import { http } from "@/utils/http";
import { handleApiError } from "@/utils";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import {
  type WriteOffOrder,
  type WriteOffQueryParams,
  BUSINESS_TYPE_OPTIONS,
  WRITEOFF_STATUS_OPTIONS
} from "./types";
import { columns, getStatusInfo } from "./columns";
import WriteOffForm from "./form.vue";

defineOptions({
  name: "FundWriteOff"
});

const loading = ref(true);
const dataList = ref<WriteOffOrder[]>([]);
const selectedRows = ref<WriteOffOrder[]>([]);
const formRef = ref<{ resetFields: () => void }>();
const pagination = reactive({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

const queryForm = reactive<WriteOffQueryParams>({
  businessType: undefined,
  status: undefined,
  isApproved: undefined,
  startDate: "",
  endDate: "",
  billNo: ""
});

const dialogVisible = ref(false);
const editData = ref<WriteOffOrder | null>(null);

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
      CommonResult<PaginatedResponseDto<WriteOffOrder>>
    >(`/write-off-order/${pagination.currentPage}`, { params });

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
    businessType: undefined,
    status: undefined,
    isApproved: undefined,
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

function handleEdit(row: WriteOffOrder) {
  editData.value = row;
  dialogVisible.value = true;
}

async function handleDelete(row: WriteOffOrder) {
  try {
    await ElMessageBox.confirm(`确定删除单据 ${row.billNo} 吗？`, "删除确认", {
      type: "warning"
    });
    await http.delete(`/write-off-order/${row.uid}`);
    ElMessage.success("删除成功");
    onSearch();
  } catch (e) {
    if ((e as string) !== "cancel") {
      handleApiError(e, "删除失败");
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
      await http.delete(`/write-off-order/${row.uid}`);
    }
    ElMessage.success("批量删除成功");
    onSearch();
  } catch (e) {
    if ((e as string) !== "cancel") {
      handleApiError(e, "批量删除失败");
    }
  }
}

async function handleApprove(row: WriteOffOrder) {
  try {
    await ElMessageBox.confirm("确定审核通过该核销单吗？", "审核确认", {
      type: "warning"
    });
    await http.post(`/write-off-order/${row.uid}/approve`);
    ElMessage.success("审核成功");
    onSearch();
  } catch (e) {
    if ((e as string) !== "cancel") {
      handleApiError(e, "审核失败");
    }
  }
}

async function handleReject(row: WriteOffOrder) {
  try {
    await ElMessageBox.confirm("确定拒绝该核销单吗？", "拒绝确认", {
      type: "warning"
    });
    await http.post(`/write-off-order/${row.uid}/reject`);
    ElMessage.success("已拒绝");
    onSearch();
  } catch (e) {
    if ((e as string) !== "cancel") {
      handleApiError(e, "操作失败");
    }
  }
}

function handlePrint() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要打印的记录");
    return;
  }
  ElMessage.info("打印功能开发中");
}

function handleSelectionChange(rows: WriteOffOrder[]) {
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
      <el-form-item label="业务类型" prop="businessType">
        <el-select
          v-model="queryForm.businessType"
          placeholder="请选择类型"
          clearable
          class="!w-[140px]"
        >
          <el-option
            v-for="item in BUSINESS_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态" prop="isApproved">
        <el-select
          v-model="queryForm.isApproved"
          placeholder="请选择状态"
          clearable
          class="w-[120px]!"
        >
          <el-option label="待审核" value="false" />
          <el-option label="已审核" value="true" />
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

    <PureTableBar title="核销单列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新建核销单
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
            <StatusTag
              :status="row.isApproved"
              :status-map="APPROVAL_STATUS_MAP"
            />
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
              v-if="!row.isApproved"
              link
              type="success"
              :size="size"
              @click="handleApprove(row)"
            >
              审核
            </el-button>
            <el-button
              v-if="!row.isApproved"
              link
              type="warning"
              :size="size"
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
            <el-button
              v-if="!row.isApproved"
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

    <WriteOffForm
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
