import type { OutboundOrder } from "./types";

import { hideOnMobile } from "@/utils/viewport";

type TableColumn = {
  label: string;
  hide?: boolean | (() => boolean);
  prop?: string;
  slot?: string;
  fixed?: string | boolean;
  width?: number;
  minWidth?: number;
  formatter?: (
    row: OutboundOrder,
    column: TableColumn,
    cellValue: unknown
  ) => string;
};

/** Outbound Order Table Columns */
export const outboundOrderColumns: TableColumn[] = [
  {
    label: "出库单号",
    prop: "number",
    minWidth: 140
  },
  {
    label: "关联销售单",
    hide: hideOnMobile,
    prop: "saleOrder.number",
    minWidth: 140
  },
  {
    label: "客户",
    prop: "customer.name",
    minWidth: 120
  },
  {
    label: "商品数量",
    hide: hideOnMobile,
    prop: "count",
    width: 100
  },
  {
    label: "出库金额",
    prop: "total",
    width: 120
  },
  {
    label: "本次收款",
    hide: hideOnMobile,
    prop: "paidAmount",
    width: 120
  },
  {
    label: "出库员",
    hide: hideOnMobile,
    prop: "operator.name",
    width: 100
  },
  {
    label: "审核员",
    hide: hideOnMobile,
    prop: "auditor.name",
    width: 100
  },
  {
    label: "单据状态",
    hide: hideOnMobile,
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
    hide: hideOnMobile,
    prop: "logisticsStatus",
    width: 100,
    formatter: (_row, _column, cellValue) => {
      const statusMap: Record<number, string> = {
        0: "待发货",
        1: "部分发货",
        2: "已发货",
        3: "已送达",
        4: "已取消"
      };
      return statusMap[cellValue as number] || "未知";
    }
  },
  {
    label: "备注",
    hide: hideOnMobile,
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

/** Outbound Order Detail Table Columns */
export const outboundOrderDetailColumns: TableColumnList = [
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
    label: "胎号",
    prop: "serialNumbers",
    slot: "serialNosInput",
    minWidth: 220
  },
  {
    label: "已发货",
    prop: "isShipped",
    slot: "isShippedSwitch",
    width: 80
  },
  {
    label: "备注",
    hide: hideOnMobile,
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
