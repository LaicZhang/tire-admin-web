<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@/utils";
import {
  exportDataApi,
  createAsyncExportTaskApi,
  getExportTaskStatusApi,
  downloadExportFileApi
} from "@/api";

interface Props {
  visible: boolean;
  type: string;
  title?: string;
  filters?: object;
  selectedIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  title: "数据导出",
  filters: () => ({}),
  selectedIds: () => []
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
const exportMode = ref<"sync" | "async">("sync");
const asyncTaskId = ref<string | null>(null);
const taskStatus = ref<string | null>(null);
const checkInterval = ref<number | null>(null);

async function handleSyncExport() {
  loading.value = true;
  try {
    const blob = await exportDataApi(props.type, {
      ids: props.selectedIds.length > 0 ? props.selectedIds : undefined,
      filters: props.filters
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${props.type}_export_${Date.now()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    message("导出成功", { type: "success" });
    emit("success");
    dialogVisible.value = false;
  } catch {
    message("导出失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function handleAsyncExport() {
  loading.value = true;
  try {
    const { data, code, msg } = await createAsyncExportTaskApi(props.type, {
      filters: props.filters
    });

    if (code === 200 && data?.taskId) {
      asyncTaskId.value = data.taskId;
      taskStatus.value = "processing";
      message("导出任务已创建，正在处理中...", { type: "info" });
      startCheckTask();
    } else {
      message(msg || "创建导出任务失败", { type: "error" });
    }
  } catch {
    message("创建导出任务失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function startCheckTask() {
  if (checkInterval.value) {
    clearInterval(checkInterval.value);
  }

  checkInterval.value = window.setInterval(async () => {
    if (!asyncTaskId.value) return;

    try {
      const { data, code } = await getExportTaskStatusApi(asyncTaskId.value);

      if (code === 200) {
        taskStatus.value = data?.status;

        if (data?.status === "completed") {
          stopCheckTask();
          await downloadAsyncFile();
        } else if (data?.status === "failed") {
          stopCheckTask();
          message("导出任务失败", { type: "error" });
        }
      }
    } catch {
      stopCheckTask();
    }
  }, 3000);
}

function stopCheckTask() {
  if (checkInterval.value) {
    clearInterval(checkInterval.value);
    checkInterval.value = null;
  }
}

async function downloadAsyncFile() {
  if (!asyncTaskId.value) return;

  loading.value = true;
  try {
    const blob = await downloadExportFileApi(asyncTaskId.value);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${props.type}_export_${Date.now()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    message("导出成功", { type: "success" });
    emit("success");
    asyncTaskId.value = null;
    taskStatus.value = null;
  } catch {
    message("下载失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleExport() {
  if (exportMode.value === "sync") {
    handleSyncExport();
  } else {
    handleAsyncExport();
  }
}

function handleClose() {
  stopCheckTask();
  asyncTaskId.value = null;
  taskStatus.value = null;
  dialogVisible.value = false;
}

watch(dialogVisible, visible => {
  if (!visible) {
    stopCheckTask();
  }
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="450px"
    :close-on-click-modal="false"
  >
    <div class="export-dialog">
      <!-- 导出模式选择 -->
      <div class="mb-6">
        <h4 class="text-sm font-medium mb-3">选择导出方式</h4>
        <el-radio-group v-model="exportMode">
          <el-radio value="sync">
            <div>
              <span class="font-medium">同步导出</span>
              <p class="text-xs text-gray-400">适合小批量数据，即时下载</p>
            </div>
          </el-radio>
          <el-radio value="async">
            <div>
              <span class="font-medium">异步导出</span>
              <p class="text-xs text-gray-400">适合大批量数据，后台处理</p>
            </div>
          </el-radio>
        </el-radio-group>
      </div>

      <!-- 导出信息 -->
      <div class="mb-4">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="导出类型">
            {{ type }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedIds.length > 0" label="选中数量">
            {{ selectedIds.length }} 条
          </el-descriptions-item>
          <el-descriptions-item v-else label="导出范围">
            全部数据
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 异步任务状态 -->
      <div v-if="asyncTaskId && taskStatus" class="mb-4">
        <el-alert :closable="false">
          <template #title>
            <div class="flex items-center">
              <el-icon v-if="taskStatus === 'processing'" class="is-loading">
                <i-ep-loading />
              </el-icon>
              <span class="ml-2">
                {{
                  taskStatus === "processing"
                    ? "正在处理中，请稍候..."
                    : taskStatus === "completed"
                      ? "处理完成"
                      : "处理失败"
                }}
              </span>
            </div>
          </template>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!!asyncTaskId && taskStatus === 'processing'"
        @click="handleExport"
      >
        {{ asyncTaskId ? "重新导出" : "开始导出" }}
      </el-button>
    </template>
  </el-dialog>
</template>
