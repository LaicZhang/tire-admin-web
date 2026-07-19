/**
 * 订单服务层
 * 提供订单相关的通用业务逻辑
 */

import { ORDER_TYPE } from "@/utils";

/**
 * 订单类型显示名称映射
 */
export const ORDER_TYPE_LABELS: Record<string, string> = {
  [ORDER_TYPE.purchase]: "采购订单",
  [ORDER_TYPE.sale]: "销售订单",
  [ORDER_TYPE.return]: "退货订单",
  [ORDER_TYPE.waste]: "报损订单",
  [ORDER_TYPE.claim]: "理赔订单",
  [ORDER_TYPE.supplierClaim]: "供应商索赔单",
  [ORDER_TYPE.surplus]: "报溢订单",
  [ORDER_TYPE.transfer]: "调拨订单",
  [ORDER_TYPE.assembly]: "组装订单",
  [ORDER_TYPE.purchasePlan]: "采购计划",
  [ORDER_TYPE.purchaseInquiry]: "采购询价",
  [ORDER_TYPE.saleQuotation]: "销售报价"
};

/**
 * 获取订单类型的显示名称
 */
export function getOrderTypeLabel(type: string): string {
  return ORDER_TYPE_LABELS[type] || type;
}

/**
 * 聚合生命周期视图枚举（非 DB 字段）。
 * DB 支付态请用 PaymentStatus / orderStatus；审批用 isApproved；物流用 LogisticsStatus。
 * @deprecated 勿用于映射后端 orderStatus 数字。
 */
export enum OrderStatus {
  DRAFT = 0,
  PENDING = 1,
  APPROVED = 2,
  COMPLETED = 3,
  CANCELLED = 4,
  REVERSED = 5
}

/**
 * 聚合生命周期文案（非 DB orderStatus）。
 * @deprecated 勿用于映射后端 orderStatus 数字。
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: "草稿",
  [OrderStatus.PENDING]: "待审核",
  [OrderStatus.APPROVED]: "已审核",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.REVERSED]: "已作废"
};

/**
 * 物流状态枚举
 */
export enum LogisticsStatus {
  /** 待发货 */
  Pending = 0,
  /** 部分发货 */
  PartialShipped = 1,
  /** 已全部发货/运输中 */
  Shipped = 2,
  /** 已送达/已到货 */
  Delivered = 3,
  /** 已取消 */
  Cancelled = 4
}

/**
 * 物流状态显示名称
 */
export const LOGISTICS_STATUS_LABELS: Record<LogisticsStatus, string> = {
  [LogisticsStatus.Pending]: "待发货",
  [LogisticsStatus.PartialShipped]: "部分发货",
  [LogisticsStatus.Shipped]: "已发货",
  [LogisticsStatus.Delivered]: "已送达",
  [LogisticsStatus.Cancelled]: "已取消"
};

/**
 * 支付状态枚举（对齐后端 OrderStatusEnum / order_status）
 * 0 Pending / 1 Partially / 2 Paid / 3 Cancelled
 */
export enum PaymentStatus {
  UNPAID = 0,
  PARTIAL = 1,
  PAID = 2,
  CANCELLED = 3
}

/** @deprecated 使用 PaymentStatus.CANCELLED；3 为已取消而非退款 */
export const PaymentStatusRefundedAlias = PaymentStatus.CANCELLED;

/**
 * 支付状态显示名称（与后端 order-state-machine 文案一致）
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: "待支付",
  [PaymentStatus.PARTIAL]: "部分支付",
  [PaymentStatus.PAID]: "已付清",
  [PaymentStatus.CANCELLED]: "已取消"
};

/** 支付状态标签；未知值显示「未知(value)」 */
export function paymentStatusLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) return "未知";
  if (
    value === PaymentStatus.UNPAID ||
    value === PaymentStatus.PARTIAL ||
    value === PaymentStatus.PAID ||
    value === PaymentStatus.CANCELLED
  ) {
    return PAYMENT_STATUS_LABELS[value];
  }
  return `未知(${value})`;
}

/** 物流状态标签；未知值显示「未知(value)」 */
export function logisticsStatusLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) return "未知";
  if (
    value === LogisticsStatus.Pending ||
    value === LogisticsStatus.PartialShipped ||
    value === LogisticsStatus.Shipped ||
    value === LogisticsStatus.Delivered ||
    value === LogisticsStatus.Cancelled
  ) {
    return LOGISTICS_STATUS_LABELS[value];
  }
  return `未知(${value})`;
}

/**
 * 检查订单是否可编辑
 */
export function isOrderEditable(order: {
  isLocked?: boolean;
  isApproved?: boolean;
  isReversed?: boolean;
}): boolean {
  return !order.isLocked && !order.isApproved && !order.isReversed;
}

/**
 * 检查订单是否可作废
 */
export function isOrderReversible(
  order: {
    isApproved?: boolean;
    isReversed?: boolean;
  },
  orderType: string
): boolean {
  // 组装和调拨订单不支持作废
  const nonReversibleTypes: string[] = [
    ORDER_TYPE.assembly,
    ORDER_TYPE.transfer
  ];
  return (
    order.isApproved === true &&
    !order.isReversed &&
    !nonReversibleTypes.includes(orderType)
  );
}

/**
 * 检查订单是否可删除
 */
export function isOrderDeletable(order: {
  isLocked?: boolean;
  payStatus?: number;
}): boolean {
  return !order.isLocked && (!order.payStatus || order.payStatus === 0);
}

/**
 * 计算订单总金额
 */
export function calculateOrderTotal(
  details: Array<{ count: number; unitPrice: number }>
): number {
  return details.reduce((sum, item) => {
    return sum + (item.count || 0) * (item.unitPrice || 0);
  }, 0);
}

/**
 * 格式化订单编号
 */
export function formatOrderNo(orderNo: string | undefined | null): string {
  if (!orderNo) return "-";
  return orderNo;
}
