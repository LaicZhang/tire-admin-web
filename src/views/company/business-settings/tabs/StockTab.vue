<script setup lang="ts">
import { useRouter } from "vue-router";
import { useSettingsForm } from "@/composables";
import SettingsPresenceBadge from "@/components/SettingsPresence/SettingsPresenceBadge.vue";
import SettingsPresenceAlert from "@/components/SettingsPresence/SettingsPresenceAlert.vue";

defineOptions({
  name: "BusinessSettingsStockTab"
});

type FormModel = {
  serialNumberStrict: boolean;
};

const router = useRouter();

const { loading, formData, handleSave, missingSettingKeys, unsetSettingKeys } =
  useSettingsForm<FormModel>({
    group: "inventory",
    expectedKeys: ["serialNumberStrict"],
    defaults: () => ({ serialNumberStrict: false }),
    transformLoad: (settings, form) => {
      for (const s of settings) {
        if (s.group === "inventory" && s.key === "serialNumberStrict") {
          form.serialNumberStrict = s.value === "true";
        }
      }
    },
    transformSave: form => ({
      serialNumberStrict: form.serialNumberStrict
    })
  });

function goInventoryDefaults() {
  void router.push("/company/inventory-defaults");
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-base font-medium">
        库存与批次
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
      <el-divider content-position="left">序列号</el-divider>
      <el-form-item
        label="序列号严格校验"
        data-setting-key="serialNumberStrict"
      >
        <el-switch v-model="formData.serialNumberStrict" />
        <span class="ml-4 text-gray-500 text-sm">
          启用后出入库必须逐条录入序列号并校验唯一性
        </span>
      </el-form-item>
    </el-form>

    <el-divider content-position="left">默认仓库</el-divider>
    <div class="flex items-center gap-3">
      <span class="text-gray-500 text-sm">
        新建单据的默认仓库在独立页面维护。
      </span>
      <el-button link type="primary" @click="goInventoryDefaults">
        前往库存默认值
      </el-button>
    </div>
  </div>
</template>
