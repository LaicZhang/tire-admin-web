# 前端代码去重审计报告

## 概述

本报告对 `tire-admin-web/src/views` 目录进行了全量扫描，识别出多处重复实现模式，并提供了抽离建议和改造优先级。

**扫描时间**: 2025-12-31  
**扫描范围**: `src/views/**` 及 `src/components/ImportExport/**`

---

## 一、重复点分类与清单

### 1.1 Blob 下载逻辑重复

**重复模式**: `URL.createObjectURL(blob)` + `document.createElement('a')` + `link.click()` + `URL.revokeObjectURL(url)`

**命中文件** (8个):

1. `src/components/ImportExport/ImportDialog.vue` (L104-110)
2. `src/components/ImportExport/ExportDialog.vue` (L49-54, L130-135)
3. `src/views/tools/io/index.vue` (L66-73, L91-98)
4. `src/views/data/importExport/index.vue` (L170-177, L264-270)
5. `src/views/settings/dataAuth/index.vue` (L502-507, L537-542)
6. `src/views/system/backup/index.vue` (L115-122)
7. `src/views/settings/advancedPrint/index.vue` (L224-229)
8. `src/views/other/aiEntry/index.vue` (L167 - 用于图片预览，但模式类似)

**重复代码示例**:

```typescript
const url = window.URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = `${filename}.xlsx`;
link.click();
window.URL.revokeObjectURL(url);
```

**推荐抽离形态**: `src/utils/download.ts`

- `downloadBlob(blob: Blob, filename: string): void`
- `downloadFromRequest(promise: Promise<Blob>, filename: string): Promise<void>`
- `downloadFromUrl(url: string, filename?: string): void`

**改造优先级**: ⭐⭐⭐⭐⭐ (最高 - 覆盖面广，风险低)

---

### 1.2 文件上传校验重复

**重复模式**: Excel/CSV 扩展名校验 + 10MB 大小限制 + ElementPlus Upload 事件处理

**命中文件** (5个):

1. `src/components/ImportExport/ImportDialog.vue` (L122-140)
2. `src/views/data/importExport/index.vue` (L184-196)
3. `src/views/other/smartImport/index.vue` (L152-185)
4. `src/views/other/aiEntry/index.vue` (L143-214) - 支持图片和文档
5. `src/views/business/tire/form.vue` - 需要进一步确认

**重复代码模式**:

```typescript
// 扩展名校验
const isExcel =
  file.type ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
  file.type === "application/vnd.ms-excel" ||
  /\.(xlsx|xls|csv)$/i.test(file.name);

// 大小校验
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  message("文件大小不能超过 10MB", { type: "warning" });
  return false;
}
```

**推荐抽离形态**: `src/composables/useFileValidation.ts` 或 `src/utils/upload.ts`

- `validateFileType(file: File, allowedTypes: string[], allowedExtensions?: RegExp): boolean`
- `validateFileSize(file: File, maxSizeBytes: number): boolean`
- `validateExcelFile(file: File): boolean` (快捷方法)
- `validateImageFile(file: File, maxSize?: number): boolean`

**改造优先级**: ⭐⭐⭐⭐ (高 - 覆盖面广，风险低)

---

### 1.3 弹窗形态重复

**重复模式**: `<el-dialog>` 在 views 内广泛存在，且很多都带相似的 footer/关闭逻辑

**命中文件** (至少 29 个):

- `src/views/business/customer/levelDialog.vue`
- `src/views/business/customer/tagDialog.vue`
- `src/views/business/finance/income/index.vue`
- `src/views/business/batch/index.vue`
- `src/views/business/stockTaking/index.vue`
- `src/views/system/documentNumber/index.vue`
- `src/views/system/workflow/index.vue`
- `src/views/settings/closing/index.vue`
- `src/views/inventory/stocktaking/index.vue`
- `src/views/fund/payment/form.vue`
- `src/views/business/stock/serialNumber/index.vue`
- `src/views/settings/dataAuth/index.vue`
- `src/views/company/department/index.vue`
- `src/views/auth/profile.vue`
- `src/views/fund/writeOff/form.vue`
- ... 等更多

**重复模式**:

```vue
<el-dialog
  v-model="dialogVisible"
  :title="title"
  width="600px"
  :close-on-click-modal="false"
>
  <!-- content -->
  <template #footer>
    <el-button @click="handleClose">关闭</el-button>
    <el-button type="primary" :loading="loading" @click="handleSubmit">
      确定
    </el-button>
  </template>
</el-dialog>
```

**推荐抽离形态**:

- **优先使用现有组件**: `src/components/ReDialog` (已存在，支持命令式调用)
- **补充**: 如果 ReDialog 不满足需求，可扩展或创建 `ReFormDialog` 包装器

**改造优先级**: ⭐⭐⭐ (中 - 需要评估 ReDialog 覆盖度，风险中等)

---

### 1.4 导入/导出能力重复实现

**问题**: 存在两套导入/导出实现，共享逻辑未统一

**实现1 - 通用弹窗组件**:

- `src/components/ImportExport/ImportDialog.vue`
- `src/components/ImportExport/ExportDialog.vue`

