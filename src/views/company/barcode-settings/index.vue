<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { handleApiError, message } from "@/utils";
import {
  getDefaultBarcodeSettings,
  loadBarcodeSettings,
  saveBarcodeSettings
} from "@/composables";

defineOptions({
  name: "CompanyBarcodeSettings"
});

const loading = ref(false);

type FormModel = {
  barcodeFormat: string;
  autoGenerateBarcode: boolean;
};

const form = reactive<FormModel>({
  barcodeFormat: getDefaultBarcodeSettings().barcodeFormat,
  autoGenerateBarcode: getDefaultBarcodeSettings().autoGenerateBarcode
});

const BARCODE_FORMAT_OPTIONS = [
  { label: "Code128", value: "code128" },
  { label: "EAN13", value: "ean13" },
  { label: "EAN8", value: "ean8" },
  { label: "QRCode", value: "qrcode" }
] as const;

async function load() {
  loading.value = true;
  try {
    const settings = await loadBarcodeSettings({ force: true });
    form.barcodeFormat = settings.barcodeFormat;
    form.autoGenerateBarcode = settings.autoGenerateBarcode;
  } catch (error) {
    handleApiError(error, "加载条码设置失败");
  } finally {
    loading.value = false;
  }
}

async function save() {
  loading.value = true;
  try {
    await saveBarcodeSettings({
      barcodeFormat: form.barcodeFormat,
      autoGenerateBarcode: form.autoGenerateBarcode
    });
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
        <h3 class="text-lg font-medium">条码设置</h3>
        <el-button type="primary" :loading="loading" @click="save">
          保存设置
        </el-button>
      </div>

      <el-form :model="form" label-width="180px" label-position="left">
        <el-form-item label="商品新增自动生成条码">
          <el-switch v-model="form.autoGenerateBarcode" />
          <span class="ml-3 text-gray-500 text-sm">
            开启后，新增商品未填写条码时自动生成；已填写则以手工条码为准
          </span>
        </el-form-item>

        <el-form-item label="条码格式">
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
