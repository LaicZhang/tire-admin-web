export const columns = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "轮胎名",
    prop: "name"
  },
  {
    label: "当前库存",
    prop: "count"
  },
  {
    label: "待入库",
    prop: "toBeStocked"
  },
  {
    label: "待出库",
    prop: "toBeShipped"
  },
  {
    label: "最新价",
    prop: "lastPrice"
  },
  {
    label: "历史最高价",
    prop: "maxPriceInHistory"
  },
  {
    label: "历史最低价",
    prop: "minPriceInHistory"
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 120
  }
];
