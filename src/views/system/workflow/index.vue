<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getWorkflowListApi,
  createWorkflowApi,
  updateWorkflowApi,
  deleteWorkflowApi,
  type WorkflowQuery,
  type WorkflowForm,
  type WorkflowVO
} from "@/api/system/workflow";
import {
  Plus,
  Search,
  Refresh,
  Delete,
  Edit,
  Check,
  Close
} from "@element-plus/icons-vue";

defineOptions({
  name: "WorkflowIndex"
});

const loading = ref(false);
const tableData = ref<WorkflowVO[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const dialogTitle = ref("新增审批流程");

const queryForm = reactive<WorkflowQuery>({
  name: "",
  status: undefined,
  pageNum: 1,
  pageSize: 10
});

const formData = reactive<WorkflowForm>({
  id: undefined,
  name: "",
  description: "",
  steps: [],
  status: 1
});

const rules = {
  name: [{ required: true, message: "请输入流程名称", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

const formRef = ref();

// Fetch Data
const handleQuery = async () => {
  loading.value = true;
  try {
    const { data } = await getWorkflowListApi(queryForm);
    tableData.value = data.list;
    total.value = data.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
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
  dialogTitle.value = "新增审批流程";
  dialogVisible.value = true;
  Object.assign(formData, {
    id: undefined,
    name: "",
    description: "",
    steps: [],
    status: 1
  });
};

// Edit Workflow
const handleEdit = (row: WorkflowVO) => {
  dialogTitle.value = "编辑审批流程";
  dialogVisible.value = true;
  Object.assign(formData, row);
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

// Submit Form
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (formData.id) {
          await updateWorkflowApi(formData.id, formData);
          ElMessage.success("修改成功");
        } else {
          await createWorkflowApi(formData);
          ElMessage.success("新增成功");
        }
        dialogVisible.value = false;
        handleQuery();
      } catch (e) {
        console.error(e);
      }
    }
  });
};

// Mock Step Editor (Simplified for now)
const addStep = () => {
  formData.steps.push({
    name: `步骤 ${formData.steps.length + 1}`,
    approverType: "user"
  });
};

const removeStep = (index: number) => {
  formData.steps.splice(index, 1);
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

    <el-card shadow="never" class="table-wrapper">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-bold">审批流程列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd"
            >新增流程</el-button
          >
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="流程名称" min-width="150" />
        <el-table-column
          prop="description"
          label="描述"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="创建时间"
          width="180"
          align="center"
        />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)"
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
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryForm.pageNum"
          v-model:page-size="queryForm.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>
    </el-card>

    <!-- Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      append-to-body
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="流程名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入流程名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider content-position="left">流程步骤配置</el-divider>
        <div
          v-for="(step, index) in formData.steps"
          :key="index"
          class="mb-2 flex items-center gap-2"
        >
          <el-tag type="info" class="mr-2">Step {{ index + 1 }}</el-tag>
          <el-input
            v-model="step.name"
            placeholder="步骤名称"
            style="width: 150px"
          />
          <el-select
            v-model="step.approverType"
            placeholder="审批人类型"
            style="width: 120px"
          >
            <el-option label="用户" value="user" />
            <el-option label="角色" value="role" />
          </el-select>
          <el-button
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click="removeStep(index)"
          />
        </div>
        <el-button
          type="default"
          plain
          class="w-full mt-2 border-dashed"
          @click="addStep"
        >
          + 添加步骤
        </el-button>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
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
