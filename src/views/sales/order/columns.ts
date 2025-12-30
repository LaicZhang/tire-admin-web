import type { SalesOrder } from "./types";

type TableColumn = {
  label: string;
  prop?: string;
  slot?: string;
  fixed?: string | boolean;
  width?: number;
  minWidth?: number;
  formatter?: (
    row: SalesOrder,
    column: TableColumn,
    cellValue: unknown
  ) => string;
};

/** Sales Order Table Columns */
export const salesOrderColumns: TableColumn[] = [
  {
    label: "单据编号",
    prop: "number",
    minWidth: 140
  },
  {
    label: "客户",
    prop: "customer.name",
    minWidth: 120
  },
  {
    label: "商品数量",
    prop: "count",
    width: 100
  },
  {
    label: "应收金额",
    prop: "total",
    width: 120
  },
  {
    label: "已收金额",
    prop: "paidAmount",
    width: 120
  },
  {
    label: "销售员",
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
        0: "待发货",
        1: "已发货",
        2: "已送达"
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
    minWidth: 300
  }
];

/** Sales Order Detail Table Columns */
export const salesOrderDetailColumns: TableColumnList = [
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
    label: "折扣率(%)",
    prop: "discountRate",
    slot: "discountRateInput",
    width: 100
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
    label: "已发货",
    prop: "isShipped",
    slot: "isShippedSwitch",
    width: 80
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
