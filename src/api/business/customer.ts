import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/customer/";

/** 客户查询参数 */
export interface CustomerQueryDto {
  keyword?: string;
  name?: string;
  desc?: string;
  tagId?: number;
  levelId?: number;
  regionId?: number;
}

/** 客户创建/更新 DTO */
export interface CustomerDto {
  name: string;
  phone?: string;
  address?: string;
  desc?: string;
  levelId?: number;
  regionId?: number;
}

/** 客户实体 */
export interface Customer extends CustomerDto {
  id: number;
  uid: string;
  tags?: Array<{ id: number; name: string }>;
  level?: { name: string };
}

export async function getCustomerListApi(
  index: number,
  params?: CustomerQueryDto
) {
  return await http.request<CommonResult<PaginatedResponseDto<Customer>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addCustomerApi(data: Record<string, unknown>) {
  return await http.request<CommonResult<Customer>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function getCustomerApi(uid: string) {
  return await http.request<CommonResult<Customer>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateCustomerApi(
  uid: string,
  data: Record<string, unknown>
) {
  return await http.request<CommonResult<Customer>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function deleteCustomerApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

export async function migrateCustomerApi(uid: string, data: { uid: string }) {
  return await http.request<CommonResult<void>>(
    "patch",
    baseUrlApi(prefix + "migrate/" + uid),
    { data }
  );
}

export async function createCustomerDebtProfileApi(
  uid: string,
  data: {
    idCardImageUrl: string;
    iouImageUrl: string;
    liveImageUrl: string;
    phone: string;
  }
) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + "debt-profile/" + uid),
    { data }
  );
}

export async function getCustomerDebtProfileApi(uid: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "debt-profile/" + uid)
  );
}

// ============ 客户标签管理 ============

/** 获取客户标签列表 */
export async function getCustomerTagListApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "tag"));
}

/** 创建客户标签 */
export async function createCustomerTagApi(data: {
  name: string;
  color?: string;
}) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix + "tag"), {
    data
  });
}

/** 更新客户标签 */
export async function updateCustomerTagApi(
  id: number,
  data: { name?: string; color?: string }
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + `tag/${id}`),
    {
      data
    }
  );
}

/** 删除客户标签 */
export async function deleteCustomerTagApi(id: number) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + `tag/${id}`)
  );
}

/** 绑定客户标签 */
export async function bindCustomerTagsApi(uid: string, tagIds: number[]) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + `${uid}/tags`),
    { data: { tagIds } }
  );
}

// ============ 客户等级管理 ============

/** 获取客户等级列表 */
export async function getCustomerLevelListApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "level"));
}

/** 创建客户等级 */
export async function createCustomerLevelApi(data: {
  name: string;
  discount?: number;
  minAmount?: number;
}) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "level"),
    {
      data
    }
  );
}

/** 更新客户等级 */
export async function updateCustomerLevelApi(
  id: number,
  data: { name?: string; discount?: number; minAmount?: number }
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + `level/${id}`),
    {
      data
    }
  );
}

/** 删除客户等级 */
export async function deleteCustomerLevelApi(id: number) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + `level/${id}`)
  );
}

// ============ 客户跟进记录 ============

/** 获取客户跟进记录列表 */
export async function getCustomerFollowUpListApi(uid: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `${uid}/follow-up`)
  );
}

/** 创建客户跟进记录 */
export async function createCustomerFollowUpApi(
  uid: string,
  data: { content: string; type?: string; nextFollowUpDate?: string }
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + `${uid}/follow-up`),
    { data }
  );
}

// ============ 客户回访计划 ============

/** 获取回访计划列表 */
export async function getVisitPlanListApi(params?: {
  customerUid?: string;
  status?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "visit-plan"),
    { params }
  );
}

/** 创建客户回访计划 */
export async function createVisitPlanApi(
  uid: string,
  data: { planDate: string; content: string; remindBefore?: number }
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + `${uid}/visit-plan`),
    { data }
  );
}

/** 更新回访计划状态 */
export async function updateVisitPlanApi(
  planId: number,
  data: { status?: string; result?: string }
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + `visit-plan/${planId}`),
    { data }
  );
}

// ============ 客户区域管理 ============

/** 获取区域列表 */
export async function getCustomerRegionListApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "region"));
}

/** 创建区域 */
export async function createCustomerRegionApi(data: {
  name: string;
  parentId?: number;
}) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "region"),
    {
      data
    }
  );
}

/** 设置客户区域 */
export async function setCustomerRegionApi(uid: string, regionId: number) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + `${uid}/region`),
    { data: { regionId } }
  );
}

// ============ 客户提醒 ============

/** 创建客户提醒 */
export async function createCustomerReminderApi(
  uid: string,
  data: { remindDate: string; content: string; type?: string }
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + `${uid}/reminder`),
    { data }
  );
}

// ============ 客户开票信息 ============

/** 获取客户开票信息 */
export async function getCustomerInvoiceInfoApi(uid: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `${uid}/invoice-info`)
  );
}

/** 保存客户开票信息 */
export async function saveCustomerInvoiceInfoApi(
  uid: string,
  data: {
    companyName?: string;
    taxNumber?: string;
    address?: string;
    phone?: string;
    bankName?: string;
    bankAccount?: string;
  }
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + `${uid}/invoice-info`),
    { data }
  );
}

// ============ 发票登记 ============

/** 获取发票列表 */
export async function getInvoiceListApi(params?: {
  customerUid?: string;
  status?: string;
}) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "invoice"),
    { params }
  );
}

/** 创建发票 */
export async function createInvoiceApi(data: {
  customerUid: string;
  amount: number;
  type?: string;
  invoiceNo?: string;
}) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(prefix + "invoice"),
    { data }
  );
}

// ============ 欠款预警 ============

/** 获取客户欠款预警列表 */
export async function getDebtWarningListApi(params?: { type?: string }) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "debt-warning"),
    { params }
  );
}

// ============ 统计 ============

/** 获取客户数量 */
export async function getCustomerCountApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "count"));
}

/** 批量获取客户 */
export async function getCustomerBatchApi(uids: string[]) {
  return await http.request<CommonResult<Customer[]>>(
    "post",
    baseUrlApi(prefix + "batch"),
    { data: { uids } }
  );
}
