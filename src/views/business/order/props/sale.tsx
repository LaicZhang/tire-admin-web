export interface SaleFormItemProps {
  id: number;
  uid: string;
  number: bigint;
  customerId: string;
  desc?: string;
  operatorId: string;
  auditorId: string;
  warehouseEmployeeId: string;
  count: number;
  total: number;
  showTotal: number;
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
  details: [
    {
      index: number;
      companyId?: string;
      count: number;
      total: number;
      desc?: string;
      isArrival: boolean;
      tireId: string;
    }
  ];
}

export interface SaleFormProps {
  formInline: SaleFormItemProps;
}

export const saleOrderFormRules = reactive({
  customerId: [{ required: true, message: "客户为必填项", trigger: "blur" }],
  auditorId: [{ required: true, message: "审核人为必填项", trigger: "blur" }],
  count: [{ required: true, message: "数量为必填项", trigger: "blur" }],
  total: [{ required: true, message: "总价为必填项", trigger: "blur" }]
});

import { formatDate } from "@/utils";
import { reactive } from "vue";

export const saleOrderDeatailsColumns = [
  // {
  //   label: "索引",
  //   prop: "index",
  //   width: 40
  // },
  {
    label: "轮胎",
    prop: "tireId",
    slot: "tireIdSelect"
  },
  {
    label: "数量",
    prop: "count",
    cellRenderer: ({ row }) => <el-input-number v-model={row.count} />
  },
  {
    label: "单价",
    prop: "unitPrice",
    cellRenderer: ({ row }) => <el-input-number v-model={row.unitPrice} />
  },
  {
    label: "总价",
    prop: "total",
    cellRenderer: ({ row }) => <el-input-number v-model={row.total} />
  },
  {
    label: "是否到货",
    prop: "isArrival",
    cellRenderer: ({ row }) => <el-switch v-model={row.isArrival} />
  },
  {
    label: "仓库",
    prop: "repoId",
    slot: "repoIdSelect"
  },
  {
    label: "备注",
    prop: "desc",
    cellRenderer: ({ row }) => <el-input v-model={row.desc} />
  },
  {
    label: "操作",
    fixed: "right",
    prop: "operation",
    slot: "operation"
  }
];

export const saleOrderColumns = [
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
