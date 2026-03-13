<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { UploadRequestOptions, UploadUserFile } from "element-plus";
import { ElMessageBox } from "element-plus";
import { checkStaticImageApi, uploadStaticImageApi } from "@/api/static";
import {
  validateFile,
  type FileTypeConfig
} from "@/composables/useFileValidation";
import {
  BaseImagePath,
  StaticImageTypeEnum,
  getFileContentMd5,
  getImageWH,
  message
} from "@/utils";
import { toUploadProgressEvent } from "@/utils/uploadProgress";

const props = withDefaults(
  defineProps<{
    modelValue?: string[];
    limit?: number;
    disabled?: boolean;
  }>(),
  {
    modelValue: () => [],
    limit: 6,
    disabled: false
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
}>();

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

function toAttachmentValue(input: { hash: string; ext: string }) {
  return `${input.hash}.${input.ext}`;
}

function toAttachmentUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${BaseImagePath}${value}`;
}

function syncFileList(next: string[]) {
  fileList.value = next.map((value, index) => ({
    uid: index + 1,
    name: value,
    status: "success",
    url: toAttachmentUrl(value)
  }));
}

watch(
  () => props.modelValue,
  next => {
    syncFileList(Array.isArray(next) ? next : []);
  },
  { immediate: true }
);

const canUploadMore = computed(
  () => !props.disabled && (props.modelValue?.length ?? 0) < props.limit
);

function handleBeforeUpload(file: File) {
  const result = validateFile(file, imageConfig, true);
  return result.valid;
}

function emitNext(values: string[]) {
  emit("update:modelValue", values);
}

async function handlePreview(file: UploadUserFile) {
  if (!file.url) return;
  await ElMessageBox.alert(
    `<img src="${file.url}" style="max-width:100%;display:block;margin:0 auto;" alt="附件预览" />`,
    "附件预览",
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: "关闭"
    }
  );
}

function handleRemove(file: UploadUserFile) {
  const key = String(file.name || "");
  emitNext((props.modelValue ?? []).filter(item => item !== key));
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
    const { code, data } = await checkStaticImageApi(hash);
    if (code === 200 && data) {
      options.onSuccess?.({ code: 200, data });
      return;
    }

    const ext = file.name.includes(".")
      ? (file.name.split(".").pop()?.toLowerCase() ?? "jpg")
      : "jpg";
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
      options.onError?.(toUploadAjaxError(res.msg || "上传失败"));
      return;
    }

    options.onSuccess?.(res);
  } catch (error) {
    options.onError?.(toUploadAjaxError(error));
  }
};

function handleUploadSuccess(
  response: {
    code: number;
    msg?: string;
    data?: { hash: string; ext: string };
  },
  uploadFile: UploadUserFile
) {
  if (response.code !== 200 || !response.data) {
    message(response.msg || "上传失败", { type: "error" });
    return;
  }
  const value = toAttachmentValue(response.data);
  uploadFile.name = value;
  uploadFile.url = toAttachmentUrl(value);
  const current = props.modelValue ?? [];
  if (!current.includes(value)) {
    emitNext([...current, value]);
  }
}
</script>

<template>
  <el-upload
    v-model:file-list="fileList"
    :http-request="handleUploadRequest"
    :before-upload="handleBeforeUpload"
    :on-success="handleUploadSuccess"
    :on-remove="handleRemove"
    :on-preview="handlePreview"
    list-type="picture-card"
    accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
    :limit="limit"
    :disabled="disabled"
  >
    <el-icon v-if="canUploadMore"><component :is="'ep-plus'" /></el-icon>
  </el-upload>
</template>
