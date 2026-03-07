import Cookies from "js-cookie";
import { storageLocal } from "@pureadmin/utils";
import { useUserStoreHook } from "@/store/modules/user";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";
import {
  useHttpOnlyCookie,
  csrfCookieName,
  csrfHeaderName
} from "./auth-config";
import { authLogger } from "@/utils/logger";

// Re-export for backward compatibility (http -> auth -> user -> api -> http circular dependency fix)
export { useHttpOnlyCookie, csrfCookieName, csrfHeaderName };

export interface DataInfo<T> {
  /** token */
  accessToken: string;
  /** `accessToken`的过期时间（时间戳） */
  expires: T;
  /** 用于调用刷新accessToken的接口时所需的token */
  refreshToken: string;
  /** 用户名 */
  username?: string;
  avatar?: string;
  nickname?: string;
  permissions?: Array<string>;
  /** 当前登陆用户的角色 */
  roles?: Array<string>;
  /** 用户id */
  uid?: string;
}

export type SetTokenPayload = Pick<DataInfo<Date>, "accessToken"> &
  Partial<Omit<DataInfo<Date>, "accessToken">>;

export interface CurrentCompanyInfo {
  companyName?: string;
  companyId?: string;
}

export const userKey = "user-info";
export const TokenKey = "authorized-token";
export const refreshTokenKey = "refresh-token";
export const currentCompanyKey = "current-company";
/**
 * 通过`multiple-tabs`是否在`cookie`中，判断用户是否已经登录系统，
 * 从而支持多标签页打开已经登录的系统后无需再登录。
 * 浏览器完全关闭后`multiple-tabs`将自动从`cookie`中销毁，
 * 再次打开浏览器需要重新登录系统
 * */
export const multipleTabsKey = "multiple-tabs";

/**
 * 获取 CSRF Token（用于 HttpOnly Cookie 模式）
 */
export function getCsrfToken(): string | undefined {
  return Cookies.get(csrfCookieName);
}

/**
 * 类型守卫：检查 token 是否有效（accessToken 非空）
 */
export function isValidToken(
  token: DataInfo<number> | null
): token is DataInfo<number> & { accessToken: string } {
  return token !== null && !!token.accessToken;
}

/** 获取`token` */
export function getToken(): DataInfo<number> | null {
  // HttpOnly Cookie 模式：token 由浏览器自动管理，无法读取
  // 仅返回用户信息和假的过期时间（永不过期，让后端处理过期）
  if (useHttpOnlyCookie) {
    const localToken = storageLocal().getItem<DataInfo<number>>(userKey);
    if (!localToken) return null;
    return {
      accessToken: "__httponly__", // 占位符，实际 token 在 HttpOnly cookie 中
      refreshToken: "__httponly__",
      expires: Date.now() + 86400000, // 假设 1 天后过期，实际由后端管理
      username: localToken.username ?? "",
      avatar: localToken.avatar ?? "",
      nickname: localToken.nickname ?? "",
      permissions: localToken.permissions ?? [],
      roles: localToken.roles ?? [],
      uid: localToken.uid ?? ""
    };
  }

  // 传统模式：从 Cookie/localStorage 读取 token
  try {
    const cookieToken = Cookies.get(TokenKey);
    const localToken = storageLocal().getItem<DataInfo<number>>(userKey);
    const refreshToken = sessionStorage.getItem(refreshTokenKey) ?? "";

    let cookieData: Partial<DataInfo<number>> | null = null;
    if (cookieToken) {
      const parsed = JSON.parse(cookieToken) as {
        accessToken?: string;
        expires?: number;
      };
      cookieData = {
        accessToken: parsed?.accessToken ?? "",
        expires: parsed?.expires ?? 0
      };
    }

    // Cookie 仅保存 accessToken/expires；localStorage 保存 refreshToken/用户信息
    if (!cookieData && !localToken) return null;

    const accessToken = cookieData?.accessToken ?? "";
    const expires = Number(cookieData?.expires ?? localToken?.expires ?? 0);

    if (!accessToken) return null;

    return {
      accessToken,
      expires,
      refreshToken,
      username: localToken?.username ?? "",
      avatar: localToken?.avatar ?? "",
      nickname: localToken?.nickname ?? "",
      permissions: localToken?.permissions ?? [],
      roles: localToken?.roles ?? [],
      uid: localToken?.uid ?? ""
    };
  } catch (error) {
    authLogger.error("Failed to parse token:", error);
    return null;
  }
}

