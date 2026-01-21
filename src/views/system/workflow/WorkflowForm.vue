<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import type { FormInstance } from "element-plus";
import { ElMessage } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import {
  createWorkflowApi,
  updateWorkflowApi,
  type WorkflowForm,
  type WorkflowVO
} from "@/api/system/workflow";

interface Props {
  formInline: {
    isEdit: boolean;
    data?: WorkflowVO;
  };
}

const props = defineProps<Props>();

const formRef = ref<FormInstance>();
const loading = ref(false);

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

// 初始化表单数据
watch(
  () => props.formInline,
  formInline => {
    if (formInline.isEdit && formInline.data) {
      Object.assign(formData, formInline.data);
    } else {
      Object.assign(formData, {
        id: undefined,
        name: "",
        description: "",
        steps: [],
        status: 1
      });
    }
  },
  { immediate: true }
);

const addStep = () => {
  formData.steps.push({
    name: `步骤 ${formData.steps.length + 1}`,
    approverType: "user",
    _uid: crypto.randomUUID()
  });
};

const removeStep = (index: number) => {
  formData.steps.splice(index, 1);
};

const getRef = () => formRef.value;

const getFormData = () => formData;

const handleSubmit = async () => {
  if (!formRef.value) return false;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return false;

  loading.value = true;
  try {
    if (formData.id) {
      await updateWorkflowApi(formData.id, formData);
      ElMessage.success("修改成功");
    } else {
      await createWorkflowApi(formData);
      ElMessage.success("新增成功");
    }
    return true;
  } catch (e) {
    ElMessage.error("操作失败");
    return false;
  } finally {
    loading.value = false;
  }
};

defineExpose({ getRef, getFormData, handleSubmit });
</script>

<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
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
      :key="step._uid || index"
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
</template>
