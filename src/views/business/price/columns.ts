const typeTextMap: Record<string, string> = {
  SYSTEM: "系统",
  CUSTOM: "自定义"
};

export const columns: TableColumnList = [
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "类型",
    prop: "type",
    formatter: (_row, _column, cellValue) => {
      return typeTextMap[String(cellValue)] || cellValue;
    }
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];
