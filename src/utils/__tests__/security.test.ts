import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMD5, getFileMd5, getUsernameOfOnlyNumber } from "../security";

// Mock formatTimeOnlyNumber
vi.mock("@/utils/time", () => ({
  formatTimeOnlyNumber: vi.fn(() => "20251228041600")
}));

describe("security utils", () => {
  describe("getMD5", () => {
    it("should return lowercase md5 hash", () => {
      const result = getMD5("test");
      expect(result).toBe("098f6bcd4621d373cade4e832627b4f6");
    });

    it("should return consistent hash for same input", () => {
      const result1 = getMD5("hello");
      const result2 = getMD5("hello");
      expect(result1).toBe(result2);
    });

    it("should return different hash for different input", () => {
      const result1 = getMD5("hello");
      const result2 = getMD5("world");
      expect(result1).not.toBe(result2);
    });

    it("should handle empty string", () => {
      const result = getMD5("");
      expect(result).toBe("d41d8cd98f00b204e9800998ecf8427e");
    });

    it("should handle unicode characters", () => {
      const result = getMD5("你好世界");
      expect(typeof result).toBe("string");
      expect(result.length).toBe(32);
    });

    it("should handle special characters", () => {
      const result = getMD5("!@#$%^&*()");
      expect(typeof result).toBe("string");
      expect(result.length).toBe(32);
    });
  });

  describe("getFileMd5", () => {
    it("should generate md5 from lastModified and size", () => {
      const result = getFileMd5(1703721600000, 1024);
      expect(typeof result).toBe("string");
      expect(result.length).toBe(32);
    });

    it("should return same hash for same inputs", () => {
      const result1 = getFileMd5(1703721600000, 1024);
      const result2 = getFileMd5(1703721600000, 1024);
      expect(result1).toBe(result2);
    });

    it("should return different hash for different lastModified", () => {
      const result1 = getFileMd5(1703721600000, 1024);
      const result2 = getFileMd5(1703721600001, 1024);
      expect(result1).not.toBe(result2);
    });

    it("should return different hash for different size", () => {
      const result1 = getFileMd5(1703721600000, 1024);
      const result2 = getFileMd5(1703721600000, 2048);
      expect(result1).not.toBe(result2);
    });

    it("should handle zero values", () => {
      const result = getFileMd5(0, 0);
      expect(typeof result).toBe("string");
      expect(result.length).toBe(32);
    });
  });

  describe("getUsernameOfOnlyNumber", () => {
    beforeEach(() => {
      // Mock crypto.getRandomValues
      const mockGetRandomValues = vi.fn((arr: Uint32Array) => {
        arr[0] = 42;
        return arr;
      });
      vi.stubGlobal("crypto", { getRandomValues: mockGetRandomValues });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should return timestamp + random number", () => {
      const result = getUsernameOfOnlyNumber();
      expect(result).toBe("2025122804160042");
    });

    it("should return string containing only numbers", () => {
      const result = getUsernameOfOnlyNumber();
      expect(/^\d+$/.test(result)).toBe(true);
    });
  });
});
