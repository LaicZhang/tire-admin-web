<script setup lang="ts">
import { ref, computed, watch, h } from "vue";
import {
  Upload,
  Document,
  Check,
  Close,
  Loading
} from "@element-plus/icons-vue";
import { message } from "@/utils/message";
import type { UploadFile } from "element-plus";
import { ElTag, ElProgress } from "element-plus";
import {
  ImportStep,
  importStepNames,
  defaultImportConfig,
  type ImportConfig
} from "./types";
import { importTypeOptions, targetFieldsMap } from "./constants";
import { createMappingColumns, errorColumns } from "./columns";
import { useSmartImportFile } from "./composables/useSmartImportFile";
import { useSmartImportMapping } from "./composables/useSmartImportMapping";
import { useSmartImportPreview } from "./composables/useSmartImportPreview";
import { useSmartImportExecute } from "./composables/useSmartImportExecute";

defineOptions({
  name: "SmartImport"
});

// 配置和步骤
const currentStep = ref<ImportStep>(ImportStep.UPLOAD);
const config = ref<ImportConfig>({ ...defaultImportConfig });

// 文件处理
const {
  uploadedFile,
  sheets,
  selectedSheet,
  sourceColumns,
  loading: fileLoading,
  handleFileChange,
  handleFileRemove,
  parseFileSheets,
  handleSheetSelect: handleSheetSelectInternal
} = useSmartImportFile();

// 目标字段
const targetFields = computed(() => {
  return targetFieldsMap[config.value.type] || [];
});

// 字段映射
const {
  fieldMappings,
  requiredFieldsMapped,
  mappedFieldsCount,
  canProceedToPreview,
  performSmartMapping,
  handleMappingChange,
  removeMapping,
  getAvailableTargetFields,
  reset: resetMapping
} = useSmartImportMapping(targetFields);

// 预览
const {
  previewData,
  loading: previewLoading,
  validRowsCount,
  errorRowsCount,
  generatePreviewColumns,
  getRowStatusType,
  loadPreview,
  reset: resetPreview
} = useSmartImportPreview();

// 执行导入
const {
  progress,
  importResult,
  loading: importLoading,
  startImport: startImportInternal,
  reset: resetExecute
} = useSmartImportExecute();

const loading = computed(
  () => fileLoading.value || previewLoading.value || importLoading.value
);

// 预览列
const previewColumns = computed(() => {
  return generatePreviewColumns(targetFields.value, fieldMappings.value);
});

// 映射列
const mappingColumns = computed(() => createMappingColumns());

// 监听导入类型变化
watch(
  () => config.value.type,
  () => {
    if (sourceColumns.value.length > 0) {
      performSmartMapping(sourceColumns.value);
    }
  }
);

// 文件上传处理
function handleFileChangeWrapper(file: UploadFile) {
  handleFileChange(file);
  parseFileSheets().then(() => {
    if (sheets.value.length === 1) {
      selectedSheet.value = 0;
      currentStep.value = ImportStep.SELECT_SHEET;
      handleSheetSelect();
    } else if (sheets.value.length > 1) {
      currentStep.value = ImportStep.SELECT_SHEET;
    }
  });
}

// 选择 Sheet
async function handleSheetSelect() {
  const success = await handleSheetSelectInternal(config.value);
  if (success && sourceColumns.value.length > 0) {
    performSmartMapping(sourceColumns.value);
    currentStep.value = ImportStep.FIELD_MAPPING;
  }
}

// 前往预览
async function goToPreview() {
  if (!canProceedToPreview.value) {
    message("请确保所有必填字段都已映射", { type: "warning" });
    return;
  }

  await loadPreview(
    uploadedFile.value,
    selectedSheet.value,
    config.value,
    fieldMappings.value,
    targetFields.value
  );

  if (previewData.value.length > 0) {
    currentStep.value = ImportStep.PREVIEW;
  }
}

// 开始导入
async function startImport() {
  if (!uploadedFile.value) return;

  currentStep.value = ImportStep.IMPORTING;
  await startImportInternal(config.value.type, uploadedFile.value, p => {
    progress.value.current = p;
  });

  if (importResult.value) {
    currentStep.value = ImportStep.RESULT;
  }
}

