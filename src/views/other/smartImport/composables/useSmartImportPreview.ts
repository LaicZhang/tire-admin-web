import { ref, computed, h } from "vue";
import { ElTag } from "element-plus";
import { message } from "@/utils/message";
import { previewImportApi } from "@/api";
import type {
  ImportDataRow,
  FieldMapping,
  TargetField,
  ImportConfig,
  UploadedFile
} from "../types";

export function useSmartImportPreview() {
  const previewData = ref<ImportDataRow[]>([]);
  const loading = ref(false);

  const validRowsCount = computed(() => {
    return previewData.value.filter(r => r.status === "valid").length;
  });

  const errorRowsCount = computed(() => {
    return previewData.value.filter(r => r.status === "error").length;
  });

  const generatePreviewColumns = (
    targetFields: TargetField[],
    fieldMappings: FieldMapping[]
  ): TableColumnList => {
    const mappedFields = targetFields.filter(f =>
      fieldMappings.some(fm => fm.targetField?.key === f.key)
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
        cellRenderer: ({ row }: { row: ImportDataRow }) =>
          row.data[field.key] || "-"
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
          return h(
            ElTag,
            { type: statusType, size: "small" },
            () => statusText
          );
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
            row.errors.map((err, i: number) => h("p", { key: i }, err.message))
          );
        }
      }
    ];
    return cols;
  };

  const getRowStatusType = (status: string) => {
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
  };

  const loadPreview = async (
    uploadedFile: UploadedFile | null,
    selectedSheet: number,
    config: ImportConfig,
    fieldMappings: FieldMapping[],
    targetFields: TargetField[]
  ) => {
    const raw = uploadedFile?.raw;
    if (!raw) return;

    loading.value = true;
    try {
      const mappings = fieldMappings
        .filter(
          (
            fm
          ): fm is FieldMapping & {
            targetField: NonNullable<FieldMapping["targetField"]>;
          } => fm.targetField !== null && fm.targetField !== undefined
        )
        .map(fm => ({
          sourceIndex: fm.sourceColumn.index,
          targetKey: fm.targetField.key
        }));

      const fd = new FormData();
      fd.append("file", raw);
      fd.append("sheetIndex", String(selectedSheet));
      fd.append("headerRow", String(config.headerRow));
      fd.append("startDataRow", String(config.startDataRow));
      fd.append("mappings", JSON.stringify(mappings));
      fd.append("targetFields", JSON.stringify(targetFields));
      fd.append("maxRows", "200");

      const res = await previewImportApi(fd);
      if (res.code !== 200) {
        message(res.msg || "生成预览失败", { type: "error" });
        return;
      }
      previewData.value = res.data?.rows || [];
      if (previewData.value.length === 0) {
        message("未生成预览数据（可能没有有效数据行）", { type: "warning" });
        return;
      }
    } catch {
      message("生成预览失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    previewData.value = [];
  };

  return {
    previewData,
    loading,
    validRowsCount,
    errorRowsCount,
    generatePreviewColumns,
    getRowStatusType,
    loadPreview,
    reset
  };
}
