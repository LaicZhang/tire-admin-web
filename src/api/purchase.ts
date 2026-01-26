import {
  addOrderApi,
  confirmPurchaseOrderArrivalApi,
  confirmReturnOrderArrivalApi,
  confirmReturnOrderDeliveryApi,
  confirmReturnOrderShipmentApi,
  deleteOrderApi,
  getOrderApi,
  getOrderListApi,
  payPurchaseOrderApi,
  refundReturnOrderApi,
  updateOrderApi,
  type OrderQueryDto
} from "./business/order";

export const PURCHASE_ORDER_TYPE = "purchase-order" as const;
export const PURCHASE_INBOUND_ORDER_TYPE = "purchase-inbound" as const;
/**
 * `return-order` 目前为销售/采购共用的退货单模块；
 * 业务侧需用 `customerId` / `providerId` 区分来源。
 */
export const PURCHASE_RETURN_ORDER_TYPE = "return-order" as const;

export function getPurchaseOrderListApi(index: number, params?: OrderQueryDto) {
  return getOrderListApi(PURCHASE_ORDER_TYPE, index, params);
}

export function getPurchaseOrderApi(uid: string) {
  return getOrderApi(PURCHASE_ORDER_TYPE, uid);
}

export function createPurchaseOrderApi(
  data: Parameters<typeof addOrderApi>[1]
) {
  return addOrderApi(PURCHASE_ORDER_TYPE, data);
}

export function updatePurchaseOrderApi(
  uid: string,
  data: Parameters<typeof updateOrderApi>[2]
) {
  return updateOrderApi(PURCHASE_ORDER_TYPE, uid, data);
}

export function deletePurchaseOrderApi(uid: string) {
  return deleteOrderApi(PURCHASE_ORDER_TYPE, uid);
}

export function getPurchaseInboundListApi(
  index: number,
  params?: OrderQueryDto
) {
  return getOrderListApi(PURCHASE_INBOUND_ORDER_TYPE, index, params);
}

export function getPurchaseInboundApi(uid: string) {
  return getOrderApi(PURCHASE_INBOUND_ORDER_TYPE, uid);
}

export function createPurchaseInboundApi(
  data: Parameters<typeof addOrderApi>[1]
) {
  return addOrderApi(PURCHASE_INBOUND_ORDER_TYPE, data);
}

export function updatePurchaseInboundApi(
  uid: string,
  data: Parameters<typeof updateOrderApi>[2]
) {
  return updateOrderApi(PURCHASE_INBOUND_ORDER_TYPE, uid, data);
}

export function deletePurchaseInboundApi(uid: string) {
  return deleteOrderApi(PURCHASE_INBOUND_ORDER_TYPE, uid);
}

export function getPurchaseReturnOrderListApi(
  index: number,
  params?: OrderQueryDto
) {
  return getOrderListApi(PURCHASE_RETURN_ORDER_TYPE, index, params);
}

export function getPurchaseReturnOrderApi(uid: string) {
  return getOrderApi(PURCHASE_RETURN_ORDER_TYPE, uid);
}

export function createPurchaseReturnOrderApi(
  data: Parameters<typeof addOrderApi>[1]
) {
  return addOrderApi(PURCHASE_RETURN_ORDER_TYPE, data);
}

export function updatePurchaseReturnOrderApi(
  uid: string,
  data: Parameters<typeof updateOrderApi>[2]
) {
  return updateOrderApi(PURCHASE_RETURN_ORDER_TYPE, uid, data);
}

export function deletePurchaseReturnOrderApi(uid: string) {
  return deleteOrderApi(PURCHASE_RETURN_ORDER_TYPE, uid);
}

export {
  payPurchaseOrderApi,
  confirmPurchaseOrderArrivalApi,
  confirmReturnOrderArrivalApi,
  confirmReturnOrderShipmentApi,
  confirmReturnOrderDeliveryApi,
  refundReturnOrderApi
};
