import StatusTag from "@/components/StatusTag/index.vue";

interface CodeRuleRow {
  name: string;
  targetName: string;
  prefix: string;
  dateFormat: string;
  serialStart: number;
  serialDigits: number;
  resetTypeName: string;
  isActive: boolean;
}

export const documentColumns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "规则名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "适用单据",
    prop: "targetName",
    minWidth: 120
  },
  {
    label: "编码格式",
    minWidth: 180,
    cellRenderer: ({ row }: { row: CodeRuleRow }) => (
      <span class="font-mono text-sm">
        {`${row.prefix}${row.dateFormat ? `[${row.dateFormat}]` : ""}[${String(row.serialStart).padStart(row.serialDigits, "0")}]`}
      </span>
    )
  },
  {
    label: "流水号清零",
    prop: "resetTypeName",
    minWidth: 120
  },
  {
    label: "状态",
    prop: "isActive",
    minWidth: 80,
    cellRenderer: ({ row }: { row: CodeRuleRow }) => (
      <StatusTag
        status={row.isActive}
        statusMap={{
          true: { label: "使用中", type: "success" },
          false: { label: "未启用", type: "info" }
        }}
      />
    )
  },
  {
    label: "操作",
    width: 250,
    fixed: "right",
    slot: "operation"
  }
];
