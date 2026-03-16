import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  invalidateInventoryDefaultsCache,
  loadInventoryDefaults
} from "../useInventoryDefaults";

vi.mock("@/api/setting/company-setting", () => ({
  getCompanySettingGroupApi: vi.fn()
}));

import { getCompanySettingGroupApi } from "@/api/setting/company-setting";

describe("useInventoryDefaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads inventory defaults and caches result", async () => {
    (
      getCompanySettingGroupApi as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      code: 200,
      data: [{ key: "defaultWarehouseId", value: "repo-1" }]
    });

    const first = await loadInventoryDefaults({ force: true });
    expect(first).toEqual({ defaultWarehouseId: "repo-1" });

    const second = await loadInventoryDefaults();
    expect(second).toBe(first);
    expect(getCompanySettingGroupApi).toHaveBeenCalledTimes(1);
  });

  it("invalidates cache", async () => {
    (
      getCompanySettingGroupApi as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      code: 200,
      data: [{ key: "defaultWarehouseId", value: "repo-1" }]
    });

    await loadInventoryDefaults({ force: true });
    invalidateInventoryDefaultsCache();
    await loadInventoryDefaults();

    expect(getCompanySettingGroupApi).toHaveBeenCalledTimes(2);
  });

  it("throws when api returns non-200", async () => {
    (
      getCompanySettingGroupApi as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ code: 500, msg: "bad", data: [] });

    await expect(loadInventoryDefaults({ force: true })).rejects.toThrow("bad");
  });
});
