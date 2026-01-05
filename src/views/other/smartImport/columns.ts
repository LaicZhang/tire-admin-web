import { h } from "vue";
import { ElTag, ElProgress } from "element-plus";
import type { FieldMapping } from "./types";

export function createMappingColumns(): TableColumnList {
  return [
    {
      label: "源文件列",
      width: 200,
      cellRenderer: data => {
        const row = data.row as FieldMapping | undefined;
        if (!row) return "";
        return h("div", {}, [
          h("p", { class: "font-medium" }, row.sourceColumn.name),
          h(
            "p",
            { class: "text-xs text-gray-400 truncate" },
            `示例: ${row.sourceColumn.sampleValues.slice(0, 2).join(", ")}`
          )
        ]);
      }
    },
    {
      label: "匹配置信度",
      width: 120,
      align: "center",
      cellRenderer: data => {
        const row = data.row as FieldMapping | undefined;
        if (!row?.targetField)
          return h("span", { class: "text-gray-400" }, "-");
        const color =
          row.confidence >= 80
            ? "#67C23A"
            : row.confidence >= 50
              ? "#E6A23C"
              : "#F56C6C";
        return h(ElProgress, {
          percentage: row.confidence,
          color,
          strokeWidth: 6
        });
      }
    },
    {
      label: "系统字段",
      minWidth: 200,
      slot: "targetField"
    },
    {
      label: "字段类型",
      width: 100,
      align: "center",
      cellRenderer: data => {
        const row = data.row as FieldMapping | undefined;
        if (!row?.targetField)
          return h("span", { class: "text-gray-400" }, "-");
        return h(
          ElTag,
          { size: "small", type: "info" },
          () => row.targetField?.type ?? "unknown"
        );
      }
    },
    {
      label: "操作",
      width: 80,
      align: "center",
      slot: "action"
    }
  ];
}

export const errorColumns: TableColumnList = [
  {
    label: "行号",
    prop: "row",
    width: 80
  },
  {
    label: "错误信息",
    prop: "message"
  }
];
