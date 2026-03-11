const typeTextMap = {
  income: "收入",
  expense: "支出"
} as const;

export const columns: TableColumnList = [
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "类型",
    prop: "type",
    formatter: (_row, _column, cellValue) => {
      const key = String(cellValue ?? "") as keyof typeof typeTextMap;
      return typeTextMap[key] ?? cellValue;
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
