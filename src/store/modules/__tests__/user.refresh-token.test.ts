import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const mocks = vi.hoisted(() => ({
  refreshTokenApi: vi.fn(),
  setToken: vi.fn(),
  resetRouter: vi.fn(),
  initRouter: vi.fn()
}));

vi.mock("@/api", () => ({
  getLogin: vi.fn(),
  refreshTokenApi: (...args: unknown[]) => mocks.refreshTokenApi(...args),
  logoutApi: vi.fn()
}));

vi.mock("@/utils/auth", () => ({
  ensureSessionValidated: vi.fn(),
  getCsrfToken: vi.fn(),
  removeToken: vi.fn(),
  setToken: (...args: unknown[]) => mocks.setToken(...args),
  useHttpOnlyCookie: false,
  userKey: "user-info"
}));

vi.mock("@/router/utils", () => ({
  ascending: (routes: unknown[]) => routes,
  filterTree: (routes: unknown[]) => routes,
  filterNoPermissionTree: (routes: unknown[]) => routes,
  formatFlatteningRoutes: (routes: unknown[]) => routes,
  initRouter: (...args: unknown[]) => mocks.initRouter(...args),
  safeNavigate: vi.fn()
}));

vi.mock("@/router", () => ({
  router: {},
  resetRouter: vi.fn(),
  constantMenus: []
}));

vi.mock("@/store/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@/store/utils")>();
  return {
    ...actual,
    resetRouter: (...args: unknown[]) => mocks.resetRouter(...args)
  };
});

describe("user token refresh route rebuild", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetModules();
    vi.clearAllMocks();
    mocks.refreshTokenApi.mockResolvedValue({
      code: 200,
      data: {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expires: new Date("2030-01-01T00:00:00.000Z")
      }
    });
    mocks.initRouter.mockResolvedValue(undefined);
  });

  it("resets dynamic routes and rebuilds them after storing the refreshed token", async () => {
    const { useUserStore } = await import("../user");
    const store = useUserStore();

    const result = await store.handRefreshToken({
      refreshToken: "old-refresh-token"
    });

    expect(result.data?.accessToken).toBe("new-access-token");
    expect(mocks.refreshTokenApi).toHaveBeenCalledWith({
      refreshToken: "old-refresh-token"
    });
    expect(mocks.setToken).toHaveBeenCalledWith(result.data);
    expect(mocks.resetRouter).toHaveBeenCalledTimes(1);
    expect(mocks.initRouter).toHaveBeenCalledTimes(1);
    expect(mocks.setToken.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.resetRouter.mock.invocationCallOrder[0]
    );
    expect(mocks.resetRouter.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.initRouter.mock.invocationCallOrder[0]
    );
  });
});
