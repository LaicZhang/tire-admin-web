import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Cookies from "js-cookie";
import { storageLocal } from "@pureadmin/utils";
import {
  csrfCookieName,
  ensureSessionValidated,
  formatToken,
  getCsrfToken,
  getToken,
  isValidToken,
  refreshTokenKey,
  removeToken,
  resetSessionValidation,
  setToken,
  TokenKey,
  userKey
} from "../auth";

if (!("sessionStorage" in globalThis)) {
  let store: Record<string, string> = {};
  // @ts-expect-error test polyfill
  globalThis.sessionStorage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
}

const mocks = vi.hoisted(() => ({
  storage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
  httpOnly: false,
  getSessionApi: vi.fn(),
  clearCurrentCompany: vi.fn(),
  clearRecent: vi.fn(),
  clearDraft: vi.fn(),
  logger: { warn: vi.fn(), error: vi.fn() },
  userStore: {
    isRemember: false,
    loginDay: 7,
    setAvatar: vi.fn(),
    setUsername: vi.fn(),
    setNickname: vi.fn(),
    setPerms: vi.fn(),
    setRoles: vi.fn(),
    setUid: vi.fn()
  }
}));

vi.mock("js-cookie", () => ({
  default: { get: vi.fn(), set: vi.fn(), remove: vi.fn() }
}));

vi.mock("@pureadmin/utils", () => ({
  storageLocal: () => mocks.storage
}));

vi.mock("../auth-config", () => ({
  csrfCookieName: "csrf-token",
  csrfHeaderName: "x-csrf-token",
  get useHttpOnlyCookie() {
    return mocks.httpOnly;
  }
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => mocks.userStore
}));

vi.mock("@/store/modules/company", () => ({
  useCurrentCompanyStoreHook: () => ({
    clearCurrentCompany: mocks.clearCurrentCompany
  })
}));

vi.mock("@/api/auth", () => ({
  getSessionApi: mocks.getSessionApi
}));

vi.mock("@/utils/logger", () => ({ authLogger: mocks.logger }));
vi.mock("@/composables/recentFormMemory", () => ({
  clearRecentFormMemory: mocks.clearRecent
}));
vi.mock("@/composables/formDraftMemory", () => ({
  clearFormDraftMemory: mocks.clearDraft
}));

const cookieMock = vi.mocked(Cookies);

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  resetSessionValidation();
  mocks.httpOnly = false;
  mocks.userStore.isRemember = false;
  mocks.userStore.loginDay = 7;
});

afterEach(() => {
  resetSessionValidation();
});

describe("token formatting and guards", () => {
  it("formats every token as a bearer value", () => {
    expect(formatToken("test-token")).toBe("Bearer test-token");
    expect(formatToken("")).toBe("Bearer ");
  });

  it("recognizes only non-empty access tokens", () => {
    expect(isValidToken(null)).toBe(false);
    expect(
      isValidToken({ accessToken: "", expires: 1, refreshToken: "" })
    ).toBe(false);
    expect(
      isValidToken({ accessToken: "token", expires: 1, refreshToken: "" })
    ).toBe(true);
  });

  it("reads the CSRF cookie", () => {
    cookieMock.get.mockReturnValue("csrf-value");
    expect(getCsrfToken()).toBe("csrf-value");
    expect(cookieMock.get).toHaveBeenCalledWith(csrfCookieName);
  });
});

