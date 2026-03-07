import { hasAuth } from "@/router/utils";
import { createLogger } from "@/utils/logger";
import type { Directive, DirectiveBinding } from "vue";

const logger = createLogger("Directive:auth");

/**
 * 权限控制指令
 * @example
 * // 移除模式（默认）- 元素从 DOM 中完全移除
 * v-auth="['btn.add']"
 *
 * // 显隐模式 - 元素仅被隐藏，DOM 保留
 * v-auth:display="['btn.delete']"
 */
export const auth: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkAuth(el, binding);
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    if (binding.arg === "display") {
      checkAuth(el, binding);
    }
  }
};

function checkAuth(el: HTMLElement, binding: DirectiveBinding) {
  const { value, arg } = binding;
  if (value) {
    if (!hasAuth(value)) {
      if (arg === "display") {
        el.style.display = "none";
      } else {
        el.parentNode?.removeChild(el);
      }
    } else if (arg === "display") {
      el.style.display = "";
    }
  } else {
    logger.warn("need auths! Like v-auth=\"['btn.add','btn.edit']\"");
  }
}
