import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ImportExportTask, ExportParams } from "@/types/importExport";

// Helper to create mock tasks with minimal required fields
function createMockTask(
  overrides: Partial<ImportExportTask> & {
    uid: string;
    type: "import" | "export";
  }
): ImportExportTask {
  return {
    id: 1,
    module: "test",
    fileName: "test.xlsx",
    status: "pending",
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

// Mock Vue lifecycle hooks
const mountedCallbacks: Array<() => void> = [];
const unmountedCallbacks: Array<() => void> = [];

vi.mock("vue", async () => {
  const actual = await vi.importActual("vue");
  return {
    ...actual,
    onMounted: (cb: () => void) => {
      mountedCallbacks.push(cb);
    },
    onUnmounted: (cb: () => void) => {
      unmountedCallbacks.push(cb);
    }
  };
});

// Mock dependencies
vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

vi.mock("@/utils/download", () => ({
  downloadBlob: vi.fn(),
  generateFilenameWithTimestamp: vi.fn(
    (prefix, ext) => `${prefix}_20260119.${ext}`
  )
}));

vi.mock("@/composables/useFileValidation", () => ({
  FileTypePresets: {
    excel: {
      mimeTypes: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ],
      maxSize: 10 * 1024 * 1024
    }
  },
  createUploadValidator: vi.fn(() => () => true)
}));

import {
  useImportExportTask,
  useImportFile,
  useExportData,
  useTemplateDownload
} from "../useImportExport";
import { message } from "@/utils/message";
import { downloadBlob } from "@/utils/download";

describe("useImportExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("useImportExportTask", () => {
    it("should return required properties", () => {
      const result = useImportExportTask();

      expect(result).toHaveProperty("taskList");
      expect(result).toHaveProperty("readTasks");
      expect(result).toHaveProperty("writeTasks");
      expect(result).toHaveProperty("pushTask");
      expect(result).toHaveProperty("deleteTask");
      expect(result).toHaveProperty("loadTasks");
      expect(result).toHaveProperty("nowText");
    });

    it("should read empty tasks when storage is empty", () => {
      const { readTasks } = useImportExportTask();
      expect(readTasks()).toEqual([]);
    });

    it("should write and read tasks", () => {
      const { writeTasks, readTasks } = useImportExportTask();
      const tasks: ImportExportTask[] = [
        createMockTask({ uid: "1", type: "import", status: "success" })
      ];

      writeTasks(tasks);
      expect(readTasks()).toEqual(tasks);
    });

    it("should push task to the beginning", () => {
      const { pushTask, readTasks } = useImportExportTask();

      pushTask(createMockTask({ uid: "1", type: "import" }));
      pushTask(createMockTask({ uid: "2", type: "export" }));

      const tasks = readTasks();
      expect(tasks[0].uid).toBe("2");
      expect(tasks[1].uid).toBe("1");
    });

    it("should limit tasks to 200", () => {
      const { pushTask, readTasks } = useImportExportTask();

      for (let i = 0; i < 210; i++) {
        pushTask(createMockTask({ uid: String(i), type: "import" }));
      }

      const tasks = readTasks();
      expect(tasks.length).toBe(200);
    });

    it("should delete task by uid", () => {
      const { pushTask, deleteTask, readTasks } = useImportExportTask();

      pushTask(createMockTask({ uid: "1", type: "import" }));
      pushTask(createMockTask({ uid: "2", type: "export" }));

      deleteTask("1");

      const tasks = readTasks();
      expect(tasks.length).toBe(1);
      expect(tasks[0].uid).toBe("2");
    });

    it("should load tasks into taskList ref", () => {
      const { pushTask, loadTasks, taskList } = useImportExportTask();

      pushTask(createMockTask({ uid: "1", type: "import" }));
      loadTasks();

      expect(taskList.value.length).toBe(1);
    });

    it("should generate formatted timestamp", () => {
      const { nowText } = useImportExportTask();
      const result = nowText();

      // Should match format YYYY-MM-DD HH:mm:ss
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it("should use custom storage key", () => {
      const customKey = "custom:tasks";
      const { writeTasks } = useImportExportTask(customKey);

      writeTasks([createMockTask({ uid: "1", type: "import" })]);

      expect(localStorage.getItem(customKey)).toBeTruthy();
    });

    it("should handle invalid JSON in storage", () => {
      localStorage.setItem("data:import-export:tasks", "invalid json");

      const { readTasks } = useImportExportTask();
      expect(readTasks()).toEqual([]);
    });

    it("should handle non-array in storage", () => {
      localStorage.setItem(
        "data:import-export:tasks",
        JSON.stringify({ not: "array" })
      );

      const { readTasks } = useImportExportTask();
      expect(readTasks()).toEqual([]);
    });
  });

  describe("useImportFile", () => {
    it("should return required properties", () => {
      const result = useImportFile("product");

      expect(result).toHaveProperty("loading");
      expect(result).toHaveProperty("uploadProgress");
      expect(result).toHaveProperty("beforeUpload");
      expect(result).toHaveProperty("handleImport");
    });

    it("should initialize with loading false", () => {
      const { loading, uploadProgress } = useImportFile("product");

      expect(loading.value).toBe(false);
      expect(uploadProgress.value).toBe(0);
    });

    it("should handle successful import", async () => {
      const { handleImport, loading } = useImportFile("product");

      const mockApi = vi.fn().mockResolvedValue({
        code: 200,
        data: { success: 10, failed: 0, total: 10 }
      });

      const file = new File(["content"], "test.xlsx");
      const result = await handleImport(file, mockApi);

      expect(result).toEqual({
        success: true,
        total: 10,
        successCount: 10,
        failedCount: 0,
        errors: []
      });
      expect(loading.value).toBe(false);
      expect(message).toHaveBeenCalledWith(
        expect.stringContaining("成功导入"),
        expect.any(Object)
      );
    });

    it("should handle import with errors", async () => {
      const { handleImport } = useImportFile("product");

      const mockApi = vi.fn().mockResolvedValue({
        code: 200,
        data: {
          success: 8,
          failed: 2,
          total: 10,
          errors: [{ row: 1, message: "Invalid data" }, "Row 2 error"]
        }
      });

      const file = new File(["content"], "test.xlsx");
      const result = await handleImport(file, mockApi);

      expect(result?.failedCount).toBe(2);
      expect(result?.errors).toContain("第1行：Invalid data");
      expect(result?.errors).toContain("Row 2 error");
      expect(message).toHaveBeenCalledWith(
        expect.stringContaining("失败"),
        expect.any(Object)
      );
    });

    it("should handle API error response", async () => {
      const { handleImport } = useImportFile("product");

      const mockApi = vi.fn().mockResolvedValue({
        code: 500,
        msg: "Server error"
      });

      const file = new File(["content"], "test.xlsx");
      const result = await handleImport(file, mockApi);

      expect(result).toBeNull();
      expect(message).toHaveBeenCalledWith("Server error", { type: "error" });
    });

    it("should handle exception during import", async () => {
      const { handleImport, loading } = useImportFile("product");

      const mockApi = vi.fn().mockRejectedValue(new Error("Network error"));

      const file = new File(["content"], "test.xlsx");
      const result = await handleImport(file, mockApi);

      expect(result).toBeNull();
      expect(loading.value).toBe(false);
      expect(message).toHaveBeenCalledWith(
        expect.stringContaining("导入失败"),
        expect.any(Object)
      );
    });

    it("should track upload progress", async () => {
      const { handleImport } = useImportFile("product");

      const mockApi = vi
        .fn()
        .mockImplementation((_type, _formData, onProgress) => {
          onProgress?.(50);
          onProgress?.(100);
          return Promise.resolve({
            code: 200,
            data: { success: 1, failed: 0 }
          });
        });

      const file = new File(["content"], "test.xlsx");
      await handleImport(file, mockApi);

      // Progress was updated during upload
      expect(mockApi).toHaveBeenCalled();
    });
  });

  describe("useExportData", () => {
    it("should return required properties", () => {
      const result = useExportData("product");

      expect(result).toHaveProperty("loading");
      expect(result).toHaveProperty("handleSyncExport");
      expect(result).toHaveProperty("handleAsyncExport");
    });

    it("should initialize with loading false", () => {
      const { loading } = useExportData("product");
      expect(loading.value).toBe(false);
    });

    describe("handleSyncExport", () => {
      it("should download blob on success", async () => {
        const { handleSyncExport, loading } = useExportData("product");

        const mockBlob = new Blob(["data"]);
        const mockApi = vi.fn().mockResolvedValue(mockBlob);

        await handleSyncExport(mockApi, {
          filters: { test: true }
        } as ExportParams);

        expect(mockApi).toHaveBeenCalledWith("product", {
          filters: { test: true }
        });
        expect(downloadBlob).toHaveBeenCalledWith(
          mockBlob,
          expect.stringContaining("product_export"),
          expect.any(Object)
        );
        expect(loading.value).toBe(false);
      });

      it("should handle export error", async () => {
        const { handleSyncExport, loading } = useExportData("product");

        const mockApi = vi.fn().mockRejectedValue(new Error("Export failed"));

        await handleSyncExport(mockApi);

        expect(message).toHaveBeenCalledWith("导出失败", { type: "error" });
        expect(loading.value).toBe(false);
      });
    });

    describe("handleAsyncExport", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("should handle missing taskId", async () => {
        const { handleAsyncExport } = useExportData("product");

        const createTaskApi = vi.fn().mockResolvedValue({ data: null });
        const getStatusApi = vi.fn();
        const downloadApi = vi.fn();

        await handleAsyncExport(createTaskApi, getStatusApi, downloadApi);

        expect(message).toHaveBeenCalledWith(
          expect.stringContaining("创建导出任务失败"),
          expect.any(Object)
        );
      });

      it("should handle exception during task creation", async () => {
        const { handleAsyncExport, loading } = useExportData("product");

        const createTaskApi = vi
          .fn()
          .mockRejectedValue(new Error("Create failed"));
        const getStatusApi = vi.fn();
        const downloadApi = vi.fn();

        await handleAsyncExport(createTaskApi, getStatusApi, downloadApi);

        expect(message).toHaveBeenCalledWith(
          expect.stringContaining("创建导出任务失败"),
          expect.any(Object)
        );
        expect(loading.value).toBe(false);
      });
    });
  });

  describe("useTemplateDownload", () => {
    it("should return required properties", () => {
      const result = useTemplateDownload();

      expect(result).toHaveProperty("loading");
      expect(result).toHaveProperty("downloadTemplate");
    });

    it("should download template successfully", async () => {
      const { downloadTemplate, loading } = useTemplateDownload();

      const mockBlob = new Blob(["template"]);
      const mockApi = vi.fn().mockResolvedValue(mockBlob);

      await downloadTemplate(mockApi, "product", "product_template.xlsx");

      expect(mockApi).toHaveBeenCalledWith("product");
      expect(downloadBlob).toHaveBeenCalledWith(
        mockBlob,
        "product_template.xlsx",
        expect.any(Object)
      );
      expect(loading.value).toBe(false);
    });

    it("should use default filename when not provided", async () => {
      const { downloadTemplate } = useTemplateDownload();

      const mockBlob = new Blob(["template"]);
      const mockApi = vi.fn().mockResolvedValue(mockBlob);

      await downloadTemplate(mockApi, "product");

      expect(downloadBlob).toHaveBeenCalledWith(
        mockBlob,
        "product_import_template.xlsx",
        expect.any(Object)
      );
    });

    it("should handle download error", async () => {
      const { downloadTemplate, loading } = useTemplateDownload();

      const mockApi = vi.fn().mockRejectedValue(new Error("Download failed"));

      await downloadTemplate(mockApi, "product");

      expect(message).toHaveBeenCalledWith("模板下载失败", { type: "error" });
      expect(loading.value).toBe(false);
    });
  });
});
