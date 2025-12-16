import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/packing-box/";

export async function createPackingBoxApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getPackingBoxListApi(params?: object) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix), {
    params
  });
}

export async function addPackingBoxItemApi(id: number, data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + id + "/item"),
    {
      data
    }
  );
}
