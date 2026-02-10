<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref, reactive, h } from "vue";
import { columns } from "./columns";
import {
  getWorkflowListApi,
  deleteWorkflowApi,
  restoreWorkflowApi,
  type WorkflowQuery,
  type WorkflowVO
} from "@/api/system/workflow";
import { Plus, Search, Refresh, Delete, Edit } from "@element-plus/icons-vue";
import { PureTableBar } from "@/components/RePureTableBar";
import StatusTag from "@/components/StatusTag/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import WorkflowForm from "./WorkflowForm.vue";
import { useCrud } from "@/composables";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import { message } from "@/utils";

defineOptions({
  name: "WorkflowIndex"
});

type WorkflowFormExpose = {
  handleSubmit: () => Promise<boolean>;
};

const formRef = ref<WorkflowFormExpose>();
const { confirm } = useConfirmDialog();

const queryForm = reactive<Pick<WorkflowQuery, "name" | "status" | "scope">>({
  name: "",
  status: undefined,
  scope: "nonDeleted"
});

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
      total: res.data?.total ?? res.data?.count ?? 0
    };
  },
  immediate: true
});

const workflowStatusMap = {
  1: { label: "启用", type: "success" },
  0: { label: "禁用", type: "info" }
} as const;

// Reset Query
const resetQuery = () => {
  queryForm.name = "";
  queryForm.status = undefined;
  queryForm.scope = "nonDeleted";
  pagination.value = { ...pagination.value, currentPage: 1 };
  handleQuery();
};

// Search
const onSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  handleQuery();
};

// Add Workflow
const handleAdd = () => {
  addDialog({
    title: "新增审批流程",
    props: {
      formInline: {
        isEdit: false
      }
    },
    width: "600px",
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

// Edit Workflow
const handleEdit = (row: WorkflowVO) => {
  addDialog({
    title: "编辑审批流程",
    props: {
      formInline: {
        isEdit: true,
        data: row
      }
    },
    width: "600px",
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

// Delete Workflow
const handleDelete = async (row: WorkflowVO) => {
  const ok = await confirm(`确认删除流程 "${row.name}" 吗?`, "提示");
  if (!ok) return;

  try {
    await deleteWorkflowApi(row.id);
    message("删除成功", { type: "success" });
    handleQuery();
  } catch {
    // ignore
  }
};

const handleRestore = async (row: WorkflowVO) => {
  try {
    await restoreWorkflowApi(row.id);
    message("恢复成功", { type: "success" });
    handleQuery();
  } catch {
    // ignore
  }
};
</script>

<template>
  <div class="main-content">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="queryFormRef" :model="queryForm" :inline="true">
        <el-form-item label="流程名称" prop="name">
          <el-input
            v-model="queryForm.name"
            placeholder="请输入流程名称"
            clearable
            @keyup.enter="onSearch"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 200px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="范围" prop="scope">
          <el-select
            v-model="queryForm.scope"
            placeholder="请选择范围"
            clearable
            style="width: 200px"
          >
            <el-option label="未删除" value="nonDeleted" />
            <el-option label="已删除" value="deleted" />
            <el-option label="全部" value="all" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="onSearch"
            >搜索</el-button
          >
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="table-wrapper bg-white p-4">
      <PureTableBar
        title="审批流程列表"
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
            <template #status="{ row }">
              <StatusTag
                :status="row.status"
                :status-map="workflowStatusMap"
                size="default"
              />
            </template>
            <template #operation="{ row }">
              <el-button
                v-if="!row.deleteTime"
                link
                type="primary"
                :icon="Edit"
                @click="handleEdit(row)"
                >编辑</el-button
              >
              <el-button
                v-if="!row.deleteTime"
                link
                type="danger"
                :icon="Delete"
                @click="handleDelete(row)"
                >删除</el-button
              >
              <el-button v-else link type="primary" @click="handleRestore(row)"
                >恢复</el-button
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

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
