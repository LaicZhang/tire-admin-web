import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const getOrderPrefix = (type: string) => {
  return `/${type}/`;
};

// ============ 订单 DTO 类型定义 ============

/** 订单详情 DTO */
export interface OrderDetailDto {
  uid?: string;
  tireId: string;
  count: number;
  unitPrice?: number;
  total?: number;
  desc?: string;
  isArrival?: boolean;
  companyId?: string;
  repoId?: string;
  batchNo?: string;
  expiryDate?: string;
}

/** 订单基础信息 DTO */
export interface BaseOrderDto {
  /** UID */
  uid?: string;
  /** 供应商/客户ID */
  providerId?: string;
  customerId?: string;
  /** 操作人ID */
  operatorId?: string;
  /** 审核人ID */
  auditorId?: string;
  /** 仓库管理员ID */
  warehouseEmployeeId?: string;
  /** 仓库ID */
  repoId?: string;
  fromRepositoryId?: string;
  toRepositoryId?: string;
  /** 描述 */
  desc?: string;
  /** 付款账户ID */
  paymentId?: string;
  /** 税率相关 */
  taxRate?: number;
  taxIncluded?: boolean;
  /** 日期 */
  expiryAt?: string;
  /** 订单名称/备注 */
  name?: string;
  /** 状态 */
  status?: boolean | string;
  /** 总价 */
  total?: number | string;
  /** 数量 */
  count?: number;
  /** 费用 */
  fee?: number;
  /** 是否收款 */
  isReceive?: boolean;
  /** 其他可能的业务字段，为兼容性保留 */
  [key: string]: unknown;
}

/** Prisma 关联连接类型 */
interface PrismaConnect<T> {
  connect?: T;
}

/** 创建订单请求 DTO */
export interface CreateOrderDto {
  order: BaseOrderDto & {
    /** Prisma 关联 - 供应商 */
    provider?: PrismaConnect<{ uid: string | undefined }>;
    /** Prisma 关联 - 客户 */
    customer?: PrismaConnect<{ uid: string | undefined }>;
    /** Prisma 关联 - 公司 */
    company?: PrismaConnect<{ uid: string }>;
    /** Prisma 关联 - 审核人 */
    auditor?: PrismaConnect<{ uid: string }>;
  };
  details: OrderDetailDto[];
}

/** 更新订单请求 DTO */
export interface UpdateOrderDto extends Partial<BaseOrderDto> {
  /** 订单状态 */
  orderStatus?: number;
  /** 物流状态 */
  logisticsStatus?: number;
  /** 是否锁定 */
  isLocked?: boolean;
  /** 是否已审批 */
  isApproved?: boolean;
  /** 驳回原因 */
  rejectReason?: string;
  /** 审批时间 */
  auditAt?: string | Date | null;
  /** Prisma 关联 - 公司 */
  company?: PrismaConnect<{ uid: string }>;
  /** Prisma 关联 - 供应商 */
  provider?: PrismaConnect<{ uid: string }>;
  /** Prisma 关联 - 客户 */
  customer?: PrismaConnect<{ uid: string }>;
  /** 其他可能的业务字段 */
  [key: string]: unknown;
}

/** 订单查询参数 DTO */
/** 支付订单请求 DTO */
export interface PayOrderDto {
  fee: number;
  paymentId?: string;
}

/** 确认物流状态请求 DTO */
export type ConfirmDetailUidDto = {
  detailUid: string;
};

export type PurchaseOrderConfirmArrivalDto = {
  detailUid: string;
  batchNo?: string;
  productionDate?: string;
  expiryDate?: string;
};

export type SaleOrderConfirmShipmentDto = {
  detailUid: string;
  shipCount?: number;
};

/** 订单查询参数 DTO */
export interface OrderQueryDto {
  orderStatus?: number;
  logisticsStatus?: number;
  isApproved?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  pageSize?: number;
  // Transfer order specific fields
  fromRepositoryId?: string;
  toRepositoryId?: string;
  auditorId?: string;
}

// ============ 通用订单 API ============

export async function getOrderListApi(
  type: string,
  index: number,
  params?: OrderQueryDto
) {
  return await http.request<CommonResult<PaginatedResponseDto>>(
    "get",
    baseUrlApi(getOrderPrefix(type) + "page/" + index),
    { params }
  );
}

export async function addOrderApi(type: string, data: CreateOrderDto) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(getOrderPrefix(type)),
    {
      data
    }
  );
}

export async function getOrderApi(type: string, uid: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(getOrderPrefix(type) + uid)
  );
}

export async function updateOrderApi(
  type: string,
  uid: string,
  data: UpdateOrderDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(getOrderPrefix(type) + uid),
    {
      data
    }
  );
}

export async function deleteOrderApi(type: string, uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(getOrderPrefix(type) + uid)
  );
}

// 采购订单特定接口
export async function getPurchaseOrderCountApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/purchase-order/count")
  );
}

export async function payPurchaseOrderApi(uid: string, data: PayOrderDto) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/purchase-order/pay/${uid}`),
    { data }
  );
}

export async function createPurchaseOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/purchase-order/detail/${uid}`)
  );
}

export async function updatePurchaseOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/purchase-order/detail/${uid}`),
    { data }
  );
}

export async function deletePurchaseOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/purchase-order/detail/${uid}`)
  );
}

