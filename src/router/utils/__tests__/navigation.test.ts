import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteLocationRaw } from "vue-router";
import {
  getNavigationErrorMessage,
  isChunkLoadError,
  resolveSafeErrorRoute,
  resolveSafeHomeRoute,
  safeNavigate
} from "../navigation";

const { messageMock } = vi.hoisted(() => ({
  messageMock: vi.fn()
}));

vi.mock("@/utils/progress", () => ({
  default: {
    done: vi.fn()
  }
}));

vi.mock("@/utils/message", () => ({
  message: messageMock
}));

vi.mock("@/utils/logger", () => ({
  routerLogger: {
    error: vi.fn(),
    warn: vi.fn()
  }
}));

type MockRouter = {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  resolve: ReturnType<typeof vi.fn>;
  hasRoute: ReturnType<typeof vi.fn>;
  getRoutes: ReturnType<typeof vi.fn>;
  currentRoute: {
    value: {
      fullPath: string;
      path: string;
    };
  };
};

function createRouterMock(): MockRouter {
  return {
    push: vi.fn(async () => undefined),
    replace: vi.fn(async () => undefined),
    resolve: vi.fn((target: RouteLocationRaw) => ({
      fullPath: typeof target === "string" ? target : (target.path ?? "/"),
      path: typeof target === "string" ? target : (target.path ?? "/")
    })),
    hasRoute: vi.fn((name: string) => name === "Home" || name === "500"),
    getRoutes: vi.fn(() => [{ path: "/" }, { path: "/login" }]),
    currentRoute: {
      value: {
        fullPath: "/current",
        path: "/current"
      }
    }
  };
}

describe("navigation helpers", () => {
  beforeEach(() => {
    messageMock.mockReset();
  });

  it("detects chunk load errors", () => {
    expect(
      isChunkLoadError(new Error("Failed to fetch dynamically imported module"))
    ).toBe(true);
    expect(isChunkLoadError(new Error("ordinary error"))).toBe(false);
  });

  it("returns a friendly chunk load message", () => {
    expect(
      getNavigationErrorMessage(
        new Error("Failed to fetch dynamically imported module")
      )
    ).toBe("页面资源加载失败，请刷新后重试");
  });

  it("resolves safe home and error routes", () => {
    const router = createRouterMock();
    expect(resolveSafeHomeRoute(router as never)).toEqual({ path: "/" });
    expect(resolveSafeErrorRoute(router as never)).toEqual({
      path: "/error/500"
    });
  });

  it("falls back when navigation throws", async () => {
    const router = createRouterMock();
    router.push.mockRejectedValueOnce(new Error("boom"));

    const result = await safeNavigate(router as never, "/target", {
      fallback: { path: "/error/500" }
    });

    expect(result).toBe(false);
    expect(router.replace).toHaveBeenCalledWith({ path: "/error/500" });
    expect(messageMock).toHaveBeenCalledWith("页面跳转失败，请稍后重试", {
      type: "error"
    });
  });

  it("does not show a message when silent is enabled", async () => {
    const router = createRouterMock();
    router.push.mockRejectedValueOnce(new Error("boom"));

    await safeNavigate(router as never, "/target", {
      silent: true,
      fallback: { path: "/login" }
    });

    expect(messageMock).not.toHaveBeenCalled();
  });
});
