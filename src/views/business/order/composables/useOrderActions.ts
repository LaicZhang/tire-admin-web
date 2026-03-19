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
  convertSaleQuotationApi,
  getOrderListApi
} from "@/api";
import { addDialog } from "@/composables/useDialogService";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import { ElMessageBox, ElOption, ElSelect } from "element-plus";
import { CUR_FORM_TITLE, localForage, message, ORDER_TYPE } from "@/utils";
import type { PurchaseInquiryDto } from "@/api/business/purchase-inquiry";
import { openDialog } from "../table";
import type { CommonResult } from "@/api/type";
import ConfirmOrderDetailAction from "../components/ConfirmOrderDetailAction.vue";
import ClaimDefectCategoryManager from "../components/ClaimDefectCategoryManager.vue";
import ClaimInspectionDialog from "../components/ClaimInspectionDialog.vue";
import { openPurchasePlanConvertDialog } from "../../purchase/plan/usePurchasePlanConvertDialog";
import { openPurchaseQuotationManagerDialog } from "../../purchase/inquiry/usePurchaseQuotationDialogs";

/**
 * 订单行数据接口
 */
export interface OrderRow {
  uid: string;
  id?: number;
  name?: string;
  status?: string;
  orderNo?: string;
  customerId?: string;
  customer?: { uid?: string; name?: string | null } | null;
  orders?: Array<{ saleOrderUid?: string }>;
  total?: number | string;
  payStatus?: number;
  [key: string]: unknown;
}

interface SaleOrderCandidate {
  uid: string;
  number?: string | number;
  desc?: string | null;
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
  const { confirm } = useConfirmDialog();

  const resolveQuotationCustomerId = (row: OrderRow) => {
    return row.customerId || row.customer?.uid || "";
  };

  const loadSaleOrderCandidates = async (customerId: string) => {
    const { data, code, msg } = await getOrderListApi<SaleOrderCandidate>(
      "sale-order",
      1,
      {
        customerId,
        pageSize: 100
      }
    );
    if (code !== 200) {
      throw new Error(msg || "加载销售订单失败");
    }
    return (data.list || []).filter(item => typeof item.uid === "string");
  };

  const promptSaleOrderUid = async (row: OrderRow) => {
    const customerId = resolveQuotationCustomerId(row);
    if (!customerId) {
      throw new Error("报价单缺少客户信息，无法匹配销售订单");
    }

    const linkedOrderUids = new Set(
      (row.orders || [])
        .map(item => item.saleOrderUid)
        .filter((value): value is string => typeof value === "string")
    );
    const candidates = (await loadSaleOrderCandidates(customerId)).filter(
      item => !linkedOrderUids.has(item.uid)
    );
    if (candidates.length === 0) {
      throw new Error("未找到可关联的销售订单，请先创建销售订单");
    }

    const selectedUid = ref(candidates[0].uid);
    return await new Promise<string>((resolve, reject) => {
      addDialog({
        title: "选择关联销售订单",
        width: "560px",
        draggable: true,
        closeOnClickModal: false,
        contentRenderer: () =>
          h("div", { class: "space-y-3" }, [
            h(
              "div",
              { class: "text-sm text-gray-500" },
              "销售报价需要关联一张已存在的销售订单，系统不会自动补仓库信息。"
            ),
            h(
              ElSelect,
              {
                modelValue: selectedUid.value,
                "onUpdate:modelValue": (value: string) => {
                  selectedUid.value = value;
                },
                class: "w-full",
                placeholder: "请选择销售订单"
              },
              () =>
                candidates.map(item =>
                  h(ElOption, {
                    key: item.uid,
                    label: `${item.number ?? item.uid}${
                      item.desc ? ` | ${item.desc}` : ""
                    }`,
                    value: item.uid
                  })
                )
            )
          ]),
        beforeSure: done => {
          if (!selectedUid.value) {
            message("请选择销售订单", { type: "warning" });
            return;
          }
          done();
          resolve(selectedUid.value);
        },
        closeCallBack: () => {
          reject(new Error("cancel"));
        }
      });
    });
  };

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
      validate: () => Promise<boolean>;
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
          const ok = await formRef.value?.validate();
          if (!ok) return;

          const payload = formRef.value?.getPayload();
          if (!payload?.detailUid) return;

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

    const ok = await confirm(
      `确定要删除订单 "${row.orderNo || row.name}" 吗？此操作不可恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    if (!ok) return;

    try {
      await deleteOrderApi(orderType.value, row.uid);
      message(`订单已删除`, { type: "success" });
      await onSearch();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "删除失败";
      message(msg, { type: "error" });
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

  const handleManageClaimDefectCategories = async () => {
    addDialog({
      title: "缺陷类别管理",
      width: "960px",
      draggable: true,
      closeOnClickModal: false,
      hideFooter: true,
      contentRenderer: () => h(ClaimDefectCategoryManager)
    });
  };

  const handleManageClaimInspections = async (row: OrderRow) => {
    addDialog({
      title: "检测记录",
      width: "1080px",
      draggable: true,
      closeOnClickModal: false,
      hideFooter: true,
      contentRenderer: () =>
        h(ClaimInspectionDialog, {
          orderUid: row.uid
        })
    });
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
      type PromptResult = { value: string } | string;
      const res = await ElMessageBox.prompt("请输入作废原因", "订单作废", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        inputPattern: /\S+/,
        inputErrorMessage: "作废原因不能为空"
      });
      const result = res as PromptResult;
      const reason = typeof result === "string" ? result : result.value;
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

  const handleConvertPurchasePlan = async (row: OrderRow) => {
    if (!row.id) {
      message("采购计划缺少主键，无法转订单", { type: "warning" });
      return;
    }

    await openPurchasePlanConvertDialog(
      {
        id: row.id,
        repo: row.repo as { uid: string; name: string } | undefined,
        tire: row.tire as { name?: string } | undefined,
        count: Number(row.count ?? 0)
      },
      onSearch
    );
  };

  const handleManagePurchaseQuotations = async (row: OrderRow) => {
    if (!row.id) {
      message("询价单缺少主键，无法加载报价", { type: "warning" });
      return;
    }
    openPurchaseQuotationManagerDialog(
      row as unknown as PurchaseInquiryDto,
      onSearch
    );
  };

  const handleConvertQuotation = async (row: OrderRow) => {
    try {
      const saleOrderUid = await promptSaleOrderUid(row);
      if (!saleOrderUid) return;
      await convertSaleQuotationApi(row.id ?? 0, saleOrderUid);
      message("报价单转订单成功", { type: "success" });
      await onSearch();
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "cancel") return;
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
    handleManageClaimDefectCategories,
    handleManageClaimInspections,
    handleConfirmReturnCustomerArrival,
    handleConfirmReturnProviderShipment,
    handleConfirmReturnProviderDelivery,
    handleRefundReturnOrder,
    handleConfirmTransferShipment,
    handleConfirmTransferArrival,
    handleReverseOrder,
    handleSendInquiry,
    handleManagePurchaseQuotations,
    handleConvertPurchasePlan,
    handleConvertQuotation
  };
}
