interface ClosingRow {
  closingDate: string;
  operationDate: string;
  operatorName: string;
  status: string;
  remark: string;
}

export const columns: TableColumnList = [
  {
    label: "结账日",
    prop: "closingDate",
    minWidth: 120
  },
  {
    label: "操作日期",
    prop: "operationDate",
    minWidth: 160
  },
  {
    label: "操作员",
    prop: "operatorName",
    minWidth: 100
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    cellRenderer: ({ row }: { row: ClosingRow }) => (
      <el-tag
        type={row.status === "closed" ? "success" : "info"}
        effect="plain"
      >
        {row.status === "closed" ? "已结账" : "已反结账"}
      </el-tag>
    )
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 200
  }
];
