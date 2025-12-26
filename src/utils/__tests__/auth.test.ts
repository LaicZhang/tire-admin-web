import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Cookies from "js-cookie";
import { storageLocal } from "@pureadmin/utils";
import { formatToken, getToken, TokenKey, userKey } from "../auth";

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

      vi.mocked(Cookies.get).mockImplementation((key?: string) => {
        if (key === TokenKey) return cookieValue;
        return undefined as any;
      });

      vi.mocked(storageLocal().getItem).mockImplementation((key?: string) => {
        if (key === userKey)
          return {
            refreshToken: "refresh-token",
            expires: 1710000000000,
            username: "u",
            roles: ["admin"],
            uid: "uid-1"
          } as any;
        return null as any;
      });

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
      vi.mocked(Cookies.get).mockReturnValue(undefined as any);
      vi.mocked(storageLocal().getItem).mockReturnValue({
        refreshToken: "refresh-token",
        expires: 1710000000000
      } as any);

      expect(getToken()).toBeNull();
    });

    it("should return null when cookie token is invalid JSON", () => {
      vi.mocked(Cookies.get).mockReturnValue("{invalid json" as any);
      vi.mocked(storageLocal().getItem).mockReturnValue(null as any);

      expect(getToken()).toBeNull();
    });
  });
});
