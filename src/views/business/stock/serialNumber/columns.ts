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

export const statusMap: Record<string, { label: string; type: string }> = {
  IN_STOCK: { label: "在库", type: "success" },
  SOLD: { label: "已售", type: "info" },
  RETURNED: { label: "已退", type: "warning" },
  SCRAPPED: { label: "已报废", type: "danger" }
};
