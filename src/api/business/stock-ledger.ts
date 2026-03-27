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
