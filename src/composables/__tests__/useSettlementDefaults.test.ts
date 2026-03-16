import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  invalidateSettlementDefaultsCache,
  loadSettlementDefaults
} from "../useSettlementDefaults";

vi.mock("@/api/setting/company-setting", () => ({
  getCompanySettingGroupApi: vi.fn()
}));

import { getCompanySettingGroupApi } from "@/api/setting/company-setting";

describe("useSettlementDefaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads settlement/document defaults and caches result", async () => {
    (
      getCompanySettingGroupApi as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(async (group: string) => {
      if (group === "settlement") {
        return {
          code: 200,
          data: [
            { key: "defaultPaymentMethod", value: "WECHAT" },
            { key: "defaultReceivableAccount", value: "recv-1" },
            { key: "defaultPayableAccount", value: "pay-1" }
          ]
        };
      }
      if (group === "document") {
        return {
          code: 200,
          data: [{ key: "allowBackdateDays", value: "7" }]
        };
      }
      return { code: 404, data: [] };
    });

    const first = await loadSettlementDefaults({ force: true });
    expect(first).toEqual({
      defaultPaymentMethod: "WECHAT",
      defaultReceivableAccount: "recv-1",
      defaultPayableAccount: "pay-1",
      allowBackdateDays: 7
    });

    const second = await loadSettlementDefaults();
    expect(second).toBe(first);
    expect(getCompanySettingGroupApi).toHaveBeenCalledTimes(2);
  });

  it("invalidates cache", async () => {
    (
      getCompanySettingGroupApi as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(async (group: string) => {
      if (group === "settlement") {
        return { code: 200, data: [] };
      }
      if (group === "document") {
        return { code: 200, data: [{ key: "allowBackdateDays", value: "0" }] };
      }
      return { code: 404, data: [] };
    });

    await loadSettlementDefaults({ force: true });
    invalidateSettlementDefaultsCache();
    await loadSettlementDefaults();

    expect(getCompanySettingGroupApi).toHaveBeenCalledTimes(4);
  });

  it("throws when any group api returns non-200", async () => {
    (
      getCompanySettingGroupApi as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(async (group: string) => {
      if (group === "settlement") return { code: 200, data: [] };
      if (group === "document") return { code: 500, msg: "bad", data: [] };
      return { code: 404, data: [] };
    });

    await expect(loadSettlementDefaults({ force: true })).rejects.toThrow(
      "bad"
    );
  });
});
