import { http } from "../../utils/http";
import { baseUrlApi } from "./../utils";
import type { CommonResult, PaginatedResponseDto } from "./../type";

const prefix = "/tire/";

export interface TireQueryDto {
  keyword?: string;
  group?: string;
}

export interface TireDto {
  name: string;
  number?: string;
  barCode?: string;
  group?: string;
  brand?: string;
  price?: number;
  cost?: number;
  desc?: string;
}

export interface Tire extends TireDto {
  uid: string;
  id: number;
  covers?: Array<{
    id: number;
    hash: string;
    ext: string;
  }>;
}

export async function getTireListApi(index: number, params?: TireQueryDto) {
  return await http.request<CommonResult<PaginatedResponseDto<Tire>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addTireApi(data: TireDto) {
  return await http.request<CommonResult<Tire>>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getTireApi(uid: string) {
  return await http.request<CommonResult<Tire>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateTireApi(uid: string, data: Partial<TireDto>) {
  return await http.request<CommonResult<Tire>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function deleteTireApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

// ============ 商品查询扩展 ============

/** 按条码查询商品 */
export async function getTireByBarcodeApi(code: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "barcode/" + code)
  );
}

/** 按分组查询商品 */
export async function getTireByGroupApi(group: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "group/" + group)
  );
}

/** 按名称查询商品 */
export async function getTireByNameApi(name: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "name/" + name)
  );
}

// ============ 商品封面管理 ============

/** 添加商品封面 */
export async function addTireCoverApi(tireId: string, staticId: number) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + `cover/${tireId}/${staticId}`)
  );
}

/** 删除商品封面 */
export async function deleteTireCoverApi(tireId: string, coverId: number) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + `cover/${tireId}/${coverId}`)
  );
}

/** 批量获取商品 */
export async function getTireBatchApi(uids: string[]) {
  return await http.request<CommonResult<Tire[]>>(
    "post",
    baseUrlApi(prefix + "batch"),
    { data: { uids } }
  );
}
