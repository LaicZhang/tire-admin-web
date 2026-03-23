<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getDocumentCenterPrintApi,
  type DocumentCenterPrintDto,
  type DocumentCenterType
} from "@/api/document-center";
import { extractErrorMessage } from "@/utils/error";

defineOptions({
  name: "Success"
});

type DescriptionColumn = {
  label: string;
  value: string;
};

type DocumentRouteConfig = {
  path: string;
  queryMode: "uid" | "uidAction" | "none";
};

type RouteParams =
  | {
      uid: string;
      documentType: DocumentCenterType;
    }
  | {
      error: string;
    };

const EMPTY_VALUE = "-";
const VALID_DOCUMENT_TYPES = [
  "RECEIPT",
  "WRITE_OFF",
  "OTHER_INCOME",
  "OTHER_EXPENSE",
  "TRANSFER",
  "INVENTORY_TRANSFER",
  "STOCKTAKING",
  "OTHER_INBOUND",
  "OTHER_OUTBOUND",
  "ASSEMBLY",
  "DISASSEMBLY",
  "COST_ADJUST",
  "PAYMENT",
  "PURCHASE_ORDER",
  "PURCHASE_INBOUND",
  "PURCHASE_RETURN",
  "SALE_ORDER",
  "SALE_OUTBOUND",
  "SALE_RETURN"
] as const satisfies readonly DocumentCenterType[];

const DOCUMENT_TYPE_LABELS: Record<DocumentCenterType, string> = {
  RECEIPT: "收款单",
  WRITE_OFF: "核销单",
  OTHER_INCOME: "其他收入单",
  OTHER_EXPENSE: "其他支出单",
  TRANSFER: "转账单",
  INVENTORY_TRANSFER: "调拨单",
  STOCKTAKING: "盘点单",
  OTHER_INBOUND: "其他入库单",
  OTHER_OUTBOUND: "其他出库单",
  ASSEMBLY: "组装单",
  DISASSEMBLY: "拆卸单",
  COST_ADJUST: "成本调整单",
  PAYMENT: "付款单",
  PURCHASE_ORDER: "采购订单",
  PURCHASE_INBOUND: "采购入库单",
  PURCHASE_RETURN: "采购退货单",
  SALE_ORDER: "销售订单",
  SALE_OUTBOUND: "销售出库单",
  SALE_RETURN: "销售退货单"
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  APPROVED: "已审核",
  COMPLETED: "已完成",
  VOID: "已作废"
};

const DOCUMENT_ROUTE_MAP: Record<DocumentCenterType, DocumentRouteConfig> = {
  RECEIPT: { path: "/fund/receipt", queryMode: "uid" },
  WRITE_OFF: { path: "/fund/writeOff", queryMode: "uid" },
  OTHER_INCOME: { path: "/fund/otherIncome", queryMode: "uid" },
  OTHER_EXPENSE: { path: "/fund/otherExpense", queryMode: "uid" },
  TRANSFER: { path: "/fund/transfer", queryMode: "uid" },
  INVENTORY_TRANSFER: { path: "/inventory/transfer", queryMode: "uid" },
  STOCKTAKING: { path: "/inventory/stocktaking", queryMode: "uid" },
  OTHER_INBOUND: { path: "/inventory/otherInbound", queryMode: "uid" },
  OTHER_OUTBOUND: { path: "/inventory/otherOutbound", queryMode: "uid" },
  ASSEMBLY: { path: "/inventory/assembly", queryMode: "uid" },
  DISASSEMBLY: { path: "/inventory/disassembly", queryMode: "uid" },
  COST_ADJUST: { path: "/inventory/costAdjust", queryMode: "uid" },
  PAYMENT: { path: "/fund/payment", queryMode: "uid" },
  PURCHASE_ORDER: { path: "/purchase/order", queryMode: "uidAction" },
  PURCHASE_INBOUND: { path: "/purchase/inbound", queryMode: "uidAction" },
  PURCHASE_RETURN: { path: "/purchase/return", queryMode: "uidAction" },
  SALE_ORDER: { path: "/sales/order", queryMode: "none" },
  SALE_OUTBOUND: { path: "/sales/outbound", queryMode: "none" },
  SALE_RETURN: { path: "/sales/return", queryMode: "none" }
};

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const error = ref("");
const documentData = ref<DocumentCenterPrintDto | null>(null);
const currentUid = ref("");
const currentDocumentType = ref<DocumentCenterType | null>(null);

