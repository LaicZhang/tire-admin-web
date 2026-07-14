import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const mocks = vi.hoisted(() => ({
  logoutApi: vi.fn(),
  getLogin: vi.fn(),
  refreshTokenApi: vi.fn(),
  removeToken: vi.fn(),
  resetRouter: vi.fn(),
  safeNavigate: vi.fn(),
  handleTags: vi.fn()
}));

vi.mock("@/api", () => ({
  getLogin: (...args: unknown[]) => mocks.getLogin(...args),
  refreshTokenApi: (...args: unknown[]) => mocks.refreshTokenApi(...args),
  logoutApi: (...args: unknown[]) => mocks.logoutApi(...args)
}));

vi.mock("@/utils/auth", () => ({
  ensureSessionValidated: vi.fn(),
  getCsrfToken: vi.fn(),
  removeToken: (...args: unknown[]) => mocks.removeToken(...args),
  setToken: vi.fn(),
  useHttpOnlyCookie: false,
  userKey: "user-info"
}));

vi.mock("@/router/utils", () => ({
  safeNavigate: (...args: unknown[]) => mocks.safeNavigate(...args)
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

vi.mock("../multiTags", () => ({
  useMultiTagsStoreHook: () => ({
    handleTags: (...args: unknown[]) => mocks.handleTags(...args)
  })
}));

describe("user store logout", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("calls backend logoutApi then always clears local state", async () => {
    const { useUserStore } = await import("../user");
    const store = useUserStore();
    store.setUsername("alice");
    store.setNickname("alice");
    store.setUid("user-1");

    mocks.logoutApi.mockResolvedValue({ code: 200, msg: "", data: [1] });

    await store.logout();

    expect(mocks.logoutApi).toHaveBeenCalledTimes(1);
    expect(mocks.removeToken).toHaveBeenCalledTimes(1);
    expect(mocks.resetRouter).toHaveBeenCalledTimes(1);
    expect(mocks.safeNavigate).toHaveBeenCalledTimes(1);
    expect(store.username).toBe("");
    expect(store.nickname).toBe("");
    expect(store.uid).toBe("");
  });

  it("still clears local state when backend logoutApi fails", async () => {
    const { useUserStore } = await import("../user");
    const store = useUserStore();
    store.setUsername("alice");
    store.setUid("user-1");

    const error = new Error("network");
    mocks.logoutApi.mockRejectedValue(error);

    await expect(store.logout()).rejects.toBe(error);
    expect(mocks.removeToken).toHaveBeenCalledTimes(1);
    expect(mocks.resetRouter).toHaveBeenCalledTimes(1);
    expect(mocks.safeNavigate).toHaveBeenCalledTimes(1);
    expect(store.username).toBe("");
    expect(store.uid).toBe("");
  });
});
