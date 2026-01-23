export const batchColumns: TableColumnList = [
  { label: "ID", prop: "id", width: 80 },
  { label: "批次号", prop: "batchNo", width: 150 },
  { label: "商品名称", prop: "tireName" },
  { label: "仓库", prop: "repoName" },
  { label: "数量", prop: "quantity", width: 100 },
  { label: "生产日期", prop: "productionDate", width: 120 },
  { label: "到期日期", prop: "expiryDate", width: 120 },
  { label: "状态", prop: "status", slot: "status", width: 100 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 120
  }
];

export const serialColumns: TableColumnList = [
  { label: "ID", prop: "id", width: 80 },
  { label: "序列号", prop: "serialNo", width: 180 },
  { label: "商品", prop: "tire.name" },
  { label: "仓库", prop: "repo.name" },
  { label: "状态", prop: "status", slot: "serialStatus", width: 100 },
  { label: "批次号", prop: "batchNo", width: 120 },
  { label: "生产日期", prop: "productionDate", width: 120 },
  { label: "到期日期", prop: "expiryDate", width: 120 },
  { label: "创建时间", prop: "createdAt", width: 160 },
  {
    label: "操作",
    prop: "operation",
    slot: "serialOperation",
    fixed: "right",
    minWidth: 100
  }
];

export const expiryColumns: TableColumnList = [
  { label: "批次号", prop: "batchNo" },
  { label: "商品名称", prop: "tireName" },
  { label: "仓库", prop: "repoName" },
  { label: "数量", prop: "quantity" },
  { label: "到期日期", prop: "expiryDate" },
  { label: "剩余天数", slot: "remainingDays" }
];
