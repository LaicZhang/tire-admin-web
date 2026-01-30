import { getBusinessTypeText, getStatusInfo } from "./types";
import type { WriteOffOrder } from "./types";
import { fenToYuanOrDash } from "@/utils/formatMoney";

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
    label: "业务类型",
    prop: "businessType",
    minWidth: 120,
    formatter: (row: WriteOffOrder) => getBusinessTypeText(row.businessType)
  },
  {
    label: "转出客户/供应商",
    prop: "fromName",
    minWidth: 130,
    formatter: (row: WriteOffOrder) =>
      row.fromCustomer?.name ||
      row.fromCustomerName ||
      row.fromProvider?.name ||
      row.fromProviderName ||
      "-"
  },
  {
    label: "转入客户/供应商",
    prop: "toName",
    minWidth: 130,
    formatter: (row: WriteOffOrder) =>
      row.toCustomer?.name ||
      row.toCustomerName ||
      row.toProvider?.name ||
      row.toProviderName ||
      "-"
  },
  {
    label: "应收金额",
    prop: "receivableAmount",
    minWidth: 110,
    align: "right",
    formatter: (row: WriteOffOrder) => fenToYuanOrDash(row.receivableAmount)
  },
  {
    label: "应付金额",
    prop: "payableAmount",
    minWidth: 110,
    align: "right",
    formatter: (row: WriteOffOrder) => fenToYuanOrDash(row.payableAmount)
  },
  {
    label: "核销金额",
    prop: "writeOffAmount",
    minWidth: 110,
    align: "right",
    formatter: (row: WriteOffOrder) => fenToYuanOrDash(row.writeOffAmount)
  },
  {
    label: "核销日期",
    prop: "writeOffDate",
    minWidth: 120
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 90,
    slot: "status"
  },
  {
    label: "核销原因",
    prop: "reason",
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
    width: 200,
    slot: "operation"
  }
];

export { getStatusInfo };
