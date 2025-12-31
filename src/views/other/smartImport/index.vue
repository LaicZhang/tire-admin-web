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
import type { UploadFile, UploadRawFile } from "element-plus";
import type { TableColumnList } from "@pureadmin/table";
import { ElTag, ElProgress, ElSelect, ElButton } from "element-plus";
import {
  importDataApi,
  parseImportColumnsApi,
  parseImportSheetsApi,
  previewImportApi
} from "@/api";
import {
  type UploadedFile,
  type SheetInfo,
  type SourceColumn,
  type TargetField,
  type FieldMapping,
  type ImportDataRow,
  type ImportProgress,
  type ImportResult,
  type ImportConfig,
  ImportStep,
  importStepNames,
  defaultImportConfig
} from "./types";

defineOptions({
  name: "SmartImport"
});

// 导入类型配置
const importTypeOptions = [
  { value: "customer", label: "客户导入" },
  { value: "provider", label: "供应商导入" },
  { value: "tire", label: "商品导入" },
  { value: "user", label: "员工导入" },
  { value: "order", label: "订单导入" }
];

// 各类型对应的目标字段
const targetFieldsMap: Record<string, TargetField[]> = {
  customer: [
    { key: "name", label: "客户名称", required: true, type: "string" },
    { key: "code", label: "客户编码", required: false, type: "string" },
    { key: "contact", label: "联系人", required: false, type: "string" },
    { key: "phone", label: "联系电话", required: false, type: "string" },
    { key: "address", label: "地址", required: false, type: "string" },
    { key: "remark", label: "备注", required: false, type: "string" }
  ],
  provider: [
    { key: "name", label: "供应商名称", required: true, type: "string" },
    { key: "code", label: "供应商编码", required: false, type: "string" },
    { key: "contact", label: "联系人", required: false, type: "string" },
    { key: "phone", label: "联系电话", required: false, type: "string" },
    { key: "address", label: "地址", required: false, type: "string" },
    { key: "remark", label: "备注", required: false, type: "string" }
  ],
  tire: [
    { key: "name", label: "商品名称", required: true, type: "string" },
    { key: "code", label: "商品编码", required: false, type: "string" },
    { key: "spec", label: "规格型号", required: false, type: "string" },
    { key: "unit", label: "单位", required: false, type: "string" },
    { key: "price", label: "售价", required: false, type: "number" },
    { key: "cost", label: "成本价", required: false, type: "number" },
    { key: "category", label: "分类", required: false, type: "string" },
    { key: "remark", label: "备注", required: false, type: "string" }
  ],
  user: [
    { key: "name", label: "姓名", required: true, type: "string" },
    { key: "phone", label: "手机号", required: true, type: "string" },
    { key: "department", label: "部门", required: false, type: "string" },
    { key: "position", label: "职位", required: false, type: "string" },
    { key: "email", label: "邮箱", required: false, type: "string" },
    { key: "remark", label: "备注", required: false, type: "string" }
  ],
  order: [
    { key: "orderNo", label: "订单号", required: false, type: "string" },
    { key: "customerName", label: "客户名称", required: true, type: "string" },
    { key: "productName", label: "商品名称", required: true, type: "string" },
    { key: "quantity", label: "数量", required: true, type: "number" },
    { key: "price", label: "单价", required: false, type: "number" },
    { key: "orderDate", label: "订单日期", required: false, type: "date" },
    { key: "remark", label: "备注", required: false, type: "string" }
  ]
};

// 状态
const currentStep = ref<ImportStep>(ImportStep.UPLOAD);
const config = ref<ImportConfig>({ ...defaultImportConfig });
const uploadedFile = ref<UploadedFile | null>(null);
const sheets = ref<SheetInfo[]>([]);
const selectedSheet = ref<number>(0);
const sourceColumns = ref<SourceColumn[]>([]);
const fieldMappings = ref<FieldMapping[]>([]);
const previewData = ref<ImportDataRow[]>([]);
const progress = ref<ImportProgress>({
  current: 0,
  total: 0,
  status: "idle"
});
const importResult = ref<ImportResult | null>(null);
const loading = ref(false);

// 计算属性
const targetFields = computed(() => {
  return targetFieldsMap[config.value.type] || [];
});

