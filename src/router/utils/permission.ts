/**
 * 权限相关工具函数
 */
import { isString, isIncludeAllChildren } from "@pureadmin/utils";
import { router } from "../index";
import { useUserStoreHook } from "@/store/modules/user";

/**
 * 获取当前页面声明的按钮权限集合
 */
export function getAuths(): Array<string> {
  const routeAuths = router.currentRoute.value.meta.auths;
  return Array.isArray(routeAuths)
    ? routeAuths.filter((item): item is string => typeof item === "string")
    : [];
}

function resolveEffectiveAuths(): Array<string> {
  const routeAuths = getAuths();
  const userPermissions = useUserStoreHook().permissions ?? [];
  if (userPermissions.length === 0) return routeAuths;
  if (routeAuths.length === 0) return userPermissions;
  return userPermissions.filter(permission => routeAuths.includes(permission));
}

/**
 * 是否有按钮级别的权限
 */
export function hasAuth(value: string | Array<string>): boolean {
  if (!value) return false;
  const metaAuths = resolveEffectiveAuths();
  if (metaAuths.length === 0) return false;
  const isAuths = isString(value)
    ? metaAuths.includes(value)
    : isIncludeAllChildren(value, metaAuths);
  return isAuths ? true : false;
}
