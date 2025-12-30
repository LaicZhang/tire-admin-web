import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

// ============ 通用类别接口 ============

/** 树形类别项 */
export interface TreeCategoryItem {
  id: number;
  uid: string;
  name: string;
  parentId: number | null;
  parentUid: string | null;
  sort: number;
  level: number;
  children?: TreeCategoryItem[];
}

/** 扁平类别项 */
export interface FlatCategoryItem {
  id: number;
  uid: string;
  code: string;
  name: string;
  sort: number;
  remark?: string;
}

/** 创建树形类别 DTO */
export interface CreateTreeCategoryDto {
  name: string;
  parentUid?: string | null;
  sort?: number;
}

/** 创建扁平类别 DTO */
export interface CreateFlatCategoryDto {
  code: string;
  name: string;
  sort?: number;
  remark?: string;
}

// ============ 商品类别 (树形) ============

const productCategoryPrefix = "/product-category/";

export async function getProductCategoryTreeApi() {
  return await http.request<CommonResult<TreeCategoryItem[]>>(
    "get",
    baseUrlApi(productCategoryPrefix + "tree")
  );
}

export async function getProductCategoryListApi(
  index: number,
  params?: object
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<TreeCategoryItem>>
  >("get", baseUrlApi(productCategoryPrefix + "page/" + index), { params });
}

export async function createProductCategoryApi(data: CreateTreeCategoryDto) {
  return await http.request<CommonResult<TreeCategoryItem>>(
    "post",
    baseUrlApi(productCategoryPrefix),
    { data }
  );
}

export async function updateProductCategoryApi(
  uid: string,
  data: Partial<CreateTreeCategoryDto>
) {
  return await http.request<CommonResult<TreeCategoryItem>>(
    "patch",
    baseUrlApi(productCategoryPrefix + uid),
    { data }
  );
}

export async function deleteProductCategoryApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(productCategoryPrefix + uid)
  );
}

// ============ 客户类别 (树形) ============

const customerCategoryPrefix = "/customer-category/";

export async function getCustomerCategoryTreeApi() {
  return await http.request<CommonResult<TreeCategoryItem[]>>(
    "get",
    baseUrlApi(customerCategoryPrefix + "tree")
  );
}

export async function getCustomerCategoryListApi(
  index: number,
  params?: object
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<TreeCategoryItem>>
  >("get", baseUrlApi(customerCategoryPrefix + "page/" + index), { params });
}

export async function createCustomerCategoryApi(data: CreateTreeCategoryDto) {
  return await http.request<CommonResult<TreeCategoryItem>>(
    "post",
    baseUrlApi(customerCategoryPrefix),
    { data }
  );
}

export async function updateCustomerCategoryApi(
  uid: string,
  data: Partial<CreateTreeCategoryDto>
) {
  return await http.request<CommonResult<TreeCategoryItem>>(
    "patch",
    baseUrlApi(customerCategoryPrefix + uid),
    { data }
  );
}

export async function deleteCustomerCategoryApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(customerCategoryPrefix + uid)
  );
}

// ============ 供应商类别 (树形) ============

const supplierCategoryPrefix = "/supplier-category/";

export async function getSupplierCategoryTreeApi() {
  return await http.request<CommonResult<TreeCategoryItem[]>>(
    "get",
    baseUrlApi(supplierCategoryPrefix + "tree")
  );
}

export async function getSupplierCategoryListApi(
  index: number,
  params?: object
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<TreeCategoryItem>>
  >("get", baseUrlApi(supplierCategoryPrefix + "page/" + index), { params });
}

export async function createSupplierCategoryApi(data: CreateTreeCategoryDto) {
  return await http.request<CommonResult<TreeCategoryItem>>(
    "post",
    baseUrlApi(supplierCategoryPrefix),
    { data }
  );
}

export async function updateSupplierCategoryApi(
  uid: string,
  data: Partial<CreateTreeCategoryDto>
) {
  return await http.request<CommonResult<TreeCategoryItem>>(
    "patch",
    baseUrlApi(supplierCategoryPrefix + uid),
    { data }
  );
}

export async function deleteSupplierCategoryApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(supplierCategoryPrefix + uid)
  );
}

// ============ 收入类别 (扁平) ============

const incomeCategoryPrefix = "/income-category/";

export async function getIncomeCategoryListApi(index: number, params?: object) {
  return await http.request<
    CommonResult<PaginatedResponseDto<FlatCategoryItem>>
  >("get", baseUrlApi(incomeCategoryPrefix + "page/" + index), { params });
}

export async function getAllIncomeCategoriesApi() {
  return await http.request<CommonResult<FlatCategoryItem[]>>(
    "get",
    baseUrlApi(incomeCategoryPrefix + "all")
  );
}

export async function createIncomeCategoryApi(data: CreateFlatCategoryDto) {
  return await http.request<CommonResult<FlatCategoryItem>>(
    "post",
    baseUrlApi(incomeCategoryPrefix),
    { data }
  );
}

