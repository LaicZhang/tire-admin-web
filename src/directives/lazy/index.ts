import type { Directive, DirectiveBinding } from "vue";

export interface LazyImageOptions {
  /** 加载中的占位图 */
  loading?: string;
  /** 加载失败的占位图 */
  error?: string;
  /** IntersectionObserver 的 threshold */
  threshold?: number;
  /** IntersectionObserver 的 rootMargin，提前加载 */
  rootMargin?: string;
}

const DEFAULT_LOADING =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3C/svg%3E";
const DEFAULT_ERROR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23fef2f2' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23ef4444' font-size='12'%3E加载失败%3C/text%3E%3C/svg%3E";

const observerMap = new WeakMap<HTMLImageElement, IntersectionObserver>();

/**
 * 图片懒加载指令
 *
 * @example
 * ```vue
 * <!-- 基础用法 -->
 * <img v-lazy="imageUrl" />
 *
 * <!-- 带选项 -->
 * <img v-lazy="{ src: imageUrl, loading: loadingImg, error: errorImg }" />
 * ```
 */
export const lazy: Directive<HTMLImageElement> = {
  mounted(el: HTMLImageElement, binding: DirectiveBinding) {
    const value = binding.value;

    // 解析参数
    let src: string;
    let options: LazyImageOptions = {};

    if (typeof value === "string") {
      src = value;
    } else if (value && typeof value === "object") {
      src = value.src;
      options = value;
    } else {
      console.warn("[Directive: lazy]: value must be a string or object");
      return;
    }

    if (!src) {
      console.warn("[Directive: lazy]: src is required");
      return;
    }

    // 设置占位图
    el.src = options.loading || DEFAULT_LOADING;
    el.dataset.src = src;

    // 创建 IntersectionObserver
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement;
            const dataSrc = target.dataset.src;

            if (dataSrc) {
              // 预加载图片
              const img = new Image();
              img.onload = () => {
                target.src = dataSrc;
                target.removeAttribute("data-src");
              };
              img.onerror = () => {
                target.src = options.error || DEFAULT_ERROR;
                target.removeAttribute("data-src");
              };
              img.src = dataSrc;
            }

            // 停止观察
            observer.unobserve(target);
          }
        });
      },
      {
        threshold: options.threshold ?? 0,
        rootMargin: options.rootMargin ?? "50px"
      }
    );

    observer.observe(el);
    observerMap.set(el, observer);
  },

  updated(el: HTMLImageElement, binding: DirectiveBinding) {
    const value = binding.value;
    const oldValue = binding.oldValue;

    // 值未变化时不处理
    if (value === oldValue) return;

    // 更新 data-src
    const src = typeof value === "string" ? value : value?.src;
    if (src && src !== el.dataset.src) {
      el.dataset.src = src;

      // 如果已经在视口内，立即加载
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const options = typeof value === "object" ? value : {};
        const img = new Image();
        img.onload = () => {
          el.src = src;
          el.removeAttribute("data-src");
        };
        img.onerror = () => {
          el.src = options.error || DEFAULT_ERROR;
          el.removeAttribute("data-src");
        };
        img.src = src;
      }
    }
  },

  unmounted(el: HTMLImageElement) {
    const observer = observerMap.get(el);
    if (observer) {
      observer.disconnect();
      observerMap.delete(el);
    }
  }
};