describe("getToken traditional mode", () => {
  it("merges cookie token and local user info", () => {
    sessionStorage.setItem(refreshTokenKey, "refresh-token");
    cookieMock.get.mockReturnValue(
      JSON.stringify({ accessToken: "access-token", expires: 1710000000000 })
    );
    vi.mocked(storageLocal().getItem).mockReturnValue({
      expires: 1710000000000,
      username: "u",
      avatar: "a",
      nickname: "n",
      permissions: ["read"],
      roles: ["admin"],
      uid: "uid-1"
    });

    expect(getToken()).toEqual({
      accessToken: "access-token",
      expires: 1710000000000,
      refreshToken: "refresh-token",
      username: "u",
      avatar: "a",
      nickname: "n",
      permissions: ["read"],
      roles: ["admin"],
      uid: "uid-1"
    });
  });

  it("returns null when the cookie omits the access token", () => {
    cookieMock.get.mockReturnValue(JSON.stringify({}));
    vi.mocked(storageLocal().getItem).mockReturnValue({
      accessToken: "ignored",
      expires: 42
    });
    expect(getToken()).toBeNull();
  });

  it("returns null for missing sources, missing access token and malformed JSON", () => {
    cookieMock.get.mockReturnValue(undefined);
    vi.mocked(storageLocal().getItem).mockReturnValueOnce(null);
    expect(getToken()).toBeNull();

    cookieMock.get.mockReturnValue(JSON.stringify({ expires: 1 }));
    vi.mocked(storageLocal().getItem).mockReturnValueOnce(null);
    expect(getToken()).toBeNull();

    cookieMock.get.mockReturnValue("{invalid json");
    expect(getToken()).toBeNull();
    expect(mocks.logger.error).toHaveBeenCalled();
  });
});

describe("getToken HttpOnly mode", () => {
  it("returns null without local user information", () => {
    mocks.httpOnly = true;
    vi.mocked(storageLocal().getItem).mockReturnValue(null);
    expect(getToken()).toBeNull();
  });

  it("returns placeholder credentials and local display information", () => {
    mocks.httpOnly = true;
    vi.mocked(storageLocal().getItem).mockReturnValue({
      username: "u",
      avatar: "a",
      nickname: "n",
      permissions: ["read"],
      roles: ["admin"],
      uid: "1"
    });

    expect(getToken()).toMatchObject({
      accessToken: "__httponly__",
      refreshToken: "__httponly__",
      username: "u",
      avatar: "a",
      nickname: "n",
      permissions: ["read"],
      roles: ["admin"],
      uid: "1"
    });
  });

  it("supplies empty defaults for absent display fields", () => {
    mocks.httpOnly = true;
    vi.mocked(storageLocal().getItem).mockReturnValue({});
    expect(getToken()).toMatchObject({
      username: "",
      avatar: "",
      nickname: "",
      permissions: [],
      roles: [],
      uid: ""
    });
  });
});

describe("setToken", () => {
  it("persists user data and access credentials in traditional mode", () => {
    setToken({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expires: new Date(Date.now() + 86_400_000),
      username: "tester",
      roles: ["admin"],
      uid: "uid-1",
      avatar: "avatar.png",
      nickname: "Tester",
      permissions: ["order.read"]
    });

    expect(cookieMock.set).toHaveBeenCalledWith(
      TokenKey,
      expect.stringContaining("access-token"),
      expect.objectContaining({
        sameSite: "strict",
        expires: expect.any(Number)
      })
    );
    expect(cookieMock.set).toHaveBeenCalledWith("multiple-tabs", "true", {
      sameSite: "strict",
      secure: expect.any(Boolean)
    });
    expect(sessionStorage.getItem(refreshTokenKey)).toBe("refresh-token");
    expect(storageLocal().setItem).toHaveBeenCalledWith(
      userKey,
      expect.objectContaining({
        username: "tester",
        roles: ["admin"],
        uid: "uid-1",
        avatar: "avatar.png",
        nickname: "Tester",
        permissions: ["order.read"]
      })
    );
    expect(mocks.userStore.setRoles).toHaveBeenCalledWith(["admin"]);
    expect(mocks.userStore.setPerms).toHaveBeenCalledWith(["order.read"]);
  });

  it("uses stored user defaults and remember duration when fields are omitted", () => {
    mocks.userStore.isRemember = true;
    vi.mocked(storageLocal().getItem).mockReturnValue({
      username: "stored",
      roles: ["common"],
      uid: "2"
    });

    setToken({ accessToken: "access-token" });

    expect(cookieMock.set).toHaveBeenCalledWith(TokenKey, expect.any(String), {
      sameSite: "strict",
      secure: expect.any(Boolean)
    });
    expect(cookieMock.set).toHaveBeenCalledWith("multiple-tabs", "true", {
      sameSite: "strict",
      secure: expect.any(Boolean),
      expires: 7
    });
    expect(storageLocal().setItem).toHaveBeenCalledWith(
      userKey,
      expect.objectContaining({
        username: "stored",
        roles: ["common"],
        uid: "2",
        avatar: "",
        nickname: "",
        permissions: []
      })
    );
    expect(sessionStorage.getItem(refreshTokenKey)).toBe("");
  });

  it("clears legacy credentials in HttpOnly mode", () => {
    mocks.httpOnly = true;
    setToken({ accessToken: "access-token", refreshToken: "refresh" });

    expect(cookieMock.remove).toHaveBeenCalledWith(TokenKey);
    expect(cookieMock.set).not.toHaveBeenCalledWith(
      TokenKey,
      expect.anything(),
      expect.anything()
    );
    expect(sessionStorage.getItem(refreshTokenKey)).toBeNull();
  });
});

