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
import { invalidateBarcodeSettingsCache } from "@/composables";
import { analyzeSettingsPresence } from "@/utils/settingsPresence";

defineOptions({
  name: "CompanyBarcodeSettings"
});

const loading = ref(false);
const missingSettingKeys = ref<readonly string[]>([]);
const unsetSettingKeys = ref<readonly string[]>([]);

const EXPECTED_KEYS = ["autoGenerateBarcode", "barcodeFormat"] as const;
const DEFAULT_BARCODE_FORMAT = "code128";
const DEFAULT_AUTO_GENERATE_BARCODE = false;

type FormModel = {
  barcodeFormat: string;
  autoGenerateBarcode: boolean;
};

const form = reactive<FormModel>({
  barcodeFormat: DEFAULT_BARCODE_FORMAT,
  autoGenerateBarcode: DEFAULT_AUTO_GENERATE_BARCODE
});

const BARCODE_FORMAT_OPTIONS = [
  { label: "Code128", value: "code128" },
  { label: "EAN13", value: "ean13" },
  { label: "EAN8", value: "ean8" },
  { label: "QRCode", value: "qrcode" }
] as const;

function pickValue(
  list: CompanySettingItem[] | undefined,
  key: string
): string | undefined {
  if (!Array.isArray(list)) return undefined;
  const found = list.find(i => i.key === key);
  const value = String(found?.value ?? "").trim();
  return value ? value : undefined;
}

function parseBooleanOrDefault(
  raw: string | undefined,
  defaultValue: boolean
): boolean {
  if (raw === undefined) return defaultValue;
  const v = raw.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return defaultValue;
}

async function load() {
  loading.value = true;
  try {
    const res = await getCompanySettingGroupApi("barcode");
    if (res.code !== 200) {
      message(res.msg || "加载条码设置失败", { type: "error" });
      return;
    }
    const presence = analyzeSettingsPresence({
      expectedKeys: EXPECTED_KEYS,
      items: res.data ?? []
    });
    missingSettingKeys.value = presence.missingKeys;
    unsetSettingKeys.value = presence.unsetKeys;

    form.barcodeFormat =
      pickValue(res.data, "barcodeFormat") || DEFAULT_BARCODE_FORMAT;
    form.autoGenerateBarcode = parseBooleanOrDefault(
      pickValue(res.data, "autoGenerateBarcode"),
      DEFAULT_AUTO_GENERATE_BARCODE
    );
  } catch (error) {
    handleApiError(error, "加载条码设置失败");
  } finally {
    loading.value = false;
  }
}

async function save() {
  loading.value = true;
  try {
    const res = await patchCompanySettingGroupApi("barcode", {
      barcodeFormat: form.barcodeFormat,
      autoGenerateBarcode: form.autoGenerateBarcode
    });
    if (res.code !== 200) {
      message(res.msg || "保存失败", { type: "error" });
      return;
    }
    invalidateBarcodeSettingsCache();
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
          条码设置
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
        <el-form-item
          label="商品新增自动生成条码"
          data-setting-key="autoGenerateBarcode"
        >
          <el-switch v-model="form.autoGenerateBarcode" />
          <span class="ml-3 text-gray-500 text-sm">
            开启后，新增商品未填写条码时自动生成；已填写则以手工条码为准
          </span>
        </el-form-item>

        <el-form-item label="条码格式" data-setting-key="barcodeFormat">
          <el-select v-model="form.barcodeFormat" class="w-full">
            <el-option
              v-for="item in BARCODE_FORMAT_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <span class="ml-3 text-gray-500 text-sm">
            影响工具页生成条码（/tools/barcode）的类型
          </span>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
