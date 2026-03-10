import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useLoginForm } from "./useLoginForm";

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
      expect.stringContaining("/api/v1/auth/github"),
      "github-login",
      expect.any(String)
    );
  });

  it("handleGithubLogin resolves full payload from direct message", async () => {
    const { handleGithubLogin, githubLoading } = useLoginForm();

    const mockPopup = { closed: false, close: vi.fn() };
    vi.mocked(window.open).mockReturnValue(mockPopup as unknown as Window);

    let messageHandler: ((event: MessageEvent) => void) | undefined;
    vi.mocked(window.addEventListener).mockImplementation((event, handler) => {
      if (event === "message") {
        messageHandler = handler as (event: MessageEvent) => void;
      }
    });

    const promise = handleGithubLogin();
    if (!messageHandler) throw new Error("message handler not registered");

    messageHandler({
      origin: window.location.origin,
      source: mockPopup as unknown as Window,
      data: {
        accessToken: "token",
        refreshToken: "refresh",
        expires: "2026-03-08T00:00:00.000Z",
        username: "octocat",
        uid: "user-1",
        roles: ["admin"],
        permissions: ["sys:user:add"]
      }
    } as MessageEvent);

    await expect(promise).resolves.toEqual({
      accessToken: "token",
      refreshToken: "refresh",
      expires: new Date("2026-03-08T00:00:00.000Z"),
      username: "octocat",
      uid: "user-1",
      roles: ["admin"],
      permissions: ["sys:user:add"]
    });
    expect(githubLoading.value).toBe(false);
  });

  it("handleGithubLogin resolves wrapped payload", async () => {
    const { handleGithubLogin } = useLoginForm();

    const mockPopup = { closed: false, close: vi.fn() };
    vi.mocked(window.open).mockReturnValue(mockPopup as unknown as Window);

    let messageHandler: ((event: MessageEvent) => void) | undefined;
    vi.mocked(window.addEventListener).mockImplementation((event, handler) => {
      if (event === "message") {
        messageHandler = handler as (event: MessageEvent) => void;
      }
    });

    const promise = handleGithubLogin();
    if (!messageHandler) throw new Error("message handler not registered");

    messageHandler({
      origin: window.location.origin,
      source: mockPopup as unknown as Window,
      data: {
        data: {
          accessToken: "token"
        }
      }
    } as MessageEvent);

    await expect(promise).resolves.toEqual({ accessToken: "token" });
  });

  it("handleGithubLogin rejects on error message", async () => {
    const { handleGithubLogin, githubLoading } = useLoginForm();

    const mockPopup = { closed: false, close: vi.fn() };
    vi.mocked(window.open).mockReturnValue(mockPopup as unknown as Window);

    let messageHandler: ((event: MessageEvent) => void) | undefined;
    vi.mocked(window.addEventListener).mockImplementation((event, handler) => {
      if (event === "message")
        messageHandler = handler as (event: MessageEvent) => void;
    });

    const promise = handleGithubLogin();

    if (!messageHandler) throw new Error("message handler not registered");
    messageHandler({
      origin: window.location.origin,
      source: mockPopup as unknown as Window,
      data: { error: "Access denied" }
    } as MessageEvent);

    await expect(promise).rejects.toThrow("Access denied");
    expect(githubLoading.value).toBe(false);
  });

  it("ignores messages from other origins or sources", async () => {
    const { handleGithubLogin, githubLoading } = useLoginForm();

    const popup = { closed: false, close: vi.fn() };
    const otherPopup = { closed: false, close: vi.fn() };
    vi.mocked(window.open).mockReturnValue(popup as unknown as Window);

    let messageHandler: ((event: MessageEvent) => void) | undefined;
    vi.mocked(window.addEventListener).mockImplementation((event, handler) => {
      if (event === "message")
        messageHandler = handler as (event: MessageEvent) => void;
    });

    const promise = handleGithubLogin();

    if (!messageHandler) throw new Error("message handler not registered");

    messageHandler({
      origin: "https://evil.example",
      source: popup as unknown as Window,
      data: { accessToken: "evil-token" }
    } as MessageEvent);

    messageHandler({
      origin: window.location.origin,
      source: otherPopup as unknown as Window,
      data: { accessToken: "evil-token" }
    } as MessageEvent);

    expect(githubLoading.value).toBe(true);

    messageHandler({
      origin: window.location.origin,
      source: popup as unknown as Window,
      data: { accessToken: "ok-token" }
    } as MessageEvent);

    await expect(promise).resolves.toEqual({ accessToken: "ok-token" });
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

    mockPopup.closed = true;
    vi.advanceTimersByTime(2000);

    await expect(promise).rejects.toThrow("用户取消登录");
    expect(githubLoading.value).toBe(false);
  });
});
