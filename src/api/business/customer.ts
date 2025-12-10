import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import { getCompanyId } from "../company";

const prefix = "/customer/";

const cid = getCompanyId();

export async function getCustomerListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addCustomerApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getCustomerApi(uid = cid) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateCustomerApi(uid, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteCustomerApi(uid) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

export async function migrateCustomerApi(uid: string, data: { uid: string }) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + "migrate/" + uid),
    { data }
  );
}

export async function createCustomerDebtProfileApi(
  uid: string,
  data: {
    idCardImageUrl: string;
    iouImageUrl: string;
    liveImageUrl: string;
    phone: string;
  }
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "debt-profile/" + uid),
    { data }
  );
}

export async function getCustomerDebtProfileApi(uid: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "debt-profile/" + uid)
  );
}
