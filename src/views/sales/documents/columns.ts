import type { DocumentItem } from "./types";

type TableColumn = {
  label: string;
  prop?: string;
  slot?: string;
  fixed?: string | boolean;
  width?: number;
  minWidth?: number;
  formatter?: (
    row: DocumentItem,
    column: TableColumn,
    cellValue: unknown
  ) => string;
};

/** Document List Table Columns */
export const documentColumns: TableColumn[] = [
  {
    label: "单据类型",
    prop: "typeName",
    width: 120
  },
  {
    label: "单据编号",
    prop: "number",
    minWidth: 140
  },
  {
    label: "客户",
    prop: "customerName",
    minWidth: 120
  },
  {
    label: "商品数量",
    prop: "count",
    width: 100
  },
  {
    label: "金额",
    prop: "total",
    width: 120
  },
  {
    label: "操作员",
    prop: "operatorName",
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
    label: "创建时间",
    prop: "createdAt",
    width: 160
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
    minWidth: 200
  }
];
