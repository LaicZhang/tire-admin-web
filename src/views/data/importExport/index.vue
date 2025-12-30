<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Refresh from "~icons/ep/refresh";
import UploadIcon from "~icons/ri/upload-cloud-2-line";
import DownloadIcon from "~icons/ri/download-cloud-2-line";
import DeleteIcon from "~icons/ep/delete";
import { message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import type { ImportExportTask, ModuleOption } from "./types";
import {
  downloadImportTemplateApi,
  exportDataApi,
  importDataApi
} from "@/api/tools";
import type { UploadRequestOptions } from "element-plus";

defineOptions({
  name: "ImportExport"
});

const activeTab = ref("import");
const loading = ref(false);
const uploadRef = ref();
const selectedModule = ref("tire");
const exportModule = ref("tire");
const taskList = ref<ImportExportTask[]>([]);

const TASK_STORAGE_KEY = "data:import-export:tasks";

const readTasks = (): ImportExportTask[] => {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ImportExportTask[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeTasks = (tasks: ImportExportTask[]) => {
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
};

const pushTask = (task: ImportExportTask) => {
  const tasks = readTasks();
  tasks.unshift(task);
  writeTasks(tasks.slice(0, 200));
  taskList.value = tasks;
};

const nowText = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const toToolType = (module: string): string | null => {
  const map: Record<string, string> = {
    tire: "tire",
    customer: "customer",
    provider: "provider",
    initialStock: "stock-init"
  };
  return map[module] ?? null;
};

// 模块选项
const moduleOptions: ModuleOption[] = [
  { label: "商品", value: "tire", templateUrl: "/templates/tire.xlsx" },
  { label: "客户", value: "customer", templateUrl: "/templates/customer.xlsx" },
  {
    label: "供应商",
    value: "provider",
    templateUrl: "/templates/provider.xlsx"
  },
  { label: "仓库", value: "repo", templateUrl: "/templates/repo.xlsx" },
  { label: "员工", value: "employee", templateUrl: "/templates/employee.xlsx" },
  {
    label: "期初库存",
    value: "initialStock",
    templateUrl: "/templates/initial-stock.xlsx"
  },
  {
    label: "客户期初余额",
    value: "customerBalance",
    templateUrl: "/templates/customer-balance.xlsx"
  },
  {
    label: "供应商期初余额",
    value: "supplierBalance",
    templateUrl: "/templates/supplier-balance.xlsx"
  }
];

// 导出字段配置
const exportFields = ref([
  { name: "id", label: "ID", selected: true },
  { name: "name", label: "名称", selected: true },
  { name: "group", label: "分组", selected: true },
  { name: "brand", label: "品牌", selected: true },
  { name: "pattern", label: "花纹", selected: true },
  { name: "purchasePrice", label: "进价", selected: true },
  { name: "salePrice", label: "售价", selected: true },
  { name: "desc", label: "备注", selected: false }
]);

const columns = [
  { label: "ID", prop: "id", width: 80 },
  { label: "类型", prop: "type", slot: "type", width: 80 },
  { label: "模块", prop: "module", width: 100 },
  { label: "文件名", prop: "fileName" },
  { label: "状态", prop: "status", slot: "status", width: 100 },
  { label: "进度", prop: "progress", slot: "progress", width: 150 },
  { label: "创建时间", prop: "createdAt", width: 160 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 140
  }
];

const getTaskList = async () => {
  loading.value = true;
  try {
    taskList.value = readTasks();
  } finally {
    loading.value = false;
  }
};

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: "info",
    processing: "warning",
    success: "success",
    failed: "danger"
  };
  return map[status] || "info";
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: "等待中",
    processing: "处理中",
    success: "成功",
    failed: "失败"
  };
  return map[status] || status;
};

const getModuleLabel = (module: string) => {
  const item = moduleOptions.find(m => m.value === module);
  return item?.label || module;
};

