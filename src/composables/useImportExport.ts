/**
 * 导入导出共享 Composable
 * 统一处理导入导出的通用逻辑，避免重复实现
 */

import {
  getCurrentScope,
  onScopeDispose,
  ref,
  toValue,
  type MaybeRefOrGetter
} from "vue";
import { message } from "@/utils/message";
import { downloadBlob, generateFilenameWithTimestamp } from "@/utils/download";
import {
  FileTypePresets,
  createUploadValidator
} from "@/composables/useFileValidation";
import type {
  ImportExportTask,
  ImportResult,
  ExportParams
} from "@/types/importExport";
import type { CommonResult } from "@/api/type";

/**
 * 导入导出任务管理
 */
export function useImportExportTask(
  storageKey: string = "data:import-export:tasks"
) {
  const taskList = ref<ImportExportTask[]>([]);
  const maxTasks = 200;
  const taskTtlMs = 30 * 24 * 60 * 60 * 1000;

  const pruneTasks = (tasks: ImportExportTask[]): ImportExportTask[] => {
    const now = Date.now();
    const pruned = tasks.filter(task => {
      if (!task.createdAt) return true;
      const createdAtMs = Date.parse(task.createdAt);
      if (Number.isNaN(createdAtMs)) return true;
      return now - createdAtMs <= taskTtlMs;
    });

    return pruned.slice(0, maxTasks);
  };

  /**
   * 读取任务列表
   */
  const readTasks = (): ImportExportTask[] => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ImportExportTask[];
      const tasks = Array.isArray(parsed) ? parsed : [];
      const pruned = pruneTasks(tasks);
      if (pruned.length !== tasks.length) writeTasks(pruned);
      return pruned;
    } catch {
      return [];
    }
  };

  /**
   * 保存任务列表
   */
  const writeTasks = (tasks: ImportExportTask[]) => {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  };

  /**
   * 添加任务
   */
  const pushTask = (task: ImportExportTask) => {
    const tasks = readTasks();
    tasks.unshift(task);
    const pruned = pruneTasks(tasks);
    writeTasks(pruned);
    taskList.value = pruned;
  };

  /**
   * 删除任务
   */
  const deleteTask = (uid: string) => {
    const tasks = pruneTasks(readTasks().filter(t => t.uid !== uid));
    writeTasks(tasks);
    taskList.value = tasks;
  };

  /**
   * 加载任务列表
   */
  const loadTasks = () => {
    taskList.value = readTasks();
  };

  /**
   * 生成时间戳字符串
   */
  const nowText = (): string => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  return {
    taskList,
    readTasks,
    writeTasks,
    pushTask,
    deleteTask,
    loadTasks,
    nowText
  };
}

/**
 * 导入文件处理
 */
export function useImportFile(type: string) {
  const loading = ref(false);
  const uploadProgress = ref(0);

  /**
   * 文件校验器（Excel）
   */
  const beforeUpload = createUploadValidator(FileTypePresets.excel);

  /**
   * 处理导入
   */
  const handleImport = async (
    file: File,
    importApi: (
      type: string,
      formData: FormData,
      onProgress?: (progress: number) => void
    ) => Promise<
      CommonResult<{
        errors?: Array<string | { row: number; message: string }>;
        success?: number;
        failed?: number;
        total?: number;
      }>
    >
  ): Promise<ImportResult | null> => {
    loading.value = true;
    uploadProgress.value = 0;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data, code, msg } = await importApi(type, formData, progress => {
        uploadProgress.value = progress;
      });

      if (code === 200) {
        const errors = Array.isArray(data?.errors)
          ? (
              data.errors as Array<string | { row: number; message: string }>
            ).map(e =>
              typeof e === "string" ? e : `第${e.row}行：${e.message}`
            )
          : [];

        const result: ImportResult = {
          success: (data?.failed || 0) === 0,
          total: data?.total,
          successCount: data?.success || 0,
          failedCount: data?.failed || 0,
          errors
        };

        if (result.failedCount === 0) {
          message(`成功导入 ${result.successCount} 条数据`, {
            type: "success"
          });
        } else {
          message(
            `导入完成：成功 ${result.successCount} 条，失败 ${result.failedCount} 条`,
            { type: "warning" }
          );
        }

        return result;
      } else {
        message(msg || "导入失败", { type: "error" });
        return null;
      }
    } catch {
      message("导入失败，请检查文件格式", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    uploadProgress,
    beforeUpload,
    handleImport
  };
}

/**
 * 导出数据处理
 */
