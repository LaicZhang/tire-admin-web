import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const mocks = vi.hoisted(() => ({
  logoutApi: vi.fn(),
  getLogin: vi.fn(),
  refreshTokenApi: vi.fn()
}));

vi.mock("@/api", () => ({
  getLogin: (...args: unknown[]) => mocks.getLogin(...args),
  refreshTokenApi: (...args: unknown[]) => mocks.refreshTokenApi(...args),
  logoutApi: (...args: unknown[]) => mocks.logoutApi(...args)
}));

describe("user store logout", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mocks.logoutApi.mockReset();
    mocks.getLogin.mockReset();
    mocks.refreshTokenApi.mockReset();
    vi.resetModules();
  });

  it("calls backend logoutApi then always clears local state", async () => {
    const { useUserStore } = await import("../user");
    const store = useUserStore();

    const localLogoutSpy = vi.fn();
    // Replace implementation to avoid touching router/storage in this unit test
    store.logOut = localLogoutSpy as unknown as typeof store.logOut;

    mocks.logoutApi.mockResolvedValue({ code: 200, msg: "", data: [1] });

    await store.logout();

    expect(mocks.logoutApi).toHaveBeenCalledTimes(1);
    expect(localLogoutSpy).toHaveBeenCalledTimes(1);
  });

  it("still clears local state when backend logoutApi fails", async () => {
    const { useUserStore } = await import("../user");
    const store = useUserStore();

    const localLogoutSpy = vi.fn();
    store.logOut = localLogoutSpy as unknown as typeof store.logOut;

    const error = new Error("network");
    mocks.logoutApi.mockRejectedValue(error);

    await expect(store.logout()).rejects.toBe(error);
    expect(localLogoutSpy).toHaveBeenCalledTimes(1);
  });
});
