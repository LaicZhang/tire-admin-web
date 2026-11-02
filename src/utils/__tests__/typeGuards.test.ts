import { describe, expect, it, vi } from "vitest";
import {
  extractArray,
  extractBoolean,
  extractNumber,
  extractPaginatedList,
  extractString,
  isBaseOrder,
  isBoolean,
  isFiniteNumber,
  isInventoryDocument,
  isNonEmptyArray,
  isObject,
  isPaginatedResponse,
  isRouteRecord,
  isRouteRecordArray,
  isString,
  parseJsonOrNull,
  parseJsonWithGuard,
  safeCast,
  safeCastOrThrow
} from "../type-guards";

describe("type guards", () => {
  it("accepts only the declared primitive and object shapes", () => {
    expect(isObject({ value: 1 })).toBe(true);
    expect(isObject(null)).toBe(false);
    expect(isObject([])).toBe(false);
    expect(isString("value")).toBe(true);
    expect(isString(1)).toBe(false);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean(0)).toBe(false);
    expect(isFiniteNumber(2.5)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber("2")).toBe(false);
    expect(isNonEmptyArray([1])).toBe(true);
    expect(isNonEmptyArray([])).toBe(false);
    expect(isNonEmptyArray("1")).toBe(false);
  });

  it("validates paginated responses and applies the item guard", () => {
    const isNumber = (item: unknown): item is number =>
      typeof item === "number";
    expect(isPaginatedResponse({ list: [1, 2], count: 2 }, isNumber)).toBe(
      true
    );
    expect(isPaginatedResponse({ list: [1, "2"], count: 2 }, isNumber)).toBe(
      false
    );
    expect(isPaginatedResponse({ list: [], count: 0 })).toBe(true);
    expect(isPaginatedResponse({ list: {}, count: 0 })).toBe(false);
    expect(isPaginatedResponse({ list: [], count: "0" })).toBe(false);
    expect(isPaginatedResponse(null)).toBe(false);
    expect(extractPaginatedList({ list: [1], count: 1 }, isNumber)).toEqual({
      list: [1],
      count: 1
    });
    expect(extractPaginatedList({ list: ["bad"], count: 1 }, isNumber)).toEqual(
      {
        list: [],
        count: 0
      }
    );
  });

  it("recognises order and inventory document records", () => {
    expect(isBaseOrder({ uid: "order-1" })).toBe(true);
    expect(isBaseOrder({ uid: 1 })).toBe(false);
    expect(isBaseOrder([])).toBe(false);
    expect(isInventoryDocument({ uid: "stock-1", type: "IN" })).toBe(true);
    expect(isInventoryDocument({ type: "IN" })).toBe(false);
  });

  it("casts safely or throws with the supplied message", () => {
    const validator = (value: unknown): value is string =>
      typeof value === "string";
    expect(safeCast("ok", validator, "fallback")).toBe("ok");
    expect(safeCast(1, validator, "fallback")).toBe("fallback");
    expect(safeCastOrThrow("ok", validator, "invalid")).toBe("ok");
    expect(() => safeCastOrThrow(1, validator, "invalid")).toThrow("invalid");
  });

  it("parses JSON and reports malformed payloads", () => {
    expect(parseJsonOrNull('{"ok":true}')).toEqual({ ok: true });
    expect(parseJsonOrNull("{bad")).toBeNull();
    const validator = (value: unknown): value is { ok: boolean } =>
      isObject(value) && value.ok === true;
    expect(parseJsonWithGuard('{"ok":true}', validator, "invalid")).toEqual({
      ok: true
    });
    expect(() =>
      parseJsonWithGuard('{"ok":false}', validator, "invalid")
    ).toThrow("invalid");
    expect(() => parseJsonWithGuard("{bad", validator, "invalid")).toThrow(
      "invalid"
    );
  });

  it("extracts typed properties with fallbacks and filters arrays", () => {
    const source = {
      text: "value",
      count: 3,
      enabled: true,
      rows: [1, "2", 3]
    };
    expect(extractString(source, "text")).toBe("value");
    expect(extractString(source, "count", "fallback")).toBe("fallback");
    expect(extractString(null, "text", "fallback")).toBe("fallback");
    expect(extractNumber(source, "count")).toBe(3);
    expect(extractNumber(source, "text", 7)).toBe(7);
    expect(extractNumber([], "count", 7)).toBe(7);
    expect(extractBoolean(source, "enabled")).toBe(true);
    expect(extractBoolean(source, "text", true)).toBe(true);
    expect(extractBoolean(null, "enabled", true)).toBe(true);
    const isNumber = (item: unknown): item is number =>
      typeof item === "number";
    expect(extractArray(source, "rows", isNumber)).toEqual([1, 3]);
    expect(extractArray(source, "rows")).toEqual([1, "2", 3]);
    expect(extractArray(source, "text")).toEqual([]);
    expect(extractArray(null, "rows")).toEqual([]);
  });

  it("validates route records recursively at array level", () => {
    expect(isRouteRecord({ path: "/home" })).toBe(true);
    expect(isRouteRecord({ path: 1 })).toBe(false);
    expect(isRouteRecordArray([{ path: "/home" }, { path: "/orders" }])).toBe(
      true
    );
    expect(isRouteRecordArray([{ path: "/home" }, {}])).toBe(false);
    expect(isRouteRecordArray("routes")).toBe(false);
  });

  it("keeps validator calls observable", () => {
    const validator = vi.fn(
      (value: unknown): value is string => typeof value === "string"
    );
    expect(extractArray({ values: ["a", 2] }, "values", validator)).toEqual([
      "a"
    ]);
    expect(validator).toHaveBeenCalledTimes(2);
  });
});
