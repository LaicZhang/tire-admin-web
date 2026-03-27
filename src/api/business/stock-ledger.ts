import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export type StockReservationStatus =
  | "RESERVED"
  | "PICKED"
  | "RELEASED"
  | "CONSUMED";

export type StockReservationSourceType =
  | "SALE_ALLOCATION"
  | "SALE_DELIVERY_NOTE"
  | "SALE_DIRECT_SHIPMENT"
  | "RESERVE_LOCK";

export type StockMovementSourceType =
  | "SALE_ALLOCATION"
  | "SALE_PICKING"
  | "SALE_DELIVERY_NOTE"
  | "SALE_DIRECT_SHIPMENT"
  | "RESERVE_LOCK"
  | "PURCHASE_INBOUND"
  | "TRANSFER_SHIPMENT"
  | "TRANSFER_ARRIVAL"
  | "RETURN_FROM_CUSTOMER_ARRIVAL"
  | "RETURN_TO_PROVIDER_SHIPMENT"
  | "RETURN_TO_PROVIDER_DELIVERY"
  | "BATCH_TRANSACTION"
  | "STOCK_TAKING";

export type StockLedgerStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "PICKED"
  | "IN_TRANSIT"
  | "QC"
  | "FROZEN";

export interface StockBalanceRow {
  id: number;
  uid: string;
  repoId: string;
  tireId: string;
  batchId?: number | null;
  batchNo?: string | null;
  productionDate?: string | null;
  expiryDate?: string | null;
  onHandQuantity?: number;
  availableQuantity: number;
  reservedQuantity: number;
  pickedQuantity: number;
  inTransitQuantity: number;
  qcQuantity: number;
  frozenQuantity: number;
  atpQuantity: number;
  tire?: { name?: string | null } | null;
  repo?: { name?: string | null } | null;
}

export interface StockBalanceQuery {
  repoId?: string;
  tireId?: string;
  batchNo?: string;
  limit?: number;
}

export interface StockReservationRow {
  id: number;
  uid: string;
  repoId: string;
  tireId: string;
  batchId?: number | null;
  batchNo?: string | null;
  productionDate?: string | null;
  expiryDate?: string | null;
  sourceDomain: "SALES" | "INVENTORY";
  sourceType: StockReservationSourceType;
  sourceUid: string;
  sourceLineUid?: string | null;
  saleOrderUid?: string | null;
  saleOrderDetailUid?: string | null;
  deliveryNoteUid?: string | null;
  deliveryNoteLineUid?: string | null;
  reservedQuantity: number;
  consumedQuantity: number;
  status: StockReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StockReservationQuery {
  repoId?: string;
  tireId?: string;
  sourceType?: StockReservationSourceType;
  sourceUid?: string;
  status?: StockReservationStatus;
}

export interface StockMovementRow {
  id: number;
  uid: string;
  repoId: string;
  tireId: string;
  batchId?: number | null;
  batchNo?: string | null;
  productionDate?: string | null;
  expiryDate?: string | null;
  sourceDomain: "SALES" | "INVENTORY";
  sourceType: StockMovementSourceType;
  sourceUid: string;
  sourceLineUid?: string | null;
  saleOrderUid?: string | null;
  saleOrderDetailUid?: string | null;
  deliveryNoteUid?: string | null;
  deliveryNoteLineUid?: string | null;
  operatorId: string;
  fromStatus: StockLedgerStatus;
  toStatus: StockLedgerStatus;
  quantity: number;
  createdAt: string;
}

export interface StockMovementQuery {
  repoId?: string;
  tireId?: string;
  sourceType?: StockMovementSourceType;
  sourceUid?: string;
  fromStatus?: StockLedgerStatus;
  toStatus?: StockLedgerStatus;
}

export function getStockReservationPage(
  index = 1,
  params?: StockReservationQuery
) {
  return http.request<
    CommonResult<{ count: number; list: StockReservationRow[] }>
  >("get", baseUrlApi(`/stock-ledger/reservations/${index}`), {
    params
  });
}

export function getStockBalancePage(index = 1, params?: StockBalanceQuery) {
  return http.request<CommonResult<{ count: number; list: StockBalanceRow[] }>>(
    "get",
    baseUrlApi(`/stock-ledger/page/${index}`),
    {
      params
    }
  );
}

export function getStockMovementPage(index = 1, params?: StockMovementQuery) {
  return http.request<
    CommonResult<{ count: number; list: StockMovementRow[] }>
  >("get", baseUrlApi(`/stock-ledger/movements/${index}`), {
    params
  });
}
