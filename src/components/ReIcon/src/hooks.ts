import type { iconType } from "./types";
import { h, defineComponent, type Component } from "vue";
import { FontIcon, IconifyIconOnline, IconifyIconOffline } from "../index";
import type { IconifyIcon } from "@iconify/types";

export type IconInput = string | Component | IconifyIcon | null | undefined;

function isIconifyIcon(value: unknown): value is IconifyIcon {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { body?: unknown }).body === "string"
  );
}

function isComponentLike(value: unknown): value is Component {
  if (!value) return false;
  if (typeof value === "function") return true;
  if (typeof value === "object") {
    return (
      "render" in (value as object) ||
      "setup" in (value as object) ||
      "$el" in (value as object)
    );
  }
  return false;
}

/**
 * 支持 `iconfont`、自定义 `svg` 以及 `iconify` 中所有的图标
 * @see 点击查看文档图标篇 {@link https://yiming_chang.gitee.io/pure-admin-doc/pages/icon/}
 * @param icon 必传 图标
 * @param attrs 可选 iconType 属性
 * @returns Component
 */
export function useRenderIcon(icon: IconInput, attrs?: iconType): Component {
  // iconfont
  const ifReg = /^IF-/;
  if (typeof icon === "string" && ifReg.test(icon)) {
    // iconfont
    const name = icon.split(ifReg)[1];
    const iconName = name.slice(
      0,
      name.indexOf(" ") == -1 ? name.length : name.indexOf(" ")
    );
    const iconType = name.slice(name.indexOf(" ") + 1, name.length);
    return defineComponent({
      name: "FontIcon",
      render() {
        return h(FontIcon, {
          icon: iconName,
          iconType,
          ...attrs
        });
      }
    });
  }

  if (isIconifyIcon(icon)) {
    return defineComponent({
      name: "OfflineIcon",
      render() {
        return h(IconifyIconOffline, {
          icon,
          ...attrs
        });
      }
    });
  }

  if (isComponentLike(icon)) {
    return defineComponent({
      name: "SvgIcon",
      render() {
        return h(icon, { ...attrs });
      }
    });
  }

  // 通过是否存在 : 符号来判断是在线还是本地图标，存在即是在线图标，反之
  return defineComponent({
    name: "Icon",
    render() {
      if (typeof icon !== "string" || !icon) return;
      const IconifyIcon = icon.includes(":")
        ? IconifyIconOnline
        : IconifyIconOffline;
      return h(IconifyIcon, {
        icon,
        ...attrs
      });
    }
  });
}
