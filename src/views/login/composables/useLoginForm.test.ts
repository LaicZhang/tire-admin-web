import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useLoginForm } from "./useLoginForm";

vi.mock("@/api/utils", () => ({
  baseUrlApi: (path: string) => path
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: vi.fn(() => ({
    setIsRemembered: vi.fn(),
    setLoginDay: vi.fn()
  }))
}));

describe("useLoginForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, "open").mockImplementation(
      () =>
        ({
          closed: false,
          close: vi.fn()
        }) as unknown as Window
    );
    vi.spyOn(window, "addEventListener");
    vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("handleGithubLogin opens window and sets loading", () => {
    const { handleGithubLogin, githubLoading } = useLoginForm();

    handleGithubLogin();
    expect(githubLoading.value).toBe(true);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/github"),
      "github-login",
      expect.any(String)
    );
  });

  it("handleGithubLogin resolves on success message", async () => {
    const { handleGithubLogin, githubLoading } = useLoginForm();

    // Capture message handler
    let messageHandler: (event: MessageEvent) => void;
    vi.mocked(window.addEventListener).mockImplementation((event, handler) => {
      if (event === "message")
        messageHandler = handler as (event: MessageEvent) => void;
    });

    const promise = handleGithubLogin();

    expect(messageHandler).toBeDefined();

    // Simulate success message
    messageHandler({
      data: { accessToken: "token" } as { accessToken: string }
    });

    const result = await promise;
    expect(result).toEqual({ accessToken: "token" });
    expect(githubLoading.value).toBe(false);
  });

  it("handleGithubLogin rejects on error message", async () => {
    const { handleGithubLogin, githubLoading } = useLoginForm();

    let messageHandler: (event: MessageEvent) => void;
    vi.mocked(window.addEventListener).mockImplementation((event, handler) => {
      if (event === "message")
        messageHandler = handler as (event: MessageEvent) => void;
    });

    const promise = handleGithubLogin();

    messageHandler({ data: { error: "Access denied" } as { error: string } });

    await expect(promise).rejects.toThrow("Access denied");
    expect(githubLoading.value).toBe(false);
  });

  it("handleGithubLogin rejects on timeout", async () => {
    const { handleGithubLogin, githubLoading } = useLoginForm();

    const promise = handleGithubLogin();

    vi.advanceTimersByTime(30000);

    await expect(promise).rejects.toThrow("登录超时，请重试");
    expect(githubLoading.value).toBe(false);
  });

  it("handleGithubLogin rejects on window closed", async () => {
    const { handleGithubLogin, githubLoading } = useLoginForm();

    const mockPopup = { closed: false, close: vi.fn() };
    vi.mocked(window.open).mockReturnValue(mockPopup as unknown as Window);

    const promise = handleGithubLogin();

    // Simulate close
    mockPopup.closed = true;
    vi.advanceTimersByTime(2000); // Wait for interval check

    await expect(promise).rejects.toThrow("用户取消登录");
    expect(githubLoading.value).toBe(false);
  });
});
