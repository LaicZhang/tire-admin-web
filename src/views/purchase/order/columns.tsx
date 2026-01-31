import { MoneyDisplay, StatusTag } from "@/components";

const ORDER_STATUS_TAG_MAP = {
  true: { label: "正常", type: "success" },
  false: { label: "已关闭", type: "info" }
} as const;

const APPROVAL_STATUS_TAG_MAP = {
  true: { label: "已审核", type: "success" },
  false: { label: "待审核", type: "warning" }
} as const;

const LOGISTICS_STATUS_TAG_MAP = {
  0: { label: "待发货", type: "info" },
  1: { label: "部分发货", type: "warning" },
  2: { label: "已发货", type: "primary" },
  3: { label: "已到货", type: "success" },
  4: { label: "已取消", type: "danger" }
} as const;

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
    width: 120,
    align: "right",
    cellRenderer: ({ row }) => (
      <MoneyDisplay
        value={typeof row.total === "number" ? row.total : null}
        emptyText="-"
      />
    )
  },
  {
    label: "已付金额",
    prop: "paidAmount",
    width: 120,
    align: "right",
    cellRenderer: ({ row }) => (
      <MoneyDisplay
        value={typeof row.paidAmount === "number" ? row.paidAmount : null}
        emptyText="-"
      />
    )
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
    cellRenderer: ({ row }) => (
      <StatusTag status={row.status} statusMap={ORDER_STATUS_TAG_MAP} />
    )
  },
  {
    label: "审核状态",
    prop: "isApproved",
    width: 100,
    cellRenderer: ({ row }) => (
      <StatusTag status={row.isApproved} statusMap={APPROVAL_STATUS_TAG_MAP} />
    )
  },
  {
    label: "物流状态",
    prop: "logisticsStatus",
    width: 100,
    cellRenderer: ({ row }) => (
      <StatusTag
        status={row.logisticsStatus}
        statusMap={LOGISTICS_STATUS_TAG_MAP}
      />
    )
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
