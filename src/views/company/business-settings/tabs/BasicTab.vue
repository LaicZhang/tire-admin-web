<script setup lang="ts">
import { useSettingsForm } from "@/composables";
import SettingsPresenceBadge from "@/components/SettingsPresence/SettingsPresenceBadge.vue";
import SettingsPresenceAlert from "@/components/SettingsPresence/SettingsPresenceAlert.vue";

defineOptions({
  name: "BusinessSettingsBasicTab"
});

const TOGGLE_KEYS = [
  "enableAudit",
  "enableTax",
  "enableShelfLife",
  "enableBatch",
  "enableSerialNumber",
  "allowNegativeStock",
  "enableShelfLifeAlert",
  "allowBelowMinPrice",
  "allowAboveMaxPrice"
] as const;

type ToggleKey = (typeof TOGGLE_KEYS)[number];
type FormModel = Record<ToggleKey, boolean>;

const isToggleKey = (key: string): key is ToggleKey =>
  (TOGGLE_KEYS as readonly string[]).includes(key);

const { loading, formData, handleSave, missingSettingKeys, unsetSettingKeys } =
  useSettingsForm<FormModel>({
    group: "func",
    expectedKeys: TOGGLE_KEYS,
    defaults: () => ({
      enableAudit: false,
      enableTax: false,
      enableShelfLife: false,
      enableBatch: false,
      enableSerialNumber: false,
      allowNegativeStock: false,
      enableShelfLifeAlert: false,
      allowBelowMinPrice: false,
      allowAboveMaxPrice: false
    }),
    transformLoad: (settings, form) => {
      for (const s of settings) {
        if (s.group !== "func") continue;
        if (!isToggleKey(s.key)) continue;
        form[s.key] = s.value === "true";
      }
    },
    // 仅提交本页展示的开关，避免覆盖 func 组其他键（如 defaultTaxRate 双写由原页面负责）
    transformSave: form => {
      const payload: Record<string, unknown> = {};
      for (const key of TOGGLE_KEYS) payload[key] = form[key];
      return payload;
    }
  });
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-base font-medium">
        基础开关
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
      <el-divider content-position="left">审核与税务</el-divider>
      <el-form-item label="启用审核" data-setting-key="enableAudit">
        <el-switch v-model="formData.enableAudit" />
        <span class="ml-4 text-gray-500 text-sm">
          启用后，单据需审核通过才会计入库存与资金
        </span>
      </el-form-item>
      <el-form-item label="启用税金" data-setting-key="enableTax">
        <el-switch v-model="formData.enableTax" />
        <span class="ml-4 text-gray-500 text-sm">
          启用后，采购/销售单据增加税率、税额、价税合计
        </span>
      </el-form-item>

      <el-divider content-position="left">商品属性</el-divider>
      <el-form-item label="启用保质期" data-setting-key="enableShelfLife">
        <el-switch v-model="formData.enableShelfLife" />
        <span class="ml-4 text-gray-500 text-sm"> 开启后可进行保质期管理 </span>
      </el-form-item>
      <el-form-item label="启用批次" data-setting-key="enableBatch">
        <el-switch v-model="formData.enableBatch" />
        <span class="ml-4 text-gray-500 text-sm"> 开启后允许录入商品批次 </span>
      </el-form-item>
      <el-form-item label="启用序列号" data-setting-key="enableSerialNumber">
        <el-switch v-model="formData.enableSerialNumber" />
        <span class="ml-4 text-gray-500 text-sm">
          开启后允许录入商品序列号
        </span>
      </el-form-item>

      <el-divider content-position="left">库存</el-divider>
      <el-form-item
        label="可用库存允许为负"
        data-setting-key="allowNegativeStock"
      >
        <el-switch v-model="formData.allowNegativeStock" />
        <span class="ml-4 text-gray-500 text-sm">
          启用后库存不足时也允许保存出库类单据
        </span>
      </el-form-item>
      <el-form-item
        label="过期商品出库提示"
        data-setting-key="enableShelfLifeAlert"
      >
        <el-switch v-model="formData.enableShelfLifeAlert" />
        <span class="ml-4 text-gray-500 text-sm">
          启用后，出库过期商品时会提示
        </span>
      </el-form-item>

      <el-divider content-position="left">限价</el-divider>
      <el-form-item
        label="允许低于最低销售价保存"
        data-setting-key="allowBelowMinPrice"
      >
        <el-switch v-model="formData.allowBelowMinPrice" />
        <span class="ml-4 text-gray-500 text-sm">
          启用后销售价低于最低售价时允许保存
        </span>
      </el-form-item>
      <el-form-item
        label="允许高于最高采购价保存"
        data-setting-key="allowAboveMaxPrice"
      >
        <el-switch v-model="formData.allowAboveMaxPrice" />
        <span class="ml-4 text-gray-500 text-sm">
          启用后采购价高于最高采购价时允许保存
        </span>
      </el-form-item>
    </el-form>
  </div>
</template>
