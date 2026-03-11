export const columns: TableColumnList = [
  { type: "selection", width: 50 },
  { label: "ID", prop: "id", width: 80 },
  { label: "商品名称", prop: "tireName" },
  { label: "分组", prop: "group", width: 100 },
  { label: "零售价", prop: "retailPrice", width: 100 },
  { label: "批发价", prop: "wholesalePrice", width: 100 },
  { label: "VIP价", prop: "vipPrice", width: 100 },
  { label: "会员价", prop: "memberPrice", width: 100 },
  { label: "最低销售价", prop: "minSalePrice", width: 110 },
  { label: "最高采购价", prop: "maxPurchasePrice", width: 110 },
  { label: "最近采购价", prop: "lastPurchasePrice", width: 110 },
  { label: "最近销售价", prop: "lastSalePrice", width: 110 },
  {
    label: "操作",
    prop: "operation",
    slot: "operation",
    fixed: "right",
    minWidth: 120
  }
];
