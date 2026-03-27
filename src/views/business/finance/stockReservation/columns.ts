import { formatDateTime } from "@/utils/time";
import type {
  StockReservationRow,
  StockReservationSourceType,
  StockReservationStatus
} from "@/api/business/stock-ledger";

const SOURCE_TYPE_LABELS: Record<StockReservationSourceType, string> = {
  SALE_ALLOCATION: "销售分配",
  SALE_DELIVERY_NOTE: "销售发货",
  SALE_DIRECT_SHIPMENT: "直接发货",
  RESERVE_LOCK: "手工锁库"
};

const STATUS_LABELS: Record<StockReservationStatus, string> = {
  RESERVED: "已预占",
  PICKED: "已拣货",
  RELEASED: "已释放",
  CONSUMED: "已消费"
};

export const columns: TableColumnList = [
  {
    label: "来源类型",
    prop: "sourceType",
    minWidth: 120,
    formatter: ({ sourceType }: StockReservationRow) =>
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
    formatter: ({ batchNo }: StockReservationRow) => batchNo || "-"
  },
  {
    label: "预占数量",
    prop: "reservedQuantity",
    minWidth: 100
  },
  {
    label: "已消费",
    prop: "consumedQuantity",
    minWidth: 100
  },
  {
    label: "剩余预占",
    prop: "remainingQuantity",
    minWidth: 100,
    formatter: ({ reservedQuantity, consumedQuantity }: StockReservationRow) =>
      String(reservedQuantity - consumedQuantity)
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    formatter: ({ status }: StockReservationRow) =>
      STATUS_LABELS[status] || status
  },
  {
    label: "创建时间",
    prop: "createdAt",
    minWidth: 180,
    formatter: ({ createdAt }: StockReservationRow) => formatDateTime(createdAt)
  },
  {
    label: "操作",
    fixed: "right",
    width: 120,
    slot: "operation"
  }
];
