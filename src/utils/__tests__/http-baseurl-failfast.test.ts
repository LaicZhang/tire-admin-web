import { describe, expect, it } from "vitest";
import { resolveBaseURLFromViteEnv } from "../http/baseurl";

describe("resolveBaseURLFromViteEnv", () => {
  it("returns empty baseURL in DEV (proxy mode)", () => {
    expect(
      resolveBaseURLFromViteEnv({ DEV: true, PROD: false, VITE_SERVER_URL: "" })
    ).toEqual({ baseURL: "" });
  });

  it("returns VITE_SERVER_URL in non-DEV when provided", () => {
    expect(
      resolveBaseURLFromViteEnv({
        DEV: false,
        PROD: true,
        VITE_SERVER_URL: "https://api.example.com"
      })
    ).toEqual({ baseURL: "https://api.example.com" });
  });

  it("returns fatalError in non-DEV when VITE_SERVER_URL is missing", () => {
    const resolved = resolveBaseURLFromViteEnv({
      DEV: false,
      PROD: true,
      VITE_SERVER_URL: ""
    });
    expect(resolved.baseURL).toBe("");
    expect(resolved.fatalError).toContain("VITE_SERVER_URL");
  });
});
