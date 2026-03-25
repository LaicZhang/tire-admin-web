import { beforeEach, describe, expect, it, vi } from "vitest";

const { storage, companyStore, getDictItemsApi } = vi.hoisted(() => ({
  storage: new Map<string, unknown>(),
  companyStore: { companyId: "company-1" },
  getDictItemsApi: vi.fn()
}));

vi.mock("@/api/system/dict", () => ({
  getDictItemsApi
}));

vi.mock("@/store/modules/company", () => ({
  useCurrentCompanyStoreHook: () => companyStore
}));

vi.mock("@/utils", () => ({
  SYS: { dict: "sys_dict" },
  localForage: () => ({
    getItem: vi.fn(
      async (key: string) => (storage.get(key) as unknown) ?? null
    ),
    setItem: vi.fn(async (key: string, value: unknown) => {
      storage.set(key, value);
      return value;
    }),
    removeItem: vi.fn(async (key: string) => {
      storage.delete(key);
    })
  })
}));

vi.mock("@/utils/logger", () => ({
  logger: { error: vi.fn() }
}));

import {
  ensureDictCache,
  getDictItems,
  getDictLabel,
  invalidateDictCache
} from "../useSysDict";

describe("useSysDict", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T00:00:00.000Z"));
    storage.clear();
    companyStore.companyId = "company-1";
    vi.clearAllMocks();
  });

  it("caches system dict for one hour", async () => {
    getDictItemsApi.mockResolvedValue({
      code: 200,
      data: [
        { id: 1, name: "employeeStatus", key: 1, cn: "启用", en: "enabled" }
      ]
    });

    const first = await ensureDictCache({ source: "system" });
    const second = await ensureDictCache({ source: "system" });

    expect(first.itemsByName.employeeStatus).toHaveLength(1);
    expect(second).toEqual(first);
    expect(getDictItemsApi).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60 * 60 * 1000 + 1);
    await ensureDictCache({ source: "system" });
    expect(getDictItemsApi).toHaveBeenCalledTimes(2);
  });

  it("isolates company dict cache by company id", async () => {
    getDictItemsApi
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 1, name: "repoStatus", key: 1, cn: "公司1", en: null }]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 2, name: "repoStatus", key: 1, cn: "公司2", en: null }]
      });

    const companyOne = await getDictItems("repoStatus", { source: "company" });
    companyStore.companyId = "company-2";
    const companyTwo = await getDictItems("repoStatus", { source: "company" });

    expect(companyOne[0]?.cn).toBe("公司1");
    expect(companyTwo[0]?.cn).toBe("公司2");
    expect(getDictItemsApi).toHaveBeenCalledTimes(2);
  });

  it("resolves label from cached dict items", async () => {
    getDictItemsApi.mockResolvedValue({
      code: 200,
      data: [
        { id: 1, name: "employeeStatus", key: 0, cn: "禁用", en: "disabled" }
      ]
    });

    const label = await getDictLabel("employeeStatus", 0, { source: "system" });

    expect(label).toBe("禁用");
  });

  it("invalidates cached bucket", async () => {
    getDictItemsApi.mockResolvedValue({
      code: 200,
      data: [
        { id: 1, name: "employeeStatus", key: 1, cn: "启用", en: "enabled" }
      ]
    });

    await ensureDictCache({ source: "system" });
    await invalidateDictCache({ source: "system" });
    await ensureDictCache({ source: "system" });

    expect(getDictItemsApi).toHaveBeenCalledTimes(2);
  });
});
