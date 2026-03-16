import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/setting/company-setting", () => ({
  getCompanySettingGroupApi: vi.fn(),
  patchCompanySettingGroupApi: vi.fn()
}));

import {
  getCompanySettingGroupApi,
  patchCompanySettingGroupApi
} from "@/api/setting/company-setting";

let getDefaultBarcodeSettings: typeof import("../useBarcodeSettings").getDefaultBarcodeSettings;
let invalidateBarcodeSettingsCache: typeof import("../useBarcodeSettings").invalidateBarcodeSettingsCache;
let loadBarcodeSettings: typeof import("../useBarcodeSettings").loadBarcodeSettings;
let saveBarcodeSettings: typeof import("../useBarcodeSettings").saveBarcodeSettings;

describe("useBarcodeSettings", () => {
  beforeAll(async () => {
    const mod = await import("../useBarcodeSettings");
    getDefaultBarcodeSettings = mod.getDefaultBarcodeSettings;
    invalidateBarcodeSettingsCache = mod.invalidateBarcodeSettingsCache;
    loadBarcodeSettings = mod.loadBarcodeSettings;
    saveBarcodeSettings = mod.saveBarcodeSettings;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    invalidateBarcodeSettingsCache();
  });

  it("loads barcode settings and caches result", async () => {
    (
      getCompanySettingGroupApi as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      code: 200,
      data: [
        { key: "barcodeFormat", value: "ean13" },
        { key: "autoGenerateBarcode", value: "true" }
      ]
    });

    const first = await loadBarcodeSettings();
    expect(first).toEqual({
      barcodeFormat: "ean13",
      autoGenerateBarcode: true
    });

    const second = await loadBarcodeSettings();
    expect(second).toBe(first);
    expect(getCompanySettingGroupApi).toHaveBeenCalledTimes(1);
  });

  it("falls back to default when value empty", async () => {
    (
      getCompanySettingGroupApi as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      code: 200,
      data: [
        { key: "barcodeFormat", value: "  " },
        { key: "autoGenerateBarcode", value: "  " }
      ]
    });

    const result = await loadBarcodeSettings({ force: true });
    expect(result).toEqual({
      barcodeFormat: "code128",
      autoGenerateBarcode: false
    });
  });

  it("throws when load api returns non-200", async () => {
    (
      getCompanySettingGroupApi as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ code: 500, msg: "bad", data: [] });

    await expect(loadBarcodeSettings({ force: true })).rejects.toThrow("bad");
  });

  it("saves settings and invalidates cache", async () => {
    (
      patchCompanySettingGroupApi as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ code: 200 });
    (
      getCompanySettingGroupApi as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      code: 200,
      data: [
        { key: "barcodeFormat", value: "code128" },
        { key: "autoGenerateBarcode", value: "false" }
      ]
    });

    await loadBarcodeSettings({ force: true });
    await saveBarcodeSettings({
      barcodeFormat: "ean8",
      autoGenerateBarcode: true
    });
    await loadBarcodeSettings();

    expect(patchCompanySettingGroupApi).toHaveBeenCalledWith("barcode", {
      barcodeFormat: "ean8",
      autoGenerateBarcode: true
    });
    expect(getCompanySettingGroupApi).toHaveBeenCalledTimes(2);
  });

  it("exposes default settings", () => {
    expect(getDefaultBarcodeSettings()).toEqual({
      barcodeFormat: "code128",
      autoGenerateBarcode: false
    });
  });
});
