<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  getOrderAuditConfigApi,
  updateOrderAuditConfigApi,
  type OrderAuditConfig,
  type OrderAuditMode,
  type OrderAuditOrderType,
  type OrderAuditTypeConfig
} from "@/api";
import { message } from "@/utils";

defineOptions({
  name: "CompanyOrderAudit"
});

const APPROVALS_REQUIRED_MIN = 1;
const APPROVALS_REQUIRED_MAX = 5;

const ORDER_TYPES = [
  "sale-order",
  "purchase-order",
  "return-order",
  "claim-order",
  "transfer-order",
  "waste-order",
  "surplus-order",
  "assembly-order"
] as const satisfies readonly OrderAuditOrderType[];

const ORDER_TYPE_LABELS: Record<OrderAuditOrderType, string> = {
  "sale-order": "销售订单",
  "purchase-order": "采购订单",
  "return-order": "退货订单",
  "claim-order": "索赔订单",
  "transfer-order": "调拨单",
  "waste-order": "报废单",
  "surplus-order": "报溢单",
  "assembly-order": "组装单"
};

const MODE_LABELS: Record<OrderAuditMode, string> = {
  boss_required: "必须 Boss 审核",
  dept_manager_only: "仅部门管理审核"
};

const BOSS_ONLY_TYPES = new Set<OrderAuditOrderType>([
  "waste-order",
  "surplus-order"
]);

const loading = ref(false);
const saving = ref(false);
const config = ref<OrderAuditConfig | null>(null);

type RowItem = {
  type: OrderAuditOrderType;
  label: string;
  cfg: OrderAuditTypeConfig;
};

const rows = computed<RowItem[]>(() => {
  if (!config.value) return [];
  return ORDER_TYPES.map(type => ({
    type,
    label: ORDER_TYPE_LABELS[type],
    cfg: config.value![type]
  }));
});

function isBossOnly(type: OrderAuditOrderType) {
  return BOSS_ONLY_TYPES.has(type);
}

function normalizeRow(type: OrderAuditOrderType) {
  if (!config.value) return;
  if (!isBossOnly(type)) return;
  config.value[type].mode = "boss_required";
  config.value[type].approvalsRequired = 1;
}

async function load() {
  loading.value = true;
  try {
    const { code, data, msg } = await getOrderAuditConfigApi();
    if (code !== 200) {
      message(msg ?? "加载失败", { type: "error" });
      return;
    }
    config.value = data.config;
    ORDER_TYPES.forEach(t => normalizeRow(t));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "加载失败";
    message(msg, { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!config.value) return;
  saving.value = true;
  try {
    const { code, data, msg } = await updateOrderAuditConfigApi(config.value);
    if (code !== 200) {
      message(msg ?? "保存失败", { type: "error" });
      return;
    }
    config.value = data.config;
    ORDER_TYPES.forEach(t => normalizeRow(t));
    message("保存成功", { type: "success" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "保存失败";
    message(msg, { type: "error" });
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  load();
});
</script>

<template>
  <div class="main">
    <el-card class="m-1">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="font-medium">订单审核设置</div>
          <div class="flex gap-2">
            <el-button :loading="loading" @click="load">刷新</el-button>
            <el-button
              type="primary"
              :loading="saving"
              :disabled="loading || !config"
              @click="save"
            >
              保存
            </el-button>
          </div>
        </div>
      </template>

      <el-alert
        class="mb-3"
        type="info"
        :closable="false"
        title="关闭审核后，该类型单据下单将自动审核通过；开启审核后按审核人数与模式走多级审批。"
      />

      <el-skeleton :loading="loading && !config" animated>
        <template #default>
          <el-table v-if="config" :data="rows" border>
            <el-table-column label="单据类型" min-width="140">
              <template #default="{ row }">
                {{ row.label }}
              </template>
            </el-table-column>

            <el-table-column label="开启审核" width="120">
              <template #default="{ row }">
                <el-switch v-model="row.cfg.enabled" />
              </template>
            </el-table-column>

            <el-table-column label="审核人数" width="160">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.cfg.approvalsRequired"
                  :min="APPROVALS_REQUIRED_MIN"
                  :max="APPROVALS_REQUIRED_MAX"
                  :step="1"
                  :controls="true"
                  :disabled="isBossOnly(row.type)"
                />
              </template>
            </el-table-column>

            <el-table-column label="审核模式" min-width="220">
              <template #default="{ row }">
                <el-select
                  v-model="row.cfg.mode"
                  class="w-full"
                  :disabled="isBossOnly(row.type)"
                >
                  <el-option
                    v-for="(label, key) in MODE_LABELS"
                    :key="key"
                    :label="label"
                    :value="key"
                  />
                </el-select>
              </template>
            </el-table-column>

            <el-table-column label="说明" min-width="260">
              <template #default="{ row }">
                <span v-if="row.cfg.mode === 'boss_required'">
                  审核人数包含 Boss（最后一步为 Boss）
                </span>
                <span v-else>仅部门管理审核</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-skeleton>
    </el-card>
  </div>
</template>
