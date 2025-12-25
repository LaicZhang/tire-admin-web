import { hasAuth } from "@/router/utils";
import type { Directive, DirectiveBinding } from "vue";

/**
 * 权限控制指令
 * @example
 * // 隐藏模式（默认）- 元素仅被隐藏，DOM 保留
 * v-auth="['btn.add']"
 *
 * // 移除模式 - 元素从 DOM 中完全移除（高安全场景）
 * v-auth:remove="['btn.delete']"
 */
export const auth: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkAuth(el, binding);
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    // 仅在非 remove 模式下更新（remove 模式元素已被移除）
    if (binding.arg !== "remove") {
      checkAuth(el, binding);
    }
  }
};

function checkAuth(el: HTMLElement, binding: DirectiveBinding) {
  const { value, arg } = binding;
  if (value) {
    if (!hasAuth(value)) {
      if (arg === "remove") {
        // remove 模式：完全移除 DOM 节点（高安全场景）
        el.parentNode?.removeChild(el);
      } else {
        // 默认模式：使用 display 控制可见性，支持权限动态变更后恢复显示
        el.style.display = "none";
      }
    } else {
      el.style.display = "";
    }
  } else if (import.meta.env.DEV) {
    console.warn(
      "[Directive: auth]: need auths! Like v-auth=\"['btn.add','btn.edit']\""
    );
  }
}
