import { computed, ref, type ComputedRef, type Ref } from "vue";
import { v7 as uuid } from "uuid";
import { message } from "@/utils/message";
import { loadInventoryDefaults } from "@/composables/useInventoryDefaults";
import { addCustomerApi } from "@/api/business/customer";
import { addProviderApi } from "@/api/business/provider";
import { addTireApi } from "@/api/business/tire";
import { getCompanyConnect, getCompanyId, type CommonResult } from "@/api";
import {
  createPurchaseInboundApi,
  createPurchaseOrderApi,
  createPurchaseReturnOrderApi
} from "@/api/purchase";
import {
  createSalesOrderApi,
  createSalesOutboundApi,
  createSalesReturnOrderApi
} from "@/api/sales";
import type { OrderFormData, HistoryRecord, UploadMethod } from "../types";
import { DocumentType } from "../types";
import { useUserStoreHook } from "@/store/modules/user";

type DocumentTypeConfig = {
  label: string;
  partyType: "customer" | "supplier";
  partyLabel: string;
};

type OrderDetailPayload = {
  companyId: string;
  tireId: string;
  count: number;
  repoId: string;
  unitPrice?: number;
  total?: number;
  totalAmount?: number;
  returnReason?: string;
  desc?: string;
};

const DEFAULT_RETURN_REASON = "other";

const isReturnDocument = (documentType: DocumentType) =>
  [DocumentType.PURCHASE_RETURN, DocumentType.SALE_RETURN].includes(
    documentType
  );

const isSalesFlowDocument = (documentType: DocumentType) =>
  [DocumentType.SALE_ORDER, DocumentType.SALE_OUTBOUND].includes(documentType);

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

function extractCreatedId(result: CommonResult) {
  const data = result.data as
    | { id?: string | number; uid?: string }
    | undefined;
  return data?.id ?? data?.uid;
}

function createOrderDetails(
  form: OrderFormData,
  companyId: string,
  repoId: string
): OrderDetailPayload[] {
  return form.details.map(detail => {
    const count = Math.max(1, Math.floor(detail.quantity || 1));
    const unitPrice = toCentInt(detail.price);
    const baseDetail = {
      companyId,
      tireId: String(detail.productUid || ""),
      count,
      repoId,
      unitPrice,
      desc: detail.remark
    };

    if (isReturnDocument(form.documentType)) {
      return {
        ...baseDetail,
        returnReason: DEFAULT_RETURN_REASON
      };
    }

    if (isSalesFlowDocument(form.documentType)) {
      return {
        ...baseDetail,
        totalAmount: unitPrice * count
      };
    }

    return {
      ...baseDetail,
      total: unitPrice * count
    };
  });
}

async function resolveRepoId(form: OrderFormData) {
  if (form.warehouseUid) return form.warehouseUid;
  const defaults = await loadInventoryDefaults();
  const repoId = defaults.defaultWarehouseId;
  if (!repoId) {
    throw new Error("未配置默认仓库，无法创建正式单据");
  }
  return repoId;
}

async function ensurePartyUid(
  form: OrderFormData,
  config: DocumentTypeConfig,
  enableAutoCreate: boolean
) {
  let partyUid = form.partyUid;
  const partyName = (form.partyName || "").trim();
  const operatorUid = useUserStoreHook().uid;

  if (!partyUid && partyName && enableAutoCreate) {
    if (!operatorUid) {
      throw new Error("当前用户缺少 uid，无法自动创建往来单位");
    }

    if (config.partyType === "customer") {
      const res = await addCustomerApi({
        customer: {
          name: partyName,
          company: getCompanyConnect(),
          operator: { connect: { uid: operatorUid } }
        },
        info: {}
      });
      if (res.code === 200 && res.data?.uid) {
        partyUid = res.data.uid;
      }
    } else {
      const res = await addProviderApi({
        provider: {
          name: partyName,
          company: getCompanyConnect(),
          operator: { connect: { uid: operatorUid } }
        },
        info: {}
      });
      if (res.code === 200 && res.data?.uid) {
        partyUid = res.data.uid;
      }
    }
  }

  if (!partyUid) {
    throw new Error(`未识别到${config.partyLabel}`);
  }
  return partyUid;
}

