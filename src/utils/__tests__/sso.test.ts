import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../auth", () => ({
  removeToken: vi.fn(),
  setToken: vi.fn()
}));

import {
  applySsoFromCurrentUrl,
  parseSsoPayloadFromUrl,
  removeSsoParamsFromUrl
} from "../sso";
import { removeToken, setToken } from "../auth";

describe("sso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses SSO payload from search params", () => {
    const url = new URL(
      "https://example.com/login?username=alice&accessToken=token&roles=admin,user&permissions=p1,p2"
    );
    const payload = parseSsoPayloadFromUrl(url);

    expect(payload).toEqual({
      username: "alice",
      accessToken: "token",
      roles: ["admin", "user"],
      permissions: ["p1", "p2"]
    });
  });

  it("parses SSO payload from hash query", () => {
    const url = new URL(
      "https://example.com/#/login?username=alice&accessToken=token&roles=admin"
    );
    const payload = parseSsoPayloadFromUrl(url);

    expect(payload).toEqual({
      username: "alice",
      accessToken: "token",
      roles: ["admin"]
    });
  });

  it("returns null when required fields are missing", () => {
    const url = new URL(
      "https://example.com/#/login?username=alice&roles=admin"
    );
    expect(parseSsoPayloadFromUrl(url)).toBeNull();
  });

  it("removes SSO params but keeps other params", () => {
    const url = new URL(
      "https://example.com/login?username=alice&accessToken=token&roles=admin&foo=bar"
    );
    const cleaned = new URL(removeSsoParamsFromUrl(url));

    expect(cleaned.searchParams.get("foo")).toBe("bar");
    expect(cleaned.searchParams.get("username")).toBeNull();
    expect(cleaned.searchParams.get("accessToken")).toBeNull();
    expect(cleaned.searchParams.get("roles")).toBeNull();
  });

  it("removes SSO params from hash query but keeps hash route and other params", () => {
    const url = new URL(
      "https://example.com/#/login?username=alice&accessToken=token&roles=admin&x=1"
    );
    const cleaned = new URL(removeSsoParamsFromUrl(url));

    expect(cleaned.hash).toBe("#/login?x=1");
  });

  describe("applySsoFromCurrentUrl", () => {
    let replaceSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      replaceSpy = vi
        .spyOn(window.location, "replace")
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      replaceSpy.mockRestore();
    });

    it("sets token and cleans URL when payload is present", () => {
      const origin = window.location.origin;
      window.history.replaceState(
        {},
        "",
        `${origin}/#/login?username=alice&accessToken=token&roles=admin&x=1`
      );

      const applied = applySsoFromCurrentUrl();
      expect(applied).toBe(true);

      expect(removeToken).toHaveBeenCalledTimes(1);
      expect(setToken).toHaveBeenCalledWith({
        username: "alice",
        accessToken: "token",
        roles: ["admin"]
      });

      expect(replaceSpy).toHaveBeenCalledTimes(1);
      const arg = replaceSpy.mock.calls[0]?.[0];
      expect(typeof arg).toBe("string");
      expect(String(arg)).not.toContain("accessToken=");
      expect(String(arg)).toContain("#/login?x=1");
    });

    it("no-ops when payload is absent", () => {
      const origin = window.location.origin;
      window.history.replaceState({}, "", `${origin}/#/login?x=1`);

      const applied = applySsoFromCurrentUrl();
      expect(applied).toBe(false);
      expect(removeToken).not.toHaveBeenCalled();
      expect(setToken).not.toHaveBeenCalled();
      expect(replaceSpy).not.toHaveBeenCalled();
    });
  });
});
