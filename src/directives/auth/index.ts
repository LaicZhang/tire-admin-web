import { hasAuth } from "@/router/utils";
import type { Directive, DirectiveBinding } from "vue";

export const auth: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkAuth(el, binding);
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkAuth(el, binding);
  }
};

function checkAuth(el: HTMLElement, binding: DirectiveBinding) {
  const { value } = binding;
  if (value) {
    // 使用 display 控制可见性，支持权限动态变更后恢复显示
    if (!hasAuth(value)) {
      el.style.display = "none";
    } else {
      el.style.display = "";
    }
  } else {
    throw new Error(
      "[Directive: auth]: need auths! Like v-auth=\"['btn.add','btn.edit']\""
    );
  }
}