export async function updateIncomeCategoryApi(
  uid: string,
  data: Partial<CreateFlatCategoryDto>
) {
  return await http.request<CommonResult<FlatCategoryItem>>(
    "patch",
    baseUrlApi(incomeCategoryPrefix + uid),
    { data }
  );
}

export async function deleteIncomeCategoryApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(incomeCategoryPrefix + uid)
  );
}

export async function batchDeleteIncomeCategoryApi(uids: string[]) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(incomeCategoryPrefix + "batch"),
    { data: { uids } }
  );
}

// ============ 支出类别 (扁平) ============

const expenseCategoryPrefix = "/expense-category/";

export async function getExpenseCategoryListApi(
  index: number,
  params?: object
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<FlatCategoryItem>>
  >("get", baseUrlApi(expenseCategoryPrefix + "page/" + index), { params });
}

export async function getAllExpenseCategoriesApi() {
  return await http.request<CommonResult<FlatCategoryItem[]>>(
    "get",
    baseUrlApi(expenseCategoryPrefix + "all")
  );
}

export async function createExpenseCategoryApi(data: CreateFlatCategoryDto) {
  return await http.request<CommonResult<FlatCategoryItem>>(
    "post",
    baseUrlApi(expenseCategoryPrefix),
    { data }
  );
}

export async function updateExpenseCategoryApi(
  uid: string,
  data: Partial<CreateFlatCategoryDto>
) {
  return await http.request<CommonResult<FlatCategoryItem>>(
    "patch",
    baseUrlApi(expenseCategoryPrefix + uid),
    { data }
  );
}

export async function deleteExpenseCategoryApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(expenseCategoryPrefix + uid)
  );
}

export async function batchDeleteExpenseCategoryApi(uids: string[]) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(expenseCategoryPrefix + "batch"),
    { data: { uids } }
  );
}

// ============ 结算方式 (扁平) ============

const settlementPrefix = "/settlement/";

export interface SettlementItem {
  id: number;
  uid: string;
  code: string;
  name: string;
  isDefault: boolean;
  sort: number;
  remark?: string;
}

export interface CreateSettlementDto {
  code: string;
  name: string;
  isDefault?: boolean;
  sort?: number;
  remark?: string;
}

export async function getSettlementListApi(index: number, params?: object) {
  return await http.request<CommonResult<PaginatedResponseDto<SettlementItem>>>(
    "get",
    baseUrlApi(settlementPrefix + "page/" + index),
    { params }
  );
}

export async function getAllSettlementsApi() {
  return await http.request<CommonResult<SettlementItem[]>>(
    "get",
    baseUrlApi(settlementPrefix + "all")
  );
}

export async function createSettlementApi(data: CreateSettlementDto) {
  return await http.request<CommonResult<SettlementItem>>(
    "post",
    baseUrlApi(settlementPrefix),
    { data }
  );
}

export async function updateSettlementApi(
  uid: string,
  data: Partial<CreateSettlementDto>
) {
  return await http.request<CommonResult<SettlementItem>>(
    "patch",
    baseUrlApi(settlementPrefix + uid),
    { data }
  );
}

export async function deleteSettlementApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(settlementPrefix + uid)
  );
}

// ============ 单计量单位 ============

const singleUnitPrefix = "/single-unit/";

export interface SingleUnitItem {
  id: number;
  uid: string;
  name: string;
  symbol: string;
  isDefault: boolean;
  sort: number;
  remark?: string;
}

export interface CreateSingleUnitDto {
  name: string;
  symbol: string;
  isDefault?: boolean;
  sort?: number;
  remark?: string;
}

export async function getSingleUnitListApi(index: number, params?: object) {
  return await http.request<CommonResult<PaginatedResponseDto<SingleUnitItem>>>(
    "get",
    baseUrlApi(singleUnitPrefix + "page/" + index),
    { params }
  );
}

export async function getAllSingleUnitsApi() {
  return await http.request<CommonResult<SingleUnitItem[]>>(
    "get",
    baseUrlApi(singleUnitPrefix + "all")
  );
}

export async function createSingleUnitApi(data: CreateSingleUnitDto) {
  return await http.request<CommonResult<SingleUnitItem>>(
    "post",
    baseUrlApi(singleUnitPrefix),
    { data }
  );
}

export async function updateSingleUnitApi(
  uid: string,
  data: Partial<CreateSingleUnitDto>
) {
  return await http.request<CommonResult<SingleUnitItem>>(
    "patch",
    baseUrlApi(singleUnitPrefix + uid),
    { data }
  );
}

export async function deleteSingleUnitApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(singleUnitPrefix + uid)
  );
}

// ============ 多计量单位 (单位组) ============

const multiUnitPrefix = "/multi-unit/";

export interface MultiUnitConversion {
  unitUid: string;
  unitName: string;
  ratio: number;
}

export interface MultiUnitItem {
  id: number;
  uid: string;
  name: string;
  baseUnitUid: string;
  baseUnitName: string;
  conversions: MultiUnitConversion[];
  sort: number;
  remark?: string;
}

export interface CreateMultiUnitDto {
  name: string;
  baseUnitUid: string;
  conversions: Array<{ unitUid: string; ratio: number }>;
  sort?: number;
  remark?: string;
}

