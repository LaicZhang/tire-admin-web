import { ref, onMounted, onUnmounted, type Ref } from "vue";

export interface UseA11yOptions {
  /** 是否在开发环境自动运行检查 */
  autoCheck?: boolean;
  /** 检查通过的最低对比度（WCAG AA 标准为 4.5:1） */
  minContrastRatio?: number;
}

export interface A11yIssue {
  type: "error" | "warning";
  category: "contrast" | "alt" | "label" | "focus" | "aria";
  message: string;
  element?: HTMLElement;
}

export interface UseA11yReturn {
  /** 检查结果 */
  issues: Ref<A11yIssue[]>;
  /** 是否正在检查 */
  checking: Ref<boolean>;
  /** 手动触发检查 */
  check: () => void;
  /** 清除问题列表 */
  clear: () => void;
}

/**
 * 计算相对亮度 (WCAG 2.1)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 计算对比度
 */
function getContrastRatio(
  fg: { r: number; g: number; b: number },
  bg: { r: number; g: number; b: number }
): number {
  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 解析 RGB 颜色
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }
  return null;
}

/**
 * 可访问性检查 Composable
 *
 * @description 基础的可访问性检查工具，用于开发环境辅助检查
 *
 * @example
 * ```vue
 * <script setup>
 * import { useA11y } from '@/composables/useA11y';
 *
 * const { issues, check, checking } = useA11y({ autoCheck: true });
 * </script>
 *
 * <template>
 *   <div v-if="issues.length > 0">
 *     <p v-for="issue in issues" :key="issue.message">
 *       {{ issue.message }}
 *     </p>
 *   </div>
 * </template>
 * ```
 */
export function useA11y(options: UseA11yOptions = {}): UseA11yReturn {
  const { autoCheck = false, minContrastRatio = 4.5 } = options;

  const issues = ref<A11yIssue[]>([]);
  const checking = ref(false);

  /**
   * 检查图片 alt 属性
   */
  function checkImages(): A11yIssue[] {
    const result: A11yIssue[] = [];
    const images = document.querySelectorAll("img");

    images.forEach(img => {
      if (!img.alt && !img.getAttribute("aria-label")) {
        result.push({
          type: "error",
          category: "alt",
          message: `图片缺少 alt 属性: ${img.src?.slice(0, 50)}...`,
          element: img
        });
      }
    });

    return result;
  }

  /**
   * 检查表单标签
   */
  function checkFormLabels(): A11yIssue[] {
    const result: A11yIssue[] = [];
    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'
    );

    inputs.forEach(input => {
      const id = input.id;
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledby = input.getAttribute("aria-labelledby");
      const placeholder = input.getAttribute("placeholder");

      // Element Plus 组件通常使用 placeholder 或 aria-label
      if (!id && !ariaLabel && !ariaLabelledby && !placeholder) {
        result.push({
          type: "warning",
          category: "label",
          message: `表单元素缺少可访问标签`,
          element: input as HTMLElement
        });
      }
    });

    return result;
  }

  /**
   * 检查 ARIA 属性
   */
  function checkAria(): A11yIssue[] {
    const result: A11yIssue[] = [];

    // 检查按钮是否有可访问名称
    const buttons = document.querySelectorAll(
      "button:not([aria-label]):not([aria-labelledby])"
    );
    buttons.forEach(button => {
      if (!button.textContent?.trim()) {
        result.push({
          type: "warning",
          category: "aria",
          message: "按钮缺少可访问名称（无文本且无 aria-label）",
          element: button as HTMLElement
        });
      }
    });

    // 检查可点击元素是否有正确的 role
    const clickables = document.querySelectorAll(
      "[onclick]:not(button):not(a)"
    );
    clickables.forEach(el => {
      if (!el.getAttribute("role")) {
        result.push({
          type: "warning",
          category: "aria",
          message: "可点击元素缺少 role 属性",
          element: el as HTMLElement
        });
      }
    });

    return result;
  }

  /**
   * 检查颜色对比度（简化版）
   */
  function checkContrast(): A11yIssue[] {
    const result: A11yIssue[] = [];
    const textElements = document.querySelectorAll(
      "p, span, h1, h2, h3, h4, h5, h6, a, li, td, th"
    );

    textElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const color = parseColor(style.color);
      const bgColor = parseColor(style.backgroundColor);

      if (color && bgColor && bgColor.r + bgColor.g + bgColor.b > 0) {
        const ratio = getContrastRatio(color, bgColor);
        if (ratio < minContrastRatio) {
          result.push({
            type: "warning",
            category: "contrast",
            message: `对比度不足 (${ratio.toFixed(2)}:1，需要 ${minContrastRatio}:1)`,
            element: el as HTMLElement
          });
        }
      }
    });

    return result;
  }

  /**
   * 执行所有检查
   */
  function check() {
    if (typeof window === "undefined") return;

    checking.value = true;
    issues.value = [];

    try {
      issues.value = [
        ...checkImages(),
        ...checkFormLabels(),
        ...checkAria(),
        ...checkContrast()
      ];

      // 开发环境打印
      if (import.meta.env.DEV && issues.value.length > 0) {
        issues.value.forEach(issue => {
          const method = issue.type === "error" ? "error" : "warn";
          console[method](
            `[A11y][${issue.category}] ${issue.message}`,
            issue.element
          );
        });
      }
    } finally {
      checking.value = false;
    }
  }

  function clear() {
    issues.value = [];
  }

  // 自动检查
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  onMounted(() => {
    if (autoCheck && import.meta.env.DEV) {
      // 延迟检查，等待页面渲染完成
      timeoutId = setTimeout(check, 1000);
    }
  });

  onUnmounted(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  return {
    issues,
    checking,
    check,
    clear
  };
}
