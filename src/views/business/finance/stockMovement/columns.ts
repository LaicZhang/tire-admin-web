import { formatDateTime } from "@/utils/time";
import type {
  StockLedgerStatus,
  StockMovementRow,
  StockMovementSourceType
} from "@/api/business/stock-ledger";

const SOURCE_TYPE_LABELS: Record<StockMovementSourceType, string> = {
  SALE_ALLOCATION: "销售分配",
  SALE_PICKING: "销售拣货",
  SALE_DELIVERY_NOTE: "销售发货",
  SALE_DIRECT_SHIPMENT: "直接发货",
  RESERVE_LOCK: "手工锁库",
  PURCHASE_INBOUND: "采购入库",
  TRANSFER_SHIPMENT: "调拨发货",
  TRANSFER_ARRIVAL: "调拨到货",
  RETURN_FROM_CUSTOMER_ARRIVAL: "客户退货到货",
  RETURN_TO_PROVIDER_SHIPMENT: "退供应商发货",
  RETURN_TO_PROVIDER_DELIVERY: "退供应商送达",
  BATCH_TRANSACTION: "批次交易",
  STOCK_TAKING: "库存盘点"
};

const STATUS_LABELS: Record<StockLedgerStatus, string> = {
  AVAILABLE: "可用",
  RESERVED: "已预占",
  PICKED: "已拣货",
  IN_TRANSIT: "在途",
  QC: "质检",
  FROZEN: "冻结"
};

export const columns: TableColumnList = [
  {
    label: "来源类型",
    prop: "sourceType",
    minWidth: 140,
    formatter: ({ sourceType }: StockMovementRow) =>
      SOURCE_TYPE_LABELS[sourceType] || sourceType
  },
  {
    label: "来源单号",
    prop: "sourceUid",
    minWidth: 180
  },
  {
    label: "仓库",
    prop: "repoId",
    minWidth: 140
  },
  {
    label: "轮胎",
    prop: "tireId",
    minWidth: 140
  },
  {
    label: "批次",
    prop: "batchNo",
    minWidth: 120,
    formatter: ({ batchNo }: StockMovementRow) => batchNo || "-"
  },
  {
    label: "状态迁移",
    prop: "statusTransition",
    minWidth: 160,
    formatter: ({ fromStatus, toStatus }: StockMovementRow) =>
      `${STATUS_LABELS[fromStatus] || fromStatus} -> ${STATUS_LABELS[toStatus] || toStatus}`
  },
  {
    label: "数量",
    prop: "quantity",
    minWidth: 100
  },
  {
    label: "创建时间",
    prop: "createdAt",
    minWidth: 180,
    formatter: ({ createdAt }: StockMovementRow) => formatDateTime(createdAt)
  },
  {
    label: "操作",
    fixed: "right",
    width: 120,
    slot: "operation"
  }
];