**实现2 - 独立页面**:

- `src/views/data/importExport/index.vue`

**重复逻辑**:

1. 文件校验 (Excel/CSV, 10MB)
2. Blob 下载
3. 导入结果展示
4. 任务状态管理 (部分)

**推荐抽离形态**:

- **共享工具**: `src/composables/useImportExport.ts`
  - `useImportFile(type: string)` - 导入文件处理
  - `useExportData(type: string)` - 导出数据处理
  - `useImportExportTask()` - 任务状态管理
- **共享类型**: `src/types/importExport.ts`
- **统一校验**: 复用 `useFileValidation`

**改造优先级**: ⭐⭐⭐⭐ (高 - 需要统一，但涉及多个组件，需谨慎)

---

### 1.5 表格页常见组合重复

**重复模式**: 搜索表单 + 工具条 + 表格 + 分页/导出/导入

**现有组件**:

- `src/components/RePureTableBar` - 表格工具条 ✅
- `src/components/ReSearchForm` - 搜索表单 ✅

**建议**:

- 优先使用现有组件
- 如果发现页面未使用，建议迁移到现有组件
- 创建 `ReCrudPage` 组合组件（可选，风险较高）

**改造优先级**: ⭐⭐ (低 - 已有组件，主要是推广使用)

---

## 二、抽离映射表

| 页面/组件                          | 重复点             | 推荐抽离形态                                            | 优先级     |
| ---------------------------------- | ------------------ | ------------------------------------------------------- | ---------- |
| `ImportDialog.vue`                 | Blob下载、文件校验 | `utils/download.ts`, `composables/useFileValidation.ts` | ⭐⭐⭐⭐⭐ |
| `ExportDialog.vue`                 | Blob下载           | `utils/download.ts`                                     | ⭐⭐⭐⭐⭐ |
| `data/importExport/index.vue`      | Blob下载、文件校验 | `utils/download.ts`, `composables/useFileValidation.ts` | ⭐⭐⭐⭐⭐ |
| `tools/io/index.vue`               | Blob下载           | `utils/download.ts`                                     | ⭐⭐⭐⭐⭐ |
| `settings/dataAuth/index.vue`      | Blob下载           | `utils/download.ts`                                     | ⭐⭐⭐⭐⭐ |
| `system/backup/index.vue`          | Blob下载           | `utils/download.ts`                                     | ⭐⭐⭐⭐⭐ |
| `settings/advancedPrint/index.vue` | Blob下载           | `utils/download.ts`                                     | ⭐⭐⭐⭐⭐ |
| `other/smartImport/index.vue`      | 文件校验           | `composables/useFileValidation.ts`                      | ⭐⭐⭐⭐   |
| `other/aiEntry/index.vue`          | 文件校验           | `composables/useFileValidation.ts`                      | ⭐⭐⭐⭐   |
| 所有使用 `<el-dialog>` 的页面      | 弹窗模式           | `ReDialog` (已有)                                       | ⭐⭐⭐     |

---

## 三、改造顺序建议

### Phase 1: 基础工具抽离 (低风险，高收益) ✅

1. ✅ 创建 `src/utils/download.ts`
2. ✅ 创建 `src/composables/useFileValidation.ts`
3. ✅ 替换所有 Blob 下载实现
4. ✅ 替换所有文件校验实现

### Phase 2: 导入导出统一 (中风险，需回归测试)

1. 创建 `src/composables/useImportExport.ts`
2. 创建 `src/types/importExport.ts`
3. 统一 `ImportDialog` / `ExportDialog` / `data/importExport` 的共享逻辑
4. 回归测试导入导出功能

### Phase 3: 弹窗模式收敛 (中风险，需评估)

1. 评估 `ReDialog` 覆盖度
2. 扩展 `ReDialog` 或创建 `ReFormDialog` (如需要)
3. 逐步迁移页面到统一弹窗组件

---

## 四、风险说明

### 低风险 ✅

- **下载工具抽离**: 纯工具函数，不涉及业务逻辑，易于测试
- **文件校验抽离**: 逻辑简单，易于单元测试

### 中风险 ⚠️

- **导入导出统一**: 涉及多个组件，需要充分回归测试
- **弹窗模式收敛**: 需要评估现有 `ReDialog` 是否满足所有场景

### 注意事项

1. 所有改造都需要保持向后兼容
2. 建议分批次提交，每批改造后运行完整测试
3. 优先改造使用频率高的页面/组件

---

## 五、预期收益

- **代码减少**: 预计减少 500+ 行重复代码
- **维护成本**: 统一实现后，bug 修复和功能增强只需改一处
- **一致性**: 用户体验和错误提示更加统一
- **可测试性**: 工具函数易于单元测试，提高代码质量

---

## 六、后续建议

1. **代码审查**: 在 PR 审查时，如发现新的重复模式，及时补充到本清单
2. **ESLint 规则**: 考虑添加自定义规则，禁止直接使用 `URL.createObjectURL` 等模式
3. **文档更新**: 在开发文档中明确推荐使用统一工具函数

---

**文档维护**: 本报告应在每次大规模重构后更新，确保与实际代码状态同步。
