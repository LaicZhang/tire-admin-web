<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getWorkflowListApi,
  deleteWorkflowApi,
  type WorkflowQuery,
  type WorkflowVO
} from "@/api/system/workflow";
import {
  Plus,
  Search,
  Refresh,
  Delete,
  Edit
} from "@element-plus/icons-vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import StatusTag from "@/components/StatusTag/index.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import WorkflowForm from "./WorkflowForm.vue";

defineOptions({
  name: "WorkflowIndex"
});

const loading = ref(false);
const tableData = ref<WorkflowVO[]>([]);
const formRef = ref();

const queryForm = reactive<WorkflowQuery>({
  name: "",
  status: undefined,
  pageNum: 1,
  pageSize: 10
});

const columns: TableColumnList = [
  {
    label: "序号",
    type: "index",
    width: 60,
    align: "center"
  },
  {
    label: "流程名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "描述",
    prop: "description",
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    align: "center",
    slot: "status"
  },
  {
    label: "创建时间",
    prop: "createTime",
    width: 180,
    align: "center"
  },
  {
    label: "操作",
    width: 180,
    fixed: "right",
    align: "center",
    slot: "operation"
  }
];

const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  pageSizes: [10, 20, 50, 100],
  background: true,
  layout: "total, sizes, prev, pager, next, jumper"
});



const workflowStatusMap = {
  1: { label: "启用", type: "success" },
  0: { label: "禁用", type: "info" }
} as const;

const formRef = ref();

// Fetch Data
const handleQuery = async () => {
  loading.value = true;
  try {
    const { data } = await getWorkflowListApi(queryForm);
    tableData.value = data.list;
    pagination.total = data.total ?? data.count ?? 0;
    pagination.currentPage = queryForm.pageNum ?? 1;
    pagination.pageSize = queryForm.pageSize ?? 10;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const onPageSizeChange = (val: number) => {
  queryForm.pageSize = val;
  handleQuery();
};

const onCurrentPageChange = (val: number) => {
  queryForm.pageNum = val;
  handleQuery();
};

// Reset Query
const resetQuery = () => {
  queryForm.name = "";
  queryForm.status = undefined;
  queryForm.pageNum = 1;
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
    contentRenderer: () => h(WorkflowForm, { ref: formRef }),
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
    contentRenderer: () => h(WorkflowForm, { ref: formRef }),
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
  try {
    await ElMessageBox.confirm(`确认删除流程 "${row.name}" 吗?`, "提示", {
      type: "warning"
    });
    await deleteWorkflowApi(row.id);
    ElMessage.success("删除成功");
    handleQuery();
  } catch (e) {
    // cancelled
  }
};


onMounted(() => {
  handleQuery();
});
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
            @keyup.enter="handleQuery"
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
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery"
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

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