async function ensureProducts(
  form: OrderFormData,
  enableAutoCreate: boolean
): Promise<void> {
  if (!enableAutoCreate) return;

  for (const row of form.details) {
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

async function submitFormalOrder(
  form: OrderFormData,
  partyUid: string,
  companyId: string,
  repoId: string
) {
  const details = createOrderDetails(form, companyId, repoId);
  const orderBase = {
    uid: uuid(),
    count: details.reduce((sum, item) => sum + item.count, 0),
    total: details.reduce(
      (sum, item) => sum + (item.totalAmount ?? item.total ?? 0),
      0
    ),
    desc: form.remark,
    status: true,
    isApproved: false,
    isLocked: false,
    logisticsStatus: 0,
    orderStatus: 0,
    company: getCompanyConnect(companyId)
  };

  switch (form.documentType) {
    case DocumentType.PURCHASE_ORDER:
      return createPurchaseOrderApi({
        order: {
          ...orderBase,
          provider: { connect: { uid: partyUid } }
        },
        details
      });
    case DocumentType.PURCHASE_INBOUND:
      return createPurchaseInboundApi({
        order: {
          ...orderBase,
          provider: { connect: { uid: partyUid } }
        },
        details
      });
    case DocumentType.PURCHASE_RETURN:
      return createPurchaseReturnOrderApi({
        order: {
          uid: orderBase.uid,
          desc: orderBase.desc,
          status: orderBase.status,
          isApproved: orderBase.isApproved,
          isLocked: orderBase.isLocked,
          company: orderBase.company,
          provider: { connect: { uid: partyUid } }
        },
        details
      });
    case DocumentType.SALE_ORDER:
      return createSalesOrderApi({
        order: {
          ...orderBase,
          customer: { connect: { uid: partyUid } }
        },
        details
      });
    case DocumentType.SALE_OUTBOUND:
      return createSalesOutboundApi({
        order: {
          ...orderBase,
          customer: { connect: { uid: partyUid } }
        },
        details
      });
    case DocumentType.SALE_RETURN:
      return createSalesReturnOrderApi({
        order: {
          uid: orderBase.uid,
          desc: orderBase.desc,
          status: orderBase.status,
          isApproved: orderBase.isApproved,
          isLocked: orderBase.isLocked,
          company: orderBase.company,
          customer: { connect: { uid: partyUid } }
        },
        details
      });
  }
}

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
      await ensureProducts(orderForm.value, enableAutoCreate.value);

      if (orderForm.value.details.some(detail => !detail.productUid)) {
        message("存在未匹配的商品，请补充商品信息或开启智能新增基础资料", {
          type: "error"
        });
        return false;
      }

      const partyUid = await ensurePartyUid(
        orderForm.value,
        currentDocConfig.value,
        enableAutoCreate.value
      );
      const companyId = getCompanyId();
      const repoId = await resolveRepoId(orderForm.value);
      const res = await submitFormalOrder(
        orderForm.value,
        partyUid,
        companyId,
        repoId
      );
      if (res.code !== 200) {
        throw new Error(res.msg || "创建失败");
      }

      const createdId = extractCreatedId(res);
      historyRecords.value.unshift({
        id: String(Date.now()),
        timestamp: new Date().toISOString(),
        method: uploadMethod,
        documentType,
        summary: `${currentDocConfig.value.label} - ${orderForm.value.details.length}个商品`,
        success: true,
        resultOrderUid: createdId ? String(createdId) : undefined
      });

      message("单据创建成功", { type: "success" });
      return true;
    } catch (error) {
      const errMsg =
        error instanceof Error && error.message
          ? error.message
          : "提交失败，请重试";
      message(errMsg, { type: "error" });
      return false;
    }
  }

  function resetForm(documentType: DocumentType) {
    orderForm.value = {
      documentType,
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
