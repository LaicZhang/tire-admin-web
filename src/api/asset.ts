import { http } from "../utils/http";
import { baseUrlApi } from "./utils";
import type { CommonResult, PaginatedResponseDto } from "./type";

const prefix = "/asset/";

export interface Asset {
  uid: string;
  name: string;
  type: number;
  count: number;
  unit: string;
  initValue: { value: number };
  currentValue: { value: number };
  monthlyDepreciation: { value: number };
  status: boolean;
  isAuto: boolean;
  desc?: string;
  createdAt?: string;
  deleteAt?: string;
}

export interface AssetQueryDto {
  name?: string;
  scope?: "nonDeleted" | "deleted" | "all";
  pageSize?: number;
}

export interface AssetCreateDto {
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
}

export type AssetUpdateDto = Partial<
  Omit<AssetCreateDto, "company" | "creator">
>;

export async function getAssetListApi(index: number, params?: AssetQueryDto) {
  return await http.request<CommonResult<PaginatedResponseDto<Asset>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addAssetApi(data: AssetCreateDto) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getAssetApi(uid: string) {
  return await http.request<CommonResult<Asset>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateAssetApi(uid: string, data: AssetUpdateDto) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteAssetApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

export async function restoreAssetApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + uid + "/restore")
  );
}
