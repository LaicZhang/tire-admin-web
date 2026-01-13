import { computed, type Ref } from "vue";
import { ORDER_TYPE } from "@/utils";
import type { OrderRow } from "./useOrderActions";

/**
 * 订单操作按钮显示条件管理
 * 将模板中复杂的 v-if 条件提取为可复用的计算属性
 */
export function useOrderButtonVisibility(orderType: Ref<string>) {
  /**
   * 判断是否显示付款/收款按钮
   */
  const showPaymentButton = computed(() => {
    const type = orderType.value;
    return (
      type === ORDER_TYPE.purchase ||
      type === ORDER_TYPE.sale ||
      type === ORDER_TYPE.return
    );
  });

  /**
   * 获取付款按钮文字
   */
  const paymentButtonText = computed(() => {
    return orderType.value === ORDER_TYPE.sale ? "收款" : "付款";
  });

  /**
   * 判断是否显示确认到货按钮（采购订单）
   */
  const canConfirmPurchaseArrival = (row: OrderRow) => {
    return orderType.value === ORDER_TYPE.purchase && row.isApproved === true;
  };

  /**
   * 判断是否显示确认发货按钮（销售订单）
   */
  const canConfirmSaleShipment = (row: OrderRow) => {
    return (
      orderType.value === ORDER_TYPE.sale &&
      row.isApproved === true &&
      row.logisticsStatus === 0
    );
  };

  /**
   * 判断是否显示确认送达按钮（销售订单）
   */
  const canConfirmSaleDelivery = (row: OrderRow) => {
    return (
      orderType.value === ORDER_TYPE.sale &&
      row.isApproved === true &&
      row.logisticsStatus === 1
    );
  };

  /**
   * 判断是否显示处理理赔费用按钮
   */
  const canProcessClaimPayment = (row: OrderRow) => {
    return orderType.value === ORDER_TYPE.claim && row.isApproved === true;
  };

  /**
   * 判断是否显示确认客户退货到货按钮
   */
  const canConfirmReturnCustomerArrival = (row: OrderRow) => {
    return (
      orderType.value === ORDER_TYPE.return &&
      row.isApproved === true &&
      Boolean(row.customerId)
    );
  };

  /**
   * 判断是否显示确认退供应商发货按钮
   */
  const canConfirmReturnProviderShipment = (row: OrderRow) => {
    return (
      orderType.value === ORDER_TYPE.return &&
      row.isApproved === true &&
      Boolean(row.providerId)
    );
  };

  /**
   * 判断是否显示确认退供应商送达按钮
   */
  const canConfirmReturnProviderDelivery = (row: OrderRow) => {
    return (
      orderType.value === ORDER_TYPE.return &&
      row.isApproved === true &&
      Boolean(row.providerId) &&
      row.logisticsStatus === 1
    );
  };

  /**
   * 判断是否显示生成订单按钮（采购计划）
   */
  const canGenerateOrder = (row: OrderRow) => {
    return (
      orderType.value === ORDER_TYPE.purchasePlan && row.status !== "ordered"
    );
  };

  /**
   * 判断是否显示发送询价按钮
   */
  const canSendInquiry = (row: OrderRow) => {
    return (
      orderType.value === ORDER_TYPE.purchaseInquiry && row.status === "draft"
    );
  };

  /**
   * 判断是否显示转订单按钮（销售报价）
   */
  const canConvertQuotation = (row: OrderRow) => {
    return (
      orderType.value === ORDER_TYPE.saleQuotation && row.status === "accepted"
    );
  };

  /**
   * 判断是否显示退款按钮
   */
  const canRefundReturn = (row: OrderRow) => {
    return orderType.value === ORDER_TYPE.return && row.isApproved === true;
  };

  /**
   * 判断是否显示调拨确认发货按钮
   */
  const canConfirmTransferShipment = (row: OrderRow) => {
    return (
      orderType.value === ORDER_TYPE.transfer &&
      row.isApproved === true &&
      row.logisticsStatus === 0
    );
  };

  /**
   * 判断是否显示调拨确认到货按钮
   */
  const canConfirmTransferArrival = (row: OrderRow) => {
    return (
      orderType.value === ORDER_TYPE.transfer &&
      row.isApproved === true &&
      row.logisticsStatus === 1
    );
  };

  /**
   * 判断是否显示作废按钮
   */
  const canReverseOrder = (row: OrderRow) => {
    return (
      row.isApproved === true &&
      !row.isReversed &&
      orderType.value !== ORDER_TYPE.assembly &&
      orderType.value !== ORDER_TYPE.transfer
    );
  };

  /**
   * 判断是否显示修改/删除按钮
   */
  const canModify = (row: OrderRow) => {
    return row.isLocked === false;
  };

  return {
    // Computed properties
    showPaymentButton,
    paymentButtonText,
    // Row-based visibility functions
    canConfirmPurchaseArrival,
    canConfirmSaleShipment,
    canConfirmSaleDelivery,
    canProcessClaimPayment,
    canConfirmReturnCustomerArrival,
    canConfirmReturnProviderShipment,
    canConfirmReturnProviderDelivery,
    canGenerateOrder,
    canSendInquiry,
    canConvertQuotation,
    canRefundReturn,
    canConfirmTransferShipment,
    canConfirmTransferArrival,
    canReverseOrder,
    canModify
  };
}