const requiredFieldsMapped = computed(() => {
  const required = targetFields.value.filter(f => f.required);
  return required.every(rf =>
    fieldMappings.value.some(fm => fm.targetField?.key === rf.key)
  );
});

const mappedFieldsCount = computed(() => {
  return fieldMappings.value.filter(fm => fm.targetField !== null).length;
});

const canProceedToPreview = computed(() => {
  return requiredFieldsMapped.value && mappedFieldsCount.value > 0;
});

const validRowsCount = computed(() => {
  return previewData.value.filter(r => r.status === "valid").length;
});

const errorRowsCount = computed(() => {
  return previewData.value.filter(r => r.status === "error").length;
});

// 监听导入类型变化
watch(
  () => config.value.type,
  () => {
    // 重新进行智能匹配
    if (sourceColumns.value.length > 0) {
      performSmartMapping();
    }
  }
);

// 文件上传处理
function handleFileChange(file: UploadFile) {
  if (!file.raw) return;

  const validTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv"
  ];

  if (
    !validTypes.includes(file.raw.type) &&
    !file.name.match(/\.(xlsx|xls|csv)$/i)
  ) {
    message("请上传 Excel 或 CSV 文件", { type: "warning" });
    return;
  }

  if (file.raw.size > 10 * 1024 * 1024) {
    message("文件大小不能超过 10MB", { type: "warning" });
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

  // 解析 Sheet
  parseFileSheets();
}

function handleFileRemove() {
  uploadedFile.value = null;
  sheets.value = [];
  sourceColumns.value = [];
  fieldMappings.value = [];
  previewData.value = [];
  currentStep.value = ImportStep.UPLOAD;
}

function parseFileSheets() {
  const raw = uploadedFile.value?.raw;
  if (!raw) return;

  loading.value = true;
  progress.value = {
    current: 0,
    total: 100,
    status: "parsing",
    message: "正在解析文件..."
  };

  const fd = new FormData();
  fd.append("file", raw);

  parseImportSheetsApi(fd)
    .then(res => {
      if (res.code !== 200) {
        message(res.msg || "解析文件失败", { type: "error" });
        return;
      }
      sheets.value = res.data?.sheets || [];
      if (sheets.value.length === 0) {
        message("未解析到有效的 Sheet", { type: "warning" });
        return;
      }

      if (sheets.value.length === 1) {
        selectedSheet.value = 0;
        currentStep.value = ImportStep.SELECT_SHEET;
        handleSheetSelect();
      } else {
        currentStep.value = ImportStep.SELECT_SHEET;
      }
    })
    .catch(() => {
      message("解析文件失败", { type: "error" });
    })
    .finally(() => {
      progress.value.status = "idle";
      loading.value = false;
    });
}

function handleSheetSelect() {
  const raw = uploadedFile.value?.raw;
  if (!raw) return;

  loading.value = true;
  progress.value = {
    current: 0,
    total: 100,
    status: "parsing",
    message: "正在读取列信息..."
  };

  const fd = new FormData();
  fd.append("file", raw);
  fd.append("sheetIndex", String(selectedSheet.value));
  fd.append("headerRow", String(config.value.headerRow));
  fd.append("startDataRow", String(config.value.startDataRow));
  fd.append("sampleSize", "3");

  parseImportColumnsApi(fd)
    .then(res => {
      if (res.code !== 200) {
        message(res.msg || "读取列信息失败", { type: "error" });
        return;
      }
      sourceColumns.value = res.data?.columns || [];
      if (sourceColumns.value.length === 0) {
        message("未读取到列信息", { type: "warning" });
        return;
      }

      performSmartMapping();
      currentStep.value = ImportStep.FIELD_MAPPING;
    })
    .catch(() => {
      message("读取列信息失败", { type: "error" });
    })
    .finally(() => {
      progress.value.status = "idle";
      loading.value = false;
    });
}

