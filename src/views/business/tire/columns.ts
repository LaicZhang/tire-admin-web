export const columns = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "分组",
    prop: "group"
  },
  {
    label: "实物图",
    prop: "covers",
    slot: "covers"
  },
  {
    label: "名称",
    prop: "name"
  },
  {
    label: "品牌",
    prop: "brand"
  },
  {
    label: "花纹",
    prop: "pattern"
  },
  {
    label: "进价",
    prop: "purchasePrice"
  },
  {
    label: "售价",
    prop: "salePrice"
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