export async function getMultiUnitListApi(index: number, params?: object) {
  return await http.request<CommonResult<PaginatedResponseDto<MultiUnitItem>>>(
    "get",
    baseUrlApi(multiUnitPrefix + "page/" + index),
    { params }
  );
}

export async function getAllMultiUnitsApi() {
  return await http.request<CommonResult<MultiUnitItem[]>>(
    "get",
    baseUrlApi(multiUnitPrefix + "all")
  );
}

export async function createMultiUnitApi(data: CreateMultiUnitDto) {
  return await http.request<CommonResult<MultiUnitItem>>(
    "post",
    baseUrlApi(multiUnitPrefix),
    { data }
  );
}

export async function updateMultiUnitApi(
  uid: string,
  data: Partial<CreateMultiUnitDto>
) {
  return await http.request<CommonResult<MultiUnitItem>>(
    "patch",
    baseUrlApi(multiUnitPrefix + uid),
    { data }
  );
}

export async function deleteMultiUnitApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(multiUnitPrefix + uid)
  );
}

// ============ 辅助属性 ============

const auxiliaryAttrPrefix = "/auxiliary-attr/";

export interface AuxiliaryAttrValue {
  id: number;
  uid: string;
  name: string;
  sort: number;
}

export interface AuxiliaryAttrItem {
  id: number;
  uid: string;
  name: string;
  values: AuxiliaryAttrValue[];
  sort: number;
  remark?: string;
}

export interface CreateAuxiliaryAttrDto {
  name: string;
  values?: string[];
  sort?: number;
  remark?: string;
}

export async function getAuxiliaryAttrListApi(index: number, params?: object) {
  return await http.request<
    CommonResult<PaginatedResponseDto<AuxiliaryAttrItem>>
  >("get", baseUrlApi(auxiliaryAttrPrefix + "page/" + index), { params });
}

export async function getAllAuxiliaryAttrsApi() {
  return await http.request<CommonResult<AuxiliaryAttrItem[]>>(
    "get",
    baseUrlApi(auxiliaryAttrPrefix + "all")
  );
}

export async function createAuxiliaryAttrApi(data: CreateAuxiliaryAttrDto) {
  return await http.request<CommonResult<AuxiliaryAttrItem>>(
    "post",
    baseUrlApi(auxiliaryAttrPrefix),
    { data }
  );
}

export async function updateAuxiliaryAttrApi(
  uid: string,
  data: Partial<CreateAuxiliaryAttrDto>
) {
  return await http.request<CommonResult<AuxiliaryAttrItem>>(
    "patch",
    baseUrlApi(auxiliaryAttrPrefix + uid),
    { data }
  );
}

export async function deleteAuxiliaryAttrApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(auxiliaryAttrPrefix + uid)
  );
}

export async function addAuxiliaryAttrValueApi(attrUid: string, name: string) {
  return await http.request<CommonResult<AuxiliaryAttrValue>>(
    "post",
    baseUrlApi(auxiliaryAttrPrefix + attrUid + "/value"),
    { data: { name } }
  );
}

export async function updateAuxiliaryAttrValueApi(
  attrUid: string,
  valueUid: string,
  name: string
) {
  return await http.request<CommonResult<AuxiliaryAttrValue>>(
    "patch",
    baseUrlApi(auxiliaryAttrPrefix + attrUid + "/value/" + valueUid),
    { data: { name } }
  );
}

export async function deleteAuxiliaryAttrValueApi(
  attrUid: string,
  valueUid: string
) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(auxiliaryAttrPrefix + attrUid + "/value/" + valueUid)
  );
}

// ============ 辅助资料 (综合页面用) ============

const auxiliaryPrefix = "/auxiliary/";

export interface AuxiliaryItem {
  id: number;
  uid: string;
  type: string;
  code: string;
  name: string;
  sort: number;
  remark?: string;
}

export interface CreateAuxiliaryDto {
  type: string;
  code: string;
  name: string;
  sort?: number;
  remark?: string;
}

export async function getAuxiliaryListApi(
  index: number,
  type: string,
  params?: object
) {
  return await http.request<CommonResult<PaginatedResponseDto<AuxiliaryItem>>>(
    "get",
    baseUrlApi(auxiliaryPrefix + "page/" + index),
    { params: { type, ...params } }
  );
}

export async function createAuxiliaryApi(data: CreateAuxiliaryDto) {
  return await http.request<CommonResult<AuxiliaryItem>>(
    "post",
    baseUrlApi(auxiliaryPrefix),
    { data }
  );
}

export async function updateAuxiliaryApi(
  uid: string,
  data: Partial<CreateAuxiliaryDto>
) {
  return await http.request<CommonResult<AuxiliaryItem>>(
    "patch",
    baseUrlApi(auxiliaryPrefix + uid),
    { data }
  );
}

export async function deleteAuxiliaryApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(auxiliaryPrefix + uid)
  );
}

export async function batchDeleteAuxiliaryApi(uids: string[]) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(auxiliaryPrefix + "batch"),
    { data: { uids } }
  );
}
