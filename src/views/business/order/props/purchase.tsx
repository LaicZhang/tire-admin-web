export interface PurchaseFormItemProps {
  id: number;
  uid: string;
  providerId: string;
  desc?: string;
  operatorId: string;
  auditorId: string;
  warehouseEmployeeId: string;
  count: number;
  total: bigint;
  status: boolean;
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
  updateAt: Date;
  // details: [
  //   {
  //     companyId: string;
  //     count: number;
  //     total: bigint;
  //     desc: string;
  //     isArrival: boolean;
  //     tireId: string;
  //   }
  // ];
  details: any[];
}

export interface PurchaseFormProps {
  formInline: PurchaseFormItemProps;
}

import { formatDate } from "@/utils";
// import { allTireList, allRepoList } from "../table";
// import { ref } from "vue";
// const tireList = ref(allTireList.value);
export const purchaseOrderDeatailsColumns = [
  {
    label: "索引",
    prop: "index",
    width: 40
  },
  {
    label: "轮胎",
    prop: "tireId",
    slot: "tireIdSelect"
    // cellRenderer: ({ row }) => (
    //   <el-select v-model={row.tireId} clearable placeholder="请选择轮胎">
    //     {tireList.value.map(item => {
    //       return (
    //         <el-option
    //           key={item.uid}
    //           label={item.brand + " " + item.name}
    //           value={item.uid}
    //         />
    //       );
    //     })}
    //   </el-select>
    // )
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
    // cellRenderer: ({ row }) => (
    //   <el-select v-model={row.repoId} clearable placeholder="请选择仓库">
    //     {allRepoList.value.map(item => {
    //       return (
    //         <el-option key={item.uid} label={item.name} value={item.uid} />
    //       );
    //     })}
    //   </el-select>
    // )
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
export const purchaseOrderColumns = [
  {
    label: "ID",
    prop: "id"
  },
  {
    label: "供应商",
    prop: "provider.name"
    // slot: "providerId"
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
    prop: "operator.name"
    // slot: "operatorId"
  },
  {
    label: "审核员",
    prop: "auditor.name"
    // slot: "auditorId"
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
