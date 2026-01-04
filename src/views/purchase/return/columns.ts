import type { ReturnOrder } from "./types";

/** 退货原因选项 */
export const RETURN_REASON_OPTIONS = [
  { label: "质量问题", value: "quality" },
  { label: "数量错误", value: "quantity" },
  { label: "规格不符", value: "specification" },
  { label: "其他", value: "other" }
];

type TableColumn = {
  label: string;
  prop?: string;
  slot?: string;
  fixed?: string | boolean;
  width?: number;
  minWidth?: number;
  formatter?: (
    row: ReturnOrder,
    column: TableColumn,
    cellValue: unknown
  ) => string;
};

/** Return Order Table Columns */
export const returnOrderColumns: TableColumn[] = [
  {
    label: "退货单号",
    prop: "number",
    minWidth: 140
  },
  {
    label: "源单号",
    prop: "sourceOrderNumber",
    minWidth: 140
  },
  {
    label: "供应商",
    prop: "provider.name",
    minWidth: 120
  },
  {
    label: "退货数量",
    prop: "count",
    width: 100
  },
  {
    label: "退货金额",
    prop: "total",
    width: 120
  },
  {
    label: "已退款",
    prop: "refundAmount",
    width: 120
  },
  {
    label: "退货原因",
    prop: "returnReason",
    minWidth: 120
  },
  {
    label: "操作员",
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
        2: "已签收"
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

/** Return Order Detail Table Columns */
export const returnOrderDetailColumns: TableColumnList = [
  {
    label: "商品",
    prop: "tireId",
    slot: "tireIdSelect",
    minWidth: 200
  },
  {
    label: "退货数量",
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
    label: "退货金额",
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
    label: "退货原因",
    prop: "returnReason",
    slot: "returnReasonSelect",
    width: 120
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
