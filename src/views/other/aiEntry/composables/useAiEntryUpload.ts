import { ref } from "vue";
import { message } from "@/utils/message";
import {
  validateFile,
  type FileTypeConfig
} from "@/composables/useFileValidation";
import type { UploadFile } from "element-plus";
import type { UploadedFile, UploadMethod, ImageType } from "../types";

export function useAiEntryUpload() {
  const textInput = ref("");
  const textMaxLength = 5000;
  const uploadedImages = ref<UploadedFile[]>([]);
  const maxImages = 5;
  const uploadedFile = ref<UploadedFile | null>(null);
  const imageType = ref<ImageType>(ImageType.PRINTED);

  const handleTextInput = () => {
    if (textInput.value.length > textMaxLength) {
      textInput.value = textInput.value.slice(0, textMaxLength);
      message(`文本已截断至 ${textMaxLength} 字符`, { type: "warning" });
    }
  };

  const handleImageChange = (file: UploadFile) => {
    if (!file.raw) return;

    const imageConfig: FileTypeConfig = {
      mimeTypes: ["image/png", "image/jpeg", "image/jpg"],
      extensions: /\.(png|jpg|jpeg)$/i,
      maxSize: 10 * 1024 * 1024,
      errorMessages: {
        invalidType: "仅支持 png、jpg、jpeg 格式图片",
        tooLarge: "单张图片大小不能超过 10MB"
      }
    };

    const result = validateFile(file.raw, imageConfig, true);
    if (!result.valid) {
      return;
    }

    if (uploadedImages.value.length >= maxImages) {
      message(`最多上传 ${maxImages} 张图片`, { type: "warning" });
      return;
    }

    uploadedImages.value.push({
      uid: file.uid,
      name: file.name,
      size: file.raw.size,
      type: file.raw.type,
      url: URL.createObjectURL(file.raw),
      status: "success",
      raw: file.raw
    });
  };

  const removeImage = (index: number) => {
    const img = uploadedImages.value[index];
    if (img.url) {
      URL.revokeObjectURL(img.url);
    }
    uploadedImages.value.splice(index, 1);
  };

  const handleFileChange = (file: UploadFile) => {
    if (!file.raw) return;

    const documentConfig: FileTypeConfig = {
      mimeTypes: [
        "text/plain",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel"
      ],
      extensions: /\.(txt|pdf|xlsx|xls)$/i,
      maxSize: 10 * 1024 * 1024,
      errorMessages: {
        invalidType: "仅支持 TXT、PDF、Excel 格式文件",
        tooLarge: "文件大小不能超过 10MB"
      }
    };

    const result = validateFile(file.raw, documentConfig, true);
    if (!result.valid) {
      return;
    }

    uploadedFile.value = {
      uid: file.uid,
      name: file.name,
      size: file.raw.size,
      type: file.raw.type,
      status: "success",
      raw: file.raw
    };
  };

  const removeFile = () => {
    uploadedFile.value = null;
  };

  const canRecognize = (uploadMethod: UploadMethod) => {
    switch (uploadMethod) {
      case UploadMethod.TEXT:
        return textInput.value.trim().length > 0;
      case UploadMethod.IMAGE:
        return uploadedImages.value.length > 0;
      case UploadMethod.FILE:
        return uploadedFile.value !== null;
      default:
        return false;
    }
  };

  const reset = () => {
    textInput.value = "";
    uploadedImages.value.forEach(img => {
      if (img.url) URL.revokeObjectURL(img.url);
    });
    uploadedImages.value = [];
    uploadedFile.value = null;
  };

  return {
    textInput,
    textMaxLength,
    uploadedImages,
    maxImages,
    uploadedFile,
    imageType,
    handleTextInput,
    handleImageChange,
    removeImage,
    handleFileChange,
    removeFile,
    canRecognize,
    reset
  };
}
