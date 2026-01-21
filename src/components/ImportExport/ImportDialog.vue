<script setup lang="ts">
import { ref, computed } from "vue";
import { message } from "@/utils";
import {
  createUploadValidator,
  FileTypePresets
} from "@/composables/useFileValidation";
import { useTemplateDownload } from "@/composables/useImportExport";
import {
  downloadImportTemplateApi,
  importDataApi,
  getImportTemplateApi
} from "@/api";
import type { UploadFile } from "element-plus";
import ImportTemplateStep from "./ImportTemplateStep.vue";
import ImportUploadStep from "./ImportUploadStep.vue";
import ImportResultPanel from "./ImportResultPanel.vue";
import type { ImportResult, TemplateField } from "./types";

interface Props {
  visible: boolean;
  type: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "批量导入"
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const loading = ref(false);
const uploadProgress = ref(0);
const templateFields = ref<TemplateField[]>([]);
const fileList = ref<UploadFile[]>([]);
const importResult = ref<ImportResult | null>(null);

// 使用 composable 中的工具函数
const { downloadTemplate: downloadTemplateUtil } = useTemplateDownload();
const beforeUpload = createUploadValidator(FileTypePresets.excel);

async function loadTemplate() {
  try {
    const { data, code } = await getImportTemplateApi(props.type);
    if (code === 200 && data?.fields) {
      templateFields.value = data.fields;
    }
  } catch {
    // 模板加载失败不影响使用
  }
}

async function downloadTemplate() {
  await downloadTemplateUtil(downloadImportTemplateApi, props.type);
}

function handleFileChange(file: UploadFile) {
  fileList.value = [file];
}

async function handleImport() {
  if (fileList.value.length === 0) {
    message("请选择要导入的文件", { type: "warning" });
    return;
  }

  const file = fileList.value[0].raw;
  if (!file) return;

  loading.value = true;
  uploadProgress.value = 0;
  importResult.value = null;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const { data, code, msg } = await importDataApi(
      props.type,
      formData,
      progress => {
        uploadProgress.value = progress;
      }
    );

    if (code === 200) {
      const errors = Array.isArray(data?.errors)
        ? (data.errors as Array<string | { row: number; message: string }>).map(
            e => (typeof e === "string" ? e : `第${e.row}行：${e.message}`)
          )
        : [];

      const result = {
        success: data?.success || 0,
        failed: data?.failed || 0,
        errors
      };

      importResult.value = result;

      if (result.failed === 0) {
        message(`成功导入 ${result.success} 条数据`, {
          type: "success"
        });
        emit("success");
      } else {
        message(
          `导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
          { type: "warning" }
        );
      }
    } else {
      message(msg || "导入失败", { type: "error" });
    }
  } catch {
    message("导入失败，请检查文件格式", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  fileList.value = [];
  importResult.value = null;
  uploadProgress.value = 0;
  dialogVisible.value = false;
}

// Template info loaded via @open="loadTemplate" on dialog
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="600px"
    :close-on-click-modal="false"
    @open="loadTemplate"
  >
    <div class="import-dialog">
      <ImportTemplateStep
        :loading="loading"
        :template-fields="templateFields"
        @download="downloadTemplate"
      />

      <ImportUploadStep
        :file-list="fileList"
        :before-upload="beforeUpload"
        @change="handleFileChange"
      />

      <!-- 上传进度 -->
      <div v-if="loading && uploadProgress > 0" class="mb-4">
        <el-progress :percentage="uploadProgress" :stroke-width="10" />
      </div>

      <!-- 导入结果 -->
      <ImportResultPanel :result="importResult" />
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="fileList.length === 0"
        @click="handleImport"
      >
        开始导入
      </el-button>
    </template>
  </el-dialog>
</template>
