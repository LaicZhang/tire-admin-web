import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleSessionValidation, isAuthenticated } from "../routerGuard";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  storageGetItem: vi.fn(),
  ensureSessionValidated: vi.fn(),
  removeToken: vi.fn()
}));

vi.mock("js-cookie", () => ({
  default: {
    get: mocks.cookieGet
  }
}));

vi.mock("@pureadmin/utils", () => ({
  storageLocal: () => ({
    getItem: mocks.storageGetItem
  }),
  isUrl: vi.fn(() => false),
  openLink: vi.fn()
}));

vi.mock("@/config", () => ({
  getConfig: () => ({ Title: "Test" })
}));

vi.mock("@/store/modules/permission", () => ({
  usePermissionStoreHook: vi.fn(() => ({
    wholeMenus: []
  }))
}));

vi.mock("../index", () => ({
  isOneOfArray: vi.fn(() => true),
  handleAliveRoute: vi.fn()
}));

vi.mock("@/utils/auth", () => ({
  userKey: "user-info",
  multipleTabsKey: "multiple-tabs",
  removeToken: mocks.removeToken,
  ensureSessionValidated: mocks.ensureSessionValidated
}));

vi.mock("@/utils/progress", () => ({
  default: {
    done: vi.fn()
  }
}));

vi.mock("@/utils/logger", () => ({
  routerLogger: {
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe("routerGuard session checks", () => {
  beforeEach(() => {
    mocks.cookieGet.mockReset();
    mocks.storageGetItem.mockReset();
    mocks.ensureSessionValidated.mockReset();
    mocks.removeToken.mockReset();
  });

  it("treats a user as authenticated only when cookie and local user info both exist", () => {
    mocks.cookieGet.mockReturnValue("true");
    mocks.storageGetItem.mockReturnValue({ username: "alice" });

    expect(isAuthenticated()).toEqual({
      authenticated: true,
      userInfo: { username: "alice" }
    });

    mocks.cookieGet.mockReturnValue(undefined);
    expect(isAuthenticated().authenticated).toBe(false);
  });

  it("continues navigation when server session validation succeeds", async () => {
    mocks.ensureSessionValidated.mockResolvedValue(true);
    const next = vi.fn();

    await expect(handleSessionValidation(next)).resolves.toBe(false);
    expect(mocks.removeToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("forces logout and redirects to login when server session validation fails", async () => {
    mocks.ensureSessionValidated.mockResolvedValue(false);
    const next = vi.fn();

    await expect(handleSessionValidation(next)).resolves.toBe(true);
    expect(mocks.removeToken).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith({ path: "/login", replace: true });
  });
});
