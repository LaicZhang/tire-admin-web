import type { InboundOrder } from "./types";

type TableColumn = {
  label: string;
  prop?: string;
  slot?: string;
  fixed?: string | boolean;
  width?: number;
  minWidth?: number;
  formatter?: (
    row: InboundOrder,
    column: TableColumn,
    cellValue: unknown
  ) => string;
};

/** Inbound Order Table Columns */
export const inboundOrderColumns: TableColumn[] = [
  {
    label: "入库单号",
    prop: "number",
    minWidth: 140
  },
  {
    label: "关联采购单",
    prop: "purchaseOrder.number",
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
    label: "入库金额",
    prop: "total",
    width: 120
  },
  {
    label: "本次付款",
    prop: "paidAmount",
    width: 120
  },
  {
    label: "入库员",
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
    label: "备注",
    prop: "desc",
    minWidth: 150
  },
  {
    label: "操作",
    fixed: "right",
    slot: "operation",
    minWidth: 250
  }
];

/** Inbound Order Detail Table Columns */
export const inboundOrderDetailColumns: TableColumnList = [
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
    label: "批次号",
    prop: "batchNo",
    slot: "batchNoInput",
    width: 120
  },
  {
    label: "生产日期",
    prop: "productionDate",
    slot: "productionDateInput",
    width: 150
  },
  {
    label: "过期日期",
    prop: "expiryDate",
    slot: "expiryDateInput",
    width: 150
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
