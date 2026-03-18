<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { handleApiError, message } from "@/utils";
import {
  getCompanySettingGroupApi,
  patchCompanySettingGroupApi,
  type CompanySettingItem
} from "@/api/setting/company-setting";
import SettingsPresenceBadge from "@/components/SettingsPresence/SettingsPresenceBadge.vue";
import SettingsPresenceAlert from "@/components/SettingsPresence/SettingsPresenceAlert.vue";
import PaymentSelect from "@/components/EntitySelect/PaymentSelect.vue";
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod
} from "@/views/fund/payment/types";
import { invalidateSettlementDefaultsCache } from "@/composables";
import { analyzeSettingsPresence } from "@/utils/settingsPresence";

defineOptions({
  name: "CompanySettlementDefaults"
});

const loading = ref(false);
const missingSettingKeys = ref<readonly string[]>([]);
const unsetSettingKeys = ref<readonly string[]>([]);

const EXPECTED_KEYS = [
  "settlement.defaultPaymentMethod",
  "settlement.defaultReceivableAccount",
  "settlement.defaultPayableAccount",
  "document.allowBackdateDays"
] as const;

type FormModel = {
  defaultPaymentMethod: PaymentMethod | "";
  defaultReceivableAccount?: string;
  defaultPayableAccount?: string;
  allowBackdateDays: number;
};

const form = reactive<FormModel>({
  defaultPaymentMethod: "",
  defaultReceivableAccount: undefined,
  defaultPayableAccount: undefined,
  allowBackdateDays: 0
});

function pickValue(
  list: CompanySettingItem[] | undefined,
  key: string
): string {
  const found = Array.isArray(list) ? list.find(i => i.key === key) : undefined;
  return String(found?.value ?? "").trim();
}

function pickNumber(
  list: CompanySettingItem[] | undefined,
  key: string
): number {
  const raw = pickValue(list, key);
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function toPresenceItems(
  group: "settlement" | "document",
  list: CompanySettingItem[] | undefined
): { key: string; value: string }[] {
  if (!Array.isArray(list)) return [];
  return list.map(i => ({
    key: `${group}.${i.key}`,
    value: String(i.value ?? "")
  }));
}

async function load() {
  loading.value = true;
  try {
    const [settlement, document] = await Promise.all([
      getCompanySettingGroupApi("settlement"),
      getCompanySettingGroupApi("document")
    ]);
    const settlementList = settlement.code === 200 ? settlement.data : [];
    const documentList = document.code === 200 ? document.data : [];

    const presence = analyzeSettingsPresence({
      expectedKeys: EXPECTED_KEYS,
      items: [
        ...toPresenceItems("settlement", settlementList),
        ...toPresenceItems("document", documentList)
      ]
    });
    missingSettingKeys.value = presence.missingKeys;
    unsetSettingKeys.value = presence.unsetKeys;

    form.defaultPaymentMethod =
      (pickValue(settlementList, "defaultPaymentMethod") as PaymentMethod) ||
      "";
    form.defaultReceivableAccount =
      pickValue(settlementList, "defaultReceivableAccount") || undefined;
    form.defaultPayableAccount =
      pickValue(settlementList, "defaultPayableAccount") || undefined;
    form.allowBackdateDays = Math.max(
      0,
      Math.floor(pickNumber(documentList, "allowBackdateDays"))
    );
  } catch (error) {
    handleApiError(error, "加载默认值设置失败");
  } finally {
    loading.value = false;
  }
}

async function save() {
  loading.value = true;
  try {
    const settlementSettings: Record<string, unknown> = {
      defaultPaymentMethod: form.defaultPaymentMethod || "",
      defaultReceivableAccount: form.defaultReceivableAccount || "",
      defaultPayableAccount: form.defaultPayableAccount || ""
    };
    const documentSettings: Record<string, unknown> = {
      allowBackdateDays: form.allowBackdateDays
    };

    const [settlementRes, documentRes] = await Promise.all([
      patchCompanySettingGroupApi("settlement", settlementSettings),
      patchCompanySettingGroupApi("document", documentSettings)
    ]);

    if (settlementRes.code !== 200 || documentRes.code !== 200) {
      message(settlementRes.msg || documentRes.msg || "保存失败", {
        type: "error"
      });
      return;
    }
    invalidateSettlementDefaultsCache();
    message("保存成功", { type: "success" });
  } catch (error) {
    handleApiError(error, "保存失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});
</script>

<template>
  <div class="main p-4">
    <div class="bg-white p-6 rounded-md">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-medium">
          结算默认值
          <SettingsPresenceBadge
            :missing-keys="missingSettingKeys"
            :unset-keys="unsetSettingKeys"
          />
        </h3>
        <el-button type="primary" :loading="loading" @click="save">
          保存设置
        </el-button>
      </div>

      <SettingsPresenceAlert
        :missing-keys="missingSettingKeys"
        :unset-keys="unsetSettingKeys"
      />

      <el-form :model="form" label-width="180px" label-position="left">
        <el-divider content-position="left">结算默认值</el-divider>

        <el-form-item
          label="默认结算方式"
          data-setting-key="settlement.defaultPaymentMethod"
        >
          <el-select
            v-model="form.defaultPaymentMethod"
            placeholder="不设置则不默认带出"
            clearable
            class="w-full"
          >
            <el-option
              v-for="item in PAYMENT_METHOD_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          label="默认收款账户"
          data-setting-key="settlement.defaultReceivableAccount"
        >
          <PaymentSelect
            v-model="form.defaultReceivableAccount"
            placeholder="不设置则创建收款单时必须手动选择"
          />
        </el-form-item>

        <el-form-item
          label="默认付款账户"
          data-setting-key="settlement.defaultPayableAccount"
        >
          <PaymentSelect
            v-model="form.defaultPayableAccount"
            placeholder="不设置则创建付款单时必须手动选择"
          />
        </el-form-item>

        <el-divider content-position="left">单据日期</el-divider>

        <el-form-item
          label="允许回填天数"
          data-setting-key="document.allowBackdateDays"
        >
          <el-input-number
            v-model="form.allowBackdateDays"
            :min="0"
            :precision="0"
            class="w-full"
          />
          <span class="ml-3 text-gray-500 text-sm">
            0 表示不允许回填（只能填今天及之后）
          </span>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
