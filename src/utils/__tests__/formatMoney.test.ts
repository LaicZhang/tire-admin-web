import { describe, it, expect } from "vitest";
import {
  formatMoney,
  fenToYuan,
  yuanToFen,
  formatMoneyFromFen
} from "../formatMoney";

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

describe("fenToYuan", () => {
  it("should convert fen to yuan with 2 decimals", () => {
    expect(fenToYuan(12345)).toBe("123.45");
  });

  it("should handle zero", () => {
    expect(fenToYuan(0)).toBe("0.00");
  });

  it("should handle null", () => {
    expect(fenToYuan(null)).toBe("0.00");
  });

  it("should handle undefined", () => {
    expect(fenToYuan(undefined)).toBe("0.00");
  });

  it("should handle bigint", () => {
    expect(fenToYuan(BigInt(100000))).toBe("1000.00");
  });

  it("should respect custom decimal places", () => {
    expect(fenToYuan(12345, 1)).toBe("123.5");
  });

  it("should handle negative values", () => {
    expect(fenToYuan(-12345)).toBe("-123.45");
  });
});

describe("yuanToFen", () => {
  it("should convert yuan to fen", () => {
    expect(yuanToFen(123.45)).toBe(12345);
  });

  it("should handle zero", () => {
    expect(yuanToFen(0)).toBe(0);
  });

  it("should handle null", () => {
    expect(yuanToFen(null)).toBe(0);
  });

  it("should handle undefined", () => {
    expect(yuanToFen(undefined)).toBe(0);
  });

  it("should round correctly", () => {
    expect(yuanToFen(123.456)).toBe(12346);
    expect(yuanToFen(123.454)).toBe(12345);
  });

  it("should handle negative values", () => {
    expect(yuanToFen(-123.45)).toBe(-12345);
  });
});

describe("formatMoneyFromFen", () => {
  it("should format fen to yuan with thousand separators", () => {
    expect(formatMoneyFromFen(1234567)).toBe("12,345.67");
  });

  it("should handle null", () => {
    expect(formatMoneyFromFen(null)).toBe("0.00");
  });

  it("should handle undefined", () => {
    expect(formatMoneyFromFen(undefined)).toBe("0.00");
  });

  it("should handle bigint", () => {
    expect(formatMoneyFromFen(BigInt(100000000))).toBe("1,000,000.00");
  });
});
