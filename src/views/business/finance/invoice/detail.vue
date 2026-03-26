<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute } from "vue-router";
import {
  getInvoiceDetail,
  issueInvoice,
  redFlushInvoice,
  type InvoiceRow
} from "@/api/business/invoice";
import { handleApiError } from "@/utils/error";
import { message } from "@/utils/message";
import { formatMoneyFromFen } from "@/utils/formatMoney";

defineOptions({
  name: "FinanceInvoiceDetail"
});

const route = useRoute();
const loading = ref(false);
const row = ref<InvoiceRow | null>(null);

const canIssue = computed(
  () => row.value?.invoiceRole === "BLUE" && row.value?.status === "draft"
);
const canRedFlush = computed(
  () =>
    !!row.value &&
    row.value.invoiceRole === "BLUE" &&
    row.value.status === "issued" &&
    row.value.redFlushStatus !== "FULL"
);

async function loadDetail() {
  const uid = String(route.params.uid || "");
  if (!uid) return;
  loading.value = true;
  try {
    const { data } = await getInvoiceDetail(uid);
    row.value = data || null;
  } catch (error) {
    handleApiError(error, "加载发票详情失败");
  } finally {
    loading.value = false;
  }
}

async function handleIssue() {
  if (!row.value) return;
  try {
    await issueInvoice(row.value.uid);
    message("发票已签发", { type: "success" });
    await loadDetail();
  } catch (error) {
    handleApiError(error, "签发失败");
  }
}

function buildRedFlushPayload(detail: InvoiceRow) {
  return {
    invoiceNumber: `${detail.invoiceNumber}-R`,
    invoiceType: detail.invoiceType || "vat_normal",
    invoiceDate: new Date().toISOString().slice(0, 10),
    amount: Math.abs(Number(detail.amount || 0)),
    taxAmount: Math.abs(Number(detail.taxAmount || 0)),
    totalAmount: Math.abs(Number(detail.totalAmount || 0)),
    redFlushReason: "后台红冲"
  };
}

async function handleRedFlush() {
  if (!row.value) return;
  try {
    await redFlushInvoice(row.value.uid, buildRedFlushPayload(row.value));
    message("红字发票已创建", { type: "success" });
    await loadDetail();
  } catch (error) {
    handleApiError(error, "红冲失败");
  }
}

onMounted(loadDetail);
</script>

<template>
  <div v-loading="loading" class="main">
    <el-card v-if="row">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="发票号">
          {{ row.invoiceNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="票据角色">
          {{ row.invoiceRole === "RED" ? "红字票" : "蓝票" }}
        </el-descriptions-item>
        <el-descriptions-item label="业务类型">
          {{ row.businessType === "PURCHASE" ? "采购进项" : "销售销项" }}
        </el-descriptions-item>
        <el-descriptions-item label="往来单位">
          {{ row.partyName }}
        </el-descriptions-item>
        <el-descriptions-item label="对账单号">
          {{ row.statementNo }}
        </el-descriptions-item>
        <el-descriptions-item label="金额">
          {{ formatMoneyFromFen(row.amount) }}
        </el-descriptions-item>
        <el-descriptions-item label="税额">
          {{ formatMoneyFromFen(row.taxAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="价税合计">
          {{ formatMoneyFromFen(row.totalAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ row.status }}
        </el-descriptions-item>
        <el-descriptions-item label="红冲状态">
          {{ row.redFlushStatus || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="开票日期">
          {{ row.invoiceDate.slice(0, 10) }}
        </el-descriptions-item>
        <el-descriptions-item label="备注">
          {{ row.remark || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="原票">
          {{
            row.sourceInvoice?.invoiceNumber || row.sourceInvoiceNumber || "-"
          }}
        </el-descriptions-item>
        <el-descriptions-item label="红冲原因">
          {{ row.redFlushReason || "-" }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left"> 单据主链路 </el-divider>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="来源订单">
          {{ row.trace?.orders.map(item => item.docNo).join("、") || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="退货单">
          {{ row.trace?.returns.map(item => item.docNo).join("、") || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="收付款单">
          {{ row.trace?.fundOrders.map(item => item.billNo).join("、") || "-" }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left"> 开票映射 </el-divider>
      <el-table :data="row.deliveryLineLinks || []" border>
        <el-table-column
          prop="saleDeliveryNoteLineUid"
          label="发货行 UID"
          min-width="180"
        />
        <el-table-column
          prop="saleOrderDetailId"
          label="销售行 UID"
          min-width="180"
        />
        <el-table-column prop="quantity" label="数量" min-width="100" />
        <el-table-column label="金额" min-width="120">
          <template #default="{ row: link }">
            {{ formatMoneyFromFen(link.totalAmount) }}
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left"> 红字关联 </el-divider>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="红字票">
          {{
            row.redFlushInvoices?.map(item => item.invoiceNumber).join("、") ||
            "-"
          }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="mt-4 flex gap-3">
        <el-button v-if="canIssue" type="primary" @click="handleIssue">
          签发发票
        </el-button>
        <el-button v-if="canRedFlush" type="danger" @click="handleRedFlush">
          红冲发票
        </el-button>
      </div>
    </el-card>
  </div>
</template>
