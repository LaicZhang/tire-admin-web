import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/utils/http";
import { issueWxBindStateApi, wxBindApi } from "../auth";

vi.mock("@/utils/http", () => ({
  http: {
    request: vi.fn()
  }
}));

describe("WeChat bind API contract", () => {
  beforeEach(() => {
    vi.mocked(http.request).mockReset();
    vi.mocked(http.request).mockResolvedValue({ code: 200, data: {} });
  });

  it("issues a user-bound state through the authenticated mutation endpoint", async () => {
    await issueWxBindStateApi();

    expect(http.request).toHaveBeenCalledWith(
      "post",
      "/api/v1/auth/wx-bind/state"
    );
  });

  it("posts state and current password with the WeChat code", async () => {
    const payload = {
      jsCode: "wechat-code",
      state: "one-time-state",
      currentPassword: "secret-password"
    };

    await wxBindApi(payload);

    expect(http.request).toHaveBeenCalledWith("post", "/api/v1/auth/wx-bind", {
      data: payload
    });
  });
});