/**
 * @description 设置`token`以及一些必要信息并采用无感刷新`token`方案
 * 无感刷新：后端返回`accessToken`（访问接口使用的`token`）、`refreshToken`（用于调用刷新`accessToken`的接口时所需的`token`，`refreshToken`的过期时间（比如30天）应大于`accessToken`的过期时间（比如2小时））、`expires`（`accessToken`的过期时间）
 * 将`accessToken`、`expires`这两条信息放在key值为authorized-token的cookie里（过期自动销毁）
 * 将`username`、`roles`、`expires`这三条信息放在 key 值为`user-info`的 localStorage 里（利用`multipleTabsKey`当浏览器完全关闭后自动销毁）
 * 将 `refreshToken` 放在 sessionStorage（浏览器关闭后自动清理），作为 HttpOnly Cookie 迁移前的过渡方案
 */
export function setToken(data: SetTokenPayload) {
  const { accessToken } = data;
  const refreshToken = data.refreshToken ?? "";
  const { isRemember, loginDay } = useUserStoreHook();
  const expires = data.expires ? new Date(data.expires).getTime() : 0; // 如果后端直接设置时间戳，将此处代码改为expires = data.expires，然后把上面的DataInfo<Date>改成DataInfo<number>即可

  /** Cookie 安全配置 */
  const secureCookieOptions: Cookies.CookieAttributes = {
    secure: import.meta.env.PROD, // 生产环境强制 HTTPS
    sameSite: "strict" // 防止 CSRF 攻击
  };

  // HttpOnly Cookie 模式：token 由后端设置，前端只保存用户信息
  if (useHttpOnlyCookie) {
    // 清理旧模式遗留的可读 token（避免灰度切换后仍残留）
    Cookies.remove(TokenKey);
    sessionStorage.removeItem(refreshTokenKey);
  } else {
    const cookieString = JSON.stringify({ accessToken, expires });
    Cookies.set(TokenKey, cookieString, {
      ...secureCookieOptions,
      ...(expires > 0 ? { expires: (expires - Date.now()) / 86400000 } : {})
    });
    sessionStorage.setItem(refreshTokenKey, refreshToken);
  }

  Cookies.set(multipleTabsKey, "true", {
    ...secureCookieOptions,
    ...(isRemember ? { expires: loginDay } : {})
  });

  function setUserKey(
    username: string,
    roles: Array<string>,
    uid: string,
    extra?: Pick<DataInfo<number>, "avatar" | "nickname" | "permissions">
  ) {
    const avatar = extra?.avatar ?? "";
    const nickname = extra?.nickname ?? "";
    const permissions = extra?.permissions ?? [];
    const userStore = useUserStoreHook();

    userStore.setUsername(username);
    userStore.setRoles(roles);
    userStore.setUid(uid);
    userStore.setAvatar(avatar);
    userStore.setNickname(nickname);
    userStore.setPerms(permissions);

    storageLocal().setItem(userKey, {
      expires,
      username,
      avatar,
      nickname,
      permissions,
      roles,
      uid
    });
  }

  if (data.username && data.roles) {
    const { username, roles, uid, avatar, nickname, permissions } = data;
    setUserKey(username, roles, uid ?? "", {
      avatar: avatar ?? "",
      nickname: nickname ?? "",
      permissions: permissions ?? []
    });
  } else {
    const stored = storageLocal().getItem<DataInfo<number>>(userKey);
    setUserKey(stored?.username ?? "", stored?.roles ?? [], stored?.uid ?? "", {
      avatar: stored?.avatar ?? "",
      nickname: stored?.nickname ?? "",
      permissions: stored?.permissions ?? []
    });
  }
}

/** 删除`token`以及key值为`user-info`的localStorage信息 */
export function removeToken() {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  storageLocal().removeItem(userKey);
  useCurrentCompanyStoreHook().clearCurrentCompany();
  sessionStorage.removeItem(refreshTokenKey);
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};
