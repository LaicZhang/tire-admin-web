import { ref } from "vue";
import { message } from "@/utils/message";
import { importDataApi } from "@/api";
import type { ImportProgress, ImportResult, UploadedFile } from "../types";

export function useSmartImportExecute() {
  const progress = ref<ImportProgress>({
    current: 0,
    total: 0,
    status: "idle"
  });
  const importResult = ref<ImportResult | null>(null);
  const loading = ref(false);

  const startImport = async (
    type: string,
    uploadedFile: UploadedFile | null,
    onProgress?: (current: number) => void
  ) => {
    const raw = uploadedFile?.raw;
    if (!raw) return;

    loading.value = true;
    progress.value = {
      current: 0,
      total: 100,
      status: "importing",
      message: "正在导入数据..."
    };

    try {
      const fd = new FormData();
      fd.append("file", raw);

      const res = await importDataApi(type, fd, p => {
        progress.value.current = p;
        onProgress?.(p);
      });

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
    } catch {
      progress.value.status = "error";
      message("导入失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    progress.value = { current: 0, total: 0, status: "idle" };
    importResult.value = null;
  };

  return {
    progress,
    importResult,
    loading,
    startImport,
    reset
  };
}
