<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from "vue";
import {
  getCustomerApi,
  getCustomerBalanceHistoryApi
} from "@/api/business/customer";
import {
  getProviderApi,
  getProviderBalanceHistoryApi
} from "@/api/business/provider";
import {
  createManualBalanceAdjustmentApi,
  type BalanceAdjustment
} from "@/api/business/balanceAdjustment";
import { addDialog } from "@/components/ReDialog";
import { message } from "@/utils/message";
import { formatMoneyFromFen, yuanToFen } from "@/utils/formatMoney";
import { useUserStoreHook } from "@/store/modules/user";
import ManualAdjustmentForm from "./ManualAdjustmentForm.vue";
import {
  getBalanceAdjustmentSourceTypeLabel,
  getBalanceAdjustmentTypeLabel
} from "./labels";

type PartyType = "customer" | "provider";

const props = defineProps<{
  partyType: PartyType;
  partyUid: string;
  partyName?: string;
}>();

const loading = ref(false);
const listLoading = ref(false);
const currentBalanceFen = ref(0);
const historyList = ref<BalanceAdjustment[]>([]);
const pagination = ref({
  total: 0,
  pageSize: 20,
  currentPage: 1
});

const isAdmin = computed(() =>
  (useUserStoreHook().roles ?? []).includes("admin")
);

const balanceLabel = computed(() =>
  props.partyType === "customer" ? "应收余额" : "应付余额"
);

const balanceHelp = computed(() =>
  props.partyType === "customer"
    ? "正数表示客户欠公司钱"
    : "正数表示公司欠供应商钱"
);

function toFenNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatSignedFen(value: number | string | null | undefined): string {
  const n = toFenNumber(value);
  if (n === 0) return `¥${formatMoneyFromFen(0)}`;
  const sign = n > 0 ? "+" : "-";
  return `${sign}¥${formatMoneyFromFen(Math.abs(n))}`;
}

async function loadBalance() {
  if (!props.partyUid) return;

  loading.value = true;
  try {
    if (props.partyType === "customer") {
      const res = await getCustomerApi(props.partyUid);
      currentBalanceFen.value = toFenNumber(res.data?.receivableBalance);
      return;
    }

    const res = await getProviderApi(props.partyUid);
    currentBalanceFen.value = toFenNumber(res.data?.payableBalance);
  } finally {
    loading.value = false;
  }
}

async function loadHistory() {
  if (!props.partyUid) return;

  listLoading.value = true;
  try {
    const { currentPage, pageSize } = pagination.value;
    const res =
      props.partyType === "customer"
        ? await getCustomerBalanceHistoryApi(props.partyUid, {
            index: currentPage,
            pageSize
          })
        : await getProviderBalanceHistoryApi(props.partyUid, {
            index: currentPage,
            pageSize
          });

    if (res.code !== 200) {
      message(res.msg || "获取余额历史失败", { type: "error" });
      historyList.value = [];
      pagination.value.total = 0;
      return;
    }

    historyList.value = res.data?.list ?? [];
    pagination.value.total = res.data?.count ?? 0;
  } finally {
    listLoading.value = false;
  }
}

async function reloadAll() {
  await Promise.all([loadBalance(), loadHistory()]);
}

function openManualAdjustmentDialog() {
  if (!isAdmin.value) return;

  const formRef = ref<InstanceType<typeof ManualAdjustmentForm> | null>(null);

  addDialog({
    title: `${props.partyName ? props.partyName + " - " : ""}手工余额调整`,
    width: "520px",
    draggable: true,
    closeOnClickModal: false,
    contentRenderer: () =>
      h(ManualAdjustmentForm, {
        ref: formRef
      }),
    beforeSure: async done => {
      const formInstance = formRef.value?.getRef();
      if (!formInstance) return;

      const valid = await formInstance.validate().catch(() => false);
      if (!valid) return;

      const data = formRef.value?.getForm();
      if (!data) return;
      const baseAmountFen = yuanToFen(data.amountYuan);
      const amountFen =
        data.direction === "increase" ? baseAmountFen : -baseAmountFen;

      try {
        const res = await createManualBalanceAdjustmentApi({
          ...(props.partyType === "customer"
            ? { customerId: props.partyUid }
            : { providerId: props.partyUid }),
          amount: amountFen,
          remark: data.remark?.trim() ? data.remark.trim() : undefined
        });
        if (res.code !== 200) {
          message(res.msg || "调整失败", { type: "error" });
          return;
        }
        message("调整成功", { type: "success" });
        done();
        pagination.value.currentPage = 1;
        await reloadAll();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "调整失败";
        message(msg, { type: "error" });
      }
    }
  });
}

function handlePageChange(page: number) {
  pagination.value.currentPage = page;
  loadHistory();
}

watch(
  () => props.partyUid,
  () => {
    pagination.value.currentPage = 1;
    reloadAll();
  }
);

onMounted(() => {
  reloadAll();
});
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-sm text-gray-500">
          {{ balanceLabel }}
          <span class="ml-2 text-xs text-gray-400">({{ balanceHelp }})</span>
        </div>
        <div class="text-xl font-semibold">
          ¥{{ formatMoneyFromFen(currentBalanceFen) }}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button
          v-if="isAdmin"
          type="primary"
          :loading="loading"
          @click="openManualAdjustmentDialog"
        >
          手工调整
        </el-button>
        <el-button :loading="loading || listLoading" @click="reloadAll">
          刷新
        </el-button>
      </div>
    </div>

    <el-table border :data="historyList" :loading="listLoading" height="420">
      <el-table-column label="时间" prop="createAt" width="170" />
      <el-table-column label="类型" prop="type" min-width="120">
        <template #default="{ row }">
          {{ getBalanceAdjustmentTypeLabel(row.type) }}
        </template>
      </el-table-column>
      <el-table-column label="来源" prop="sourceType" min-width="100">
        <template #default="{ row }">
          {{ getBalanceAdjustmentSourceTypeLabel(row.sourceType) }}
        </template>
      </el-table-column>
      <el-table-column label="金额" prop="amount" width="140">
        <template #default="{ row }">
          <span
            :class="{
              'text-red-500': toFenNumber(row.amount) < 0,
              'text-green-600': toFenNumber(row.amount) > 0
            }"
          >
            {{ formatSignedFen(row.amount) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="调整前" prop="balanceBefore" width="140">
        <template #default="{ row }">
          ¥{{ formatMoneyFromFen(toFenNumber(row.balanceBefore)) }}
        </template>
      </el-table-column>
      <el-table-column label="调整后" prop="balanceAfter" width="140">
        <template #default="{ row }">
          ¥{{ formatMoneyFromFen(toFenNumber(row.balanceAfter)) }}
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="160">
        <template #default="{ row }">
          {{ row.remark || "-" }}
        </template>
      </el-table-column>
      <el-table-column label="撤销" prop="isReversed" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.isReversed" type="info">已撤销</el-tag>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-end">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="pagination.total"
        :page-size="pagination.pageSize"
        :current-page="pagination.currentPage"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>
