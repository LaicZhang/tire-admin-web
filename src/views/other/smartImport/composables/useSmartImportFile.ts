import { ref } from "vue";
import { message } from "@/utils/message";
import { validateFile, FileTypePresets } from "@/composables/useFileValidation";
import type { UploadFile } from "element-plus";
import { parseImportSheetsApi, parseImportColumnsApi } from "@/api";
import type {
  UploadedFile,
  SheetInfo,
  SourceColumn,
  ImportConfig
} from "../types";

export function useSmartImportFile() {
  const uploadedFile = ref<UploadedFile | null>(null);
  const sheets = ref<SheetInfo[]>([]);
  const selectedSheet = ref<number>(0);
  const sourceColumns = ref<SourceColumn[]>([]);
  const loading = ref(false);

  const handleFileChange = (file: UploadFile) => {
    if (!file.raw) return;

    const result = validateFile(file.raw, FileTypePresets.excelOrCsv, true);
    if (!result.valid) {
      return;
    }

    uploadedFile.value = {
      uid: String(file.uid),
      name: file.name,
      size: file.raw.size,
      type: file.raw.type,
      status: "success",
      raw: file.raw
    };

    parseFileSheets();
  };

  const handleFileRemove = () => {
    uploadedFile.value = null;
    sheets.value = [];
    sourceColumns.value = [];
    selectedSheet.value = 0;
  };

  const parseFileSheets = async () => {
    const raw = uploadedFile.value?.raw;
    if (!raw) return;

    loading.value = true;
    try {
      const fd = new FormData();
      fd.append("file", raw);

      const res = await parseImportSheetsApi(fd);
      if (res.code !== 200) {
        message(res.msg || "解析文件失败", { type: "error" });
        return;
      }
      sheets.value = res.data?.sheets || [];
      if (sheets.value.length === 0) {
        message("未解析到有效的 Sheet", { type: "warning" });
        return;
      }

      // 如果只有一个 sheet，自动选择，但不在这里调用 handleSheetSelect
      // 因为需要 config 参数，由外部调用
    } catch {
      message("解析文件失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  const handleSheetSelect = async (config: ImportConfig): Promise<boolean> => {
    const raw = uploadedFile.value?.raw;
    if (!raw) return false;

    loading.value = true;
    try {
      const fd = new FormData();
      fd.append("file", raw);
      fd.append("sheetIndex", String(selectedSheet.value));
      fd.append("headerRow", String(config.headerRow));
      fd.append("startDataRow", String(config.startDataRow));
      fd.append("sampleSize", "3");

      const res = await parseImportColumnsApi(fd);
      if (res.code !== 200) {
        message(res.msg || "读取列信息失败", { type: "error" });
        return false;
      }
      sourceColumns.value = res.data?.columns || [];
      if (sourceColumns.value.length === 0) {
        message("未读取到列信息", { type: "warning" });
        return false;
      }
      return true;
    } catch {
      message("读取列信息失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    uploadedFile,
    sheets,
    selectedSheet,
    sourceColumns,
    loading,
    handleFileChange,
    handleFileRemove,
    parseFileSheets,
    handleSheetSelect
  };
}
