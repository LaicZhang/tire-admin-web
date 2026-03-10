import { afterEach, describe, expect, it } from "vitest";
import { setConfig } from "@/config";
import { resolveTrustedFrameSrc, withFrameCacheBust } from "../frame";

describe("frame utils", () => {
  afterEach(() => {
    setConfig({ TrustedFrameHosts: undefined });
  });

  it("trusts same-origin relative paths", () => {
    const result = resolveTrustedFrameSrc("/embedded/dashboard");

    expect(result.trusted).toBe(true);
    if (result.trusted) {
      expect(result.src).toContain("/embedded/dashboard");
      expect(result.src.startsWith(window.location.origin)).toBe(true);
    }
  });

  it("trusts configured whitelist hosts", () => {
    setConfig({ TrustedFrameHosts: ["trusted.example.com"] });

    const result = resolveTrustedFrameSrc("https://trusted.example.com/app");

    expect(result).toEqual({
      trusted: true,
      src: "https://trusted.example.com/app"
    });
  });

  it("rejects unsupported protocols", () => {
    const result = resolveTrustedFrameSrc("javascript:alert(1)");

    expect(result.trusted).toBe(false);
    if (!result.trusted) {
      expect(result.reason).toContain("HTTPS");
    }
  });

  it("rejects non-whitelisted cross-origin hosts", () => {
    const result = resolveTrustedFrameSrc("https://evil.example.com");

    expect(result).toEqual({
      trusted: false,
      reason: "当前链接不在受信任域名范围内"
    });
  });

  it("appends cache bust timestamp", () => {
    const result = withFrameCacheBust(
      "https://trusted.example.com/app?foo=1",
      12345
    );
    const url = new URL(result);

    expect(url.searchParams.get("foo")).toBe("1");
    expect(url.searchParams.get("t")).toBe("12345");
  });
});
