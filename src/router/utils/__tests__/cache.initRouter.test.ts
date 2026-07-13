import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const storage = {
    getItem: vi.fn(),
    setItem: vi.fn()
  };

  return {
    storage,
    getAsyncRoutes: vi.fn(),
    handleAsyncRoutes: vi.fn(),
    getConfig: vi.fn(),
    setRoles: vi.fn(),
    setPerms: vi.fn()
  };
});

vi.mock("@pureadmin/utils", () => ({
  cloneDeep: (value: unknown) => JSON.parse(JSON.stringify(value)),
  storageLocal: () => mocks.storage
}));

vi.mock("@vueuse/core", () => ({
  useTimeoutFn: vi.fn()
}));

vi.mock("@/config", () => ({
  getConfig: (...args: unknown[]) => mocks.getConfig(...args)
}));

vi.mock("@/utils/auth", () => ({
  userKey: "user-info"
}));

vi.mock("@/store/modules/company", () => ({
  currentCompanyKey: "current-company"
}));

vi.mock("@/store/modules/permission", () => ({
  usePermissionStoreHook: () => ({
    cacheOperate: vi.fn(),
    clearAllCachePage: vi.fn()
  })
}));

vi.mock("@/api/routes", () => ({
  getAsyncRoutes: (...args: unknown[]) => mocks.getAsyncRoutes(...args)
}));

vi.mock("../dynamic", () => ({
  handleAsyncRoutes: (...args: unknown[]) => mocks.handleAsyncRoutes(...args)
}));

vi.mock("../../index", () => ({
  router: {}
}));

describe("initRouter permission refresh", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.getConfig.mockReturnValue({ CachingAsyncRoutes: true });
    mocks.storage.getItem.mockImplementation((key: string) => {
      if (key === "user-info") {
        return { uid: "user-1", roles: ["cached-role"] };
      }
      if (key === "current-company") {
        return { companyId: "company-1" };
      }
      if (key.startsWith("async-routes:")) {
        return {
          routes: [{ name: "stale-route" }],
          timestamp: Date.now()
        };
      }
      return null;
    });
    mocks.getAsyncRoutes.mockResolvedValue({
      data: [
        {
          name: "fresh-route",
          meta: { roles: ["sales"], auths: ["sale:read"] },
          children: [
            {
              name: "fresh-child",
              meta: { roles: ["manager"], auths: ["sale:write"] }
            }
          ]
        }
      ]
    });
  });

  it("fetches server routes despite a populated cache and syncs route permissions", async () => {
    vi.doMock("@/store/modules/user", () => ({
      useUserStoreHook: () => ({
        setRoles: mocks.setRoles,
        setPerms: mocks.setPerms
      })
    }));

    const { initRouter } = await import("../cache");
    await initRouter();

    expect(mocks.getAsyncRoutes).toHaveBeenCalledTimes(1);
    expect(mocks.handleAsyncRoutes).toHaveBeenCalledWith([
      expect.objectContaining({ name: "fresh-route" })
    ]);
    expect(mocks.setRoles).toHaveBeenCalledWith(["manager", "sales"]);
    expect(mocks.setPerms).toHaveBeenCalledWith(["sale:read", "sale:write"]);
    expect(mocks.storage.setItem).toHaveBeenCalledWith(
      "user-info",
      expect.objectContaining({
        roles: ["manager", "sales"],
        permissions: ["sale:read", "sale:write"]
      })
    );
    expect(mocks.handleAsyncRoutes).not.toHaveBeenCalledWith([
      expect.objectContaining({ name: "stale-route" })
    ]);
  });
});
