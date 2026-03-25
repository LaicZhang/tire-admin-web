import type { StatusConfig } from "@/components/StatusTag/types";
import { formatMoneyFromFen } from "@/utils/formatMoney";

export const columns: TableColumnList = [
  {
    label: "序列号",
    prop: "serialNo",
    minWidth: 180
  },
  {
    label: "商品",
    prop: "tire",
    minWidth: 150,
    formatter: ({ tire }: { tire: { name: string } | null }) =>
      tire?.name || "-"
  },
  {
    label: "仓库",
    prop: "repo",
    minWidth: 120,
    formatter: ({ repo }: { repo: { name: string } | null }) =>
      repo?.name || "-"
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    slot: "status"
  },
  {
    label: "批次号",
    prop: "batchNo",
    minWidth: 120
  },
  {
    label: "成本",
    prop: "costPrice",
    minWidth: 120,
    formatter: ({ costPrice }: { costPrice?: number | string | null }) =>
      costPrice == null ? "-" : formatMoneyFromFen(Number(costPrice))
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 160
  },
  {
    label: "创建时间",
    prop: "createdAt",
    minWidth: 160
  },
  {
    label: "操作",
    fixed: "right",
    width: 150,
    slot: "operation"
  }
];

export const statusMap: Record<string, StatusConfig> = {
  IN_STOCK: { label: "在库", type: "success" },
  RESERVED: { label: "已占用", type: "warning" },
  IN_TRANSIT: { label: "在途", type: "primary" },
  OUTBOUND: { label: "已出库", type: "info" },
  INSTALLED: { label: "已安装", type: "success" },
  SOLD: { label: "已售", type: "info" },
  RETURNED_PENDING_QC: { label: "退回待检", type: "warning" },
  GOOD_RETURN: { label: "良品退回", type: "success" },
  DEFECTIVE: { label: "不良", type: "danger" },
  SCRAPPED: { label: "已报废", type: "danger" }
};
