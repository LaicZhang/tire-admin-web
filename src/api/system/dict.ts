import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/system/dict/";

export async function getDictListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function createDictApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function updateDictApi(id: number, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + id), {
    data
  });
}

export async function deleteDictApi(id: number) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + id));
}
