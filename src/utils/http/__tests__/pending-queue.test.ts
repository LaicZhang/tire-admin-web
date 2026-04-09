import { describe, expect, it, vi } from "vitest";
import type { PureHttpRequestConfig } from "../types.d";
import { createPendingQueue } from "../pending-queue";

describe("createPendingQueue", () => {
  it("enqueue/resolveAll：正常流转并清空队列", async () => {
    const queue = createPendingQueue({ maxSize: 2, timeoutMs: 1000 });
    expect(queue.size()).toBe(0);

    const config: PureHttpRequestConfig = { url: "/api/v1/foo", method: "get" };
    const p = queue.enqueue(config);
    expect(queue.size()).toBe(1);

    queue.resolveAll(c => ({ ...c, headers: { ...c.headers, "x-a": "1" } }));
    expect(queue.size()).toBe(0);
    await expect(p).resolves.toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({ "x-a": "1" })
      })
    );
  });

  it("maxSize：超过上限直接拒绝", async () => {
    const queue = createPendingQueue({ maxSize: 1, timeoutMs: 0 });
    const first = queue.enqueue({ url: "/a" });
    await expect(queue.enqueue({ url: "/b" })).rejects.toThrow("请求过多");

    queue.resolveAll(c => c);
    await expect(first).resolves.toEqual({ url: "/a" });
  });

  it("timeoutMs：到期后拒绝并从队列移除", async () => {
    vi.useFakeTimers();
    const queue = createPendingQueue({ maxSize: 1, timeoutMs: 10 });

    try {
      const p = queue.enqueue({ url: "/timeout" });
      const assertion = expect(p).rejects.toThrow("请求等待超时");

      expect(queue.size()).toBe(1);
      await vi.advanceTimersByTimeAsync(11);

      await assertion;
      expect(queue.size()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejectAll：批量拒绝并清空队列", async () => {
    const queue = createPendingQueue({ maxSize: 2, timeoutMs: 0 });
    const p1 = queue.enqueue({ url: "/a" });
    const p2 = queue.enqueue({ url: "/b" });
    expect(queue.size()).toBe(2);

    queue.rejectAll(new Error("boom"));
    expect(queue.size()).toBe(0);
    await expect(p1).rejects.toThrow("boom");
    await expect(p2).rejects.toThrow("boom");
  });
});
