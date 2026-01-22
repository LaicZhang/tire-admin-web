<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";

export interface FormDialogProps<T> {
  visible: boolean;
  title: string;
  width?: string;
  formData: T;
  rules?: FormRules;
  loading?: boolean;
}

export interface FormDialogEmits<T> {
  (e: "update:visible", value: boolean): void;
  (e: "submit", data: T): void;
  (e: "close"): void;
}

const props = withDefaults(
  defineProps<
    FormDialogProps<T> & {
      beforeSubmit?: (data: T) => Promise<void> | void;
    }
  >(),
  {
    width: "600px",
    loading: false
  }
);

const emit = defineEmits<FormDialogEmits<T>>();

const dialogVisible = ref(props.visible);
const formRef = ref<FormInstance>();

watch(
  () => props.visible,
  val => {
    dialogVisible.value = val;
    if (val) {
      resetForm();
    }
  }
);

watch(dialogVisible, val => {
  emit("update:visible", val);
});

function resetForm() {
  formRef.value?.clearValidate();
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (!valid) return;

    try {
      await props.beforeSubmit?.(props.formData);
      emit("submit", props.formData);
    } catch {
      // 错误已在 beforeSubmit 中处理
    }
  });
}

function handleClose() {
  dialogVisible.value = false;
  emit("close");
}

defineExpose({
  setLoading: (loading: boolean) => {
    // 由父组件控制 loading
  },
  close: handleClose
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    destroy-on-close
    role="dialog"
    aria-modal="true"
    :aria-label="title"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      role="form"
    >
      <slot :formData="formData" :formRef="formRef" />
    </el-form>

    <template #footer>
      <slot name="footer" :formData="formData">
        <el-button aria-label="取消" @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          aria-label="确认提交"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </slot>
    </template>
  </el-dialog>
</template>
