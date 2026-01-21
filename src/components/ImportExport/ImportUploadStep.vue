<script setup lang="ts">
import type { UploadFile, UploadRawFile } from "element-plus";

interface Props {
  fileList: UploadFile[];
  beforeUpload: (rawFile: UploadRawFile) => boolean | Promise<boolean>;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "change", file: UploadFile): void;
}>();

const handleChange = (file: UploadFile) => {
  emit("change", file);
};
</script>

<template>
  <div class="step mb-6">
    <h4 class="text-sm font-medium mb-2">第二步：上传填写好的文件</h4>
    <el-upload
      class="upload-area"
      drag
      :auto-upload="false"
      :limit="1"
      :file-list="fileList"
      :before-upload="beforeUpload"
      :on-change="handleChange"
      accept=".xlsx,.xls"
    >
      <template #default>
        <div class="el-upload__text">
          <p>将文件拖到此处，或<em>点击上传</em></p>
          <p class="text-xs text-gray-400 mt-1">
            仅支持 .xlsx 和 .xls 格式，最大 10MB
          </p>
        </div>
      </template>
    </el-upload>
  </div>
</template>

<style scoped>
.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
}
</style>
