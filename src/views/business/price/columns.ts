const typeTextMap: Record<string, string> = {
  STANDARD: "标准价",
  PROMOTION: "促销价",
  SPECIAL: "特价"
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
    label: "启用",
    prop: "isActive",
    formatter: (_row, _column, cellValue) => (cellValue ? "是" : "否")
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation"
  }
];