describe("session validation", () => {
  it("validates a successful server session once", async () => {
    mocks.getSessionApi.mockResolvedValue({
      code: 200,
      data: { authenticated: true, user: { uid: "1" } }
    });

    await expect(ensureSessionValidated()).resolves.toBe(true);
    await expect(ensureSessionValidated()).resolves.toBe(true);
    expect(mocks.getSessionApi).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent validation", async () => {
    let resolve!: (value: unknown) => void;
    mocks.getSessionApi.mockReturnValue(
      new Promise(r => {
        resolve = r;
      })
    );

    const first = ensureSessionValidated();
    const second = ensureSessionValidated();
    resolve({ code: 200, data: { authenticated: true, user: { uid: "1" } } });

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(mocks.getSessionApi).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      { code: 401, data: { authenticated: true, user: { uid: "1" } } },
      "bad code"
    ],
    [{ code: 200, data: { authenticated: false } }, "unauthenticated"],
    [{ code: 200, data: { authenticated: true, user: {} } }, "missing uid"]
  ])("returns false for %s", async response => {
    mocks.getSessionApi.mockResolvedValue(response);
    await expect(ensureSessionValidated()).resolves.toBe(false);
  });

  it("logs failures and retries after a rejected validation", async () => {
    mocks.getSessionApi.mockRejectedValueOnce(new Error("offline"));
    await expect(ensureSessionValidated()).resolves.toBe(false);
    expect(mocks.logger.warn).toHaveBeenCalled();

    mocks.getSessionApi.mockResolvedValueOnce({
      code: 200,
      data: { authenticated: true, user: { uid: "1" } }
    });
    await expect(ensureSessionValidated()).resolves.toBe(true);
    expect(mocks.getSessionApi).toHaveBeenCalledTimes(2);
  });
});

describe("removeToken", () => {
  it("clears cookies, storage, company and cache memories", async () => {
    sessionStorage.setItem(refreshTokenKey, "refresh");
    removeToken();

    expect(cookieMock.remove).toHaveBeenCalledWith(TokenKey);
    expect(cookieMock.remove).toHaveBeenCalledWith("multiple-tabs");
    expect(storageLocal().removeItem).toHaveBeenCalledWith(userKey);
    expect(mocks.clearCurrentCompany).toHaveBeenCalled();
    expect(sessionStorage.getItem(refreshTokenKey)).toBeNull();
    await vi.waitFor(() => {
      expect(mocks.clearRecent).toHaveBeenCalledWith({ allScopes: true });
      expect(mocks.clearDraft).toHaveBeenCalledWith({ allScopes: true });
    });
  });
});
