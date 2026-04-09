import { describe, expect, it } from "vitest";
import { resolveBaseURLFromViteEnv } from "../baseurl";

describe("resolveBaseURLFromViteEnv", () => {
  it("DEV 环境：固定返回相对 baseURL", () => {
    expect(
      resolveBaseURLFromViteEnv({
        DEV: true,
        PROD: false,
        VITE_SERVER_URL: "https://example.com"
      })
    ).toEqual({ baseURL: "" });
  });

  it("非 DEV：优先使用 trim 后的 VITE_SERVER_URL", () => {
    expect(
      resolveBaseURLFromViteEnv({
        DEV: false,
        PROD: true,
        VITE_SERVER_URL: "  https://api.example.com  "
      })
    ).toEqual({ baseURL: "https://api.example.com" });
  });

  it("非 DEV 且缺少 VITE_SERVER_URL：返回 fatalError 并提示环境类型", () => {
    const prod = resolveBaseURLFromViteEnv({
      DEV: false,
      PROD: true,
      VITE_SERVER_URL: "   "
    });
    expect(prod.baseURL).toBe("");
    expect(prod.fatalError).toContain("生产环境缺少 VITE_SERVER_URL");

    const nonProd = resolveBaseURLFromViteEnv({
      DEV: false,
      PROD: false,
      VITE_SERVER_URL: undefined
    });
    expect(nonProd.baseURL).toBe("");
    expect(nonProd.fatalError).toContain("非开发环境缺少 VITE_SERVER_URL");
  });
});
