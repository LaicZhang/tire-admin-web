<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { createDeliveryExceptionApi } from "@/api";
import {
  formatToken,
  getFileMd5,
  getImageWH,
  getToken,
  message,
  StaticImageTypeEnum,
  BaseStaticUploadPath
} from "@/utils";
import { DeliveryExceptionType, deliveryExceptionTypeMap } from "./types";

defineOptions({
  name: "DeliveryExceptionDialog"
});

const props = defineProps<{
  visible: boolean;
  logisticUid: string;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = ref(props.visible);
const formRef = ref();
const loading = ref(false);
const Authorization = ref("");

const formData = ref({
  type: "" as DeliveryExceptionType,
  description: "",
  images: [] as string[],
  suggestion: ""
});

const formRules = {
  type: [{ required: true, message: "请选择异常类型", trigger: "change" }],
  description: [{ required: true, message: "请输入异常描述", trigger: "blur" }]
};

const exceptionTypeOptions = Object.entries(deliveryExceptionTypeMap).map(
  ([value, { label }]) => ({
    value,
    label
  })
);

const fileList = ref([]);
const uploadData = ref({});

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

function getAuthorization() {
  Authorization.value = formatToken(getToken().accessToken);
}

function resetForm() {
  formData.value = {
    type: "" as DeliveryExceptionType,
    description: "",
    images: [],
    suggestion: ""
  };
  fileList.value = [];
  formRef.value?.clearValidate();
}

async function handleBeforeUpload(file: File) {
  const { name, size, type, lastModified } = file;
  const hash = getFileMd5(lastModified, size);
  const [filename, ext] = name.split(".");
  const { width, height } = await getImageWH(file);
  uploadData.value = {
    hash,
    ext,
    filename,
    size,
    mimetype: type,
    width,
    height,
    lastModified,
    type: StaticImageTypeEnum.COVER
  };
  return true;
}

function handleUploadSuccess(response: any) {
  const { code, msg, data } = response;
  if (code !== 200) {
    message(msg, { type: "error" });
    return;
  }
  if (data?.id) {
    formData.value.images.push(data.hash + "." + data.ext);
  }
}

function handleRemove(file: any) {
  const index = fileList.value.findIndex((f: any) => f.uid === file.uid);
  if (index > -1) {
    formData.value.images.splice(index, 1);
  }
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    loading.value = true;
    try {
      const { code, msg } = await createDeliveryExceptionApi({
        logisticUid: props.logisticUid,
        type: formData.value.type,
        description: formData.value.description,
        images:
          formData.value.images.length > 0 ? formData.value.images : undefined
      });
      if (code === 200) {
        message("异常上报成功", { type: "success" });
        dialogVisible.value = false;
        emit("success");
      } else {
        message(msg || "上报失败", { type: "error" });
      }
    } catch {
      message("上报异常失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  });
}

function handleClose() {
  dialogVisible.value = false;
}

onMounted(() => {
  getAuthorization();
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="配送异常上报"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="异常类型" prop="type">
        <el-select
          v-model="formData.type"
          placeholder="请选择异常类型"
          style="width: 100%"
        >
          <el-option
            v-for="item in exceptionTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="异常描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请详细描述异常情况"
          :rows="4"
        />
      </el-form-item>

      <el-form-item label="异常图片">
        <el-upload
          v-model:file-list="fileList"
          :action="BaseStaticUploadPath"
          :headers="{ Authorization }"
          :data="uploadData"
          :before-upload="handleBeforeUpload"
          :on-success="handleUploadSuccess"
          :on-remove="handleRemove"
          list-type="picture-card"
          accept="image/*"
          :limit="5"
        >
          <el-icon><component :is="'ep-plus'" /></el-icon>
        </el-upload>
      </el-form-item>

      <el-form-item label="处理建议">
        <el-input
          v-model="formData.suggestion"
          type="textarea"
          placeholder="请输入处理建议(可选)"
          :rows="2"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        提交上报
      </el-button>
    </template>
  </el-dialog>
</template>