// 下载模板
const handleDownloadTemplate = async () => {
  const toolType = toToolType(selectedModule.value);
  if (!toolType) {
    message("当前模块暂不支持模板下载", { type: "warning" });
    return;
  }
  try {
    const blob = await downloadImportTemplateApi(toolType);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${toolType}_import_template.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    message("模板下载成功", { type: "success" });
  } catch {
    message("模板下载失败", { type: "error" });
  }
};

// 文件上传前校验
const beforeUpload = (file: File) => {
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
};

const handleUpload = async (options: UploadRequestOptions) => {
  const toolType = toToolType(selectedModule.value);
  if (!toolType) {
    message("当前模块暂不支持导入", { type: "warning" });
    options.onError?.(new Error("unsupported"));
    return;
  }
  const file = options.file as File;
  try {
    const formData = new FormData();
    formData.append("file", file);
    const { data, code, msg } = await importDataApi(toolType, formData, p =>
      options.onProgress?.({ percent: p } as any)
    );
    if (code !== 200) {
      message(msg || "导入失败", { type: "error" });
      options.onError?.(new Error(msg || "导入失败"));
      return;
    }

    pushTask({
      id: Date.now(),
      uid: crypto.randomUUID(),
      type: "import",
      module: selectedModule.value,
      fileName: file.name,
      status: data?.failed ? "failed" : "success",
      totalRows: data?.total,
      successRows: data?.success,
      failedRows: data?.failed,
      createdAt: nowText(),
      completedAt: nowText()
    });

    message(
      data?.failed
        ? `导入完成：成功${data?.success ?? 0}条，失败${data?.failed ?? 0}条`
        : `导入成功：${data?.success ?? 0}条`,
      { type: data?.failed ? "warning" : "success" }
    );
    options.onSuccess?.(data, options as any);
    getTaskList();
  } catch (e: any) {
    message(e?.message || "导入失败", { type: "error" });
    options.onError?.(e);
  }
};

// 导出数据
const handleExport = () => {
  const toolType = toToolType(exportModule.value);
  if (!toolType) {
    message("当前模块暂不支持导出", { type: "warning" });
    return;
  }
  const selectedFieldNames = exportFields.value
    .filter(f => f.selected)
    .map(f => f.name);

  if (selectedFieldNames.length === 0) {
    message("请至少选择一个导出字段", { type: "warning" });
    return;
  }

  loading.value = true;
  exportDataApi(toolType, { filters: { fields: selectedFieldNames } })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${toolType}_export_${Date.now()}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      pushTask({
        id: Date.now(),
        uid: crypto.randomUUID(),
        type: "export",
        module: exportModule.value,
        fileName: `${toolType}_export_${Date.now()}.xlsx`,
        status: "success",
        createdAt: nowText(),
        completedAt: nowText()
      });
      message("导出成功", { type: "success" });
      getTaskList();
    })
    .catch(() => message("导出失败", { type: "error" }))
    .finally(() => {
      loading.value = false;
    });
};

// 下载导出文件
const handleDownload = (row: ImportExportTask) => {
  message("该任务无可下载文件", { type: "warning" });
};

// 删除任务
const handleDelete = async (row: ImportExportTask) => {
  const tasks = readTasks().filter(t => t.uid !== row.uid);
  writeTasks(tasks);
  taskList.value = tasks;
  message(`删除任务${row.id}成功`, { type: "success" });
};

// 全选/取消全选导出字段
const handleSelectAll = (val: boolean) => {
  exportFields.value.forEach(f => {
    f.selected = val;
  });
};

const allSelected = computed(() => exportFields.value.every(f => f.selected));
const someSelected = computed(
  () => exportFields.value.some(f => f.selected) && !allSelected.value
);

