import dayjs from "dayjs";
import { formatMoney } from "@/utils/formatMoney";

export const columns: TableColumnList = [
  {
    label: "单据编号",
    prop: "number",
    width: 180,
    cellRenderer: ({ row }) => <span class="text-primary">#{row.number}</span>
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    slot: "status"
  },
  {
    label: "调整金额",
    prop: "totalAdjustAmount",
    width: 120,
    cellRenderer: ({ row }) => {
      const amount = Number(row.totalAdjustAmount);
      return (
        <span class={amount >= 0 ? "text-success" : "text-danger"}>
          {formatMoney(amount)}
        </span>
      );
    }
  },
  {
    label: "调整原因",
    prop: "reason",
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    label: "操作人",
    prop: "operator.name",
    width: 100,
    formatter: row => row.operator?.name || "-"
  },
  {
    label: "审核人",
    prop: "auditor.name",
    width: 100,
    formatter: row => row.auditor?.name || "-"
  },
  {
    label: "创建时间",
    prop: "createAt",
    width: 160,
    formatter: row =>
      row.createAt ? dayjs(row.createAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  {
    label: "审核时间",
    prop: "auditAt",
    width: 160,
    formatter: row =>
      row.auditAt ? dayjs(row.auditAt).format("YYYY-MM-DD HH:mm") : "-"
  },
  {
    label: "操作",
    width: 180,
    fixed: "right",
    slot: "operation"
  }
];
