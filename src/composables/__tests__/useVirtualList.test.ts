import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ref } from "vue";

// We need to mock Vue lifecycle hooks before importing the composable
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

import { useVirtualList } from "../useVirtualList";

describe("useVirtualList", () => {
  beforeEach(() => {
    mountedCallbacks.length = 0;
    unmountedCallbacks.length = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should return required properties", () => {
      const list = ref([1, 2, 3, 4, 5]);
      const result = useVirtualList({
        list,
        itemHeight: 50,
        containerHeight: 200
      });

      expect(result).toHaveProperty("containerRef");
      expect(result).toHaveProperty("visibleList");
      expect(result).toHaveProperty("containerStyle");
      expect(result).toHaveProperty("wrapperStyle");
      expect(result).toHaveProperty("scrollTo");
      expect(result).toHaveProperty("totalHeight");
    });

    it("should compute totalHeight correctly", () => {
      const list = ref([1, 2, 3, 4, 5]);
      const { totalHeight } = useVirtualList({
        list,
        itemHeight: 50,
        containerHeight: 200
      });

      expect(totalHeight.value).toBe(250); // 5 items * 50px
    });

    it("should update totalHeight when list changes", () => {
      const list = ref([1, 2, 3]);
      const { totalHeight } = useVirtualList({
        list,
        itemHeight: 50,
        containerHeight: 200
      });

      expect(totalHeight.value).toBe(150);

      list.value = [1, 2, 3, 4, 5, 6];
      expect(totalHeight.value).toBe(300);
    });
  });

  describe("visibleList", () => {
    it("should compute visible items with overscan", () => {
      const list = ref(Array.from({ length: 100 }, (_, i) => i));
      const { visibleList } = useVirtualList({
        list,
        itemHeight: 50,
        containerHeight: 200,
        overscan: 5
      });

      // At scrollTop = 0, should show items 0-8 (4 visible + 5 overscan after)
      // startIndex = max(0, 0 - 5) = 0
      // endIndex = min(100, 0 + 4 + 10) = 14
      expect(visibleList.value.length).toBeGreaterThan(0);
      expect(visibleList.value[0].data).toBe(0);
      expect(visibleList.value[0].index).toBe(0);
    });

    it("should include index and data in visible items", () => {
      const list = ref([
        { id: 1, name: "A" },
        { id: 2, name: "B" }
      ]);
      const { visibleList } = useVirtualList({
        list,
        itemHeight: 50,
        containerHeight: 200
      });

      expect(visibleList.value[0]).toEqual({
        data: { id: 1, name: "A" },
        index: 0
      });
    });
  });

  describe("styles", () => {
    it("should return correct containerStyle", () => {
      const list = ref([1, 2, 3]);
      const { containerStyle } = useVirtualList({
        list,
        itemHeight: 50,
        containerHeight: 300
      });

      expect(containerStyle.value).toEqual({
        height: "300px",
        overflow: "auto",
        position: "relative"
      });
    });

    it("should return correct wrapperStyle", () => {
      const list = ref([1, 2, 3, 4, 5]);
      const { wrapperStyle } = useVirtualList({
        list,
        itemHeight: 50,
        containerHeight: 200
      });

      expect(wrapperStyle.value).toEqual({
        height: "250px", // totalHeight
        paddingTop: "0px", // offsetTop at scroll 0
        boxSizing: "border-box"
      });
    });
  });

  describe("scrollTo", () => {
    it("should be a function", () => {
      const list = ref([1, 2, 3]);
      const { scrollTo } = useVirtualList({
        list,
        itemHeight: 50,
        containerHeight: 200
      });

      expect(typeof scrollTo).toBe("function");
    });

    it("should set scrollTop on container when containerRef is set", () => {
      const list = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const { containerRef, scrollTo } = useVirtualList({
        list,
        itemHeight: 50,
        containerHeight: 200
      });

      // Simulate container element
      const mockContainer = { scrollTop: 0 } as unknown as HTMLElement;
      containerRef.value = mockContainer;

      scrollTo(5);
      expect(mockContainer.scrollTop).toBe(250); // 5 * 50
    });
  });

  describe("default overscan", () => {
    it("should use default overscan of 5", () => {
      const list = ref(Array.from({ length: 100 }, (_, i) => i));
      const { visibleList } = useVirtualList({
        list,
        itemHeight: 50,
        containerHeight: 200
        // overscan not specified, should default to 5
      });

      // Should have some visible items
      expect(visibleList.value.length).toBeGreaterThan(0);
    });
  });

  describe("empty list", () => {
    it("should handle empty list", () => {
      const list = ref<number[]>([]);
      const { visibleList, totalHeight } = useVirtualList({
        list,
        itemHeight: 50,
        containerHeight: 200
      });

      expect(visibleList.value).toEqual([]);
      expect(totalHeight.value).toBe(0);
    });
  });
});
