import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import { getCompanyId } from "../company";
import type { ORDER_TYPE } from "@/utils";

const getOrderPrefix = (type: ORDER_TYPE) => {
  return `/${type}/`;
};

const cid = getCompanyId();

export async function getOrderListApi(
  type: ORDER_TYPE,
  index: number,
  params?: object
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(getOrderPrefix(type) + "page/" + index),
    { params }
  );
}

export async function addOrderApi(type: ORDER_TYPE, data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(getOrderPrefix(type)),
    {
      data
    }
  );
}

export async function getOrderApi(type: ORDER_TYPE, uid = cid) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(getOrderPrefix(type) + uid)
  );
}

export async function updateOrderApi(type: ORDER_TYPE, uid, data: object) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(getOrderPrefix(type) + uid),
    {
      data
    }
  );
}

export async function deleteOrderApi(type: ORDER_TYPE, uid) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(getOrderPrefix(type) + uid)
  );
}
