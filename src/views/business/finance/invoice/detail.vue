<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute } from "vue-router";
import {
  cancelInvoice,
  getInvoiceDetail,
  issueInvoice,
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

const canIssue = computed(() => row.value?.status === "draft");
const canCancel = computed(
  () => !!row.value && row.value.status !== "cancelled"
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

async function handleCancel() {
  if (!row.value) return;
  try {
    await cancelInvoice(row.value.uid, "后台作废");
    message("发票已作废", { type: "success" });
    await loadDetail();
  } catch (error) {
    handleApiError(error, "作废失败");
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
        <el-descriptions-item label="开票日期">
          {{ row.invoiceDate.slice(0, 10) }}
        </el-descriptions-item>
        <el-descriptions-item label="备注">
          {{ row.remark || "-" }}
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

      <div class="mt-4 flex gap-3">
        <el-button v-if="canIssue" type="primary" @click="handleIssue">
          签发发票
        </el-button>
        <el-button v-if="canCancel" type="danger" @click="handleCancel">
          作废发票
        </el-button>
      </div>
    </el-card>
  </div>
</template>
