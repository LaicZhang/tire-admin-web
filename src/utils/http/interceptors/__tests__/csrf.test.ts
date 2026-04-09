import { describe, expect, it, vi } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { createCsrfInterceptor } from "../csrf";

const mockGetCsrfToken = vi.fn<() => string | undefined>();

vi.mock("@/utils/auth", () => ({
  getCsrfToken: () => mockGetCsrfToken(),
  csrfHeaderName: "X-CSRF-TOKEN"
}));

function makeConfig(
  input: Partial<InternalAxiosRequestConfig> = {}
): InternalAxiosRequestConfig {
  return {
    method: "get",
    url: "/api/v1/x",
    headers: {},
    ...input
  } as InternalAxiosRequestConfig;
}

describe("createCsrfInterceptor", () => {
  it("幂等方法：不注入 CSRF header", () => {
    mockGetCsrfToken.mockReturnValue("csrf-1");
    const { requestInterceptor } = createCsrfInterceptor();

    const get = requestInterceptor(makeConfig({ method: "get" }));
    const head = requestInterceptor(makeConfig({ method: "head" }));
    const options = requestInterceptor(makeConfig({ method: "options" }));

    expect(get.headers).not.toHaveProperty("X-CSRF-TOKEN");
    expect(head.headers).not.toHaveProperty("X-CSRF-TOKEN");
    expect(options.headers).not.toHaveProperty("X-CSRF-TOKEN");
  });

  it("非幂等方法：token 存在时注入 CSRF header", () => {
    mockGetCsrfToken.mockReturnValue("csrf-1");
    const { requestInterceptor } = createCsrfInterceptor();

    const post = requestInterceptor(makeConfig({ method: "post" }));
    expect(post.headers).toMatchObject({ "X-CSRF-TOKEN": "csrf-1" });
  });

  it("非幂等方法：token 缺失时不注入 CSRF header", () => {
    mockGetCsrfToken.mockReturnValue(undefined);
    const { requestInterceptor } = createCsrfInterceptor();

    const patch = requestInterceptor(makeConfig({ method: "patch" }));
    expect(patch.headers).not.toHaveProperty("X-CSRF-TOKEN");
  });
});