export function useExportData(type: MaybeRefOrGetter<string>) {
  const loading = ref(false);
  const asyncTaskId = ref<string | null>(null);
  const taskStatus = ref<string | null>(null);
  let checkInterval: number | null = null;
  let pollCount = 0;
  const maxPollCount = 40;

  const stopPolling = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };

  const resetAsyncState = () => {
    asyncTaskId.value = null;
    taskStatus.value = null;
    pollCount = 0;
  };
  const resolveAsyncTaskStatus = (
    status?: string | null,
    onProgress?: (status: string) => void
  ) => {
    if (!status) return;
    taskStatus.value = status;
    onProgress?.(status);
  };

  const queryAsyncTaskStatus = async (
    getStatusApi: (taskId: string) => Promise<{ data?: { status: string } }>,
    taskId: string,
    onProgress?: (status: string) => void
  ) => {
    asyncTaskId.value = taskId;
    const { data } = await getStatusApi(taskId);
    resolveAsyncTaskStatus(data?.status, onProgress);
    return data?.status;
  };

  const downloadAsyncTaskFile = async (
    downloadApi: (taskId: string) => Promise<Blob>,
    taskId: string,
    fileNamePrefix?: string
  ) => {
    const filename = generateFilenameWithTimestamp(
      fileNamePrefix || `${toValue(type)}_export`,
      "xlsx"
    );
    const blob = await downloadApi(taskId);
    downloadBlob(blob, filename, {
      showMessage: true
    });
  };

  /**
   * 处理同步导出
   */
  const handleSyncExport = async (
    exportApi: (type: string, params: ExportParams) => Promise<Blob>,
    params?: ExportParams
  ): Promise<void> => {
    loading.value = true;
    try {
      const currentType = toValue(type);
      const blob = await exportApi(currentType, params || {});
      const filename = generateFilenameWithTimestamp(
        `${currentType}_export`,
        "xlsx"
      );
      downloadBlob(blob, filename, {
        showMessage: true
      });
    } catch {
      message("导出失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  /**
   * 处理异步导出（带轮询）
   */
  const handleAsyncExport = async (
    createTaskApi: (
      type: string,
      params: ExportParams
    ) => Promise<{ data?: { taskId: string } }>,
    getStatusApi: (taskId: string) => Promise<{ data?: { status: string } }>,
    downloadApi: (taskId: string) => Promise<Blob>,
    params?: ExportParams,
    onProgress?: (status: string) => void
  ): Promise<void> => {
    loading.value = true;
    stopPolling();
    resetAsyncState();

    try {
      const currentType = toValue(type);
      // 创建导出任务
      const { data } = await createTaskApi(currentType, params || {});
      if (!data?.taskId) {
        message("创建导出任务失败", { type: "error" });
        return;
      }

      asyncTaskId.value = data.taskId;
      taskStatus.value = "processing";
      message("导出任务已创建，正在处理中...", { type: "info" });
      onProgress?.("processing");

      // 轮询任务状态
      checkInterval = window.setInterval(async () => {
        const taskId = asyncTaskId.value;
        if (!taskId) return;

        pollCount += 1;
        if (pollCount >= maxPollCount) {
          stopPolling();
          taskStatus.value = "failed";
          loading.value = false;
          message("导出任务轮询超时，请稍后在任务中心查看结果", {
            type: "warning"
          });
          onProgress?.("timeout");
          return;
        }

        try {
          const status = await queryAsyncTaskStatus(
            getStatusApi,
            taskId,
            onProgress
          );

          if (status === "completed") {
            stopPolling();
            await downloadAsyncTaskFile(
              downloadApi,
              taskId,
              `${currentType}_export`
            );
            loading.value = false;
          } else if (status === "failed") {
            stopPolling();
            message("导出任务失败", { type: "error" });
            loading.value = false;
          }
        } catch {
          stopPolling();
          loading.value = false;
        }
      }, 3000);
    } catch {
      message("创建导出任务失败", { type: "error" });
      loading.value = false;
    }
  };

  if (getCurrentScope()) {
    onScopeDispose(() => {
      stopPolling();
    });
  }

  return {
    loading,
    asyncTaskId,
    taskStatus,
    handleSyncExport,
    handleAsyncExport,
    queryAsyncTaskStatus,
    downloadAsyncTaskFile,
    stopPolling,
    resetAsyncState
  };
}

/**
 * 下载模板
 */
export function useTemplateDownload() {
  const loading = ref(false);

  const downloadTemplate = async (
    downloadApi: (type: string) => Promise<Blob>,
    type: string,
    templateName?: string
  ): Promise<void> => {
    loading.value = true;
    try {
      const blob = await downloadApi(type);
      const filename = templateName || `${type}_import_template.xlsx`;
      downloadBlob(blob, filename, {
        showMessage: true
      });
    } catch {
      message("模板下载失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    downloadTemplate
  };
}
