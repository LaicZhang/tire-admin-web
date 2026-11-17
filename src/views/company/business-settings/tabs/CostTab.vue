<script setup lang="ts">
import { ref } from "vue";
import { useSettingsForm } from "@/composables";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import SettingsPresenceBadge from "@/components/SettingsPresence/SettingsPresenceBadge.vue";
import SettingsPresenceAlert from "@/components/SettingsPresence/SettingsPresenceAlert.vue";

defineOptions({
  name: "BusinessSettingsCostTab"
});

const RATIO_SCALE = 100;
const RATIO_DECIMAL_DIGITS = 6;

type FormModel = {
  costMethod: string;
  maxAdjustRatio: number;
};

const COST_METHOD_OPTIONS = [
  { label: "SKU移动加权", value: "moving_average" },
  { label: "批次移动加权", value: "moving_average_batch" },
  { label: "批次FIFO", value: "fifo" }
];

const { confirm } = useConfirmDialog();

// 记录已加载的成本核算方法，用于保存前确认是否触发了重算
const loadedCostMethod = ref("moving_average");

const { loading, formData, handleSave, missingSettingKeys, unsetSettingKeys } =
  useSettingsForm<FormModel>({
    group: "cost",
    expectedKeys: ["costMethod", "maxAdjustRatio"],
    defaults: () => ({
      costMethod: "moving_average",
      maxAdjustRatio: 50
    }),
    transformLoad: (settings, form) => {
      for (const s of settings) {
        if (s.group !== "cost") continue;
        if (s.key === "costMethod") {
          form.costMethod = s.value || "moving_average";
          loadedCostMethod.value = form.costMethod;
          continue;
        }
        if (s.key === "maxAdjustRatio") {
          const parsed = Number(s.value);
          if (Number.isFinite(parsed) && parsed > 0) {
            form.maxAdjustRatio = parsed * RATIO_SCALE;
          }
        }
      }
    },
    transformSave: form => {
      const ratio = Number(
        (form.maxAdjustRatio / RATIO_SCALE).toFixed(RATIO_DECIMAL_DIGITS)
      );
      return {
        costMethod: form.costMethod,
        maxAdjustRatio: ratio
      };
    }
  });

async function save() {
  if (formData.value.costMethod !== loadedCostMethod.value) {
    const ok = await confirm(
      "切换成本核算方法后，会对未结账业务单据进行成本重算，是否确认切换？",
      "切换确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    if (!ok) {
      formData.value.costMethod = loadedCostMethod.value;
      return;
    }
    loadedCostMethod.value = formData.value.costMethod;
  }
  await handleSave();
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-base font-medium">
        成本
        <SettingsPresenceBadge
          :missing-keys="missingSettingKeys"
          :unset-keys="unsetSettingKeys"
        />
      </h4>
      <el-button type="primary" :loading="loading" @click="save">
        保存设置
      </el-button>
    </div>

    <SettingsPresenceAlert
      :missing-keys="missingSettingKeys"
      :unset-keys="unsetSettingKeys"
    />

    <el-form :model="formData" label-width="220px" label-position="left">
      <el-divider content-position="left">成本核算</el-divider>
      <el-alert
        title="切换成本核算方法或方式后，会对未结账的业务单据进行成本重算，请谨慎操作"
        type="warning"
        :closable="false"
        class="mb-4"
      />
      <el-form-item label="成本核算方法" data-setting-key="costMethod">
        <el-radio-group v-model="formData.costMethod">
          <el-radio
            v-for="item in COST_METHOD_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-divider content-position="left">成本调整单</el-divider>
      <el-form-item label="调整幅度上限(%)" data-setting-key="maxAdjustRatio">
        <el-input-number
          v-model="formData.maxAdjustRatio"
          :min="1"
          :max="100"
          :precision="0"
        />
        <span class="ml-4 text-gray-500 text-sm">
          审核成本调整单时，调整后成本相对原成本的允许浮动比例（如 50% 表示
          ±50%）
        </span>
      </el-form-item>
    </el-form>
  </div>
</template>
