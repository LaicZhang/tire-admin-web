import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDate, formatDateTime, formatTimeOnlyNumber } from "../time";

describe("time utils", () => {
  describe("formatDate", () => {
    it("should format Date object to YYYY-MM-DD", () => {
      const date = new Date("2025-12-28T10:30:00");
      expect(formatDate(date)).toBe("2025-12-28");
    });

    it("should format ISO string to YYYY-MM-DD", () => {
      expect(formatDate("2025-12-28T10:30:00")).toBe("2025-12-28");
    });

    it("should format date string", () => {
      expect(formatDate("2025-12-28")).toBe("2025-12-28");
    });

    it("should return empty string for null", () => {
      expect(formatDate(null)).toBe("");
    });

    it("should return empty string for undefined", () => {
      expect(formatDate(undefined)).toBe("");
    });

    it("should handle date with timezone", () => {
      const result = formatDate("2025-12-28T23:59:59+08:00");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("formatDateTime", () => {
    it("should format Date object to YYYY-MM-DD HH:mm:ss", () => {
      const date = new Date("2025-12-28T10:30:45");
      expect(formatDateTime(date)).toBe("2025-12-28 10:30:45");
    });

    it("should format ISO string", () => {
      expect(formatDateTime("2025-12-28T14:25:30")).toBe("2025-12-28 14:25:30");
    });

    it("should return empty string for null", () => {
      expect(formatDateTime(null)).toBe("");
    });

    it("should return empty string for undefined", () => {
      expect(formatDateTime(undefined)).toBe("");
    });

    it("should handle midnight", () => {
      expect(formatDateTime("2025-12-28T00:00:00")).toBe("2025-12-28 00:00:00");
    });

    it("should handle end of day", () => {
      expect(formatDateTime("2025-12-28T23:59:59")).toBe("2025-12-28 23:59:59");
    });
  });

  describe("formatTimeOnlyNumber", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return 14-digit timestamp string", () => {
      vi.setSystemTime(new Date("2025-12-28T14:30:45"));
      const result = formatTimeOnlyNumber();
      expect(result).toBe("20251228143045");
    });

    it("should handle midnight", () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00"));
      const result = formatTimeOnlyNumber();
      expect(result).toBe("20250101000000");
    });

    it("should contain only numbers", () => {
      vi.setSystemTime(new Date("2025-12-28T14:30:45"));
      const result = formatTimeOnlyNumber();
      expect(/^\d{14}$/.test(result)).toBe(true);
    });
  });
});
