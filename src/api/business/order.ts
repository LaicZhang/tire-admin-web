import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import { getCompanyId } from "../company";

const getOrderPrefix = (type: string) => {
  return `/${type}/`;
};

const cid = getCompanyId();

export async function getOrderListApi(
  type: string,
  index: number,
  params?: object
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(getOrderPrefix(type) + "page/" + index),
    { params }
  );
}

export async function addOrderApi(type: string, data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(getOrderPrefix(type)),
    {
      data
    }
  );
}

export async function getOrderApi(type: string, uid = cid) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(getOrderPrefix(type) + uid)
  );
}

export async function updateOrderApi(type: string, uid, data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(getOrderPrefix(type) + uid),
    {
      data
    }
  );
}

export async function deleteOrderApi(type: string, uid) {
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

export async function payPurchaseOrderApi(uid: string, data: object) {
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

export async function updatePurchaseOrderDetailApi(uid: string, data: object) {
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
  data: object
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

export async function paySaleOrderApi(uid: string, data: object) {
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

export async function updateSaleOrderDetailApi(uid: string, data: object) {
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

export async function confirmSaleOrderShipmentApi(uid: string, data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/sale-order/confirm-shipment/${uid}`),
    { data }
  );
}

export async function confirmSaleOrderDeliveryApi(uid: string, data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/sale-order/confirm-delivery/${uid}`),
    { data }
  );
}

// 索赔订单特定接口
export async function getClaimOrderCountApi(params?: object) {
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

export async function updateClaimOrderDetailApi(uid: string, data: object) {
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

// 审核相关
const prefix = "/audit/";

export async function getAuditorListApi(type: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "auditor/" + type)
  );
}