function performSmartMapping() {
  progress.value = {
    current: 0,
    total: 100,
    status: "mapping",
    message: "正在智能匹配字段..."
  };

  // 智能匹配算法(模拟)
  const mappingRules: Record<string, string[]> = {
    name: ["名称", "姓名", "客户名", "供应商名", "商品名"],
    code: ["编码", "编号", "代码"],
    contact: ["联系人", "联络人"],
    phone: ["电话", "手机", "联系方式"],
    address: ["地址", "详细地址"],
    remark: ["备注", "说明", "描述"],
    spec: ["规格", "型号", "规格型号"],
    unit: ["单位", "计量单位"],
    price: ["价格", "单价", "售价"],
    cost: ["成本", "成本价", "进价"],
    category: ["分类", "类别", "类型"],
    email: ["邮箱", "电子邮件", "email"],
    department: ["部门", "所属部门"],
    position: ["职位", "岗位"],
    quantity: ["数量", "数目"],
    orderNo: ["订单号", "单号"],
    orderDate: ["日期", "订单日期", "下单日期"],
    customerName: ["客户", "客户名称"],
    productName: ["商品", "商品名称", "产品名称"]
  };

  fieldMappings.value = sourceColumns.value.map(col => {
    let matchedField: TargetField | null = null;
    let confidence = 0;

    for (const field of targetFields.value) {
      const rules = mappingRules[field.key] || [];
      for (const rule of rules) {
        if (col.name.includes(rule)) {
          matchedField = field;
          confidence = 85 + Math.random() * 15;
          break;
        }
      }
      if (matchedField) break;

      // 精确匹配
      if (
        col.name === field.label ||
        col.name.toLowerCase() === field.key.toLowerCase()
      ) {
        matchedField = field;
        confidence = 100;
        break;
      }
    }

    return {
      sourceColumn: col,
      targetField: matchedField,
      confidence: Math.round(confidence),
      isManual: false
    };
  });

  progress.value.status = "idle";
}

function handleMappingChange(index: number, targetKey: string | null) {
  if (targetKey === null) {
    fieldMappings.value[index].targetField = null;
    fieldMappings.value[index].confidence = 0;
  } else {
    const field = targetFields.value.find(f => f.key === targetKey);
    if (field) {
      fieldMappings.value[index].targetField = field;
      fieldMappings.value[index].confidence = 100;
      fieldMappings.value[index].isManual = true;
    }
  }
}

function removeMapping(index: number) {
  fieldMappings.value[index].targetField = null;
  fieldMappings.value[index].confidence = 0;
  fieldMappings.value[index].isManual = false;
}

function goToPreview() {
  if (!canProceedToPreview.value) {
    message("请确保所有必填字段都已映射", { type: "warning" });
    return;
  }

  const raw = uploadedFile.value?.raw;
  if (!raw) return;

  loading.value = true;
  progress.value = {
    current: 0,
    total: 100,
    status: "validating",
    message: "正在验证数据..."
  };

  const mappings = fieldMappings.value
    .filter(fm => fm.targetField)
    .map(fm => ({
      sourceIndex: fm.sourceColumn.index,
      targetKey: fm.targetField!.key
    }));

  const fd = new FormData();
  fd.append("file", raw);
  fd.append("sheetIndex", String(selectedSheet.value));
  fd.append("headerRow", String(config.value.headerRow));
  fd.append("startDataRow", String(config.value.startDataRow));
  fd.append("mappings", JSON.stringify(mappings));
  fd.append("targetFields", JSON.stringify(targetFields.value));
  fd.append("maxRows", "200");

  previewImportApi(fd)
    .then(res => {
      if (res.code !== 200) {
        message(res.msg || "生成预览失败", { type: "error" });
        return;
      }
      previewData.value = res.data?.rows || [];
      if (previewData.value.length === 0) {
        message("未生成预览数据（可能没有有效数据行）", { type: "warning" });
        return;
      }
      currentStep.value = ImportStep.PREVIEW;
    })
    .catch(() => {
      message("生成预览失败", { type: "error" });
    })
    .finally(() => {
      progress.value.status = "idle";
      loading.value = false;
    });
}

function startImport() {
  const raw = uploadedFile.value?.raw;
  if (!raw) return;

  loading.value = true;
  progress.value = {
    current: 0,
    total: 100,
    status: "importing",
    message: "正在导入数据..."
  };
  currentStep.value = ImportStep.IMPORTING;

  const fd = new FormData();
  fd.append("file", raw);

  importDataApi(config.value.type, fd, p => {
    progress.value.current = p;
  })
    .then(res => {
      if (res.code !== 200) {
        message(res.msg || "导入失败", { type: "error" });
        progress.value.status = "error";
        return;
      }
      const result = res.data;
      importResult.value = {
        success: (result?.failed || 0) === 0,
        total: result?.total || 0,
        successCount: result?.success || 0,
        failedCount: result?.failed || 0,
        errors: result?.errors
      };
      progress.value.status = "completed";
      currentStep.value = ImportStep.RESULT;
    })
    .catch(() => {
      progress.value.status = "error";
      message("导入失败", { type: "error" });
    })
    .finally(() => {
      loading.value = false;
    });
}

