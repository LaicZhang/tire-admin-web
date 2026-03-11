export const columns: TableColumnList = [
  { type: "selection", width: 50 },
  { label: "ID", prop: "id", width: 80 },
  { label: "商品名称", prop: "tireName" },
  { label: "分组", prop: "group", width: 100 },
  {
    label: "最高采购价",
    prop: "maxPurchasePrice",
    slot: "maxPurchasePrice",
    width: 120
  },
  {
    label: "采购限价",
    prop: "enablePurchaseLimit",
    slot: "enablePurchaseLimit",
    width: 100
  },
  {
    label: "最低销售价",
    prop: "minSalePrice",
    slot: "minSalePrice",
    width: 120
  },
  {
    label: "销售限价",
    prop: "enableSaleLimit",
    slot: "enableSaleLimit",
    width: 100
  },
  { label: "更新时间", prop: "updatedAt", width: 160 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 100
  }
];
