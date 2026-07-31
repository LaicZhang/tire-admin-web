import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

export type ServiceWorkOrderStatus =
  | "DRAFT"
  | "RECEIVED"
  | "INSPECTING"
  | "QUOTED"
  | "IN_SERVICE"
  | "AWAITING_PAYMENT"
  | "CONVERTED"
  | "COMPLETED"
  | "CANCELLED";

export type ServiceWorkOrderLineType = "PACKAGE" | "TIRE" | "SERVICE";

export interface ServiceWorkOrderLine {
  uid: string;
  lineType: ServiceWorkOrderLineType;
  tireId?: string | null;
  packageUid?: string | null;
  repoId?: string | null;
  qty: number;
  unitPrice: number | string;
  sortOrder?: number;
  remark?: string | null;
  snapshotJson?: unknown;
  tireName?: string | null;
}

export interface ServiceWorkOrderItem {
  uid: string;
  billNo?: string | null;
  status: ServiceWorkOrderStatus;
  storeId: string;
  customerId?: string | null;
  vehiclePlateNo?: string | null;
  vehicleVin?: string | null;
  vehicleModel?: string | null;
  contactPhone?: string | null;
  mileageKm?: number | null;
  inspectionNotes?: string | null;
  quoteNotes?: string | null;
  remark?: string | null;
  saleOrderUid?: string | null;
  receiptOrderUid?: string | null;
  createAt?: string;
  updateAt?: string;
  store?: { uid?: string; name?: string | null } | null;
  customer?: { uid?: string; name?: string | null } | null;
  lines?: ServiceWorkOrderLine[];
}

export interface CreateServiceWorkOrderPayload {
  storeId: string;
  customerId?: string;
  vehiclePlateNo?: string;
  vehicleVin?: string;
  vehicleModel?: string;
  contactPhone?: string;
  mileageKm?: number;
  remark?: string;
}

export interface UpdateServiceWorkOrderPayload {
  status?: ServiceWorkOrderStatus;
  vehiclePlateNo?: string;
  vehicleVin?: string;
  vehicleModel?: string;
  contactPhone?: string;
  mileageKm?: number;
  inspectionNotes?: string;
  quoteNotes?: string;
  remark?: string;
}

export interface AddServiceWorkOrderLinePayload {
  lineType: ServiceWorkOrderLineType;
  tireId?: string;
  packageUid?: string;
  repoId?: string;
  qty: number;
  unitPrice: number;
  sortOrder?: number;
  remark?: string | null;
}

export interface AddPackageToWorkOrderPayload {
  packageUid: string;
  multiplier?: number;
  repoId?: string;
}

export interface CheckoutServiceWorkOrderPayload {
  paymentId?: string;
  paymentMethod?: string;
  remark?: string | null;
}

const prefix = "/service-work-order";

export function getServiceWorkOrderListApi(
  index: number,
  params?: { status?: string }
) {
  return http.request<CommonResult<PaginatedResponseDto<ServiceWorkOrderItem>>>(
    "get",
    baseUrlApi(`${prefix}/page/${index}`),
    { params }
  );
}

export function getServiceWorkOrderApi(uid: string) {
  return http.request<CommonResult<ServiceWorkOrderItem>>(
    "get",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

export function createServiceWorkOrderApi(data: CreateServiceWorkOrderPayload) {
  return http.request<CommonResult<ServiceWorkOrderItem>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export function updateServiceWorkOrderApi(
  uid: string,
  data: UpdateServiceWorkOrderPayload
) {
  return http.request<CommonResult<ServiceWorkOrderItem>>(
    "patch",
    baseUrlApi(`${prefix}/${uid}`),
    { data }
  );
}

export function addServiceWorkOrderLineApi(
  uid: string,
  data: AddServiceWorkOrderLinePayload
) {
  return http.request<CommonResult<ServiceWorkOrderItem>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/lines`),
    { data }
  );
}

export function addPackageToServiceWorkOrderApi(
  uid: string,
  data: AddPackageToWorkOrderPayload
) {
  return http.request<CommonResult<ServiceWorkOrderItem>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/add-package`),
    { data }
  );
}

export function removeServiceWorkOrderLineApi(uid: string, lineUid: string) {
  return http.request<CommonResult<ServiceWorkOrderItem>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}/lines/${lineUid}`)
  );
}

/** Link an existing sale order (compat path). */
export function convertServiceWorkOrderApi(
  uid: string,
  data: { saleOrderUid: string }
) {
  return http.request<CommonResult<ServiceWorkOrderItem>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/convert`),
    { data }
  );
}

/** Primary path: generate draft SaleOrder from work-order lines. */
export function generateSaleOrderFromWorkOrderApi(uid: string) {
  return http.request<CommonResult<ServiceWorkOrderItem>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/generate-sale-order`)
  );
}

export function checkoutServiceWorkOrderApi(
  uid: string,
  data?: CheckoutServiceWorkOrderPayload
) {
  return http.request<CommonResult<ServiceWorkOrderItem>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/checkout`),
    { data: data ?? {} }
  );
}
