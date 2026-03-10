<script setup lang="ts">
import { computed, ref } from "vue";
import {
  confirmStatement,
  voidStatement,
  type Statement
} from "@/api/business/statement";
import { handleApiError, message } from "@/utils";
import { formatMoneyFromFen } from "@/utils/formatMoney";

const props = defineProps<{
  modelValue: boolean;
  row: Statement | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const loading = ref(false);

const canConfirm = computed(() => props.row?.status === "DRAFT");
const canVoid = computed(() => {
  const status = props.row?.status;
  return status === "DRAFT" || status === "CONFIRMED";
});

async function handleConfirm() {
  if (!props.row) return;
  loading.value = true;
  try {
    await confirmStatement(String(props.row.id));
    message("对账单已确认", { type: "success" });
    dialogVisible.value = false;
    emit("success");
  } catch (error) {
    handleApiError(error, "确认对账单失败");
  } finally {
    loading.value = false;
  }
}

async function handleVoid() {
  if (!props.row) return;
  loading.value = true;
  try {
    await voidStatement(String(props.row.id));
    message("对账单已作废", { type: "success" });
    dialogVisible.value = false;
    emit("success");
  } catch (error) {
    handleApiError(error, "作废对账单失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="对账单摘要"
    width="560px"
    :close-on-click-modal="false"
  >
    <el-descriptions v-if="row" :column="1" border>
      <el-descriptions-item label="对账单号">
        {{ row.statementNo || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="类型">
        {{ row.type === "CUSTOMER" ? "客户对账" : "供应商对账" }}
      </el-descriptions-item>
      <el-descriptions-item label="往来单位">
        {{ row.targetName || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="对账周期">
        {{ row.startDate || row.startTime || "-" }} ~
        {{ row.endDate || row.endTime || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="金额">
        {{ formatMoneyFromFen(Number(row.amount || 0)) }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        {{ row.status || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ row.createTime || "-" }}
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button :disabled="loading" @click="dialogVisible = false">
        关闭
      </el-button>
      <el-button
        v-if="canVoid"
        type="danger"
        :loading="loading"
        @click="handleVoid"
      >
        作废
      </el-button>
      <el-button
        v-if="canConfirm"
        type="primary"
        :loading="loading"
        @click="handleConfirm"
      >
        确认对账
      </el-button>
    </template>
  </el-dialog>
</template>
