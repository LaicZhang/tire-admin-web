import {
  addOrderApi,
  confirmReturnOrderArrivalApi,
  confirmSaleOrderDeliveryApi,
  confirmSaleOrderShipmentApi,
  deleteOrderApi,
  getOrderListApi,
  paySaleOrderApi,
  refundReturnOrderApi,
  updateOrderApi,
  type OrderQueryDto
} from "./business/order";

export const SALES_ORDER_TYPE = "sale-order" as const;
export const SALES_RETURN_ORDER_TYPE = "return-order" as const;
export const SALES_OUTBOUND_ORDER_TYPE = "sale-outbound" as const;

export function getSalesOrderListApi(index: number, params?: OrderQueryDto) {
  return getOrderListApi(SALES_ORDER_TYPE, index, params);
}

export function createSalesOrderApi(data: Parameters<typeof addOrderApi>[1]) {
  return addOrderApi(SALES_ORDER_TYPE, data);
}

export function updateSalesOrderApi(
  uid: string,
  data: Parameters<typeof updateOrderApi>[2]
) {
  return updateOrderApi(SALES_ORDER_TYPE, uid, data);
}

export function deleteSalesOrderApi(uid: string) {
  return deleteOrderApi(SALES_ORDER_TYPE, uid);
}

export function getSalesReturnOrderListApi(
  index: number,
  params?: OrderQueryDto
) {
  return getOrderListApi(SALES_RETURN_ORDER_TYPE, index, params);
}

export function createSalesReturnOrderApi(
  data: Parameters<typeof addOrderApi>[1]
) {
  return addOrderApi(SALES_RETURN_ORDER_TYPE, data);
}

export function updateSalesReturnOrderApi(
  uid: string,
  data: Parameters<typeof updateOrderApi>[2]
) {
  return updateOrderApi(SALES_RETURN_ORDER_TYPE, uid, data);
}

export function deleteSalesReturnOrderApi(uid: string) {
  return deleteOrderApi(SALES_RETURN_ORDER_TYPE, uid);
}

export function getSalesOutboundListApi(index: number, params?: OrderQueryDto) {
  return getOrderListApi(SALES_OUTBOUND_ORDER_TYPE, index, params);
}

export function createSalesOutboundApi(
  data: Parameters<typeof addOrderApi>[1]
) {
  return addOrderApi(SALES_OUTBOUND_ORDER_TYPE, data);
}

export function updateSalesOutboundApi(
  uid: string,
  data: Parameters<typeof updateOrderApi>[2]
) {
  return updateOrderApi(SALES_OUTBOUND_ORDER_TYPE, uid, data);
}

export function deleteSalesOutboundApi(uid: string) {
  return deleteOrderApi(SALES_OUTBOUND_ORDER_TYPE, uid);
}

export {
  paySaleOrderApi,
  confirmSaleOrderShipmentApi,
  confirmSaleOrderDeliveryApi,
  confirmReturnOrderArrivalApi,
  refundReturnOrderApi
};
