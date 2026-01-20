import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Vue lifecycle hooks
const mountedCallbacks: Array<() => void> = [];
const unmountedCallbacks: Array<() => void> = [];

vi.mock("vue", async () => {
  const actual = await vi.importActual("vue");
  return {
    ...actual,
    onMounted: (cb: () => void) => {
      mountedCallbacks.push(cb);
    },
    onUnmounted: (cb: () => void) => {
      unmountedCallbacks.push(cb);
    }
  };
});

import { useIdleLoad, useIdleLoadBatch } from "../useIdleLoad";

// Helper to save and restore requestIdleCallback
function mockNoIdleCallback() {
  const original = {
    requestIdleCallback: window.requestIdleCallback,
    cancelIdleCallback: window.cancelIdleCallback,
    hasRequest: "requestIdleCallback" in window,
    hasCancel: "cancelIdleCallback" in window
  };

  delete (window as Window & typeof globalThis).requestIdleCallback;

  delete (window as Window & typeof globalThis).cancelIdleCallback;

  return () => {
    if (original.hasRequest) {
      window.requestIdleCallback = original.requestIdleCallback;
    }
    if (original.hasCancel) {
      window.cancelIdleCallback = original.cancelIdleCallback;
    }
  };
}

describe("useIdleLoad", () => {
  beforeEach(() => {
    mountedCallbacks.length = 0;
    unmountedCallbacks.length = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("with requestIdleCallback support", () => {
    let mockIdleCallbackId = 1;
    let idleCallbacks: Map<number, IdleRequestCallback> = new Map();

    beforeEach(() => {
      mockIdleCallbackId = 1;
      idleCallbacks = new Map();

      vi.stubGlobal("requestIdleCallback", (cb: IdleRequestCallback) => {
        const id = mockIdleCallbackId++;
        idleCallbacks.set(id, cb);
        return id;
      });

      vi.stubGlobal("cancelIdleCallback", (id: number) => {
        idleCallbacks.delete(id);
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should return execute, cancel, and isExecuted", () => {
      const callback = vi.fn();
      const result = useIdleLoad(callback, { immediate: false });

      expect(result).toHaveProperty("execute");
      expect(result).toHaveProperty("cancel");
      expect(result).toHaveProperty("isExecuted");
      expect(typeof result.execute).toBe("function");
      expect(typeof result.cancel).toBe("function");
    });

    it("should schedule callback on execute", () => {
      const callback = vi.fn();
      const { execute } = useIdleLoad(callback, { immediate: false });

      execute();

      expect(idleCallbacks.size).toBe(1);
      expect(callback).not.toHaveBeenCalled();

      // Trigger idle callback
      const [, cb] = [...idleCallbacks.entries()][0];
      cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should not execute twice", () => {
      const callback = vi.fn();
      const { execute } = useIdleLoad(callback, { immediate: false });

      execute();
      const [, cb] = [...idleCallbacks.entries()][0];
      cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);

      execute(); // Second call should be ignored
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should cancel pending callback", () => {
      const callback = vi.fn();
      const { execute, cancel } = useIdleLoad(callback, { immediate: false });

      execute();
      expect(idleCallbacks.size).toBe(1);

      cancel();
      expect(idleCallbacks.size).toBe(0);
    });

    it("should auto-execute on mount when immediate is true", () => {
      const callback = vi.fn();
      useIdleLoad(callback, { immediate: true });

      expect(mountedCallbacks.length).toBe(1);
    });

    it("should register cleanup on unmount", () => {
      const callback = vi.fn();
      useIdleLoad(callback, { immediate: true });

      expect(unmountedCallbacks.length).toBe(1);
    });
  });

  describe("without requestIdleCallback (fallback)", () => {
    let restore: () => void;

    beforeEach(() => {
      restore = mockNoIdleCallback();
    });

    afterEach(() => {
      restore();
    });

    it("should use setTimeout as fallback", () => {
      const callback = vi.fn();
      const { execute } = useIdleLoad(callback, { immediate: false });

      execute();
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should cancel setTimeout on cancel", () => {
      const callback = vi.fn();
      const { execute, cancel } = useIdleLoad(callback, { immediate: false });

      execute();
      cancel();

      vi.advanceTimersByTime(100);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("isExecuted getter", () => {
    let restore: () => void;

    beforeEach(() => {
      restore = mockNoIdleCallback();
    });

    afterEach(() => {
      restore();
    });

    it("should return false before execution", () => {
      const callback = vi.fn();
      const result = useIdleLoad(callback, { immediate: false });

      expect(result.isExecuted).toBe(false);
    });

    it("should return true after execution", () => {
      const callback = vi.fn();
      const result = useIdleLoad(callback, { immediate: false });

      result.execute();
      vi.advanceTimersByTime(100);

      expect(result.isExecuted).toBe(true);
    });
  });
});

describe("useIdleLoadBatch", () => {
  beforeEach(() => {
    mountedCallbacks.length = 0;
    unmountedCallbacks.length = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("without requestIdleCallback (fallback)", () => {
    let restore: () => void;

    beforeEach(() => {
      restore = mockNoIdleCallback();
    });

    afterEach(() => {
      restore();
    });

    it("should return cancel function", () => {
      const tasks = [vi.fn(), vi.fn()];
      const result = useIdleLoadBatch(tasks);

      expect(result).toHaveProperty("cancel");
      expect(typeof result.cancel).toBe("function");
    });

    it("should execute tasks sequentially", async () => {
      const executionOrder: number[] = [];
      const tasks = [
        vi.fn(() => executionOrder.push(1)),
        vi.fn(() => executionOrder.push(2)),
        vi.fn(() => executionOrder.push(3))
      ];

      useIdleLoadBatch(tasks);

      // Trigger mounted
      mountedCallbacks.forEach(cb => cb());

      // Execute first task
      await vi.advanceTimersByTimeAsync(50);
      expect(executionOrder).toContain(1);

      // Execute remaining tasks
      await vi.advanceTimersByTimeAsync(100);
      expect(tasks[1]).toHaveBeenCalled();
    });

    it("should register on mount and unmount hooks", () => {
      const tasks = [vi.fn()];
      useIdleLoadBatch(tasks);

      expect(mountedCallbacks.length).toBe(1);
      expect(unmountedCallbacks.length).toBe(1);
    });
  });

  describe("with requestIdleCallback", () => {
    let idleCallbacks: Map<number, IdleRequestCallback> = new Map();
    let mockId = 1;

    beforeEach(() => {
      mockId = 1;
      idleCallbacks = new Map();

      vi.stubGlobal("requestIdleCallback", (cb: IdleRequestCallback) => {
        const id = mockId++;
        idleCallbacks.set(id, cb);
        return id;
      });

      vi.stubGlobal("cancelIdleCallback", (id: number) => {
        idleCallbacks.delete(id);
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should cancel pending callbacks on cancel", () => {
      const tasks = [vi.fn(), vi.fn()];
      const { cancel } = useIdleLoadBatch(tasks);

      // Trigger mounted
      mountedCallbacks.forEach(cb => cb());
      expect(idleCallbacks.size).toBe(1);

      cancel();
      expect(idleCallbacks.size).toBe(0);
    });
  });

  describe("empty tasks", () => {
    let restore: () => void;

    beforeEach(() => {
      restore = mockNoIdleCallback();
    });

    afterEach(() => {
      restore();
    });

    it("should handle empty task array", () => {
      const result = useIdleLoadBatch([]);

      // Trigger mounted - should not throw
      mountedCallbacks.forEach(cb => cb());

      expect(result.cancel).toBeDefined();
    });
  });
});
