<script setup lang="ts">
import { useRouter } from "vue-router";
import { useSettingsForm } from "@/composables";
import SettingsPresenceBadge from "@/components/SettingsPresence/SettingsPresenceBadge.vue";
import SettingsPresenceAlert from "@/components/SettingsPresence/SettingsPresenceAlert.vue";

defineOptions({
  name: "BusinessSettingsOrderTab"
});

const ORDER_TYPES = [
  { key: "sale-order", label: "销售订单" },
  { key: "purchase-order", label: "采购订单" },
  { key: "purchase-inbound", label: "采购入库" },
  { key: "return-order", label: "退货订单" },
  { key: "claim-order", label: "索赔订单" },
  { key: "supplier-claim-order", label: "供应商索赔单" },
  { key: "transfer-order", label: "调拨单" },
  { key: "waste-order", label: "报废单" },
  { key: "surplus-order", label: "报溢单" },
  { key: "assembly-order", label: "组装/拆装单" }
] as const;

type OrderType = (typeof ORDER_TYPES)[number]["key"];
type LockMode = "unlimited" | "sameDay" | "custom";

type LockRow = {
  mode: LockMode;
  days: number;
};

type FormModel = {
  locks: Record<OrderType, LockRow>;
  allowBackdateDays: number;
};

const MODE_OPTIONS: { value: LockMode; label: string }[] = [
  { value: "unlimited", label: "不限（长期可编辑）" },
  { value: "sameDay", label: "仅当天可编辑" },
  { value: "custom", label: "创建后 N 天内可编辑" }
];

const EXPECTED_KEYS = [
  ...ORDER_TYPES.map(t => t.key),
  "allowBackdateDays"
] as const;

const router = useRouter();

function createDefaultLocks(): Record<OrderType, LockRow> {
  const locks = {} as Record<OrderType, LockRow>;
  for (const t of ORDER_TYPES) locks[t.key] = { mode: "unlimited", days: 1 };
  return locks;
}

function parseLockValue(raw: string): LockRow {
  const value = String(raw ?? "").trim();
  if (value === "") return { mode: "unlimited", days: 1 };
  const days = Number(value);
  if (!Number.isFinite(days) || days < 0) return { mode: "unlimited", days: 1 };
  if (days === 0) return { mode: "sameDay", days: 1 };
  return { mode: "custom", days: Math.floor(days) };
}

function serializeLock(row: LockRow): string {
  if (row.mode === "unlimited") return "";
  if (row.mode === "sameDay") return "0";
  const days = Number.isFinite(row.days)
    ? Math.max(1, Math.floor(row.days))
    : 1;
  return String(days);
}

const { loading, formData, handleSave, missingSettingKeys, unsetSettingKeys } =
  useSettingsForm<FormModel>({
    group: "orderLock",
    loadGroups: ["orderLock", "document"],
    expectedKeys: EXPECTED_KEYS,
    defaults: () => ({
      locks: createDefaultLocks(),
      allowBackdateDays: 0
    }),
    transformLoad: (settings, form) => {
      for (const s of settings) {
        if (s.group === "orderLock" && s.key in form.locks) {
          form.locks[s.key as OrderType] = parseLockValue(s.value);
          continue;
        }
        if (s.group === "document" && s.key === "allowBackdateDays") {
          const parsed = Number(s.value);
          form.allowBackdateDays = Number.isFinite(parsed)
            ? Math.max(0, Math.floor(parsed))
            : 0;
        }
      }
    },
    transformSaveMulti: form => {
      const orderLock: Record<string, unknown> = {};
      for (const t of ORDER_TYPES) {
        orderLock[t.key] = serializeLock(form.locks[t.key]);
      }
      return {
        orderLock,
        document: {
          allowBackdateDays: Math.max(0, Math.floor(form.allowBackdateDays))
        }
      };
    }
  });

function goOrderAudit() {
  void router.push("/company/order-audit");
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-base font-medium">
        单据与审核
        <SettingsPresenceBadge
          :missing-keys="missingSettingKeys"
          :unset-keys="unsetSettingKeys"
        />
      </h4>
      <el-button type="primary" :loading="loading" @click="handleSave">
        保存设置
      </el-button>
    </div>

    <SettingsPresenceAlert
      :missing-keys="missingSettingKeys"
      :unset-keys="unsetSettingKeys"
    />

    <el-alert
      class="mb-3"
      type="info"
      :closable="false"
      title="单据可编辑策略：不限 = 长期可编辑；仅当天 = 创建当天可编辑；N 天 = 创建后 N 天内可编辑。已审核或已锁定的单据一律不可修改。"
    />

    <div class="border rounded-md divide-y">
      <div
        v-for="row in ORDER_TYPES"
        :key="row.key"
        class="flex items-center gap-4 px-4 py-3"
      >
        <span class="w-40 flex-shrink-0" :data-setting-key="row.key">
          {{ row.label }}
        </span>
        <el-select v-model="formData.locks[row.key].mode" class="w-56">
          <el-option
            v-for="opt in MODE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-input-number
          v-model="formData.locks[row.key].days"
          :min="1"
          :precision="0"
          :disabled="formData.locks[row.key].mode !== 'custom'"
        />
        <span class="text-gray-500 text-sm">
          {{
            formData.locks[row.key].mode === "custom"
              ? `创建后 ${formData.locks[row.key].days} 天内可编辑`
              : formData.locks[row.key].mode === "sameDay"
                ? "仅创建当天可编辑"
                : "不限制可编辑时间"
          }}
        </span>
      </div>
    </div>

    <el-form class="mt-6" label-width="220px" label-position="left">
      <el-divider content-position="left">单据日期</el-divider>
      <el-form-item label="允许回填天数" data-setting-key="allowBackdateDays">
        <el-input-number
          v-model="formData.allowBackdateDays"
          :min="0"
          :precision="0"
        />
        <span class="ml-4 text-gray-500 text-sm">
          0 表示不允许回填（只能填今天及之后）
        </span>
      </el-form-item>
    </el-form>

    <el-divider content-position="left">审核流程</el-divider>
    <div class="flex items-center gap-3">
      <span class="text-gray-500 text-sm">
        单据审核开关、审核人数与审核模式在独立页面维护。
      </span>
      <el-button link type="primary" @click="goOrderAudit">
        前往订单审核设置
      </el-button>
    </div>
  </div>
</template>
