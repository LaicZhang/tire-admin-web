import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import { createCrudApi } from "../utils/crud-factory";
import type { BalanceAdjustment } from "./balanceAdjustment";

const prefix = "/customer/";

/** 客户查询参数 */
export interface CustomerQueryDto {
  keyword?: string;
  name?: string;
  desc?: string;
  tagId?: number;
  levelId?: number;
  regionId?: number;
  scope?: "nonDeleted" | "deleted" | "all";
}

/** Prisma 关联连接类型 */
interface PrismaConnect<T> {
  connect?: T;
  set?: T[];
  disconnect?: T | T[];
}

/** 客户创建/更新输入数据 */
export interface CustomerInputData {
  name?: string;
  phone?: string;
  address?: string;
  desc?: string;
  from?: string;
  isIndividual?: boolean;
  creditLimit?: number;
  initialBalance?: number;
  /** Prisma 关联 - 公司 */
  company?: PrismaConnect<{ uid: string }>;
  /** Prisma 关联 - 等级 */
  level?: PrismaConnect<{ id: number }>;
  /** Prisma 关联 - 标签 */
  tags?: PrismaConnect<{ id: number }> | { set: Array<{ id: number }> };
}

/** 客户创建/更新 DTO - 支持嵌套 customer 形式 */
export interface CustomerDto {
  customer?: CustomerInputData;
  // 兼容直接传递字段的形式
  name?: string;
  phone?: string;
  address?: string;
  desc?: string;
  levelId?: number;
  regionId?: number;
}

/** 客户实体 */
export interface Customer {
  id: number;
  uid: string;
  code?: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  desc?: string;
  deleteAt?: string | null;
  receivableBalance?: number;
  tags?: Array<{ id: number; name: string }>;
  level?: { id?: number; name: string };
  from?: string;
  isIndividual?: boolean;
  creditLimit?: number;
  info?: { phone?: string };
}

export function getCustomerBalanceHistoryApi(
  uid: string,
  params?: { index?: number; pageSize?: number }
) {
  return http.request<
    CommonResult<{
      count: number;
      list: BalanceAdjustment[];
    }>
  >("get", baseUrlApi(prefix + `${uid}/balance-history`), { params });
}

// ============ 标准 CRUD API (使用工厂函数) ============

const baseCustomerApi = createCrudApi<Customer, CustomerQueryDto, CustomerDto>({
  prefix: prefix,
  enableBatch: true,
  enableRestore: true
});

/** 获取客户分页列表 */
export const getCustomerListApi = baseCustomerApi.getList;

/** 创建客户 */
export const addCustomerApi = baseCustomerApi.add;

/** 获取客户详情 */
export const getCustomerApi = baseCustomerApi.get;

/** 更新客户 */
export const updateCustomerApi = baseCustomerApi.update;

/** 删除客户 */
export const deleteCustomerApi = baseCustomerApi.delete;

/** 恢复客户 */
export const restoreCustomerApi = baseCustomerApi.restore as NonNullable<
  typeof baseCustomerApi.restore
>;

/** 批量获取客户 */
export const getCustomerBatchApi = baseCustomerApi.batch as NonNullable<
  typeof baseCustomerApi.batch
>;

// ============ 扩展 API ============

/** 迁移客户 */
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
