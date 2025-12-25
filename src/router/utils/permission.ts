/**
 * 权限相关工具函数
 */
import { isString, isIncludeAllChildren } from "@pureadmin/utils";
import { router } from "../index";

/**
 * 获取当前页面按钮级别的权限
 */
export function getAuths(): Array<string> {
  return router.currentRoute.value.meta.auths as Array<string>;
}

/**
 * 是否有按钮级别的权限
 */
export function hasAuth(value: string | Array<string>): boolean {
  if (!value) return false;
  /** 从当前路由的`meta`字段里获取按钮级别的所有自定义`code`值 */
  const metaAuths = getAuths();
  if (!metaAuths) return false;
  const isAuths = isString(value)
    ? metaAuths.includes(value)
    : isIncludeAllChildren(value, metaAuths);
  return isAuths ? true : false;
}
