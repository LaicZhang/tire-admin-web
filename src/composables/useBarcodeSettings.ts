import {
  getCompanySettingGroupApi,
  patchCompanySettingGroupApi
} from "@/api/setting/company-setting";

export type BarcodeSettings = Readonly<{
  barcodeFormat: string;
  autoGenerateBarcode: boolean;
}>;

const DEFAULT_SETTINGS: BarcodeSettings = Object.freeze({
  barcodeFormat: "code128",
  autoGenerateBarcode: false
});

let cached: BarcodeSettings | null = null;
let inFlight: Promise<BarcodeSettings> | null = null;

export function invalidateBarcodeSettingsCache(): void {
  cached = null;
  inFlight = null;
}

function pickValue(
  list: { key: string; value: string }[] | undefined,
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

export async function loadBarcodeSettings(options?: {
  force?: boolean;
}): Promise<BarcodeSettings> {
  if (!options?.force && cached) return cached;
  if (!options?.force && inFlight) return inFlight;

  inFlight = (async () => {
    const res = await getCompanySettingGroupApi("barcode");
    if (res.code !== 200) {
      throw new Error(res.msg || "加载条码设置失败");
    }
    const autoGenerateBarcodeRaw = pickValue(res.data, "autoGenerateBarcode");
    const next: BarcodeSettings = Object.freeze({
      barcodeFormat: pickValue(res.data, "barcodeFormat") || "code128",
      autoGenerateBarcode: parseBooleanOrDefault(
        autoGenerateBarcodeRaw,
        DEFAULT_SETTINGS.autoGenerateBarcode
      )
    });
    cached = next;
    return next;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

export async function saveBarcodeSettings(settings: {
  barcodeFormat: string;
  autoGenerateBarcode: boolean;
}): Promise<void> {
  const barcodeFormat = String(settings.barcodeFormat ?? "").trim();
  const autoGenerateBarcode = Boolean(settings.autoGenerateBarcode);
  const res = await patchCompanySettingGroupApi("barcode", {
    barcodeFormat,
    autoGenerateBarcode
  });
  if (res.code !== 200) {
    throw new Error(res.msg || "保存条码设置失败");
  }
  invalidateBarcodeSettingsCache();
}

export function getDefaultBarcodeSettings(): BarcodeSettings {
  return DEFAULT_SETTINGS;
}