// 重置
function resetImport() {
  currentStep.value = ImportStep.UPLOAD;
  config.value = { ...defaultImportConfig };
  handleFileRemove();
  resetMapping();
  resetPreview();
  resetExecute();
}

// 返回上一步
function goBack() {
  if (currentStep.value > ImportStep.UPLOAD) {
    currentStep.value--;
  }
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
</script>

<template>
  <el-card>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-lg font-medium">智能匹配导入</span>
        <el-button
          v-if="
            currentStep > ImportStep.UPLOAD && currentStep < ImportStep.RESULT
          "
          @click="resetImport"
        >
          重新开始
        </el-button>
      </div>
    </template>

    <!-- 步骤条 -->
    <el-steps :active="currentStep" align-center class="mb-8">
      <el-step
        v-for="(name, step) in importStepNames"
        :key="step"
        :title="name"
      />
    </el-steps>

    <!-- 步骤1: 上传文件 -->
    <div v-if="currentStep === ImportStep.UPLOAD" class="p-4">
      <el-form label-width="100px" class="mb-6">
        <el-form-item label="导入类型" required>
          <el-select
            v-model="config.type"
            placeholder="请选择导入类型"
            class="w-64"
          >
            <el-option
              v-for="item in importTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <el-upload
        drag
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChangeWrapper"
        accept=".xlsx,.xls,.csv"
        class="w-full"
        :disabled="!config.type"
      >
        <div class="flex flex-col items-center justify-center py-8">
          <el-icon class="text-6xl text-gray-300 mb-4"><Upload /></el-icon>
          <p class="text-gray-600 mb-2">将文件拖到此处，或点击上传</p>
          <p class="text-gray-400 text-sm">
            支持 .xlsx, .xls, .csv 格式，最大 10MB
          </p>
        </div>
      </el-upload>

      <div
        v-if="uploadedFile"
        class="mt-4 p-4 bg-gray-50 rounded flex items-center justify-between"
      >
        <div class="flex items-center">
          <el-icon class="text-2xl text-green-500 mr-3"><Document /></el-icon>
          <div>
            <p class="font-medium">{{ uploadedFile.name }}</p>
            <p class="text-gray-400 text-sm">
              {{ formatFileSize(uploadedFile.size) }}
            </p>
          </div>
        </div>
        <el-button type="danger" text @click="handleFileRemove">删除</el-button>
      </div>

      <el-alert
        type="info"
        :closable="false"
        class="mt-6"
        description="智能匹配导入支持用户自制模板，系统会自动识别字段对应关系。如有必要，您可以手动调整映射关系。"
      />
    </div>

    <!-- 步骤2: 选择Sheet -->
    <div v-if="currentStep === ImportStep.SELECT_SHEET" class="p-4">
      <el-alert
        type="info"
        :closable="false"
        class="mb-4"
        description="请选择要导入的 Sheet 页"
      />

      <el-radio-group v-model="selectedSheet" class="w-full">
        <div class="space-y-3">
          <el-card
            v-for="sheet in sheets"
            :key="sheet.index"
            shadow="hover"
            class="cursor-pointer"
            :class="{
              'border-blue-500 border-2': selectedSheet === sheet.index
            }"
            @click="selectedSheet = sheet.index"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <el-radio :label="sheet.index" :value="sheet.index">
                  <span class="font-medium">{{ sheet.name }}</span>
                </el-radio>
              </div>
              <span class="text-gray-400">{{ sheet.rowCount }} 行数据</span>
            </div>
          </el-card>
        </div>
      </el-radio-group>

      <div class="mt-6 flex justify-between">
        <el-button @click="goBack">上一步</el-button>
        <el-button type="primary" :loading="loading" @click="handleSheetSelect">
          下一步
        </el-button>
      </div>
    </div>

    <!-- 步骤3: 字段映射 -->
    <div v-if="currentStep === ImportStep.FIELD_MAPPING" class="p-4">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <span class="text-gray-600"
            >已映射 {{ mappedFieldsCount }} /
            {{ sourceColumns.length }} 个字段</span
          >
          <el-tag v-if="!requiredFieldsMapped" type="warning" class="ml-2"
            >存在未映射的必填字段</el-tag
          >
          <el-tag v-else type="success" class="ml-2">必填字段已完成映射</el-tag>
        </div>
      </div>

      <div class="overflow-x-auto">
        <pure-table
          :data="fieldMappings"
          :columns="mappingColumns"
          border
          stripe
        >
          <template #targetField="{ row, index }">
            <el-select
              :model-value="row.targetField?.key || null"
              placeholder="请选择映射字段"
              clearable
              class="w-full"
              @update:model-value="handleMappingChange(index, $event)"
            >
              <el-option
                v-for="field in getAvailableTargetFields(index)"
                :key="field.key"
                :label="field.label + (field.required ? ' *' : '')"
                :value="field.key"
              />
            </el-select>
          </template>
          <template #action="{ row, index }">
            <el-button
              v-if="row.targetField"
              type="danger"
              text
              size="small"
              @click="removeMapping(index)"
            >
              移除
            </el-button>
          </template>
        </pure-table>
      </div>

      <div class="mt-6 flex justify-between">
        <el-button @click="goBack">上一步</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!canProceedToPreview"
          @click="goToPreview"
        >
          预览数据
        </el-button>
      </div>
    </div>

    <!-- 步骤4: 预览数据 -->
    <div v-if="currentStep === ImportStep.PREVIEW" class="p-4">
      <div class="mb-4 flex items-center gap-4">
        <el-tag type="success">有效数据: {{ validRowsCount }} 条</el-tag>
        <el-tag v-if="errorRowsCount > 0" type="danger"
          >错误数据: {{ errorRowsCount }} 条</el-tag
        >
      </div>

      <div class="overflow-x-auto">
        <pure-table
          :data="previewData"
          :columns="previewColumns"
          border
          stripe
          max-height="400"
        />
      </div>

      <el-alert
        v-if="errorRowsCount > 0"
        type="warning"
        :closable="false"
        class="mt-4"
        description="存在错误数据，导入时将跳过这些记录。您可以返回上一步修改映射关系，或继续导入有效数据。"
      />

      <div class="mt-6 flex justify-between">
        <el-button @click="goBack">返回修改</el-button>
        <el-button type="primary" :loading="loading" @click="startImport">
          开始导入 ({{ validRowsCount }} 条)
        </el-button>
      </div>
    </div>

    <!-- 步骤5: 导入中 -->
    <div v-if="currentStep === ImportStep.IMPORTING" class="p-8 text-center">
      <el-icon class="text-6xl text-blue-500 mb-4 is-loading"
        ><Loading
      /></el-icon>
      <h3 class="text-lg font-medium mb-2">正在导入数据...</h3>
      <p class="text-gray-500 mb-6">
        {{ progress.current }} / {{ progress.total }}
      </p>
      <el-progress
        :percentage="Math.round((progress.current / progress.total) * 100)"
        :stroke-width="10"
      />
    </div>

    <!-- 步骤6: 导入结果 -->
    <div
      v-if="currentStep === ImportStep.RESULT && importResult"
      class="p-8 text-center"
    >
      <el-icon
        class="text-6xl mb-4"
        :class="importResult.success ? 'text-green-500' : 'text-red-500'"
      >
        <Check v-if="importResult.success" />
        <Close v-else />
      </el-icon>
      <h3 class="text-lg font-medium mb-2">
        {{ importResult.success ? "导入完成" : "导入失败" }}
      </h3>

      <div class="flex justify-center gap-8 my-6">
        <div class="text-center">
          <p class="text-3xl font-bold text-blue-500">
            {{ importResult.total }}
          </p>
          <p class="text-gray-500">总记录数</p>
        </div>
        <div class="text-center">
          <p class="text-3xl font-bold text-green-500">
            {{ importResult.successCount }}
          </p>
          <p class="text-gray-500">成功导入</p>
        </div>
        <div v-if="importResult.failedCount > 0" class="text-center">
          <p class="text-3xl font-bold text-red-500">
            {{ importResult.failedCount }}
          </p>
          <p class="text-gray-500">导入失败</p>
        </div>
      </div>

      <div
        v-if="importResult.errors && importResult.errors.length > 0"
        class="mt-6"
      >
        <el-collapse>
          <el-collapse-item title="查看错误详情">
            <pure-table
              :data="importResult.errors"
              :columns="errorColumns"
              border
              size="small"
            />
          </el-collapse-item>
        </el-collapse>
      </div>

      <div class="mt-8">
        <el-button type="primary" @click="resetImport">继续导入</el-button>
      </div>
    </div>
  </el-card>
</template>
