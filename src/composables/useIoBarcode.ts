import { ref } from "vue";
import { generateBarcodeApi, scanBarcodeApi } from "@/api/tools";
import { message } from "@/utils/message";
import { downloadFromUrl } from "@/utils/download";
import type { BarcodeProduct } from "@/api/tools";

interface BarcodeForm {
  code: string;
  type: "code128" | "qrcode";
  width: number;
  height: number;
}

export function useIoBarcode() {
  const barcodeForm = ref<BarcodeForm>({
    code: "",
    type: "code128",
    width: 200,
    height: 100
  });
  const barcodeImage = ref<string | null>(null);
  const scanCode = ref("");
  const scanResult = ref<BarcodeProduct | null>(null);
  const barcodeLoading = ref(false);

  const barcodeTypeOptions: Array<{
    label: string;
    value: "code128" | "qrcode";
  }> = [
    { label: "一维码 (Code128)", value: "code128" },
    { label: "二维码 (QRCode)", value: "qrcode" }
  ];

  async function generateBarcode() {
    if (!barcodeForm.value.code) {
      message("请输入条码内容", { type: "warning" });
      return;
    }
    barcodeLoading.value = true;
    try {
      const blob = await generateBarcodeApi({
        code: barcodeForm.value.code,
        type: barcodeForm.value.type,
        width: barcodeForm.value.width,
        height: barcodeForm.value.height
      });
      barcodeImage.value = window.URL.createObjectURL(blob);
      message("条码生成成功", { type: "success" });
    } catch {
      message("条码生成失败", { type: "error" });
    } finally {
      barcodeLoading.value = false;
    }
  }

  function downloadBarcode() {
    if (!barcodeImage.value) return;
    downloadFromUrl(
      barcodeImage.value,
      `barcode_${barcodeForm.value.code}.png`
    );
  }

  async function handleScan() {
    if (!scanCode.value) {
      message("请输入条码", { type: "warning" });
      return;
    }
    barcodeLoading.value = true;
    try {
      const { data, code, msg } = await scanBarcodeApi(scanCode.value);
      if (code === 200) {
        scanResult.value = data;
        message("查询成功", { type: "success" });
      } else {
        message(msg || "查询失败", { type: "error" });
        scanResult.value = null;
      }
    } catch {
      message("查询失败", { type: "error" });
      scanResult.value = null;
    } finally {
      barcodeLoading.value = false;
    }
  }

  return {
    barcodeForm,
    barcodeImage,
    scanCode,
    scanResult,
    barcodeLoading,
    barcodeTypeOptions,
    generateBarcode,
    downloadBarcode,
    handleScan
  };
}
