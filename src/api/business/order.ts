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