export async function confirmPurchaseOrderArrivalApi(
  uid: string,
  data: PurchaseOrderConfirmArrivalDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/purchase-order/confirm-arrival/${uid}`),
    { data }
  );
}

// 销售订单特定接口
export async function getSaleOrderCountApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/sale-order/count")
  );
}

export async function paySaleOrderApi(uid: string, data: PayOrderDto) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/sale-order/pay/${uid}`),
    { data }
  );
}

export async function createSaleOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/sale-order/detail/${uid}`)
  );
}

export async function updateSaleOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/sale-order/detail/${uid}`),
    { data }
  );
}

export async function deleteSaleOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/sale-order/detail/${uid}`)
  );
}

export async function confirmSaleOrderShipmentApi(
  uid: string,
  data: SaleOrderConfirmShipmentDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/sale-order/confirm-shipment/${uid}`),
    { data }
  );
}

export async function confirmSaleOrderDeliveryApi(
  uid: string,
  data: ConfirmDetailUidDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/sale-order/confirm-delivery/${uid}`),
    { data }
  );
}

// 索赔订单特定接口
export async function getClaimOrderCountApi(params?: OrderQueryDto) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/claim-order/count"),
    { params }
  );
}

export async function createClaimOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/claim-order/detail/${uid}`)
  );
}

export async function updateClaimOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/claim-order/detail/${uid}`),
    { data }
  );
}

export async function deleteClaimOrderDetailApi(uid: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/claim-order/detail/${uid}`)
  );
}

export async function processClaimOrderPaymentApi(
  uid: string,
  data: { fee: number; isReceive: boolean }
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/claim-order/payment/${uid}`),
    { data }
  );
}

// 退货订单特定接口
export async function confirmReturnOrderArrivalApi(
  uid: string,
  data: ConfirmDetailUidDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/return-order/confirm-arrival/${uid}`),
    { data }
  );
}

export async function confirmReturnOrderShipmentApi(
  uid: string,
  data: ConfirmDetailUidDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/return-order/confirm-shipment/${uid}`),
    { data }
  );
}

export async function confirmReturnOrderDeliveryApi(
  uid: string,
  data: ConfirmDetailUidDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/return-order/confirm-delivery/${uid}`),
    { data }
  );
}

export async function refundReturnOrderApi(uid: string, data: { fee: number }) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/return-order/refund/${uid}`),
    { data }
  );
}

export async function getReturnOrderExchangeListApi(
  index: number,
  params?: OrderQueryDto
) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(`/return-order/exchange/page/${index}`),
    { params }
  );
}

// 调拨订单特定接口
export async function confirmTransferOrderShipmentApi(
  uid: string,
  data: ConfirmDetailUidDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/transfer-order/confirm-shipment/${uid}`),
    { data }
  );
}

export async function confirmTransferOrderArrivalApi(
  uid: string,
  data: ConfirmDetailUidDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/transfer-order/confirm-arrival/${uid}`),
    { data }
  );
}

// 报废订单特定接口
export async function createWasteOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/waste-order/detail/${uid}`),
    { data }
  );
}

export async function updateWasteOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/waste-order/detail/${uid}`),
    { data }
  );
}

export async function deleteWasteOrderDetailApi(uid: string, detailId: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/waste-order/detail/${uid}/${detailId}`)
  );
}

// 订单作废相关接口
export async function reverseSaleOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/sale-order/reverse/${uid}`),
    { data: { reason } }
  );
}

export async function reversePurchaseOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/purchase-order/reverse/${uid}`),
    { data: { reason } }
  );
}

export async function reverseReturnOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/return-order/reverse/${uid}`),
    { data: { reason } }
  );
}

export async function reverseWasteOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/waste-order/reverse/${uid}`),
    { data: { reason } }
  );
}

export async function reverseClaimOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/claim-order/reverse/${uid}`),
    { data: { reason } }
  );
}

export async function reverseSurplusOrderApi(uid: string, reason: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/surplus-order/reverse/${uid}`),
    { data: { reason } }
  );
}

// 调拨订单明细管理
export async function createTransferOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/transfer-order/detail/${uid}`),
    { data }
  );
}

export async function updateTransferOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/transfer-order/detail/${uid}`),
    { data }
  );
}

export async function deleteTransferOrderDetailApi(
  uid: string,
  detailId: string
) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/transfer-order/detail/${uid}/${detailId}`)
  );
}

// 盘盈订单明细管理
export async function createSurplusOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(`/surplus-order/detail/${uid}`),
    { data }
  );
}

export async function updateSurplusOrderDetailApi(
  uid: string,
  data: OrderDetailDto
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/surplus-order/detail/${uid}`),
    { data }
  );
}

export async function deleteSurplusOrderDetailApi(
  uid: string,
  detailId: string
) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/surplus-order/detail/${uid}/${detailId}`)
  );
}

// 审核相关
const prefix = "/audit/";

export async function getAuditorListApi(type: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "auditor/" + type)
  );
}

// 获取待审核订单列表
export async function getPendingAuditOrdersApi(
  type: string,
  index: number,
  params?: OrderQueryDto
) {
  return await http.request<CommonResult<PaginatedResponseDto>>(
    "get",
    baseUrlApi(prefix + "pending/" + type + "/page/" + index),
    { params }
  );
}
