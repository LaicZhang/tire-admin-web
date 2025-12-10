import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult } from "./type";

const prefix = "/asset/";

export async function getAssetListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addAssetApi(data: {
  company: { connect: { uid: string } };
  count: number;
  creator: { connect: { uid: string } };
  currentValue: { value: number };
  initValue: { value: number };
  monthlyDepreciation: { value: number };
  name: string;
  status: boolean;
  type: number;
  desc?: string;
  isAuto?: boolean;
  unit?: string;
}) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getAssetApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateAssetApi(uid: string, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteAssetApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}