function resetImport() {
  currentStep.value = ImportStep.UPLOAD;
  config.value = { ...defaultImportConfig };
  uploadedFile.value = null;
  sheets.value = [];
  selectedSheet.value = 0;
  sourceColumns.value = [];
  fieldMappings.value = [];
  previewData.value = [];
  progress.value = { current: 0, total: 0, status: "idle" };
  importResult.value = null;
}

function goBack() {
  if (currentStep.value > ImportStep.UPLOAD) {
    currentStep.value--;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getAvailableTargetFields(currentIndex: number) {
  const usedKeys = fieldMappings.value
    .filter((_, i) => i !== currentIndex)
    .map(fm => fm.targetField?.key)
    .filter(Boolean);
  return targetFields.value.filter(f => !usedKeys.includes(f.key));
}

function getRowStatusType(status: string) {
  switch (status) {
    case "valid":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "danger";
    default:
      return "info";
  }
}

const mappingColumns: TableColumnList = [
  {
    label: "源文件列",
    width: 200,
    cellRenderer: ({ row }) => {
      return h("div", {}, [
        h("p", { class: "font-medium" }, row.sourceColumn.name),
        h(
          "p",
          { class: "text-xs text-gray-400 truncate" },
          `示例: ${row.sourceColumn.sampleValues.slice(0, 2).join(", ")}`
        )
      ]);
    }
  },
  {
    label: "匹配置信度",
    width: 120,
    align: "center",
    cellRenderer: ({ row }) => {
      if (!row.targetField) return h("span", { class: "text-gray-400" }, "-");
      const color =
        row.confidence >= 80
          ? "#67C23A"
          : row.confidence >= 50
            ? "#E6A23C"
            : "#F56C6C";
      return h(ElProgress, {
        percentage: row.confidence,
        color,
        strokeWidth: 6
      });
    }
  },
  {
    label: "系统字段",
    minWidth: 200,
    slot: "targetField"
  },
  {
    label: "字段类型",
    width: 100,
    align: "center",
    cellRenderer: ({ row }) => {
      if (!row.targetField) return h("span", { class: "text-gray-400" }, "-");
      return h(
        ElTag,
        { size: "small", type: "info" },
        () => row.targetField.type
      );
    }
  },
  {
    label: "操作",
    width: 80,
    align: "center",
    slot: "action"
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

const previewColumns = computed<TableColumnList>(() => {
  const mappedFields = targetFields.value.filter(f =>
    fieldMappings.value.some(fm => fm.targetField?.key === f.key)
  );
  const cols: TableColumnList = [
    {
      label: "行号",
      width: 80,
      align: "center",
      cellRenderer: ({ row }) => row.rowIndex
    },
    ...mappedFields.map(field => ({
      label: field.label,
      prop: `data.${field.key}`,
      minWidth: 120,
      cellRenderer: ({ row }: any) => row.data[field.key] || "-"
    })),
    {
      label: "状态",
      width: 100,
      align: "center",
      fixed: "right",
      cellRenderer: ({ row }) => {
        const statusType = getRowStatusType(row.status);
        const statusText =
          row.status === "valid"
            ? "有效"
            : row.status === "warning"
              ? "警告"
              : "错误";
        return h(ElTag, { type: statusType, size: "small" }, () => statusText);
      }
    },
    {
      label: "错误信息",
      width: 200,
      fixed: "right",
      cellRenderer: ({ row }) => {
        if (row.errors.length === 0)
          return h("span", { class: "text-gray-400" }, "-");
        return h(
          "div",
          { class: "text-red-500 text-xs" },
          row.errors.map((err: any, i: number) =>
            h("p", { key: i }, err.message)
          )
        );
      }
    }
  ];
  return cols;
});
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
        :on-change="handleFileChange"
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
