<script setup lang="ts">
import { ref } from "vue";
import { createDeliveryReceiptApi } from "@/api";
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
import type { UploadRequestOptions, UploadUserFile } from "element-plus";

defineOptions({
  name: "DeliveryReceiptCard"
});

const props = defineProps<{
  logisticUid: string;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

const formRef = ref();
const loading = ref(false);

const formData = ref({
  receiverName: "",
  signedAt: "",
  images: [] as string[],
  remark: ""
});

const formRules = {
  receiverName: [{ required: true, message: "请输入签收人", trigger: "blur" }],
  signedAt: [{ required: true, message: "请选择签收时间", trigger: "change" }]
};

type UploadResponse = {
  code: number;
  msg?: string;
  data?: { id?: string | number; hash: string; ext: string };
};

const fileList = ref<UploadUserFile[]>([]);

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

function handleUploadSuccess(response: UploadResponse) {
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

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    loading.value = true;
    try {
      const { code, msg } = await createDeliveryReceiptApi({
        logisticUid: props.logisticUid,
        receiverName: formData.value.receiverName,
        signedAt: formData.value.signedAt,
        remark: formData.value.remark || undefined
      });
      if (code === 200) {
        message("签收回执提交成功", { type: "success" });
        resetForm();
        emit("refresh");
      } else {
        message(msg || "提交失败", { type: "error" });
      }
    } catch {
      message("提交签收回执失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  });
}

function resetForm() {
  formData.value = {
    receiverName: "",
    signedAt: "",
    images: [],
    remark: ""
  };
  fileList.value = [];
  formRef.value?.clearValidate();
}
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>签收回执</span>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="签收人" prop="receiverName">
        <el-input
          v-model="formData.receiverName"
          placeholder="请输入签收人姓名"
          clearable
        />
      </el-form-item>

      <el-form-item label="签收时间" prop="signedAt">
        <el-date-picker
          v-model="formData.signedAt"
          type="datetime"
          placeholder="请选择签收时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="签收图片">
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

      <el-form-item label="备注">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
          :rows="2"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          提交签收
        </el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.card-header {
  font-weight: 600;
}
</style>
