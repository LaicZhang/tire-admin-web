<script setup lang="ts">
import { ref, watch } from "vue";

defineOptions({
  name: "TrackingNodeDialog"
});

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (
    e: "submit",
    data: { time: string; location: string; description: string }
  ): void;
}>();

const dialogVisible = ref(props.visible);
const formRef = ref();
const loading = ref(false);

const formData = ref({
  time: "",
  location: "",
  description: ""
});

const formRules = {
  time: [{ required: true, message: "请选择时间", trigger: "change" }],
  location: [{ required: true, message: "请输入地点", trigger: "blur" }],
  description: [{ required: true, message: "请输入描述", trigger: "blur" }]
};

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
  formData.value = {
    time: "",
    location: "",
    description: ""
  };
  formRef.value?.clearValidate();
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    loading.value = true;
    try {
      emit("submit", {
        time: formData.value.time,
        location: formData.value.location,
        description: formData.value.description
      });
    } finally {
      loading.value = false;
    }
  });
}

function handleClose() {
  dialogVisible.value = false;
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="手动添加跟踪节点"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="时间" prop="time">
        <el-date-picker
          v-model="formData.time"
          type="datetime"
          placeholder="请选择时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="地点" prop="location">
        <el-input
          v-model="formData.location"
          placeholder="请输入地点"
          clearable
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入物流节点描述"
          :rows="3"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>
