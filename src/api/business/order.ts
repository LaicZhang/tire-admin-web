import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const getOrderPrefix = (type: string) => {
  return `/${type}/`;
};

// ============ 订单 DTO 类型定义 ============

/** 订单详情 DTO */
export interface OrderDetailDto {
  tireId: string;
  count: number;
  total?: number;
  repoId?: string;
  batchNo?: string;
  expiryDate?: string;
}

/** 创建订单请求 DTO */
export interface CreateOrderDto {
  providerId?: string;
  customerId?: string;
  auditorId?: string;
  desc?: string;
  details: OrderDetailDto[];
}

/** 更新订单请求 DTO */
export interface UpdateOrderDto {
  providerId?: string;
  customerId?: string;
  auditorId?: string;
  desc?: string;
  total?: number;
  paidAmount?: number;
  details?: OrderDetailDto[];
}

/** 订单查询参数 DTO */
/** 支付订单请求 DTO */
export interface PayOrderDto {
  total: number;
  paymentId?: string;
}

/** 确认物流状态请求 DTO */
export interface ConfirmLogisticsDto {
  details?: Array<{
    uid: string;
    batchNo?: string;
    expiryDate?: string;
  }>;
}

export interface OrderQueryDto {
  orderStatus?: number;
  logisticsStatus?: number;
  isApproved?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

// ============ 通用订单 API ============

export async function getOrderListApi(
  type: string,
  index: number,
  params?: OrderQueryDto
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(getOrderPrefix(type) + "page/" + index),
    { params }
  );
}

export async function addOrderApi(type: string, data: CreateOrderDto) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(getOrderPrefix(type)),
    {
      data
    }
  );
}

export async function getOrderApi(type: string, uid: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(getOrderPrefix(type) + uid)
  );
}

export async function updateOrderApi(
  type: string,
  uid: string,
  data: UpdateOrderDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(getOrderPrefix(type) + uid),
    {
      data
    }
  );
}

export async function deleteOrderApi(type: string, uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(getOrderPrefix(type) + uid)
  );
}

// 采购订单特定接口
export async function getPurchaseOrderCountApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/purchase-order/count")
  );
}

export async function payPurchaseOrderApi(uid: string, data: PayOrderDto) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/purchase-order/pay/${uid}`),
    { data }
  );
}

export async function createPurchaseOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/purchase-order/detail/${uid}`)
  );
}

export async function updatePurchaseOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/purchase-order/detail/${uid}`),
    { data }
  );
}

export async function deletePurchaseOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/purchase-order/detail/${uid}`)
  );
}

export async function confirmPurchaseOrderArrivalApi(
  uid: string,
  data: ConfirmLogisticsDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/purchase-order/confirm-arrival/${uid}`),
    { data }
  );
}

// 销售订单特定接口
export async function getSaleOrderCountApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/sale-order/count")
  );
}

export async function paySaleOrderApi(uid: string, data: PayOrderDto) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/sale-order/pay/${uid}`),
    { data }
  );
}

export async function createSaleOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/sale-order/detail/${uid}`)
  );
}

export async function updateSaleOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/sale-order/detail/${uid}`),
    { data }
  );
}

export async function deleteSaleOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/sale-order/detail/${uid}`)
  );
}

export async function confirmSaleOrderShipmentApi(
  uid: string,
  data: ConfirmLogisticsDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/sale-order/confirm-shipment/${uid}`),
    { data }
  );
}

export async function confirmSaleOrderDeliveryApi(
  uid: string,
  data: ConfirmLogisticsDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/sale-order/confirm-delivery/${uid}`),
    { data }
  );
}

// 索赔订单特定接口
export async function getClaimOrderCountApi(params?: OrderQueryDto) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/claim-order/count"),
    { params }
  );
}

export async function createClaimOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/claim-order/detail/${uid}`)
  );
}

export async function updateClaimOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/claim-order/detail/${uid}`),
    { data }
  );
}

export async function deleteClaimOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/claim-order/detail/${uid}`)
  );
}

export async function processClaimOrderPaymentApi(
  uid: string,
  data: { fee: number; isReceive: boolean }
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/claim-order/payment/${uid}`),
    { data }
  );
}

// 退货订单特定接口
export async function confirmReturnOrderCustomerArrivalApi(
  uid: string,
  data: ConfirmLogisticsDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/return-order/customer-arrival/${uid}`),
    { data }
  );
}

export async function confirmReturnOrderProviderShipmentApi(
  uid: string,
  data: ConfirmLogisticsDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/return-order/provider-shipment/${uid}`),
    { data }
  );
}

export async function confirmReturnOrderProviderDeliveryApi(
  uid: string,
  data: ConfirmLogisticsDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/return-order/provider-delivery/${uid}`),
    { data }
  );
}

export async function refundReturnOrderApi(uid: string, data: { fee: number }) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/return-order/refund/${uid}`),
    { data }
  );
}

export async function getReturnOrderExchangeListApi(
  index: number,
  params?: OrderQueryDto
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(`/return-order/exchange/page/${index}`),
    { params }
  );
}

// 调拨订单特定接口
export async function confirmTransferOrderShipmentApi(
  uid: string,
  data: ConfirmLogisticsDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/transfer-order/confirm-shipment/${uid}`),
    { data }
  );
}

export async function confirmTransferOrderArrivalApi(
  uid: string,
  data: ConfirmLogisticsDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/transfer-order/confirm-arrival/${uid}`),
    { data }
  );
}

// 报废订单特定接口
export async function createWasteOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/waste-order/detail/${uid}`),
    { data }
  );
}

export async function updateWasteOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/waste-order/detail/${uid}`),
    { data }
  );
}

export async function deleteWasteOrderDetailApi(uid: string, detailId: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/waste-order/detail/${uid}/${detailId}`)
  );
}

// 订单作废相关接口
export async function reverseSaleOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/sale-order/reverse/${uid}`),
    { data: { reason } }
  );
}

export async function reversePurchaseOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/purchase-order/reverse/${uid}`),
    { data: { reason } }
  );
}

export async function reverseReturnOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/return-order/reverse/${uid}`),
    { data: { reason } }
  );
}

export async function reverseWasteOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/waste-order/reverse/${uid}`),
    { data: { reason } }
  );
}

export async function reverseClaimOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/claim-order/reverse/${uid}`),
    { data: { reason } }
  );
}

export async function reverseSurplusOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/surplus-order/reverse/${uid}`),
    { data: { reason } }
  );
}

// 调拨订单明细管理
export async function createTransferOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/transfer-order/detail/${uid}`),
    { data }
  );
}

export async function updateTransferOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/transfer-order/detail/${uid}`),
    { data }
  );
}

export async function deleteTransferOrderDetailApi(
  uid: string,
  detailId: string
) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/transfer-order/detail/${uid}/${detailId}`)
  );
}

// 盘盈订单明细管理
export async function createSurplusOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/surplus-order/detail/${uid}`),
    { data }
  );
}

export async function updateSurplusOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/surplus-order/detail/${uid}`),
    { data }
  );
}

export async function deleteSurplusOrderDetailApi(
  uid: string,
  detailId: string
) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/surplus-order/detail/${uid}/${detailId}`)
  );
}

// 审核相关
const prefix = "/audit/";

export async function getAuditorListApi(type: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "auditor/" + type)
  );
}

// 获取待审核订单列表
export async function getPendingAuditOrdersApi(
  type: string,
  index: number,
  params?: OrderQueryDto
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "pending/" + type + "/page/" + index),
    { params }
  );
}
