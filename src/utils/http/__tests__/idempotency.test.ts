import { describe, it, expect } from "vitest";
import type { PureHttpRequestConfig } from "../types.d";
import { ensureIdempotencyKey } from "../idempotency";

describe("ensureIdempotencyKey", () => {
  it("should not set key for GET", () => {
    const config: PureHttpRequestConfig = { method: "get", url: "/api/v1/foo" };
    const key = ensureIdempotencyKey(config, { nowMs: 0 });
    expect(key).toBeUndefined();
    expect(config.headers).toBeUndefined();
  });

  it("should set key for POST", () => {
    const config: PureHttpRequestConfig = {
      method: "post",
      url: "/api/v1/foo",
      data: { a: 1 }
    };
    const key = ensureIdempotencyKey(config, { nowMs: 0, reuseMs: 3000 });
    expect(typeof key).toBe("string");
    expect(
      (config.headers as Record<string, unknown>)["x-idempotency-key"]
    ).toBe(key);
  });

  it("should reuse key for same signature within reuse window", () => {
    const a: PureHttpRequestConfig = {
      method: "post",
      url: "/api/v1/foo",
      data: { a: 1, b: 2 }
    };
    const b: PureHttpRequestConfig = {
      method: "post",
      url: "/api/v1/foo",
      data: { b: 2, a: 1 }
    };

    const key1 = ensureIdempotencyKey(a, { nowMs: 1000, reuseMs: 3000 });
    const key2 = ensureIdempotencyKey(b, { nowMs: 2000, reuseMs: 3000 });
    expect(key1).toBeTruthy();
    expect(key2).toBe(key1);
  });

  it("should rotate key after reuse window", () => {
    const config: PureHttpRequestConfig = {
      method: "post",
      url: "/api/v1/foo-rotate",
      data: { a: 1 }
    };
    const gen1 = (() => {
      const values = ["uuid-1", "uuid-2"];
      let i = 0;
      return () => values[i++] || "uuid-x";
    })();
    const key1 = ensureIdempotencyKey(config, {
      nowMs: 0,
      reuseMs: 10,
      generateKey: gen1
    });
    const key2 = ensureIdempotencyKey(
      { ...config, headers: {} },
      { nowMs: 20, reuseMs: 10, generateKey: gen1 }
    );
    expect(key1).toBeTruthy();
    expect(key2).toBeTruthy();
    expect(key2).not.toBe(key1);
  });

  it("should keep existing header", () => {
    const config: PureHttpRequestConfig = {
      method: "post",
      url: "/api/v1/foo",
      headers: { "x-idempotency-key": "fixed" }
    };
    const key = ensureIdempotencyKey(config, { nowMs: 0 });
    expect(key).toBe("fixed");
  });
});
