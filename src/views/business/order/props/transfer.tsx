export interface TransferFormItemProps {
  id: number;
  uid: string;
  customerId: string;
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

export interface TransferFormProps {
  formInline: TransferFormItemProps;
}

import { formatDate } from "@/utils";
import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { fieldRules } from "@/utils/validation/fieldRules";
export const transferOrderFormRules: FormRules = reactive({
  customerId: fieldRules.uidSelect({ label: "客户" }),
  auditorId: fieldRules.uidSelect({ label: "审核人" }),
  count: fieldRules.positiveInt({ label: "数量", min: 1, required: true }),
  total: fieldRules.moneyYuan({ label: "总价", min: 0, required: true })
});
export const transferOrderDetailsColumns: TableColumnList = [];

export const transferOrderColumns: TableColumnList = [
  {
    label: "流水号",
    prop: "number"
  },
  {
    label: "客户",
    prop: "customerId"
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
    label: "销售员",
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
