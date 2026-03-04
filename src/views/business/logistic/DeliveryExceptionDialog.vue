<script setup lang="ts">
import { ref, watch } from "vue";
import { createDeliveryExceptionApi } from "@/api";
import {
  getImageWH,
  message,
  StaticImageTypeEnum,
  getFileContentMd5
} from "@/utils";
import { toUploadProgressEvent } from "@/utils/uploadProgress";
import {
  validateFile,
  type FileTypeConfig
} from "@/composables/useFileValidation";
import { checkStaticImageApi, uploadStaticImageApi } from "@/api/static";
import { DeliveryExceptionType, deliveryExceptionTypeMap } from "./types";
import type { UploadRequestOptions, UploadUserFile } from "element-plus";

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

const fileList = ref<UploadUserFile[]>([]);

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
    type: "" as DeliveryExceptionType,
    description: "",
    images: [],
    suggestion: ""
  };
  fileList.value = [];
  formRef.value?.clearValidate();
}

const imageConfig: FileTypeConfig = {
  mimeTypes: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "image/bmp"
  ],
  extensions: /\.(png|jpg|jpeg|gif|webp|bmp)$/i,
  maxSize: 10 * 1024 * 1024,
  errorMessages: {
    invalidType: "仅支持 png、jpg、jpeg、gif、webp、bmp 格式图片",
    tooLarge: "单张图片大小不能超过 10MB"
  }
};

function parseExtFromFilename(filename: string) {
  const clean = String(filename || "");
  const idx = clean.lastIndexOf(".");
  return idx >= 0 ? clean.slice(idx + 1).toLowerCase() : "";
}

function handleBeforeUpload(file: File) {
  const result = validateFile(file, imageConfig, true);
  return result.valid;
}

function handleUploadSuccess(response: {
  code: number;
  msg?: string;
  data?: { id?: string | number; hash: string; ext: string };
}) {
  const { code, msg, data } = response;
  if (code !== 200) {
    message(msg || "上传失败", { type: "error" });
    return;
  }
  if (data?.id) {
    formData.value.images.push(data.hash + "." + data.ext);
  }
}

function handleRemove(file: UploadUserFile) {
  const index = fileList.value.findIndex(f => f.uid === file.uid);
  if (index > -1) {
    formData.value.images.splice(index, 1);
  }
}

const handleUploadRequest = async (options: UploadRequestOptions) => {
  const toUploadAjaxError = (err: unknown) => {
    const base = err instanceof Error ? err : new Error(String(err));
    const e = base as Error & {
      status: number;
      method: string;
      url: string;
      name: string;
    };
    e.name = "UploadAjaxError";
    e.status = 0;
    e.method = options.method;
    e.url = options.action;
    return e;
  };

  const file = options.file as File;
  try {
    const hash = await getFileContentMd5(file);

    try {
      const { code, data } = await checkStaticImageApi(hash);
      if (code === 200 && data) {
        options.onSuccess?.({ code: 200, data });
        return;
      }
    } catch {
      // ignore and fallback to normal upload
    }

    const ext = parseExtFromFilename(file.name);
    const { width, height } = await getImageWH(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", file.name);
    formData.append("ext", ext);
    formData.append("hash", hash);
    formData.append("mimetype", file.type);
    formData.append("size", String(file.size));
    formData.append("width", String(width));
    formData.append("height", String(height));
    formData.append("lastModified", String(file.lastModified));
    formData.append("type", String(StaticImageTypeEnum.COVER));

    const res = await uploadStaticImageApi(formData, progress => {
      options.onProgress?.(toUploadProgressEvent(progress));
    });

    if (res.code !== 200 || !res.data) {
      const msg = res.msg || "上传失败";
      message(msg, { type: "error" });
      options.onError?.(toUploadAjaxError(msg));
      return;
    }

    options.onSuccess?.(res);
  } catch (e) {
    options.onError?.(toUploadAjaxError(e));
  }
};

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
          :http-request="handleUploadRequest"
          :before-upload="handleBeforeUpload"
          :on-success="handleUploadSuccess"
          :on-remove="handleRemove"
          list-type="picture-card"
          accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
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
