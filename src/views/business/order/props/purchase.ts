export interface PurchaseFormItemProps {
  id: number;
  uid: string;
  providerId: string;
  desc?: string;
  operatorId: string;
  auditorId: string;
  count: number;
  total: number;
  orderStatus: number;
  logisticsStatus: number;
  paidAmount: number;
  isApproved: boolean;
  isLocked: boolean;
  rejectReason: string;
  paymentId: string;
  auditAt: Date;
  arrivalAt: Date;
  payAt: Date;
}

export interface PurchaseFormProps {
  formInline: PurchaseFormItemProps;
}

import { formatDate } from "@/utils";

export const purchaseOrderColumns = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "供应商",
    prop: "providerId"
  },
  {
    label: "数量",
    prop: "count"
  },
  {
    label: "总价",
    prop: "total"
  },
  {
    label: "采购员",
    prop: "operatorId"
  },
  {
    label: "审核员",
    prop: "auditorId"
  },
  {
    label: "状态",
    prop: "status",
    formatter: (row, column, cellValue) => {
      return cellValue === true ? "正常" : "关闭";
    }
  },
  {
    label: "审核状态",
    prop: "isApproved",
    formatter: (row, column, cellValue) => {
      return cellValue === true ? "已批准" : "未批准";
    }
  },
  {
    label: "是否锁单",
    prop: "isLocked",
    formatter: (row, column, cellValue) => {
      return cellValue === true ? "已锁单" : "未锁单";
    }
  },
  {
    label: "备注",
    prop: "desc"
  },
  {
    label: "付款时间",
    prop: "payAt",
    formatter: (row, column, cellValue) => {
      return formatDate(cellValue);
    }
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation",
    minWidth: 120
  }
];
