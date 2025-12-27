import Cookies from "js-cookie";
import { storageLocal } from "@pureadmin/utils";
import { useUserStoreHook } from "@/store/modules/user";

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

/** 获取`token` */
export function getToken(): DataInfo<number> | null {
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
      username: localToken?.username,
      avatar: localToken?.avatar,
      nickname: localToken?.nickname,
      permissions: localToken?.permissions,
      roles: localToken?.roles,
      uid: localToken?.uid
    };
  } catch (error) {
    console.error("Failed to parse token:", error);
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
export function setToken(data: DataInfo<Date>) {
  let expires = 0;
  const { accessToken, refreshToken } = data;
  const { isRemember, loginDay } = useUserStoreHook();
  expires = new Date(data.expires).getTime(); // 如果后端直接设置时间戳，将此处代码改为expires = data.expires，然后把上面的DataInfo<Date>改成DataInfo<number>即可
  const cookieString = JSON.stringify({ accessToken, expires });

  /** Cookie 安全配置 */
  const secureCookieOptions: Cookies.CookieAttributes = {
    secure: import.meta.env.PROD, // 生产环境强制 HTTPS
    sameSite: "strict" // 防止 CSRF 攻击
  };

  Cookies.set(TokenKey, cookieString, {
    ...secureCookieOptions,
    ...(expires > 0 ? { expires: (expires - Date.now()) / 86400000 } : {})
  });

  Cookies.set(multipleTabsKey, "true", {
    ...secureCookieOptions,
    ...(isRemember ? { expires: loginDay } : {})
  });

  sessionStorage.setItem(refreshTokenKey, refreshToken);

  function setUserKey(username: string, roles: Array<string>, uid: string) {
    useUserStoreHook().setUsername(username);
    useUserStoreHook().setRoles(roles);
    useUserStoreHook().setUid(uid);
    storageLocal().setItem(userKey, {
      expires,
      username,
      roles,
      uid
    });
  }

  if (data.username && data.roles) {
    const { username, roles, uid } = data;
    setUserKey(username, roles, uid ?? "");
  } else {
    const username =
      storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "";
    const roles =
      storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [];
    const uid = storageLocal().getItem<DataInfo<number>>(userKey)?.uid ?? "";
    setUserKey(username, roles, uid);
  }
}

/** 删除`token`以及key值为`user-info`的localStorage信息 */
export function removeToken() {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  storageLocal().removeItem(userKey);
  sessionStorage.removeItem(refreshTokenKey);
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};
