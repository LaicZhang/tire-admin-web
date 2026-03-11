import { formatMoney } from "@/utils/formatMoney";

const formatDateTime = (value: unknown) => {
  return value ? new Date(String(value)).toLocaleString() : "-";
};

export const columns: TableColumnList = [
  {
    label: "账户UID",
    prop: "uid"
  },
  {
    label: "公司UID",
    prop: "companyUid"
  },
  {
    label: "余额",
    prop: "balance",
    formatter: (_row, _column, cellValue) => {
      return formatMoney(Number(cellValue ?? 0));
    }
  },
  {
    label: "创建时间",
    prop: "createAt",
    formatter: (_row, _column, cellValue) => formatDateTime(cellValue)
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 200
  }
];
