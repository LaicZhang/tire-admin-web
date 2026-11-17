<script setup lang="ts">
import { useSettingsForm } from "@/composables";
import SettingsPresenceBadge from "@/components/SettingsPresence/SettingsPresenceBadge.vue";
import SettingsPresenceAlert from "@/components/SettingsPresence/SettingsPresenceAlert.vue";

defineOptions({
  name: "BusinessSettingsClaimAssetTab"
});

type NullDeptAssetVisibility = "company" | "all";

type FormModel = {
  claimRequireWarranty: boolean;
  nullDeptAssetVisibility: NullDeptAssetVisibility;
};

const { loading, formData, handleSave, missingSettingKeys, unsetSettingKeys } =
  useSettingsForm<FormModel>({
    group: "claim",
    loadGroups: ["claim", "asset"],
    expectedKeys: ["claimRequireWarranty", "nullDeptAssetVisibility"],
    defaults: () => ({
      claimRequireWarranty: true,
      nullDeptAssetVisibility: "company"
    }),
    transformLoad: (settings, form) => {
      for (const s of settings) {
        if (s.group === "claim" && s.key === "claimRequireWarranty") {
          form.claimRequireWarranty = s.value === "true";
          continue;
        }
        if (s.group === "asset" && s.key === "nullDeptAssetVisibility") {
          form.nullDeptAssetVisibility = s.value === "all" ? "all" : "company";
        }
      }
    },
    transformSaveMulti: form => ({
      claim: {
        claimRequireWarranty: form.claimRequireWarranty
      },
      asset: {
        nullDeptAssetVisibility: form.nullDeptAssetVisibility
      }
    })
  });
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-base font-medium">
        理赔与资产
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
      <el-divider content-position="left">理赔</el-divider>
      <el-form-item
        label="理赔必须关联有效质保"
        data-setting-key="claimRequireWarranty"
      >
        <el-switch v-model="formData.claimRequireWarranty" />
        <span class="ml-4 text-gray-500 text-sm">
          启用后，需要赔付的理赔明细必须关联有效质保登记
        </span>
      </el-form-item>

      <el-divider content-position="left">资产可见性</el-divider>
      <el-form-item
        label="空部门资产可见性"
        data-setting-key="nullDeptAssetVisibility"
      >
        <el-radio-group v-model="formData.nullDeptAssetVisibility">
          <el-radio value="company">仅公司级可见</el-radio>
          <el-radio value="all">部门级用户也可见</el-radio>
        </el-radio-group>
        <span class="ml-4 text-gray-500 text-sm">
          选择“部门级用户也可见”时，部门级用户可查看未绑定部门的资产
        </span>
      </el-form-item>
    </el-form>
  </div>
</template>
