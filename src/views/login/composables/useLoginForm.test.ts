import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCaptcha, useLoginForm, useRememberLogin } from "./useLoginForm";

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: vi.fn(() => ({
    setIsRemembered: vi.fn(),
    setLoginDay: vi.fn()
  }))
}));

vi.mock("@/api/utils", () => ({
  baseUrlApi: (path: string) => `/api/v1${path}`
}));

describe("useLoginForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns reactive form defaults without third-party OAuth helpers", () => {
    const form = useLoginForm();

    expect(form.loading.value).toBe(false);
    expect(form.disabled.value).toBe(false);
    expect(form.ruleForm).toEqual({
      username: "",
      password: "",
      captchaCode: "",
      isRemember: false
    });
    expect(form).not.toHaveProperty("githubLoading");
    expect(form).not.toHaveProperty("handleGithubLogin");
  });
});

describe("useCaptcha", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds captcha URL with cache-busting timestamp", () => {
    const { captchaUrl, refreshCaptcha } = useCaptcha();

    refreshCaptcha();
    vi.advanceTimersByTime(500);

    expect(captchaUrl.value).toContain("/api/v1/verify/captcha");
    expect(captchaUrl.value).toMatch(/[?&]t=\d+/);
  });
});

describe("useRememberLogin", () => {
  it("defaults remember-me off", () => {
    const { checked, loginDay } = useRememberLogin();
    expect(checked.value).toBe(false);
    expect(loginDay.value).toBe(7);
  });
});
