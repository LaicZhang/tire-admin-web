import { describe, it, expect } from "vitest";
import { formatMoney } from "../formatMoney";

describe("formatMoney", () => {
  it("should format integer to 2 decimal places", () => {
    expect(formatMoney(1000)).toBe("1,000.00");
  });

  it("should format with thousand separators", () => {
    expect(formatMoney(1234567.89)).toBe("1,234,567.89");
  });

  it("should format small numbers", () => {
    expect(formatMoney(0.5)).toBe("0.50");
  });

  it("should handle zero", () => {
    expect(formatMoney(0)).toBe("0.00");
  });

  it("should handle negative numbers", () => {
    expect(formatMoney(-1234.56)).toBe("-1,234.56");
  });

  it("should respect custom decimal places", () => {
    expect(formatMoney(1234.5678, 3)).toBe("1,234.568");
  });

  it("should handle no decimal places", () => {
    expect(formatMoney(1234.56, 0)).toBe("1,235");
  });

  it("should return 0.00 for NaN", () => {
    expect(formatMoney(NaN)).toBe("0.00");
  });

  it("should return 0.00 for null", () => {
    // @ts-expect-error testing null input
    expect(formatMoney(null)).toBe("0.00");
  });

  it("should return 0.00 for undefined", () => {
    // @ts-expect-error testing undefined input
    expect(formatMoney(undefined)).toBe("0.00");
  });

  it("should handle very large numbers", () => {
    const result = formatMoney(9999999999.99);
    expect(result).toContain("9,999,999,999");
  });

  it("should handle very small decimals", () => {
    expect(formatMoney(0.001, 3)).toBe("0.001");
  });
});
