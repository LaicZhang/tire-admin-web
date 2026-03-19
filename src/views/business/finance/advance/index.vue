<script setup lang="ts">
import { PAGE_SIZE_SMALL } from "@/utils/constants";
import { ref, computed } from "vue";
import ReSearchForm from "@/components/ReSearchForm/index.vue";
import { columns } from "./columns";
import StatusTag from "@/components/StatusTag/index.vue";
import type { StatusConfig } from "@/components/StatusTag/types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddFill from "~icons/ri/add-circle-line";
import {
  approveAdvancePayment,
  deleteAdvancePayment,
  getAdvancePaymentList,
  type AdvancePaymentListItem,
  type AdvancePaymentType
} from "@/api/business/advance-payment";
import { handleApiError, message } from "@/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useCrud } from "@/composables";
import type { CommonResult } from "@/api/type";
import { useOptions } from "@/composables/useOptions";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import AdvancePaymentFormDialog from "./AdvancePaymentFormDialog.vue";
import { paymentStatusMap } from "@/views/fund/payment/types";
import { calcAdvanceReceiptStatus } from "./types";

defineOptions({
  name: "AdvancePaymentList"
});

const form = ref({
  type: undefined as string | undefined,
  targetName: undefined as string | undefined
});

const searchFormRef = ref<InstanceType<typeof ReSearchForm> | null>(null);
const { customers, providers } = useOptions();
const { confirm } = useConfirmDialog();
const dialogVisible = ref(false);
const initialType = computed<AdvancePaymentType | undefined>(() => {
  const value = form.value.type;
  if (!value) return undefined;
  return value as AdvancePaymentType;
});
const RECEIPT_STATUS_MAP: Record<string, StatusConfig> = {
  ACTIVE: { label: "可用", type: "success" },
  EXHAUSTED: { label: "已用完", type: "info" }
};
const PAYMENT_STATUS_MAP: Record<string, StatusConfig> = paymentStatusMap;
const customerNameMap = computed(
  () => new Map(customers.value.map(item => [item.uid, item.name]))
);
const providerNameMap = computed(
  () => new Map(providers.value.map(item => [item.uid, item.name]))
);

