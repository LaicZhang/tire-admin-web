import { beforeEach, describe, expect, it, vi } from "vitest";

async function load() {
  const mod = await import("../utils");
  return { baseUrlApi: mod.baseUrlApi };
}

describe("baseUrlApi", () => {
  beforeEach(() => {
    // Reset module-level cache (`cachedResults`) between tests
    // so each case is independent.
    vi.resetModules();
  });

  it("正常：自动拼接 /api/v1 且兼容有无前导 /", async () => {
    const { baseUrlApi } = await load();
    expect(baseUrlApi("tire")).toBe("/api/v1/tire");
    expect(baseUrlApi("/tire")).toBe("/api/v1/tire");
  });

  it("空输入：返回 /api/v1/", async () => {
    const { baseUrlApi } = await load();
    expect(baseUrlApi("")).toBe("/api/v1/");
  });

  it("边界：多个前导 / 的行为固定", async () => {
    const { baseUrlApi } = await load();
    expect(baseUrlApi("//tire")).toBe("/api/v1//tire");
  });

  it("缓存：同入参重复调用结果一致，且达到 MAX_CACHE_SIZE 后不影响正确性", async () => {
    const { baseUrlApi } = await load();
    const first = baseUrlApi("/keep");

    for (let i = 0; i < 1001; i++) {
      baseUrlApi(`/k/${i}`);
    }

    expect(baseUrlApi("/keep")).toBe(first);
    expect(baseUrlApi("/after")).toBe("/api/v1/after");
  });
});
