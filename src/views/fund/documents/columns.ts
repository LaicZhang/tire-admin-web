import { getDocumentTypeInfo, getStatusInfo } from "./types";

export const columns: TableColumnList = [
  {
    type: "selection",
    width: 55,
    align: "center"
  },
  {
    label: "单据编号",
    prop: "billNo",
    minWidth: 160,
    fixed: "left"
  },
  {
    label: "单据类型",
    prop: "documentType",
    minWidth: 110,
    slot: "documentType"
  },
  {
    label: "收支方向",
    prop: "direction",
    minWidth: 90,
    slot: "direction"
  },
  {
    label: "往来单位",
    prop: "targetName",
    minWidth: 140
  },
  {
    label: "金额",
    prop: "amount",
    minWidth: 120,
    align: "right",
    slot: "amount"
  },
  {
    label: "账户",
    prop: "paymentName",
    minWidth: 120
  },
  {
    label: "单据日期",
    prop: "documentDate",
    minWidth: 120
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 90,
    slot: "status"
  },
  {
    label: "经办人",
    prop: "operatorName",
    minWidth: 100
  },
  {
    label: "备注",
    prop: "remark",
    minWidth: 150,
    showOverflowTooltip: true
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

export { getDocumentTypeInfo, getStatusInfo };