const targetNameOptions = computed(() => {
  const type = form.value.type;
  const pool =
    type === "RECEIPT"
      ? customers.value
      : type === "PAYMENT"
        ? providers.value
        : [...customers.value, ...providers.value];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of pool) {
    const name = String(item.name || "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
});

const {
  loading,
  dataList,
  pagination,
  fetchData,
  onCurrentChange,
  onSizeChange
} = useCrud<
  AdvancePaymentListItem,
  CommonResult<{
    list: AdvancePaymentListItem[];
    total?: number;
    count?: number;
  }>,
  { page: number; pageSize: number }
>({
  api: ({ page, pageSize }) =>
    getAdvancePaymentList({
      page,
      pageSize,
      ...form.value
    }) as unknown as Promise<
      CommonResult<{
        list: AdvancePaymentListItem[];
        total?: number;
        count?: number;
      }>
    >,
  pagination: {
    total: 0,
    pageSize: PAGE_SIZE_SMALL,
    currentPage: 1,
    background: true
  },
  transform: res => {
    if (res.code !== 200) {
      message(res.msg || "加载失败", { type: "error" });
      return { list: [], total: 0 };
    }
    return {
      list: res.data?.list ?? [],
      total: res.data?.total ?? 0
    };
  },
  immediate: true
});

const tableData = computed(() =>
  dataList.value.map(row => ({
    ...row,
    targetName:
      row.targetName ||
      (row.type === "RECEIPT"
        ? customerNameMap.value.get(row.targetId || "")
        : providerNameMap.value.get(row.targetId || "")) ||
      ""
  }))
);

const onSearch = () => {
  pagination.value = { ...pagination.value, currentPage: 1 };
  fetchData();
};

function onReset() {
  searchFormRef.value?.resetFields();
  onSearch();
}

function handleAdd() {
  dialogVisible.value = true;
}

function canDelete(row: AdvancePaymentListItem) {
  return row.type === "RECEIPT" || row.status === "DRAFT";
}

function canApprove(row: AdvancePaymentListItem) {
  return row.type === "PAYMENT" && row.status === "DRAFT";
}

function getStatusConfig(row: AdvancePaymentListItem) {
  if (row.type === "RECEIPT") {
    return {
      status: calcAdvanceReceiptStatus(row.remainingAmount),
      statusMap: RECEIPT_STATUS_MAP
    };
  }
  return {
    status: row.status || "UNKNOWN",
    statusMap: PAYMENT_STATUS_MAP
  };
}

async function handleDelete(row: AdvancePaymentListItem) {
  if (!canDelete(row)) {
    message("当前状态不允许删除", { type: "warning" });
    return;
  }

  const ok = await confirm(`确定删除单据 ${row.billNo} 吗？`, "删除确认", {
    type: "warning"
  });
  if (!ok) return;

  try {
    await deleteAdvancePayment(String(row.id), row.type, row.uid);
    message("删除成功", { type: "success" });
    fetchData();
  } catch (error) {
    handleApiError(error, "删除失败");
  }
}

async function handleApprove(row: AdvancePaymentListItem) {
  if (!canApprove(row)) {
    message("仅草稿状态预付款允许审核", { type: "warning" });
    return;
  }

  const ok = await confirm(
    `确定审核单据 ${row.billNo} 吗？审核后会扣减对应账户余额。`,
    "审核确认",
    { type: "warning" }
  );
  if (!ok) return;

  try {
    await approveAdvancePayment(String(row.id), row.type, row.uid);
    message("审核成功", { type: "success" });
    fetchData();
  } catch (error) {
    handleApiError(error, "审核失败");
  }
}
</script>

<template>
  <div class="main">
    <el-alert
      title="预收款支持核销闭环，预付款会生成付款单草稿并在审核后完成账户扣减。"
      type="info"
      :closable="false"
      class="mb-4"
    />
    <ReSearchForm
      ref="searchFormRef"
      :form="form"
      :loading="loading"
      @search="onSearch"
      @reset="onReset"
    >
      <el-form-item label="相关类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择类型"
          clearable
          class="w-[160px]"
        >
          <el-option label="预收款" value="RECEIPT" />
          <el-option label="预付款" value="PAYMENT" />
        </el-select>
      </el-form-item>
      <el-form-item label="往来单位" prop="targetName">
        <el-select
          v-model="form.targetName"
          placeholder="请选择或输入单位名称"
          filterable
          clearable
          allow-create
          default-first-option
          class="w-[160px]"
        >
          <el-option
            v-for="name in targetNameOptions"
            :key="name"
            :label="name"
            :value="name"
          />
        </el-select>
      </el-form-item>
    </ReSearchForm>

    <PureTableBar title="预收预付列表" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新建
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="tableData"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="val => (pagination.pageSize = val) && onSearch()"
          @page-current-change="
            val => (pagination.currentPage = val) && onSearch()
          "
        >
          <template #operation="{ row }">
            <el-button
              v-if="canApprove(row)"
              link
              type="primary"
              size="small"
              @click="handleApprove(row)"
            >
              审核
            </el-button>
            <el-button
              v-if="canDelete(row)"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <span
              v-if="!canApprove(row) && !canDelete(row)"
              class="text-gray-400"
            >
              -
            </span>
          </template>

          <template #status="{ row }">
            <StatusTag
              :status="getStatusConfig(row).status"
              :status-map="getStatusConfig(row).statusMap"
            />
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <AdvancePaymentFormDialog
      v-model="dialogVisible"
      :initial-type="initialType"
      @success="onSearch"
    />
  </div>
</template>
