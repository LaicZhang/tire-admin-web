<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref, reactive, h } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { columns } from "./columns";
import {
  getWorkflowListApi,
  deleteWorkflowApi,
  type WorkflowQuery,
  type WorkflowVO
} from "@/api/system/workflow";
import { Plus, Search, Refresh, Delete, Edit } from "@element-plus/icons-vue";
import { PureTableBar } from "@/components/RePureTableBar";
import StatusTag from "@/components/StatusTag/index.vue";
import { addDialog } from "@/composables/useDialogService";
import { deviceDetection } from "@pureadmin/utils";
import WorkflowForm from "./WorkflowForm.vue";
import { useCrud } from "@/composables";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import { message } from "@/utils";
import { fieldRules } from "@/utils/validation/fieldRules";
import { handleApiError } from "@/utils/error";

defineOptions({
  name: "WorkflowIndex"
});

type WorkflowFormExpose = {
  handleSubmit: () => Promise<boolean>;
};

const formRef = ref<WorkflowFormExpose>();
const { confirm } = useConfirmDialog();

const queryFormRef = ref<FormInstance>();
const queryForm = reactive<Pick<WorkflowQuery, "name">>({
  name: undefined
});

const queryRules: FormRules = {
  name: fieldRules.name({ required: false, label: "流程名称", max: 50 })
};

const {
  loading,
  dataList: tableData,
  pagination,
  fetchData: handleQuery,
  onCurrentChange: onCurrentPageChange,
  onSizeChange: onPageSizeChange
} = useCrud<
  WorkflowVO,
  CommonResult<PaginatedResponseDto<WorkflowVO>>,
  { page: number; pageSize: number }
>({
  api: ({ page, pageSize }) =>
    getWorkflowListApi({ ...queryForm, page, pageSize }),
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    pageSizes: [10, 20, 50, 100],
    background: true,
    layout: "total, sizes, prev, pager, next, jumper"
  },
  transform: res => {
    if (res.code !== 200) {
      return { list: [], total: 0 };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.total ?? 0
    };
  },
  immediate: true
});

const enabledStatusMap = {
  true: { label: "启用", type: "success" },
  false: { label: "禁用", type: "info" }
} as const;

const formatAmountRange = (row: WorkflowVO) => {
  const min =
    row.minAmount === null || row.minAmount === undefined || row.minAmount === ""
      ? null
      : String(row.minAmount);
  const max =
    row.maxAmount === null || row.maxAmount === undefined || row.maxAmount === ""
      ? null
      : String(row.maxAmount);
  if (!min && !max) return "不限";
  if (min && max) return `${min} ~ ${max}`;
  if (min) return `≥ ${min}`;
  return `≤ ${max}`;
};

const resetQuery = () => {
  queryForm.name = "";
  pagination.value = { ...pagination.value, currentPage: 1 };
  handleQuery();
};

const onSearch = async () => {
  const valid = await queryFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  pagination.value = { ...pagination.value, currentPage: 1 };
  handleQuery();
};

const handleAdd = () => {
  addDialog({
    title: "新增审批流程（ApprovalFlow）",
    props: {
      formInline: {
        isEdit: false
      }
    },
    width: "640px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(WorkflowForm, {
        ref: formRef,
        formInline: (
          options.props as {
            formInline: { isEdit: boolean; data?: WorkflowVO };
          }
        ).formInline
      }),
    beforeSure: async done => {
      const formInstance = formRef.value;
      if (!formInstance) return;
      const success = await formInstance.handleSubmit();
      if (success) {
        done();
        handleQuery();
      }
    }
  });
};

const handleEdit = (row: WorkflowVO) => {
  addDialog({
    title: "编辑审批流程（ApprovalFlow）",
    props: {
      formInline: {
        isEdit: true,
        data: row
      }
    },
    width: "640px",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) =>
      h(WorkflowForm, {
        ref: formRef,
        formInline: (
          options.props as {
            formInline: { isEdit: boolean; data?: WorkflowVO };
          }
        ).formInline
      }),
    beforeSure: async done => {
      const formInstance = formRef.value;
      if (!formInstance) return;
      const success = await formInstance.handleSubmit();
      if (success) {
        done();
        handleQuery();
      }
    }
  });
};

const handleDelete = async (row: WorkflowVO) => {
  const ok = await confirm(`确认删除流程 "${row.name}" 吗?`, "提示");
  if (!ok) return;

  try {
    await deleteWorkflowApi(row.uid);
    message("删除成功", { type: "success" });
    handleQuery();
  } catch (e) {
    handleApiError(e);
  }
};
</script>

<template>
  <div class="main-content">
    <el-alert
      class="mb-4"
      type="warning"
      show-icon
      :closable="false"
      title="AWF-005：本页已切换为真实 ApprovalFlow"
      description="订单审核只读取 ApprovalFlow。旧 SystemWorkflow 写入已在后端禁用，避免双真相配置。"
    />

    <el-card shadow="never" class="search-wrapper">
      <el-form
        ref="queryFormRef"
        :model="queryForm"
        :rules="queryRules"
        :inline="true"
      >
        <el-form-item label="流程名称" prop="name">
          <el-input
            v-model="queryForm.name"
            placeholder="客户端筛选（后端暂无 name 过滤）"
            clearable
            @keyup.enter="onSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="onSearch"
            >刷新</el-button
          >
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="table-wrapper bg-white p-4">
      <PureTableBar
        title="审批流程列表（ApprovalFlow）"
        :columns="columns"
        @refresh="handleQuery"
      >
        <template #buttons>
          <el-button type="primary" :icon="Plus" @click="handleAdd"
            >新增流程</el-button
          >
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            border
            align-whole="center"
            showOverflowTooltip
            table-layout="auto"
            :loading="loading"
            :size="size"
            :data="tableData"
            :columns="dynamicColumns"
            :pagination="pagination"
            :paginationSmall="size === 'small' ? true : false"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
            @page-size-change="onPageSizeChange"
            @page-current-change="onCurrentPageChange"
          >
            <template #amountRange="{ row }">
              {{ formatAmountRange(row) }}
            </template>
            <template #status="{ row }">
              <StatusTag
                :status="row.isEnabled !== false"
                :status-map="enabledStatusMap"
                size="default"
              />
            </template>
            <template #operation="{ row }">
              <el-button
                link
                type="primary"
                :icon="Edit"
                @click="handleEdit(row)"
                >编辑</el-button
              >
              <el-button
                link
                type="danger"
                :icon="Delete"
                @click="handleDelete(row)"
                >删除</el-button
              >
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
  </div>
</template>

<style scoped>
.main-content {
  padding: 20px;
}

.search-wrapper {
  margin-bottom: 20px;
}
</style>
