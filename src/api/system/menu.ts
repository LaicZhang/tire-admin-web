import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/system/menu/";

export async function getMenuListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "list"), {
    params
  });
}

export async function createMenuApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function updateMenuApi(id: number, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + id), {
    data
  });
}

export async function deleteMenuApi(id: number) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + id));
}
