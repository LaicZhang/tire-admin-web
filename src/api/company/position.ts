import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import { getCompanyId } from "../company";

const prefix = "/role/";

const cid = getCompanyId();

export async function getPositionListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addPositionApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getPositionApi(uid = cid) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updatePositionApi(uid, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deletePositionApi(uid) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

export async function getPositionMenuUidsApi(uid: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(`${prefix}${uid}/menus`)
  );
}

export async function setPositionMenusApi(uid: string, menuUids: string[]) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`${prefix}${uid}/menus`),
    {
      data: { menuUids }
    }
  );
}
