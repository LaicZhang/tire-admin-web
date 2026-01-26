<script setup lang="ts">
import { ref, reactive } from "vue";
import {
  createDefectCategoryApi,
  updateDefectCategoryApi,
  type DefectCategory
} from "@/api/business/quality";
import { message, handleApiError } from "@/utils";

const props = defineProps<{
  initialData: {
    id: number;
    name: string;
    description: string;
    solution: string;
  };
  mode: "add" | "edit";
  onSuccess: () => void;
  onClose: () => void;
}>();

const loading = ref(false);
const formRef = ref();
const dialogForm = reactive({ ...props.initialData });

const rules = {
  name: [{ required: true, message: "请输入分类名称", trigger: "blur" }]
};

async function handleSubmit() {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      try {
        if (props.mode === "add") {
          await createDefectCategoryApi(dialogForm);
        } else {
          await updateDefectCategoryApi(dialogForm.id, dialogForm);
        }
        message("操作成功", { type: "success" });
        props.onSuccess();
      } catch (e) {
        handleApiError(e, "操作失败");
      } finally {
        loading.value = false;
      }
    }
  });
}
</script>

<template>
  <div>
    <el-form
      ref="formRef"
      :model="dialogForm"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="dialogForm.name" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="dialogForm.description" type="textarea" />
      </el-form-item>
      <el-form-item label="解决方案" prop="solution">
        <el-input v-model="dialogForm.solution" type="textarea" />
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mt-4">
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </div>
  </div>
</template>
