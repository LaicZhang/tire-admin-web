import type { Ref } from "vue";
import {
  deleteOrderApi,
  confirmSaleOrderShipmentApi,
  confirmSaleOrderDeliveryApi,
  confirmReturnOrderCustomerArrivalApi,
  confirmReturnOrderProviderShipmentApi,
  confirmReturnOrderProviderDeliveryApi,
  confirmTransferOrderShipmentApi,
  confirmTransferOrderArrivalApi,
  reverseSaleOrderApi,
  reversePurchaseOrderApi,
  reverseReturnOrderApi,
  reverseWasteOrderApi,
  reverseClaimOrderApi,
  reverseSurplusOrderApi,
  sendPurchaseInquiryApi,
  convertSaleQuotationApi
} from "@/api";
import { ElMessageBox } from "element-plus";
import { CUR_FORM_TITLE, localForage, message, ORDER_TYPE } from "@/utils";
import { openDialog } from "../table";
import type { CommonResult } from "@/api/type";

/**
 * 订单行数据接口
 */
export interface OrderRow {
  uid: string;
  id?: number;
  name?: string;
  status?: string;
  orderNo?: string;
  total?: number | string;
  payStatus?: number;
  [key: string]: unknown;
}

/**
 * 订单操作 composable
 * 提取订单确认、作废、删除等操作逻辑
 */
export function useOrderActions(
  orderType: Ref<string>,
  onSearch: () => Promise<void>
) {
  const formTitle = { value: "" };

  const handleOpenDialog = async (
    title: string,
    type: string,
    row?: OrderRow
  ) => {
    formTitle.value = title;
    await localForage().setItem(CUR_FORM_TITLE, title);
    openDialog(title, type, row);
  };

  const handleDelete = async (row: OrderRow) => {
    await deleteOrderApi(orderType.value, row.uid);
    message(`您删除了${row.name}这条数据`, { type: "success" });
    await onSearch();
  };

  // 采购订单：确认到货
  const handleConfirmPurchaseArrival = async (row: OrderRow) => {
    handleOpenDialog("确认到货", orderType.value, row);
  };

  // 销售订单：确认发货
  const handleConfirmSaleShipment = async (row: OrderRow) => {
    try {
      await confirmSaleOrderShipmentApi(row.uid, {});
      message("确认发货成功", { type: "success" });
      await onSearch();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "确认发货失败";
      message(msg, { type: "error" });
    }
  };

  // 销售订单：确认送达
  const handleConfirmSaleDelivery = async (row: OrderRow) => {
    try {
      await confirmSaleOrderDeliveryApi(row.uid, {});
      message("确认送达成功", { type: "success" });
      await onSearch();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "确认送达失败";
      message(msg, { type: "error" });
    }
  };

  // 理赔订单：处理理赔费用
  const handleProcessClaimPayment = async (row: OrderRow) => {
    handleOpenDialog("处理理赔费用", orderType.value, row);
  };

  // 退货订单：确认客户退货到货
  const handleConfirmReturnCustomerArrival = async (row: OrderRow) => {
    try {
      await confirmReturnOrderCustomerArrivalApi(row.uid, {});
      message("确认客户退货到货成功", { type: "success" });
      await onSearch();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "确认客户退货到货失败";
      message(msg, { type: "error" });
    }
  };

  // 退货订单：确认退供应商发货
  const handleConfirmReturnProviderShipment = async (row: OrderRow) => {
    try {
      await confirmReturnOrderProviderShipmentApi(row.uid, {});
      message("确认退供应商发货成功", { type: "success" });
      await onSearch();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "确认退供应商发货失败";
      message(msg, { type: "error" });
    }
  };

  // 退货订单：确认退供应商送达
  const handleConfirmReturnProviderDelivery = async (row: OrderRow) => {
    try {
      await confirmReturnOrderProviderDeliveryApi(row.uid, {});
      message("确认退供应商送达成功", { type: "success" });
      await onSearch();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "确认退供应商送达失败";
      message(msg, { type: "error" });
    }
  };

  // 退货订单：退款
  const handleRefundReturnOrder = async (row: OrderRow) => {
    handleOpenDialog("退款", orderType.value, row);
  };

  // 调拨订单：确认发货
  const handleConfirmTransferShipment = async (row: OrderRow) => {
    try {
      await confirmTransferOrderShipmentApi(row.uid, {});
      message("确认发货成功", { type: "success" });
      await onSearch();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "确认发货失败";
      message(msg, { type: "error" });
    }
  };

  // 调拨订单：确认到货
  const handleConfirmTransferArrival = async (row: OrderRow) => {
    try {
      await confirmTransferOrderArrivalApi(row.uid, {});
      message("确认到货成功", { type: "success" });
      await onSearch();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "确认到货失败";
      message(msg, { type: "error" });
    }
  };

  // 订单作废
  const reverseApiMap: Record<
    string,
    (uid: string, reason: string) => Promise<CommonResult>
  > = {
    [ORDER_TYPE.sale]: reverseSaleOrderApi,
    [ORDER_TYPE.purchase]: reversePurchaseOrderApi,
    [ORDER_TYPE.return]: reverseReturnOrderApi,
    [ORDER_TYPE.waste]: reverseWasteOrderApi,
    [ORDER_TYPE.claim]: reverseClaimOrderApi,
    [ORDER_TYPE.surplus]: reverseSurplusOrderApi
  };

  const handleReverseOrder = async (row: OrderRow) => {
    try {
      const { value: reason } = await ElMessageBox.prompt(
        "请输入作废原因",
        "订单作废",
        {
          confirmButtonText: "确认",
          cancelButtonText: "取消",
          inputPattern: /\S+/,
          inputErrorMessage: "作废原因不能为空"
        }
      );
      if (reason) {
        const api = reverseApiMap[orderType.value];
        if (api) {
          await api(row.uid, reason);
          message("订单已作废", { type: "success" });
          await onSearch();
        }
      }
    } catch {
      // User cancelled
    }
  };

  const handleSendInquiry = async (row: OrderRow) => {
    try {
      await sendPurchaseInquiryApi(row.id!);
      message("询价单发送成功", { type: "success" });
      await onSearch();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "发送失败";
      message(msg, { type: "error" });
    }
  };

  const handleConvertQuotation = async (row: OrderRow) => {
    try {
      await convertSaleQuotationApi(row.id!);
      message("报价单转订单成功", { type: "success" });
      await onSearch();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "转换失败";
      message(msg, { type: "error" });
    }
  };

  return {
    formTitle,
    handleOpenDialog,
    handleDelete,
    handleConfirmPurchaseArrival,
    handleConfirmSaleShipment,
    handleConfirmSaleDelivery,
    handleProcessClaimPayment,
    handleConfirmReturnCustomerArrival,
    handleConfirmReturnProviderShipment,
    handleConfirmReturnProviderDelivery,
    handleRefundReturnOrder,
    handleConfirmTransferShipment,
    handleConfirmTransferArrival,
    handleReverseOrder,
    handleSendInquiry,
    handleConvertQuotation
  };
}
