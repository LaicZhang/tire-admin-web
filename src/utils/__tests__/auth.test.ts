import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Cookies from "js-cookie";
import { storageLocal } from "@pureadmin/utils";
import {
  formatToken,
  getToken,
  refreshTokenKey,
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

// Mock dependencies
const cookiesMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn()
}));

vi.mock("js-cookie", () => ({
  default: cookiesMock
}));

const storageMock = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}));

vi.mock("@pureadmin/utils", () => ({
  storageLocal: () => storageMock
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => ({
    isRemember: false,
    loginDay: 7,
    setUsername: vi.fn(),
    setRoles: vi.fn(),
    setUid: vi.fn()
  })
}));

describe("auth utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("formatToken", () => {
    it("should format token with Bearer prefix", () => {
      expect(formatToken("test-token")).toBe("Bearer test-token");
    });

    it("should handle empty token", () => {
      expect(formatToken("")).toBe("Bearer ");
    });

    it("should handle token with spaces", () => {
      expect(formatToken("token with spaces")).toBe("Bearer token with spaces");
    });
  });

  describe("getToken", () => {
    it("should merge cookie token and local user-info", () => {
      const cookieValue = JSON.stringify({
        accessToken: "access-token",
        expires: 1710000000000
      });

      sessionStorage.setItem(refreshTokenKey, "refresh-token");

      vi.mocked(Cookies.get).mockImplementation(((key?: string) => {
        if (key === TokenKey) return cookieValue;
        return undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any);

      vi.mocked(storageLocal().getItem).mockImplementation(((key?: string) => {
        if (key === userKey)
          return {
            expires: 1710000000000,
            username: "u",
            roles: ["admin"],
            uid: "uid-1"
          };
        return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any);

      expect(getToken()).toEqual({
        accessToken: "access-token",
        expires: 1710000000000,
        refreshToken: "refresh-token",
        username: "u",
        avatar: undefined,
        nickname: undefined,
        permissions: undefined,
        roles: ["admin"],
        uid: "uid-1"
      });
    });

    it("should return null when cookie is missing", () => {
      sessionStorage.setItem(refreshTokenKey, "refresh-token");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(Cookies.get).mockReturnValue(undefined as any);

      vi.mocked(storageLocal().getItem).mockReturnValue({
        expires: 1710000000000
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(getToken()).toBeNull();
    });

    it("should return null when cookie token is invalid JSON", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(Cookies.get).mockReturnValue("{invalid json" as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(storageLocal().getItem).mockReturnValue(null as any);

      expect(getToken()).toBeNull();
    });
  });
});
