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
 * 订单状态枚举
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
 * 订单状态显示名称
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
 * 支付状态枚举
 */
export enum PaymentStatus {
  UNPAID = 0,
  PARTIAL = 1,
  PAID = 2,
  REFUNDED = 3
}

/**
 * 支付状态显示名称
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: "未付款",
  [PaymentStatus.PARTIAL]: "部分付款",
  [PaymentStatus.PAID]: "已付款",
  [PaymentStatus.REFUNDED]: "已退款"
};

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
