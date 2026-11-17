<script setup lang="ts">
import { useSettingsForm } from "@/composables";
import SettingsPresenceBadge from "@/components/SettingsPresence/SettingsPresenceBadge.vue";
import SettingsPresenceAlert from "@/components/SettingsPresence/SettingsPresenceAlert.vue";

defineOptions({
  name: "BusinessSettingsPricingTab"
});

const TAX_RATE_SCALE = 100;
const TAX_RATE_DECIMAL_DIGITS = 6;

type TaxMode = "INCLUDED" | "EXCLUDE";

type FormModel = {
  defaultTaxMode: TaxMode;
  defaultTaxRate: number;
};

const { loading, formData, handleSave, missingSettingKeys, unsetSettingKeys } =
  useSettingsForm<FormModel>({
    group: "tax",
    expectedKeys: ["defaultTaxMode", "defaultTaxRate"],
    defaults: () => ({
      defaultTaxMode: "INCLUDED",
      defaultTaxRate: 13
    }),
    transformLoad: (settings, form) => {
      for (const s of settings) {
        if (s.group !== "tax") continue;
        if (s.key === "defaultTaxMode") {
          form.defaultTaxMode = s.value === "EXCLUDE" ? "EXCLUDE" : "INCLUDED";
          continue;
        }
        if (s.key === "defaultTaxRate") {
          const parsed = Number(s.value);
          if (Number.isFinite(parsed)) {
            form.defaultTaxRate = parsed * TAX_RATE_SCALE;
          }
        }
      }
    },
    // 仅写 tax 组；func.defaultTaxRate 的过渡双写仍由原功能参数页负责
    transformSave: form => {
      const decimal = Number(
        (form.defaultTaxRate / TAX_RATE_SCALE).toFixed(TAX_RATE_DECIMAL_DIGITS)
      );
      return {
        defaultTaxMode: form.defaultTaxMode === "EXCLUDE" ? "EXCLUDE" : "",
        defaultTaxRate: decimal
      };
    }
  });
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-base font-medium">
        价格与税务
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

    <el-form :model="formData" label-width="220px" label-position="left">
      <el-divider content-position="left">税务</el-divider>
      <el-form-item label="默认含税模式" data-setting-key="defaultTaxMode">
        <el-radio-group v-model="formData.defaultTaxMode">
          <el-radio value="INCLUDED">含税</el-radio>
          <el-radio value="EXCLUDE">不含税</el-radio>
        </el-radio-group>
        <span class="ml-4 text-gray-500 text-sm">
          未显式传入含税标记时按此默认值计价
        </span>
      </el-form-item>
      <el-form-item label="默认税率(%)" data-setting-key="defaultTaxRate">
        <el-input-number
          v-model="formData.defaultTaxRate"
          :min="0"
          :max="100"
          :precision="2"
        />
        <span class="ml-4 text-gray-500 text-sm">
          按百分比录入，存储为 0~1 的小数
        </span>
      </el-form-item>
    </el-form>
  </div>
</template>
