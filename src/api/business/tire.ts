import { http } from "../../utils/http";
import { baseUrlApi } from "./../utils";
import type { CommonResult } from "./../type";
import { createCrudApi } from "../utils/crud-factory";

const prefix = "/tire/";

export interface TireQueryDto {
  keyword?: string;
  group?: string;
}

/** 商品DTO - 创建/更新时使用 */
export interface TireDto {
  name: string;
  number?: string;
  /** 后端字段有历史兼容：barcode/barCode */
  barcode?: string;
  barCode?: string;
  group?: string;
  brand?: string;
  pattern?: string;
  loadIndex?: string;
  speedLevel?: string;
  format?: string;
  weight?: number;
  price?: number;
  cost?: number;
  purchasePriceWithTax?: number;
  purchasePrice?: number;
  salePriceWithTax?: number;
  salePrice?: number;
  unit?: string;
  unitId?: string;
  enableMultiUnit?: boolean;
  commissionType?: number;
  commission?: string;
  desc?: string;
}

/** 商品封面 */
export interface TireCover {
  id: number;
  hash: string;
  ext: string;
}

/** 单位换算关系 */
export interface TireUnitConversion {
  id: number;
  uid: string;
  sourceUnitId: string;
  targetUnitId: string;
  ratio: number;
}

/** 商品实体 - API返回时使用 */
export interface Tire extends TireDto {
  uid: string;
  id: number;
  covers?: TireCover[];
  unitConversions?: TireUnitConversion[];
  createdAt?: string;
  updatedAt?: string;
}

// ============ 标准 CRUD API (使用工厂函数) ============

const baseTireApi = createCrudApi<Tire, TireQueryDto, TireDto>({
  prefix: prefix,
  enableBatch: true
});

/** 获取商品分页列表 */
export const getTireListApi = baseTireApi.getList;

/** 创建商品 */
export const addTireApi = baseTireApi.add;

/** 获取商品详情 */
export const getTireApi = baseTireApi.get;

/** 更新商品 */
export const updateTireApi = baseTireApi.update;

/** 删除商品 */
export const deleteTireApi = baseTireApi.delete;

/** 批量获取商品 */
export const getTireBatchApi = baseTireApi.batch as NonNullable<
  typeof baseTireApi.batch
>;

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