onMounted(() => {
  getTaskList();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <el-tabs v-model="activeTab">
        <!-- 导入 -->
        <el-tab-pane label="数据导入" name="import">
          <div class="p-4">
            <el-form label-width="100px">
              <el-form-item label="导入模块">
                <el-select
                  v-model="selectedModule"
                  placeholder="请选择模块"
                  class="w-[200px]"
                >
                  <el-option
                    v-for="item in moduleOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-button
                  class="ml-4"
                  :icon="useRenderIcon(DownloadIcon)"
                  @click="handleDownloadTemplate"
                >
                  下载模板
                </el-button>
              </el-form-item>

              <el-form-item label="上传文件">
                <el-upload
                  ref="uploadRef"
                  :before-upload="beforeUpload"
                  :http-request="handleUpload"
                  :show-file-list="false"
                  accept=".xlsx,.xls"
                  drag
                  class="w-full max-w-[500px]"
                >
                  <div class="el-upload__text p-8">
                    <IconifyIconOffline
                      :icon="UploadIcon"
                      class="text-4xl text-gray-400 mb-2"
                    />
                    <div>将文件拖到此处，或<em>点击上传</em></div>
                    <div class="text-gray-400 text-sm mt-2">
                      只能上传xlsx/xls文件，且不超过10MB
                    </div>
                  </div>
                </el-upload>
              </el-form-item>
            </el-form>

            <el-divider content-position="left">导入说明</el-divider>
            <el-alert type="info" :closable="false" show-icon>
              <template #title>
                <ol class="list-decimal list-inside text-sm">
                  <li>请先下载对应模块的导入模板</li>
                  <li>按照模板格式填写数据</li>
                  <li>上传填写好的Excel文件</li>
                  <li>系统会自动校验数据并导入</li>
                </ol>
              </template>
            </el-alert>
          </div>
        </el-tab-pane>

        <!-- 导出 -->
        <el-tab-pane label="数据导出" name="export">
          <div class="p-4">
            <el-form label-width="100px">
              <el-form-item label="导出模块">
                <el-select
                  v-model="exportModule"
                  placeholder="请选择模块"
                  class="w-[200px]"
                >
                  <el-option
                    v-for="item in moduleOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="导出字段">
                <div class="border rounded p-4 w-full max-w-[600px]">
                  <el-checkbox
                    :model-value="allSelected"
                    :indeterminate="someSelected"
                    @change="handleSelectAll"
                  >
                    全选
                  </el-checkbox>
                  <el-divider class="my-2" />
                  <el-checkbox-group
                    v-model="exportFields"
                    class="flex flex-wrap gap-4"
                  >
                    <el-checkbox
                      v-for="field in exportFields"
                      :key="field.name"
                      :label="field"
                      :checked="field.selected"
                      @change="(val: boolean) => (field.selected = val)"
                    >
                      {{ field.label }}
                    </el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  :icon="useRenderIcon(DownloadIcon)"
                  @click="handleExport"
                >
                  导出数据
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 任务历史 -->
        <el-tab-pane label="任务历史" name="history">
          <PureTableBar title="导入导出任务" @refresh="getTaskList">
            <template v-slot="{ size }">
              <pure-table
                row-key="uid"
                adaptive
                :size
                :columns
                border
                :data="taskList"
                :loading="loading"
                showOverflowTooltip
              >
                <template #type="{ row }">
                  <el-tag
                    :type="row.type === 'import' ? 'primary' : 'success'"
                    size="small"
                  >
                    {{ row.type === "import" ? "导入" : "导出" }}
                  </el-tag>
                </template>
                <template #status="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
                <template #progress="{ row }">
                  <template v-if="row.totalRows">
                    <el-progress
                      v-if="row.status === 'processing'"
                      :percentage="
                        Math.round(
                          ((row.successRows || 0) / row.totalRows) * 100
                        )
                      "
                      :stroke-width="10"
                    />
                    <span v-else class="text-sm">
                      {{ row.successRows || 0 }}/{{ row.totalRows }}
                      <span v-if="row.failedRows" class="text-red-500">
                        (失败{{ row.failedRows }})
                      </span>
                    </span>
                  </template>
                  <span v-else>-</span>
                </template>
                <template #operation="{ row }">
                  <el-button
                    v-if="row.downloadUrl"
                    link
                    type="primary"
                    @click="handleDownload(row)"
                  >
                    下载
                  </el-button>
                  <el-popconfirm
                    :title="`确认删除任务${row.id}?`"
                    @confirm="handleDelete(row)"
                  >
                    <template #reference>
                      <el-button link type="danger">删除</el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
