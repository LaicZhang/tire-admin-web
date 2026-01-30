import { ref, onMounted, onUnmounted } from "vue";

export type A11yIssueCategory = "alt" | "label" | "aria" | "contrast";
export type A11yIssueType = "error" | "warning";

export interface A11yIssue {
  type: A11yIssueType;
  category: A11yIssueCategory;
  message: string;
  element?: Element;
}

export interface UseA11yOptions {
  autoCheck?: boolean;
  minContrastRatio?: number;
}

function hasAccessibleName(el: Element): boolean {
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel && ariaLabel.trim()) return true;

  const ariaLabelledBy = el.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ids = ariaLabelledBy
      .split(/\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    for (const id of ids) {
      const refEl = document.getElementById(id);
      if (refEl && (refEl.textContent ?? "").trim()) return true;
    }
  }

  if ((el.textContent ?? "").trim()) return true;
  return false;
}

function inputHasLabel(input: HTMLInputElement): boolean {
  if (input.type === "hidden") return true;
  if ((input.getAttribute("aria-label") ?? "").trim()) return true;
  if ((input.getAttribute("placeholder") ?? "").trim()) return true;

  const ariaLabelledBy = input.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ids = ariaLabelledBy
      .split(/\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    for (const id of ids) {
      const refEl = document.getElementById(id);
      if (refEl && (refEl.textContent ?? "").trim()) return true;
    }
  }

  const id = input.getAttribute("id");
  if (id) {
    const escapedId =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(id)
        : id.replaceAll('"', '\\"');
    const label = document.querySelector(`label[for="${escapedId}"]`);
    if (label && (label.textContent ?? "").trim()) return true;
  }

  return false;
}

export function useA11y(options: UseA11yOptions = {}) {
  const issues = ref<A11yIssue[]>([]);
  const checking = ref(false);

  const clear = () => {
    issues.value = [];
  };

  const check = () => {
    checking.value = true;
    try {
      const nextIssues: A11yIssue[] = [];

      // Images alt
      document.querySelectorAll("img").forEach(img => {
        const alt = img.getAttribute("alt");
        const hasLabel =
          (alt ?? "").trim() ||
          (img.getAttribute("aria-label") ?? "").trim() ||
          (img.getAttribute("aria-labelledby") ?? "").trim();
        if (!hasLabel) {
          nextIssues.push({
            type: "error",
            category: "alt",
            message: "图片缺少可访问名称（建议设置 alt 或 aria-label）",
            element: img
          });
        }
      });

      // Buttons accessible name
      document.querySelectorAll("button").forEach(btn => {
        if (!hasAccessibleName(btn)) {
          nextIssues.push({
            type: "error",
            category: "aria",
            message: "按钮缺少可访问名称（文本/aria-label/aria-labelledby）",
            element: btn
          });
        }
      });

      // Inputs label
      document.querySelectorAll("input").forEach(el => {
        const input = el as HTMLInputElement;
        if (!inputHasLabel(input)) {
          nextIssues.push({
            type: "error",
            category: "label",
            message: "表单输入框缺少可访问名称（label/placeholder/aria-label）",
            element: input
          });
        }
      });

      // Contrast ratio (placeholder, enabled for later extension)
      void options.minContrastRatio;

      issues.value = nextIssues;
    } finally {
      checking.value = false;
    }
  };

  if (options.autoCheck) {
    onMounted(() => {
      if (import.meta.env.DEV) check();
    });
    onUnmounted(() => clear());
  }

  return {
    issues,
    checking,
    check,
    clear
  };
}
