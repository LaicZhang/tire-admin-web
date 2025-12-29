import { h, ref, type Ref } from "vue";
import {
  deleteOrderApi,
  confirmPurchaseOrderArrivalApi,
  confirmSaleOrderShipmentApi,
  confirmSaleOrderDeliveryApi,
  confirmReturnOrderArrivalApi,
  confirmReturnOrderShipmentApi,
  confirmReturnOrderDeliveryApi,
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
import { addDialog } from "@/components/ReDialog";
import { ElMessageBox } from "element-plus";
import { CUR_FORM_TITLE, localForage, message, ORDER_TYPE } from "@/utils";
import { openDialog } from "../table";
import type { CommonResult } from "@/api/type";
import ConfirmOrderDetailAction from "../components/ConfirmOrderDetailAction.vue";

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

  const openConfirmDetailActionDialog = async (
    title: string,
    action:
      | "purchase-arrival"
      | "sale-shipment"
      | "sale-delivery"
      | "return-arrival"
      | "return-shipment"
      | "return-delivery"
      | "transfer-shipment"
      | "transfer-arrival",
    row: OrderRow,
    onSubmit: (payload: {
      detailUid: string;
      shipCount?: number;
      batchNo?: string;
      productionDate?: string;
      expiryDate?: string;
    }) => Promise<unknown>
  ) => {
    const formRef = ref<{
      getPayload: () => {
        detailUid: string;
        shipCount?: number;
        batchNo?: string;
        productionDate?: string;
        expiryDate?: string;
      };
    } | null>(null);

    addDialog({
      title,
      width: "520px",
      draggable: true,
      closeOnClickModal: false,
      contentRenderer: () =>
        h(ConfirmOrderDetailAction, {
          ref: formRef,
          orderType: orderType.value,
          action,
          orderUid: row.uid
        }),
      beforeSure: async done => {
        try {
          const payload = formRef.value?.getPayload();
          if (!payload?.detailUid) {
            message("请选择明细", { type: "warning" });
            return;
          }
          if (
            action === "sale-shipment" &&
            (!payload.shipCount || payload.shipCount <= 0)
          ) {
            message("请输入有效的发货数量", { type: "warning" });
            return;
          }

          await onSubmit(payload);
          message(`${title}成功`, { type: "success" });
          done();
          await onSearch();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : `${title}失败`;
          message(msg, { type: "error" });
        }
      }
    });
  };

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
    // 检查订单是否已付款，已付款订单不允许直接删除
    if (row.payStatus && row.payStatus > 0) {
      message("已付款订单不能直接删除，请先作废订单", { type: "warning" });
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除订单 "${row.orderNo || row.name}" 吗？此操作不可恢复。`,
        "删除确认",
        {
          confirmButtonText: "确定删除",
          cancelButtonText: "取消",
          type: "warning"
        }
      );
      await deleteOrderApi(orderType.value, row.uid);
      message(`订单已删除`, { type: "success" });
      await onSearch();
    } catch (error) {
      if (error !== "cancel") {
        const msg = error instanceof Error ? error.message : "删除失败";
        message(msg, { type: "error" });
      }
    }
  };

  // 采购订单：确认到货
  const handleConfirmPurchaseArrival = async (row: OrderRow) => {
    await openConfirmDetailActionDialog(
      "确认到货",
      "purchase-arrival",
      row,
      async payload => {
        return confirmPurchaseOrderArrivalApi(row.uid, payload);
      }
    );
  };

  // 销售订单：确认发货
  const handleConfirmSaleShipment = async (row: OrderRow) => {
    await openConfirmDetailActionDialog(
      "确认发货",
      "sale-shipment",
      row,
      async payload => {
        return confirmSaleOrderShipmentApi(row.uid, payload);
      }
    );
  };

  // 销售订单：确认送达
  const handleConfirmSaleDelivery = async (row: OrderRow) => {
    await openConfirmDetailActionDialog(
      "确认送达",
      "sale-delivery",
      row,
      async payload => {
        return confirmSaleOrderDeliveryApi(row.uid, payload);
      }
    );
  };

  // 理赔订单：处理理赔费用
  const handleProcessClaimPayment = async (row: OrderRow) => {
    handleOpenDialog("处理理赔费用", orderType.value, row);
  };

  // 退货订单：确认客户退货到货
  const handleConfirmReturnCustomerArrival = async (row: OrderRow) => {
    await openConfirmDetailActionDialog(
      "确认客户退货到货",
      "return-arrival",
      row,
      async payload => {
        return confirmReturnOrderArrivalApi(row.uid, payload);
      }
    );
  };

  // 退货订单：确认退供应商发货
  const handleConfirmReturnProviderShipment = async (row: OrderRow) => {
    await openConfirmDetailActionDialog(
      "确认退供应商发货",
      "return-shipment",
      row,
      async payload => {
        return confirmReturnOrderShipmentApi(row.uid, payload);
      }
    );
  };

  // 退货订单：确认退供应商送达
  const handleConfirmReturnProviderDelivery = async (row: OrderRow) => {
    await openConfirmDetailActionDialog(
      "确认退供应商送达",
      "return-delivery",
      row,
      async payload => {
        return confirmReturnOrderDeliveryApi(row.uid, payload);
      }
    );
  };

  // 退货订单：退款
  const handleRefundReturnOrder = async (row: OrderRow) => {
    handleOpenDialog("退款", orderType.value, row);
  };

  // 调拨订单：确认发货
  const handleConfirmTransferShipment = async (row: OrderRow) => {
    await openConfirmDetailActionDialog(
      "确认调拨发货",
      "transfer-shipment",
      row,
      async payload => {
        return confirmTransferOrderShipmentApi(row.uid, payload);
      }
    );
  };

  // 调拨订单：确认到货
  const handleConfirmTransferArrival = async (row: OrderRow) => {
    await openConfirmDetailActionDialog(
      "确认调拨到货",
      "transfer-arrival",
      row,
      async payload => {
        return confirmTransferOrderArrivalApi(row.uid, payload);
      }
    );
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
      await sendPurchaseInquiryApi(row.id ?? 0);
      message("询价单发送成功", { type: "success" });
      await onSearch();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "发送失败";
      message(msg, { type: "error" });
    }
  };

  const handleConvertQuotation = async (row: OrderRow) => {
    try {
      await convertSaleQuotationApi(row.id ?? 0);
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
