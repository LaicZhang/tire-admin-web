import { describe, expect, it } from "vitest";
import {
  clearRuntimeError,
  formatRuntimeError,
  showRuntimeError,
  useRuntimeErrorState
} from "../runtimeError";

describe("runtimeError", () => {
  it("formats error details", () => {
    expect(formatRuntimeError(new Error("boom"), "router")).toBe(
      "router: boom"
    );
    expect(formatRuntimeError(null, undefined, "fallback")).toBe("fallback");
  });

  it("stores and clears runtime errors", () => {
    showRuntimeError({
      kind: "render",
      title: "页面渲染异常",
      message: "加载失败",
      detail: "detail"
    });

    const state = useRuntimeErrorState();
    expect(state.visible).toBe(true);
    expect(state.title).toBe("页面渲染异常");
    expect(state.detail).toBe("detail");

    clearRuntimeError();

    expect(state.visible).toBe(false);
    expect(state.detail).toBe("");
  });
});
