import { describe, it, expect, vi } from "vitest";
import { lazyComponent } from "../lazyComponent";

describe("lazyComponent", () => {
  it("should create an async component", () => {
    const mockLoader = vi.fn().mockResolvedValue({
      default: { name: "TestComponent" }
    });

    const component = lazyComponent(mockLoader);

    // 应该返回一个组件对象
    expect(component).toBeDefined();
    expect(typeof component).toBe("object");
  });

  it("should accept options", () => {
    const mockLoader = vi.fn().mockResolvedValue({
      default: { name: "TestComponent" }
    });

    const component = lazyComponent(mockLoader, {
      delay: 100,
      timeout: 5000,
      retries: 1,
      retryDelay: 500
    });

    expect(component).toBeDefined();
  });

  it("should use default options when not provided", () => {
    const mockLoader = vi.fn().mockResolvedValue({
      default: { name: "TestComponent" }
    });

    const component = lazyComponent(mockLoader);

    expect(component).toBeDefined();
    // 加载器在这一步不会被立即调用
    expect(mockLoader).not.toHaveBeenCalled();
  });
});
