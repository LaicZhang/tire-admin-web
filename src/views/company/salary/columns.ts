import { formatDate } from "@/utils";
import { fenToYuan } from "@/utils/formatMoney";

function moneyCell(_row: unknown, _column: unknown, cellValue: unknown) {
  if (cellValue === null || cellValue === undefined || cellValue === "") {
    return "-";
  }
  const n =
    typeof cellValue === "bigint"
      ? cellValue
      : typeof cellValue === "number"
        ? cellValue
        : Number(cellValue);
  if (typeof n === "number" && Number.isNaN(n)) return "-";
  return fenToYuan(n);
}

export const columns: TableColumnList = [
  {
    label: "员工",
    prop: "employee",
    minWidth: 120,
    formatter: (row: { employee?: { name?: string }; employeeId?: string }) =>
      row.employee?.name || row.employeeId || "-"
  },
  {
    label: "月份",
    prop: "date",
    width: 100
  },
  {
    label: "应发(元)",
    prop: "payableWages",
    minWidth: 110,
    formatter: moneyCell
  },
  {
    label: "实发(元)",
    prop: "actualWages",
    minWidth: 110,
    formatter: moneyCell
  },
  {
    label: "状态",
    prop: "confirmedAt",
    width: 90,
    formatter: (
      row: { confirmedAt?: string | null },
      _c: unknown,
      cellValue: unknown
    ) => (cellValue || row.confirmedAt ? "已确认" : "草稿")
  },
  {
    label: "更新时间",
    prop: "updateAt",
    minWidth: 160,
    formatter: (_row, _column, cellValue) => formatDate(cellValue)
  },
  {
    label: "备注",
    prop: "desc",
    minWidth: 120
  },
  {
    label: "操作",
    fixed: "right",
    width: 220,
    prop: "operation",
    slot: "operation"
  }
];