const columns = computed<DescriptionColumn[]>(() =>
  buildColumns(documentData.value)
);
const descriptionTitle = computed(() =>
  documentData.value
    ? `${DOCUMENT_TYPE_LABELS[documentData.value.documentType]}信息`
    : "单据信息"
);
const resultSubtitle = computed(() => {
  if (!documentData.value) return "";
  return `${DOCUMENT_TYPE_LABELS[documentData.value.documentType]} ${documentData.value.billNo} 已提交成功。`;
});
const canViewDocument = computed(() => {
  if (!currentDocumentType.value) return false;
  return DOCUMENT_ROUTE_MAP[currentDocumentType.value].queryMode !== "none";
});

function normalizeQueryValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function isDocumentCenterType(
  value: string | undefined
): value is DocumentCenterType {
  return (
    value !== undefined &&
    VALID_DOCUMENT_TYPES.includes(value as DocumentCenterType)
  );
}

function formatValue(value?: string): string {
  const trimmedValue = value?.trim() ?? "";
  return trimmedValue || EMPTY_VALUE;
}

function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? formatValue(status);
}

function buildColumns(
  data: DocumentCenterPrintDto | null
): DescriptionColumn[] {
  if (!data) return [];

  const baseColumns: DescriptionColumn[] = [
    { label: "单据编号：", value: formatValue(data.billNo) },
    {
      label: "单据类型：",
      value: DOCUMENT_TYPE_LABELS[data.documentType]
    },
    { label: "状态：", value: formatStatus(data.status) },
    { label: "往来单位：", value: formatValue(data.targetName) }
  ];

  const detailColumns = Object.entries(data.detail ?? {}).map(
    ([label, value]) => ({
      label: `${label}：`,
      value: formatValue(value)
    })
  );

  return [...baseColumns, ...detailColumns];
}

function resolveRouteParams(): RouteParams {
  const uid = normalizeQueryValue(route.query.uid);
  const documentType = normalizeQueryValue(route.query.documentType);

  if (!uid || !documentType) {
    return { error: "缺少单据类型或单据 UID，无法加载提交结果。" };
  }

  if (!isDocumentCenterType(documentType)) {
    return { error: `不支持的单据类型：${documentType}` };
  }

  return { uid, documentType };
}

async function loadDocumentResult() {
  const params = resolveRouteParams();
  documentData.value = null;
  error.value = "";

  if ("error" in params) {
    currentUid.value = "";
    currentDocumentType.value = null;
    error.value = params.error;
    return;
  }

  currentUid.value = params.uid;
  currentDocumentType.value = params.documentType;
  loading.value = true;

  try {
    const response = await getDocumentCenterPrintApi(
      params.documentType,
      params.uid
    );
    if (response.code !== 200) {
      error.value = response.msg || "获取单据详情失败";
      return;
    }
    documentData.value = response.data;
  } catch (requestError) {
    error.value = extractErrorMessage(requestError, "获取单据详情失败");
  } finally {
    loading.value = false;
  }
}

function handleBack() {
  router.back();
}

function handleViewDocument() {
  if (!currentDocumentType.value || !currentUid.value) return;

  const routeConfig = DOCUMENT_ROUTE_MAP[currentDocumentType.value];
  if (routeConfig.queryMode === "none") return;

  const query =
    routeConfig.queryMode === "uidAction"
      ? { uid: currentUid.value, action: "view" }
      : { uid: currentUid.value };

  router.push({
    path: routeConfig.path,
    query
  });
}

watch(
  () => [route.query.documentType, route.query.uid],
  () => {
    void loadDocumentResult();
  },
  { immediate: true }
);
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span class="font-medium">提交结果</span>
      </div>
    </template>

    <div v-if="loading" class="p-6">
      <el-skeleton :rows="8" animated />
    </div>

    <el-result
      v-else-if="error"
      icon="error"
      title="结果加载失败"
      :sub-title="error"
    >
      <template #extra>
        <el-button type="primary" @click="handleBack">返回上一页</el-button>
      </template>
    </el-result>

    <template v-else-if="documentData">
      <el-result icon="success" title="提交成功" :sub-title="resultSubtitle">
        <template #extra>
          <div class="flex gap-3">
            <el-button type="primary" @click="handleBack">
              返回上一页
            </el-button>
            <el-button :disabled="!canViewDocument" @click="handleViewDocument">
              查看单据
            </el-button>
          </div>
        </template>
      </el-result>

      <div class="p-6 w-[90%] m-auto bg-[#fafafa] dark:bg-[#1d1d1d]">
        <PureDescriptions
          :title="descriptionTitle"
          :columns="columns"
          class="mb-5"
        />
      </div>
    </template>
  </el-card>
</template>

<style scoped>
:deep(.el-descriptions__body) {
  background: transparent;
}
</style>
