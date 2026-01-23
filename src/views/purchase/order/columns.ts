/** Purchase Order Table Columns */
export const purchaseOrderColumns: TableColumnList = [
  {
    label: "单据编号",
    prop: "number",
    minWidth: 140
  },
  {
    label: "供应商",
    prop: "provider.name",
    minWidth: 120
  },
  {
    label: "商品数量",
    prop: "count",
    width: 100
  },
  {
    label: "应付金额",
    prop: "total",
    width: 120
  },
  {
    label: "已付金额",
    prop: "paidAmount",
    width: 120
  },
  {
    label: "采购员",
    prop: "operator.name",
    width: 100
  },
  {
    label: "审核员",
    prop: "auditor.name",
    width: 100
  },
  {
    label: "单据状态",
    prop: "status",
    width: 100,
    formatter: (_row, _column, cellValue) => {
      return cellValue === true ? "正常" : "已关闭";
    }
  },
  {
    label: "审核状态",
    prop: "isApproved",
    width: 100,
    formatter: (_row, _column, cellValue) => {
      return cellValue === true ? "已审核" : "待审核";
    }
  },
  {
    label: "物流状态",
    prop: "logisticsStatus",
    width: 100,
    formatter: (_row, _column, cellValue) => {
      const statusMap: Record<number, string> = {
        0: "未发货",
        1: "已发货",
        2: "已到货"
      };
      return statusMap[cellValue as number] || "未知";
    }
  },
  {
    label: "备注",
    prop: "desc",
    minWidth: 150
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    minWidth: 280
  }
];

/** Purchase Order Detail Table Columns */
export const purchaseOrderDetailColumns: TableColumnList = [
  {
    label: "商品",
    prop: "tireId",
    slot: "tireIdSelect",
    minWidth: 200
  },
  {
    label: "数量",
    prop: "count",
    slot: "countInput",
    width: 120
  },
  {
    label: "单价",
    prop: "unitPrice",
    slot: "unitPriceInput",
    width: 120
  },
  {
    label: "金额",
    prop: "total",
    slot: "totalInput",
    width: 120
  },
  {
    label: "仓库",
    prop: "repoId",
    slot: "repoIdSelect",
    width: 150
  },
  {
    label: "是否到货",
    prop: "isArrival",
    slot: "isArrivalSwitch",
    width: 100
  },
  {
    label: "备注",
    prop: "desc",
    slot: "descInput",
    minWidth: 150
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    width: 80
  }
];
