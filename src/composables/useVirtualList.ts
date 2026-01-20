import { ref, computed, onMounted, onUnmounted, type Ref } from "vue";

export interface UseVirtualListOptions<T> {
  /** 列表数据 */
  list: Ref<T[]>;
  /** 每项高度（固定高度模式） */
  itemHeight: number;
  /** 容器高度 */
  containerHeight: number;
  /** 预渲染缓冲区项数 */
  overscan?: number;
}

export interface UseVirtualListReturn<T> {
  /** 容器 ref */
  containerRef: Ref<HTMLElement | null>;
  /** 可见列表数据 */
  visibleList: Ref<{ data: T; index: number }[]>;
  /** 容器样式 */
  containerStyle: Ref<Record<string, string>>;
  /** 列表样式 */
  wrapperStyle: Ref<Record<string, string>>;
  /** 滚动到指定索引 */
  scrollTo: (index: number) => void;
  /** 总高度 */
  totalHeight: Ref<number>;
}

/**
 * 虚拟列表 Composable
 *
 * @description 用于渲染大量列表数据时的性能优化，只渲染可见区域的元素
 *
 * @example
 * ```vue
 * <script setup>
 * import { useVirtualList } from '@/composables/useVirtualList';
 *
 * const items = ref(Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` })));
 *
 * const { containerRef, visibleList, containerStyle, wrapperStyle } = useVirtualList({
 *   list: items,
 *   itemHeight: 50,
 *   containerHeight: 400
 * });
 * </script>
 *
 * <template>
 *   <div ref="containerRef" :style="containerStyle">
 *     <div :style="wrapperStyle">
 *       <div v-for="{ data, index } in visibleList" :key="index" style="height: 50px">
 *         {{ data.name }}
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 */
export function useVirtualList<T>(
  options: UseVirtualListOptions<T>
): UseVirtualListReturn<T> {
  const { list, itemHeight, containerHeight, overscan = 5 } = options;

  const containerRef = ref<HTMLElement | null>(null);
  const scrollTop = ref(0);

  // 计算属性
  const totalHeight = computed(() => list.value.length * itemHeight);

  const startIndex = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight) - overscan;
    return Math.max(0, start);
  });

  const endIndex = computed(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = startIndex.value + visibleCount + overscan * 2;
    return Math.min(list.value.length, end);
  });

  const visibleList = computed(() => {
    const result: { data: T; index: number }[] = [];
    for (let i = startIndex.value; i < endIndex.value; i++) {
      result.push({ data: list.value[i], index: i });
    }
    return result;
  });

  const offsetTop = computed(() => startIndex.value * itemHeight);

  // 样式
  const containerStyle = computed(() => ({
    height: `${containerHeight}px`,
    overflow: "auto",
    position: "relative" as const
  }));

  const wrapperStyle = computed(() => ({
    height: `${totalHeight.value}px`,
    paddingTop: `${offsetTop.value}px`,
    boxSizing: "border-box" as const
  }));

  // 滚动处理
  const handleScroll = () => {
    if (containerRef.value) {
      scrollTop.value = containerRef.value.scrollTop;
    }
  };

  // 滚动到指定索引
  const scrollTo = (index: number) => {
    if (containerRef.value) {
      const top = index * itemHeight;
      containerRef.value.scrollTop = top;
    }
  };

  // 生命周期
  onMounted(() => {
    containerRef.value?.addEventListener("scroll", handleScroll, {
      passive: true
    });
  });

  onUnmounted(() => {
    containerRef.value?.removeEventListener("scroll", handleScroll);
  });

  return {
    containerRef,
    visibleList,
    containerStyle,
    wrapperStyle,
    scrollTo,
    totalHeight
  };
}
