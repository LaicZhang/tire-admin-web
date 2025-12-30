export const columns = [
  {
    label: "ID",
    prop: "id",
    minWidth: 60
  },
  {
    label: "商品名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "分组",
    prop: "group",
    minWidth: 100
  },
  {
    label: "品牌",
    prop: "brand",
    minWidth: 100
  },
  {
    label: "规格",
    prop: "format",
    minWidth: 100
  },
  {
    label: "单位",
    prop: "unit",
    minWidth: 80
  },
  {
    label: "进价",
    prop: "purchasePrice",
    minWidth: 100
  },
  {
    label: "售价",
    prop: "salePrice",
    minWidth: 100
  },
  {
    label: "备注",
    prop: "desc",
    minWidth: 120
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 180
  }
];
