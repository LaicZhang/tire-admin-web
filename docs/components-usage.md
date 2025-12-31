# 前端组件与工具使用文档

本文档介绍项目中抽离的通用组件、Composable 和工具函数的使用方法。

---

## 目录

- [文件下载工具](#文件下载工具)
- [文件校验工具](#文件校验工具)
- [导入导出工具](#导入导出工具)
- [类型定义](#类型定义)
- [最佳实践](#最佳实践)

---

## 文件下载工具

### 位置

`src/utils/download.ts`

### 功能

统一处理文件下载逻辑，支持 Blob、Promise、URL 等多种下载场景。

### API

#### `downloadBlob(blob, filename, options?)`

下载 Blob 对象为文件。

**参数：**

- `blob: Blob` - 要下载的 Blob 对象
- `filename: string` - 文件名（包含扩展名）
- `options?: { addTimestamp?: boolean; showMessage?: boolean }` - 可选配置
  - `addTimestamp` - 是否自动添加时间戳到文件名（默认 `false`）
  - `showMessage` - 是否在下载后显示成功消息（默认 `false`）

**示例：**

```typescript
import { downloadBlob } from "@/utils/download";

// 基础用法
const blob = await fetch("/api/export").then(r => r.blob());
downloadBlob(blob, "data.xlsx");

// 带时间戳和消息提示
downloadBlob(blob, "report.xlsx", {
  addTimestamp: true,
  showMessage: true
});
```

#### `downloadFromRequest(promise, filename, options?)`

从返回 Blob 的 Promise 下载文件。

**参数：**

- `promise: Promise<Blob>` - 返回 Blob 的 Promise
- `filename: string` - 文件名
- `options?: { addTimestamp?: boolean; showMessage?: boolean; onProgress?: (progress: number) => void }` - 可选配置

**示例：**

```typescript
import { downloadFromRequest } from "@/utils/download";
import { exportDataApi } from "@/api";

// 直接传入 API 调用
await downloadFromRequest(
  exportDataApi("tire", { filters: {} }),
  "tire_export.xlsx",
  { showMessage: true }
);
```

#### `downloadFromUrl(url, filename?, options?)`

从 URL 下载文件（支持跨域）。

**参数：**

- `url: string` - 文件 URL
- `filename?: string` - 可选的文件名（如果不提供，将尝试从 URL 提取）
- `options?: { addTimestamp?: boolean; showMessage?: boolean }` - 可选配置

**示例：**

```typescript
import { downloadFromUrl } from "@/utils/download";

// 同源 URL
await downloadFromUrl("/api/files/report.pdf", "report.pdf");

// 跨域 URL（会自动 fetch 后下载）
await downloadFromUrl("https://example.com/file.xlsx", "data.xlsx", {
  showMessage: true
});
```

#### `generateFilenameWithTimestamp(baseName, extension?)`

生成带时间戳的文件名。

**参数：**

- `baseName: string` - 基础文件名（不含扩展名）
- `extension: string` - 扩展名（默认 `.xlsx`）

**示例：**

```typescript
import { generateFilenameWithTimestamp } from "@/utils/download";

const filename = generateFilenameWithTimestamp("export", "xlsx");
// 输出: export_1704067200000.xlsx
```

### 完整示例

```vue
<script setup lang="ts">
import { ref } from "vue";
import {
  downloadBlob,
  downloadFromRequest,
  generateFilenameWithTimestamp
} from "@/utils/download";
import { exportDataApi, downloadTemplateApi } from "@/api";

const loading = ref(false);

// 方式1: 直接下载 Blob
async function handleExport1() {
  loading.value = true;
  try {
    const blob = await exportDataApi("tire");
    downloadBlob(blob, generateFilenameWithTimestamp("tire_export", "xlsx"), {
      showMessage: true
    });
  } finally {
    loading.value = false;
  }
}

// 方式2: 使用 downloadFromRequest（更简洁）
async function handleExport2() {
  loading.value = true;
  try {
    await downloadFromRequest(
      exportDataApi("tire"),
      generateFilenameWithTimestamp("tire_export", "xlsx"),
      { showMessage: true }
    );
  } finally {
    loading.value = false;
  }
}

// 方式3: 下载模板
async function handleDownloadTemplate() {
  await downloadFromRequest(downloadTemplateApi("tire"), "tire_template.xlsx", {
    showMessage: true
  });
}
</script>
```

---

## 文件校验工具

### 位置

`src/composables/useFileValidation.ts`

### 功能

统一处理文件类型、大小等校验逻辑，支持多种文件类型预设。

### API

#### `validateFile(file, config, showMessage?)`

校验文件类型和大小。

**参数：**

- `file: File | UploadRawFile` - 文件对象
- `config: FileTypeConfig` - 文件类型配置
- `showMessage?: boolean` - 是否显示错误消息（默认 `true`）

**返回值：**

```typescript
interface FileValidationResult {
  valid: boolean;
  error?: string;
}
```

**示例：**

```typescript
import { validateFile, FileTypePresets } from "@/composables/useFileValidation";

const result = validateFile(file, FileTypePresets.excel, true);
if (!result.valid) {
  console.error(result.error);
  return;
}
// 文件校验通过
```

#### `FileTypePresets`

预定义的文件类型配置：

- `FileTypePresets.excel` - Excel 文件（.xlsx, .xls），最大 10MB
- `FileTypePresets.excelOrCsv` - Excel 或 CSV 文件，最大 10MB
- `FileTypePresets.image` - 图片文件（PNG、JPG、JPEG、GIF、WEBP），最大 10MB
- `FileTypePresets.pdf` - PDF 文件，最大 10MB
- `FileTypePresets.json` - JSON 文件，最大 5MB

**示例：**

```typescript
import { validateFile, FileTypePresets } from "@/composables/useFileValidation";

// 校验 Excel 文件
const result = validateFile(file, FileTypePresets.excel);

// 校验图片文件
const result = validateFile(file, FileTypePresets.image);
```

#### `createUploadValidator(config)`

为 ElementPlus Upload 组件创建 `before-upload` 校验函数。

**参数：**

- `config: FileTypeConfig` - 文件类型配置

**返回值：**
`(file: UploadRawFile) => boolean`

**示例：**

```vue
<script setup lang="ts">
import {
  createUploadValidator,
  FileTypePresets
} from "@/composables/useFileValidation";

const beforeUpload = createUploadValidator(FileTypePresets.excel);
</script>

<template>
  <el-upload :before-upload="beforeUpload" :auto-upload="false">
    <!-- ... -->
  </el-upload>
</template>
```

#### `createUploadChangeHandler(config, onValid?)`

为 ElementPlus Upload 组件创建 `on-change` 处理函数。

**参数：**

- `config: FileTypeConfig` - 文件类型配置
- `onValid?: (file: UploadFile) => void` - 校验通过时的回调

**返回值：**
`(file: UploadFile) => void`

**示例：**

```vue
<script setup lang="ts">
import {
  createUploadChangeHandler,
  FileTypePresets
} from "@/composables/useFileValidation";

const handleFileChange = createUploadChangeHandler(
  FileTypePresets.excel,
  file => {
    console.log("文件校验通过:", file.name);
    // 处理文件...
  }
);
</script>

<template>
  <el-upload :on-change="handleFileChange" :auto-upload="false">
    <!-- ... -->
  </el-upload>
</template>
```

#### 快捷方法

- `validateExcelFile(file, showMessage?)` - 校验 Excel 文件
- `validateExcelOrCsvFile(file, showMessage?)` - 校验 Excel 或 CSV 文件
- `validateImageFile(file, maxSize?, showMessage?)` - 校验图片文件

**示例：**

```typescript
import {
  validateExcelFile,
  validateImageFile
} from "@/composables/useFileValidation";

// 校验 Excel
if (!validateExcelFile(file).valid) return;

// 校验图片（自定义大小限制）
if (!validateImageFile(file, 5 * 1024 * 1024).valid) return; // 5MB
```

#### 自定义配置

如果需要自定义文件类型配置：

```typescript
import {
  validateFile,
  type FileTypeConfig
} from "@/composables/useFileValidation";

const customConfig: FileTypeConfig = {
  mimeTypes: ["application/pdf", "application/msword"],
  extensions: /\.(pdf|doc|docx)$/i,
  maxSize: 20 * 1024 * 1024, // 20MB
  errorMessages: {
    invalidType: "仅支持 PDF、Word 格式文件",
    tooLarge: "文件大小不能超过 20MB"
  }
};

const result = validateFile(file, customConfig);
```

#### `formatFileSize(bytes, decimals?)`

格式化文件大小。

**参数：**

- `bytes: number` - 字节数
- `decimals?: number` - 小数位数（默认 2）

**示例：**

```typescript
import { formatFileSize } from "@/composables/useFileValidation";

formatFileSize(1024); // "1 KB"
formatFileSize(1048576); // "1 MB"
formatFileSize(1073741824); // "1 GB"
```

### 完整示例

```vue
<script setup lang="ts">
import { ref } from "vue";
import {
  createUploadValidator,
  FileTypePresets,
  validateFile
} from "@/composables/useFileValidation";
import type { UploadFile } from "element-plus";

const fileList = ref<UploadFile[]>([]);

// 方式1: 使用 before-upload（推荐）
const beforeUpload = createUploadValidator(FileTypePresets.excel);

// 方式2: 使用 on-change
function handleFileChange(file: UploadFile) {
  if (!file.raw) return;

  const result = validateFile(file.raw, FileTypePresets.excel, true);
  if (!result.valid) {
    return;
  }

  fileList.value = [file];
}
</script>

<template>
  <!-- 方式1 -->
  <el-upload :before-upload="beforeUpload" :auto-upload="false">
    <el-button>选择文件</el-button>
  </el-upload>

  <!-- 方式2 -->
  <el-upload :on-change="handleFileChange" :auto-upload="false">
    <el-button>选择文件</el-button>
  </el-upload>
</template>
```

---

## 导入导出工具

### 位置

`src/composables/useImportExport.ts`

### 功能

统一处理导入导出的通用逻辑，包括任务管理、文件处理、模板下载等。

### API

#### `useImportExportTask(storageKey?)`

导入导出任务管理。

**参数：**

- `storageKey?: string` - localStorage 存储键（默认 `"data:import-export:tasks"`）

**返回值：**

```typescript
{
  taskList: Ref<ImportExportTask[]>;
  readTasks: () => ImportExportTask[];
  writeTasks: (tasks: ImportExportTask[]) => void;
  pushTask: (task: ImportExportTask) => void;
  deleteTask: (uid: string) => void;
  loadTasks: () => void;
  nowText: () => string;
}
```

**示例：**

```vue
<script setup lang="ts">
import { useImportExportTask } from "@/composables/useImportExport";
import type { ImportExportTask } from "@/types/importExport";

const { taskList, pushTask, deleteTask, loadTasks, nowText } =
  useImportExportTask();

// 加载任务列表
loadTasks();

// 添加任务
const newTask: ImportExportTask = {
  id: Date.now(),
  uid: crypto.randomUUID(),
  type: "import",
  module: "tire",
  fileName: "tire_import.xlsx",
  status: "success",
  createdAt: nowText()
};
pushTask(newTask);

// 删除任务
deleteTask("task-uid");
</script>
```

#### `useImportFile(type)`

导入文件处理。

**参数：**

- `type: string` - 导入类型

**返回值：**

```typescript
{
  loading: Ref<boolean>;
  uploadProgress: Ref<number>;
  beforeUpload: (file: UploadRawFile) => boolean;
  handleImport: (
    file: File,
    importApi: (
      type: string,
      formData: FormData,
      onProgress?: (progress: number) => void
    ) => Promise<any>
  ) => Promise<ImportResult | null>;
}
```

**示例：**

```vue
<script setup lang="ts">
import { useImportFile } from "@/composables/useImportExport";
import { importDataApi } from "@/api";
import type { UploadFile } from "element-plus";

const { loading, uploadProgress, beforeUpload, handleImport } =
  useImportFile("tire");
const fileList = ref<UploadFile[]>([]);

async function handleSubmit() {
  if (fileList.value.length === 0) return;

  const file = fileList.value[0].raw;
  if (!file) return;

  const result = await handleImport(file, importDataApi);
  if (result?.success) {
    // 导入成功
    console.log(`成功导入 ${result.successCount} 条数据`);
  }
}
</script>

<template>
  <el-upload
    :before-upload="beforeUpload"
    :auto-upload="false"
    v-model:file-list="fileList"
  >
    <el-button>选择文件</el-button>
  </el-upload>

  <el-progress v-if="loading" :percentage="uploadProgress" />

  <el-button :loading="loading" @click="handleSubmit">开始导入</el-button>
</template>
```

#### `useExportData(type)`

导出数据处理。

**参数：**

- `type: string` - 导出类型

**返回值：**

```typescript
{
  loading: Ref<boolean>;
  handleSyncExport: (
    exportApi: (type: string, params: ExportParams) => Promise<Blob>,
    params?: ExportParams
  ) => Promise<void>;
  handleAsyncExport: (
    createTaskApi: (
      type: string,
      params: ExportParams
    ) => Promise<{ data?: { taskId: string } }>,
    getStatusApi: (taskId: string) => Promise<{ data?: { status: string } }>,
    downloadApi: (taskId: string) => Promise<Blob>,
    params?: ExportParams,
    onProgress?: (status: string) => void
  ) => Promise<void>;
}
```

**示例：**

```vue
<script setup lang="ts">
import { useExportData } from "@/composables/useImportExport";
import {
  exportDataApi,
  createAsyncExportTaskApi,
  getExportTaskStatusApi,
  downloadExportFileApi
} from "@/api";

const { loading, handleSyncExport, handleAsyncExport } = useExportData("tire");

// 同步导出
async function handleSync() {
  await handleSyncExport(exportDataApi, {
    filters: { status: "active" }
  });
}

// 异步导出
async function handleAsync() {
  await handleAsyncExport(
    createAsyncExportTaskApi,
    getExportTaskStatusApi,
    downloadExportFileApi,
    { filters: { status: "active" } },
    status => {
      console.log("导出状态:", status);
    }
  );
}
</script>

<template>
  <el-button :loading="loading" @click="handleSync">同步导出</el-button>
  <el-button :loading="loading" @click="handleAsync">异步导出</el-button>
</template>
```

#### `useTemplateDownload()`

模板下载。

**返回值：**

```typescript
{
  loading: Ref<boolean>;
  downloadTemplate: (
    downloadApi: (type: string) => Promise<Blob>,
    type: string,
    templateName?: string
  ) => Promise<void>;
}
```

**示例：**

```vue
<script setup lang="ts">
import { useTemplateDownload } from "@/composables/useImportExport";
import { downloadImportTemplateApi } from "@/api";

const { loading, downloadTemplate } = useTemplateDownload();

async function handleDownload() {
  await downloadTemplate(downloadImportTemplateApi, "tire");
}
</script>

<template>
  <el-button :loading="loading" @click="handleDownload">下载模板</el-button>
</template>
```

### 完整示例

```vue
<script setup lang="ts">
import { ref } from "vue";
import {
  useImportExportTask,
  useImportFile,
  useExportData,
  useTemplateDownload
} from "@/composables/useImportExport";
import { importDataApi, exportDataApi, downloadImportTemplateApi } from "@/api";
import type { UploadFile } from "element-plus";

const importType = ref("tire");
const fileList = ref<UploadFile[]>([]);

// 导入相关
const {
  loading: importLoading,
  uploadProgress,
  beforeUpload,
  handleImport
} = useImportFile(importType.value);

// 导出相关
const { loading: exportLoading, handleSyncExport } = useExportData(
  importType.value
);

// 模板下载
const { loading: templateLoading, downloadTemplate } = useTemplateDownload();

// 任务管理
const { taskList, pushTask, loadTasks } = useImportExportTask();

async function handleImportSubmit() {
  if (fileList.value.length === 0) return;
  const file = fileList.value[0].raw;
  if (!file) return;

  const result = await handleImport(file, importDataApi);
  if (result) {
    pushTask({
      id: Date.now(),
      uid: crypto.randomUUID(),
      type: "import",
      module: importType.value,
      fileName: file.name,
      status: result.success ? "success" : "failed",
      successRows: result.successCount,
      failedRows: result.failedCount,
      createdAt: new Date().toISOString()
    });
  }
}

async function handleExport() {
  await handleSyncExport(exportDataApi, {
    filters: {}
  });
}

async function handleDownloadTemplate() {
  await downloadTemplate(downloadImportTemplateApi, importType.value);
}

onMounted(() => {
  loadTasks();
});
</script>

<template>
  <div>
    <!-- 导入 -->
    <el-upload
      :before-upload="beforeUpload"
      :auto-upload="false"
      v-model:file-list="fileList"
    >
      <el-button>选择文件</el-button>
    </el-upload>
    <el-progress v-if="importLoading" :percentage="uploadProgress" />
    <el-button :loading="importLoading" @click="handleImportSubmit"
      >导入</el-button
    >

    <!-- 导出 -->
    <el-button :loading="exportLoading" @click="handleExport">导出</el-button>

    <!-- 下载模板 -->
    <el-button :loading="templateLoading" @click="handleDownloadTemplate"
      >下载模板</el-button
    >

    <!-- 任务列表 -->
    <el-table :data="taskList">
      <!-- ... -->
    </el-table>
  </div>
</template>
```

---

## 类型定义

### 位置

`src/types/importExport.ts`

### 主要类型

#### `ImportExportTask`

导入导出任务。

```typescript
interface ImportExportTask {
  id: number;
  uid: string;
  type: "import" | "export";
  module: string;
  fileName: string;
  fileSize?: number;
  status: "pending" | "processing" | "success" | "failed";
  totalRows?: number;
  successRows?: number;
  failedRows?: number;
  errorMessage?: string;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
}
```

#### `ImportResult`

导入结果。

```typescript
interface ImportResult {
  success: boolean;
  total?: number;
  successCount?: number;
  failedCount?: number;
  errors?: Array<string | { row: number; message: string }>;
}
```

#### `ExportParams`

导出参数。

```typescript
interface ExportParams {
  ids?: string[];
  filters?: Record<string, any>;
  fields?: string[];
}
```

#### `FileTypeConfig`

文件类型配置。

```typescript
interface FileTypeConfig {
  mimeTypes?: string[];
  extensions?: RegExp;
  maxSize?: number;
  errorMessages?: {
    invalidType?: string;
    tooLarge?: string;
  };
}
```

---

## 最佳实践

### 1. 下载文件

✅ **推荐：**

```typescript
import { downloadBlob, generateFilenameWithTimestamp } from "@/utils/download";

const blob = await exportDataApi("tire");
downloadBlob(blob, generateFilenameWithTimestamp("tire_export", "xlsx"), {
  showMessage: true
});
```

❌ **不推荐：**

```typescript
// 不要直接使用 URL.createObjectURL
const url = window.URL.createObjectURL(blob);
const link = document.createElement("a");
// ...
```

### 2. 文件校验

✅ **推荐：**

```typescript
import {
  createUploadValidator,
  FileTypePresets
} from "@/composables/useFileValidation";

const beforeUpload = createUploadValidator(FileTypePresets.excel);
```

❌ **不推荐：**

```typescript
// 不要重复写校验逻辑
function beforeUpload(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    // ...
  }
  // ...
}
```

### 3. 导入导出

✅ **推荐：**

```typescript
import { useImportFile, useExportData } from "@/composables/useImportExport";

const { handleImport } = useImportFile("tire");
const { handleSyncExport } = useExportData("tire");
```

❌ **不推荐：**

```typescript
// 不要在每个组件中重复实现导入导出逻辑
async function handleImport() {
  // 重复的代码...
}
```

### 4. 错误处理

✅ **推荐：**

```typescript
try {
  const result = await handleImport(file, importDataApi);
  if (result?.success) {
    // 处理成功
  }
} catch (error) {
  // 错误已在 composable 中处理并显示消息
}
```

### 5. 类型安全

✅ **推荐：**

```typescript
import type { ImportExportTask, ImportResult } from "@/types/importExport";

const task: ImportExportTask = {
  // ...
};
```

---

## 迁移指南

### 从旧代码迁移

#### 1. 替换下载逻辑

**旧代码：**

```typescript
const url = window.URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = `export_${Date.now()}.xlsx`;
link.click();
window.URL.revokeObjectURL(url);
message("导出成功", { type: "success" });
```

**新代码：**

```typescript
import { downloadBlob, generateFilenameWithTimestamp } from "@/utils/download";

downloadBlob(blob, generateFilenameWithTimestamp("export", "xlsx"), {
  showMessage: true
});
```

#### 2. 替换文件校验

**旧代码：**

```typescript
function beforeUpload(file: File) {
  const isExcel = /\.(xlsx|xls)$/.test(file.name);
  if (!isExcel) {
    message("只能上传Excel文件!", { type: "error" });
    return false;
  }
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message("文件大小不能超过10MB!", { type: "error" });
    return false;
  }
  return true;
}
```

**新代码：**

```typescript
import {
  createUploadValidator,
  FileTypePresets
} from "@/composables/useFileValidation";

const beforeUpload = createUploadValidator(FileTypePresets.excel);
```

#### 3. 替换导入逻辑

**旧代码：**

```typescript
async function handleImport() {
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    const { data, code } = await importDataApi(type, formData);
    // 处理结果...
  } finally {
    loading.value = false;
  }
}
```

**新代码：**

```typescript
import { useImportFile } from "@/composables/useImportExport";

const { loading, handleImport } = useImportFile(type);

async function handleSubmit() {
  const result = await handleImport(file, importDataApi);
  // 处理结果...
}
```

---

## 常见问题

### Q: 如何自定义文件类型校验？

A: 使用自定义 `FileTypeConfig`：

```typescript
import {
  validateFile,
  type FileTypeConfig
} from "@/composables/useFileValidation";

const customConfig: FileTypeConfig = {
  mimeTypes: ["application/pdf"],
  extensions: /\.pdf$/i,
  maxSize: 20 * 1024 * 1024,
  errorMessages: {
    invalidType: "仅支持 PDF 文件",
    tooLarge: "文件大小不能超过 20MB"
  }
};

const result = validateFile(file, customConfig);
```

### Q: 如何处理异步导出？

A: 使用 `useExportData` 的 `handleAsyncExport`：

```typescript
const { handleAsyncExport } = useExportData("tire");

await handleAsyncExport(
  createAsyncExportTaskApi,
  getExportTaskStatusApi,
  downloadExportFileApi,
  { filters: {} },
  status => {
    console.log("状态:", status);
  }
);
```

### Q: 如何管理导入导出任务历史？

A: 使用 `useImportExportTask`：

```typescript
const { taskList, pushTask, deleteTask, loadTasks } = useImportExportTask();

// 加载任务
loadTasks();

// 添加任务
pushTask(newTask);

// 删除任务
deleteTask(taskUid);
```

---

## 更新日志

- **2025-12-31**: 初始版本，抽离下载、校验、导入导出工具

---

**文档维护**: 如有问题或建议，请及时更新本文档。
