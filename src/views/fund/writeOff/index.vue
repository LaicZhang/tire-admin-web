<script setup lang="ts">
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import { ref, reactive, onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import StatusTag from "@/components/StatusTag/index.vue";
import { APPROVAL_STATUS_MAP } from "@/components/StatusTag/types";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import Printer from "~icons/ep/printer";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { handleApiError, message } from "@/utils";
import { getDocumentCenterPrintApi } from "@/api/document-center";
import {
  type WriteOffOrder,
  type WriteOffQueryParams,
  BUSINESS_TYPE_OPTIONS,
  WRITEOFF_STATUS_OPTIONS
} from "./types";
import {
  approveWriteOffApi,
  deleteWriteOffApi,
  getWriteOffListApi,
  rejectWriteOffApi,
  type WriteOffOrder as WriteOffOrderApi
} from "@/api/fund/write-off-order";
import { columns } from "./columns";
import WriteOffForm from "./form.vue";
import {
  useManagedSubmitDialog,
  type ManagedSubmitDialogRef
} from "@/composables/useManagedSubmitDialog";

defineOptions({
  name: "FundWriteOff"
});

const loading = ref(true);
const dataList = ref<WriteOffOrder[]>([]);
const selectedRows = ref<WriteOffOrder[]>([]);
const formRef = ref<{ resetFields: () => void }>();
const { confirm } = useConfirmDialog();
const pagination = reactive({
  total: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  currentPage: 1,
  background: true
});

const queryForm = reactive<WriteOffQueryParams>({
  businessType: undefined,
  status: undefined,
  isApproved: undefined,
  startDate: undefined,
  endDate: undefined,
  billNo: undefined
});

const { openDialog: openWriteOffDialog } =
  useManagedSubmitDialog<ManagedSubmitDialogRef>();

function toViewWriteOffOrder(row: WriteOffOrderApi): WriteOffOrder {
  return {
    ...row,
    businessType: row.businessType as WriteOffOrder["businessType"],
    status: row.status as WriteOffOrder["status"]
  };
}

async function onSearch() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      ...queryForm,
      pageSize: pagination.pageSize
    };
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === undefined) {
        delete params[key];
      }
    });
    const { data } = await getWriteOffListApi(pagination.currentPage, params);

    dataList.value = (data.list || []).map(toViewWriteOffOrder);
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
  openWriteOffDialog({
    title: "新建核销单",
    width: "700px",
    formComponent: WriteOffForm,
    buildProps: () => ({ editData: null }),
    onSuccess: handleFormSuccess
  });
}

function handleEdit(row: WriteOffOrder) {
  message(`单据 ${row.billNo || row.uid} 的编辑能力暂未接入`, {
    type: "warning"
  });
}

async function handleDelete(row: WriteOffOrder) {
  const ok = await confirm(`确定删除单据 ${row.billNo} 吗？`, "删除确认");
  if (!ok) return;

  try {
    await deleteWriteOffApi(row.uid);
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
      await deleteWriteOffApi(row.uid);
    }
    message("批量删除成功", { type: "success" });
    onSearch();
  } catch (e) {
    handleApiError(e, "批量删除失败");
  }
}

async function handleApprove(row: WriteOffOrder) {
  const ok = await confirm("确定审核通过该核销单吗？", "审核确认");
  if (!ok) return;

  try {
    await approveWriteOffApi(row.uid);
    message("审核成功", { type: "success" });
    onSearch();
  } catch (e) {
    handleApiError(e, "审核失败");
  }
}

async function handleReject(row: WriteOffOrder) {
  const ok = await confirm("确定拒绝该核销单吗？", "拒绝确认");
  if (!ok) return;

  try {
    await rejectWriteOffApi(row.uid);
    message("已拒绝", { type: "success" });
    onSearch();
  } catch (e) {
    handleApiError(e, "操作失败");
  }
}

function handlePrint() {
  if (selectedRows.value.length === 0) {
    message("请选择要打印的记录", { type: "warning" });
    return;
  }
  Promise.all(
    selectedRows.value.map(row =>
      getDocumentCenterPrintApi("WRITE_OFF", row.uid)
    )
  )
    .then(results => {
      const printable = results.filter(
        result => result.code === 200 && result.data
      );
      if (printable.length === 0) {
        message("获取打印数据失败", { type: "error" });
        return;
      }
      printable.forEach(result => {
        if (!result.data) return;
        const rows = Object.entries(result.data.detail)
          .map(
            ([key, value]) =>
              `<tr><td style="padding:8px;border:1px solid #ddd;">${key}</td><td style="padding:8px;border:1px solid #ddd;">${value}</td></tr>`
          )
          .join("");
        const popup = window.open(
          "",
          "_blank",
          "noopener,noreferrer,width=960,height=720"
        );
        if (!popup) {
          message("打印窗口打开失败", { type: "warning" });
          return;
        }
        popup.document.write(
          `<!doctype html><html><head><title>${result.data.billNo}</title></head><body style="font-family:sans-serif;padding:24px;"><h2>${result.data.billNo}</h2><p>状态：${result.data.status}</p><p>往来单位：${result.data.targetName ?? "-"}</p><table style="border-collapse:collapse;width:100%;margin-top:16px;">${rows}</table></body></html>`
        );
        popup.document.close();
        popup.focus();
        popup.print();
      });
    })
    .catch(() => {
      message("获取打印数据失败", { type: "error" });
    });
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
