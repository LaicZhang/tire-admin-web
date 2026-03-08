<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { message } from "@/utils";
import { useExportData } from "@/composables/useImportExport";
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
  filters?: Record<string, unknown>;
  selectedIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  title: "数据导出",
  filters: () => ({}) as Record<string, unknown>,
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

const exportMode = ref<"sync" | "async">("sync");
const {
  loading,
  asyncTaskId,
  taskStatus,
  handleSyncExport: runSyncExport,
  handleAsyncExport: runAsyncExport,
  stopPolling,
  resetAsyncState
} = useExportData(() => props.type);

async function handleSyncExport() {
  try {
    await runSyncExport(exportDataApi, {
      ids: props.selectedIds.length > 0 ? props.selectedIds : undefined,
      filters: props.filters
    });

    emit("success");
    dialogVisible.value = false;
  } catch {
    message("导出失败", { type: "error" });
  }
}

async function handleAsyncExport() {
  try {
    await runAsyncExport(
      createAsyncExportTaskApi,
      getExportTaskStatusApi,
      downloadExportFileApi,
      {
        filters: props.filters,
        ids: props.selectedIds.length > 0 ? props.selectedIds : undefined
      },
      status => {
        if (status === "completed") {
          emit("success");
        }
      }
    );
  } catch {
    message("创建导出任务失败", { type: "error" });
  }
}

function handleExport() {
  if (exportMode.value === "sync") {
    handleSyncExport();
  } else {
    handleAsyncExport();
  }
}

function resetDialogState() {
  stopPolling();
  resetAsyncState();
}

function handleClose() {
  resetDialogState();
  dialogVisible.value = false;
}

watch(dialogVisible, visible => {
  if (!visible) {
    resetDialogState();
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
