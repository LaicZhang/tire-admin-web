interface RecycleRow {
  name: string;
  typeName: string;
  deleteTime: string;
  deleteByName: string;
  daysLeft: number;
}

export const columns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "名称",
    prop: "name",
    minWidth: 200
  },
  {
    label: "类型",
    prop: "typeName",
    minWidth: 100
  },
  {
    label: "删除时间",
    prop: "deleteTime",
    minWidth: 160
  },
  {
    label: "删除人",
    prop: "deleteByName",
    minWidth: 100
  },
  {
    label: "剩余天数",
    prop: "daysLeft",
    minWidth: 100,
    cellRenderer: ({ row }: { row: RecycleRow }) => (
      <el-tag
        type={
          row.daysLeft <= 7 ? "danger" : row.daysLeft <= 30 ? "warning" : "info"
        }
        effect="plain"
      >
        {row.daysLeft} 天
      </el-tag>
    )
  },
  {
    label: "操作",
    width: 180,
    fixed: "right",
    slot: "operation"
  }
];
