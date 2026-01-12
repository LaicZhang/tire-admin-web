<script setup lang="ts">
import { ref, computed, h } from "vue";
import { message } from "@/utils";
import { downloadBlob } from "@/utils/download";
import {
  createUploadValidator,
  FileTypePresets
} from "@/composables/useFileValidation";
import {
  useTemplateDownload,
  useImportFile
} from "@/composables/useImportExport";
import {
  downloadImportTemplateApi,
  importDataApi,
  getImportTemplateApi
} from "@/api";
import { ElUpload, ElTag } from "element-plus";
import type { UploadFile, UploadRawFile } from "element-plus";

interface Props {
  visible: boolean;
  type: string;
  title?: string;
}

interface TemplateField {
  name: string;
  label: string;
  required: boolean;
  type?: string;
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
const importResult = ref<{
  success: number;
  failed: number;
  errors: string[];
} | null>(null);

// 使用 composable 中的工具函数
const { downloadTemplate: downloadTemplateUtil } = useTemplateDownload();
const beforeUpload = createUploadValidator(FileTypePresets.excel);

const templateColumns: TableColumnList = [
  {
    label: "字段名",
    prop: "label",
    width: 120
  },
  {
    label: "列名",
    prop: "name",
    width: 120
  },
  {
    label: "必填",
    prop: "required",
    width: 80,
    cellRenderer: ({ row }) => {
      return row.required
        ? h(ElTag, { type: "danger", size: "small" }, () => "是")
        : h(ElTag, { type: "info", size: "small" }, () => "否");
    }
  },
  {
    label: "类型",
    prop: "type"
  }
];

const errorColumns: TableColumnList = [
  {
    label: "行号",
    prop: "row",
    width: 80
  },
  {
    label: "错误信息",
    prop: "message"
  }
];

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
      <!-- 步骤1: 下载模板 -->
      <div class="step mb-6">
        <h4 class="text-sm font-medium mb-2">第一步：下载导入模板</h4>
        <el-button :loading="loading" @click="downloadTemplate">
          下载模板
        </el-button>
        <p class="text-xs text-gray-400 mt-2">
          请按模板格式填写数据，支持 .xlsx 和 .xls 格式
        </p>
      </div>

      <!-- 模板字段说明 -->
      <div v-if="templateFields.length > 0" class="mb-6">
        <el-collapse>
          <el-collapse-item title="查看字段说明">
            <pure-table
              :data="templateFields"
              :columns="templateColumns"
              size="small"
              border
            />
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 步骤2: 上传文件 -->
      <div class="step mb-6">
        <h4 class="text-sm font-medium mb-2">第二步：上传填写好的文件</h4>
        <el-upload
          ref="uploadRef"
          class="upload-area"
          drag
          :auto-upload="false"
          :limit="1"
          :file-list="fileList"
          :before-upload="beforeUpload"
          :on-change="handleFileChange"
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

      <!-- 上传进度 -->
      <div v-if="loading && uploadProgress > 0" class="mb-4">
        <el-progress :percentage="uploadProgress" :stroke-width="10" />
      </div>

      <!-- 导入结果 -->
      <div v-if="importResult" class="result-panel mb-4">
        <el-alert
          :type="importResult.failed === 0 ? 'success' : 'warning'"
          :closable="false"
        >
          <template #title>
            导入完成：成功 {{ importResult.success }} 条，失败
            {{ importResult.failed }} 条
          </template>
        </el-alert>

        <div v-if="importResult.errors.length > 0" class="mt-4">
          <h5 class="text-sm font-medium mb-2 text-red-500">错误详情：</h5>
          <el-scrollbar max-height="150px">
            <ul class="text-xs text-red-500">
              <li v-for="(error, index) in importResult.errors" :key="index">
                {{ error }}
              </li>
            </ul>
          </el-scrollbar>
        </div>
      </div>
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

<style scoped>
.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
}
</style>
