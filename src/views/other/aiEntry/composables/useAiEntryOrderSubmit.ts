import { ref, computed, type Ref, type ComputedRef } from "vue";
import { message } from "@/utils/message";
import {
  addCustomerApi,
  addProviderApi,
  addTireApi,
  createPurchaseInquiryApi,
  createSaleQuotationApi
} from "@/api";
import type {
  OrderFormData,
  DocumentType,
  HistoryRecord,
  UploadMethod
} from "../types";

type DocumentTypeConfig = {
  label: string;
  partyType: "customer" | "supplier";
  partyLabel: string;
};

export function useAiEntryOrderSubmit(
  currentDocConfig: ComputedRef<DocumentTypeConfig> | Ref<DocumentTypeConfig>,
  enableAutoCreate: Ref<boolean> | ComputedRef<boolean>
) {
  const orderForm = ref<OrderFormData>({
    documentType: DocumentType.SALE_ORDER,
    orderDate: new Date().toISOString().split("T")[0],
    details: [],
    totalAmount: 0
  });
  const historyRecords = ref<HistoryRecord[]>([]);

  const totalAmount = computed(() => {
    return orderForm.value.details.reduce((sum, row) => {
      return sum + (row.amount || 0);
    }, 0);
  });

  const hasUnmatchedProducts = computed(() => {
    return orderForm.value.details.some(d => !d.productUid && !d.isNew);
  });

  function updateDetailRow(index: number, field: string, value: unknown) {
    const row = orderForm.value.details[index];
    (row as Record<string, unknown>)[field] = value;

    if (field === "quantity" || field === "price") {
      row.amount = (row.quantity || 0) * (row.price || 0);
    }
  }

  function removeDetailRow(index: number) {
    orderForm.value.details.splice(index, 1);
  }

  function addDetailRow() {
    orderForm.value.details.push({
      id: String(Date.now()),
      productName: "",
      quantity: 1,
      isNew: true
    });
  }

  async function submitOrder(
    uploadMethod: UploadMethod,
    documentType: DocumentType
  ) {
    if (orderForm.value.details.length === 0) {
      message("请添加商品明细", { type: "warning" });
      return false;
    }

    if (orderForm.value.details.length > 300) {
      message("单据明细最多支持 300 行", { type: "error" });
      return false;
    }

    if (hasUnmatchedProducts.value && !enableAutoCreate.value) {
      message("存在未匹配的商品，请手动选择或开启智能新增基础资料", {
        type: "warning"
      });
      return false;
    }

    try {
      const details = orderForm.value.details;

      const toCentInt = (value: unknown) => {
        const n =
          typeof value === "number"
            ? value
            : typeof value === "string"
              ? Number(value)
              : NaN;
        if (!Number.isFinite(n)) return 0;
        return Math.max(0, Math.round(n * 100));
      };

      const partyType = currentDocConfig.value.partyType;
      let partyUid = orderForm.value.partyUid;
      const partyName = (orderForm.value.partyName || "").trim();

      if (!partyUid && partyName && enableAutoCreate.value) {
        if (partyType === "customer") {
          const res = await addCustomerApi({ name: partyName });
          if (res.code === 200 && res.data?.uid) {
            partyUid = res.data.uid;
          }
        } else {
          const res = await addProviderApi({ name: partyName });
          if (res.code === 200 && res.data?.uid) {
            partyUid = res.data.uid;
          }
        }
      }

      if (enableAutoCreate.value) {
        for (const row of details) {
          if (row.productUid) continue;
          const name = row.productName.trim();
          if (!name) continue;
          const res = await addTireApi({ name, price: row.price });
          if (res.code === 200 && res.data?.uid) {
            row.productUid = res.data.uid;
            row.isNew = true;
          }
        }
      }

      if (currentDocConfig.value.partyType === "customer" && !partyUid) {
        message("未识别到客户，请补充客户信息或开启智能新增基础资料", {
          type: "error"
        });
        return false;
      }

      if (details.some(d => !d.productUid)) {
        message("存在未匹配的商品，请补充商品信息或开启智能新增基础资料", {
          type: "error"
        });
        return false;
      }

      let createdId: string | number | undefined;
      if (currentDocConfig.value.partyType === "customer") {
        const res = await createSaleQuotationApi({
          customerId: partyUid,
          remark: orderForm.value.remark,
          details: details.map(d => ({
            tireId: d.productUid,
            quantity: Math.max(1, Math.floor(d.quantity || 1)),
            quotedPrice: toCentInt(d.price),
            originalPrice: toCentInt(d.price),
            remark: d.remark
          }))
        });
        if (res.code !== 200) throw new Error(res.msg || "创建失败");
        createdId = res.data?.id ?? res.data?.uid;
      } else {
        const res = await createPurchaseInquiryApi({
          providerId: partyUid,
          remark: orderForm.value.remark,
          details: details.map(d => ({
            tireId: d.productUid,
            quantity: Math.max(1, Math.floor(d.quantity || 1)),
            expectedPrice: d.price == null ? undefined : toCentInt(d.price)
          }))
        });
        if (res.code !== 200) throw new Error(res.msg || "创建失败");
        createdId = res.data?.id ?? res.data?.uid;
      }

      historyRecords.value.unshift({
        id: String(Date.now()),
        timestamp: new Date().toISOString(),
        method: uploadMethod,
        documentType: documentType,
        summary: `${currentDocConfig.value.label} - ${orderForm.value.details.length}个商品`,
        success: true,
        resultOrderUid: createdId ? String(createdId) : undefined
      });

      message("单据创建成功", { type: "success" });
      return true;
    } catch {
      message("提交失败，请重试", { type: "error" });
      return false;
    }
  }

  function resetForm(documentType: DocumentType) {
    orderForm.value = {
      documentType: documentType,
      orderDate: new Date().toISOString().split("T")[0],
      details: [],
      totalAmount: 0
    };
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return {
    orderForm,
    historyRecords,
    totalAmount,
    hasUnmatchedProducts,
    updateDetailRow,
    removeDetailRow,
    addDetailRow,
    submitOrder,
    resetForm,
    formatFileSize
  };
}
