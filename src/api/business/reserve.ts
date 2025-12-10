import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/reserve/";

export async function getReserveListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addReserveApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getReserveApi(id: number) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + id));
}

export async function updateReserveApi(id: number, data?: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + id), {
    data
  });
}

export async function deleteReserveApi(id: number) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + id));
}
