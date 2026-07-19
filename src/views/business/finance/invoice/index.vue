<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import StatusTag from "@/components/StatusTag/index.vue";
import type { StatusConfig } from "@/components/StatusTag/types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import {
  getInvoicePage,
  issueInvoice,
  redFlushInvoice,
  type InvoiceBusinessType,
  type InvoiceRow
} from "@/api/business/invoice";
import { handleApiError } from "@/utils/error";
import { message } from "@/utils/message";
import { columns } from "./columns";
import InvoiceFormDialog from "./InvoiceFormDialog.vue";

defineOptions({
  name: "FinanceInvoiceList"
});

const route = useRoute();
const router = useRouter();

const STATUS_MAP: Record<string, StatusConfig> = {
  draft: { label: "草稿", type: "warning" },
  issued: { label: "已签发", type: "success" },
  cancelled: { label: "已作废", type: "info" }
};

const form = ref({
  businessType: undefined as InvoiceBusinessType | undefined,
  status: undefined as string | undefined,
  invoiceNumber: undefined as string | undefined
});

const dataList = ref<InvoiceRow[]>([]);
const loading = ref(false);
const createDialogVisible = ref(false);
const createPreset = ref<{
  businessType?: InvoiceBusinessType;
  deliveryNoteId?: string;
  purchaseInboundId?: string;
} | null>(null);

const pagination = ref({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

async function loadList() {
  loading.value = true;
  try {
    const { data } = await getInvoicePage(pagination.value.currentPage, {
      businessType: form.value.businessType,
      status: form.value.status as "draft" | "issued" | "cancelled" | undefined,
      invoiceNumber: form.value.invoiceNumber
    });
    dataList.value = data?.list || [];
    pagination.value.total = data?.total || 0;
  } catch (error) {
    handleApiError(error, "加载发票失败");
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  createPreset.value = null;
  createDialogVisible.value = true;
}

function handleView(row: InvoiceRow) {
  router.push(`/finance/invoice/detail/${row.uid}`);
}

async function handleIssue(row: InvoiceRow) {
  try {
    await issueInvoice(row.uid);
    message("发票已签发", { type: "success" });
    await loadList();
  } catch (error) {
    handleApiError(error, "签发失败");
  }
}

function buildRedFlushPayload(row: InvoiceRow) {
  return {
    invoiceNumber: `${row.invoiceNumber}-R`,
    invoiceType: row.invoiceType || "vat_normal",
    invoiceDate: new Date().toISOString().slice(0, 10),
    amount: Math.abs(Number(row.amount || 0)),
    taxAmount: Math.abs(Number(row.taxAmount || 0)),
    totalAmount: Math.abs(Number(row.totalAmount || 0)),
    redFlushReason: "后台红冲"
  };
}

function canRedFlush(row: InvoiceRow) {
  return (
    row.invoiceRole === "BLUE" &&
    row.status === "issued" &&
    row.redFlushStatus !== "FULL"
  );
}

async function handleRedFlush(row: InvoiceRow) {
  try {
    await redFlushInvoice(row.uid, buildRedFlushPayload(row));
    message("红字发票已创建", { type: "success" });
    await loadList();
  } catch (error) {
    handleApiError(error, "红冲失败");
  }
}

watch(
  () => route.query,
  query => {
    const deliveryNoteId = String(query.deliveryNoteId || "").trim();
    const purchaseInboundId = String(query.purchaseInboundId || "").trim();
    const businessType = String(query.businessType || "").trim() as
      | InvoiceBusinessType
      | "";
    if (query.autoCreate === "1" && (deliveryNoteId || purchaseInboundId)) {
      createPreset.value = {
        ...(deliveryNoteId ? { deliveryNoteId } : {}),
        ...(purchaseInboundId ? { purchaseInboundId } : {}),
        businessType: businessType || "SALE"
      };
      createDialogVisible.value = true;
      router.replace({ path: route.path, query: {} });
    }
  },
  { immediate: true }
);

loadList();
</script>

<template>
  <div class="main">
    <ReSearchForm
      :form="form"
      :loading="loading"
      @search="loadList"
      @reset="loadList"
    >
      <el-form-item label="业务类型">
        <el-select v-model="form.businessType" clearable>
          <el-option label="销售销项" value="SALE" />
          <el-option label="采购进项" value="PURCHASE" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" clearable>
          <el-option label="草稿" value="draft" />
          <el-option label="已签发" value="issued" />
          <el-option label="已作废" value="cancelled" />
        </el-select>
      </el-form-item>
      <el-form-item label="发票号">
        <el-input v-model="form.invoiceNumber" />
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="发票列表" :columns="columns" @refresh="loadList">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openCreateDialog"
        >
          新建发票
        </el-button>
      </template>

      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          table-layout="auto"
          :size="size"
          :loading="loading"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          @page-size-change="val => (pagination.pageSize = val) && loadList()"
          @page-current-change="
            val => (pagination.currentPage = val) && loadList()
          "
        >
          <template #status="{ row }">
            <StatusTag :status="row.status" :status-map="STATUS_MAP" />
          </template>
          <template #operation="{ row }">
            <el-button
              link
              type="primary"
              :size="size"
              @click="handleView(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="row.status === 'draft'"
              link
              type="primary"
              :size="size"
              @click="handleIssue(row)"
            >
              签发
            </el-button>
            <el-button
              v-if="canRedFlush(row)"
              link
              type="danger"
              :size="size"
              @click="handleRedFlush(row)"
            >
              红冲
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <InvoiceFormDialog
      v-model="createDialogVisible"
      :preset="createPreset"
      @success="loadList"
    />
  </div>
</template>
