import { defineStore } from "pinia";
import type { userType } from "./types";
import {
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal,
  toMultiTypeArray
} from "../utils";
import {
  type UserResult,
  type RefreshTokenResult,
  type LoginDto,
  type RefreshTokenDto,
  getLogin,
  refreshTokenApi
} from "@/api";
import { useMultiTagsStoreHook } from "./multiTags";
import { type DataInfo, setToken, removeToken, userKey } from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => {
    // 一次性读取 localStorage 并解构，避免重复调用
    const stored = storageLocal().getItem<DataInfo<number>>(userKey);
    return {
      // 头像
      avatar: stored?.avatar ?? "",
      // 用户名
      username: stored?.username ?? "",
      // 昵称
      nickname: stored?.nickname ?? "",
      // 用户id
      uid: stored?.uid ?? "",
      // 页面级别权限
      roles: stored?.roles ?? [],
      // 按钮级别权限
      permissions: stored?.permissions ?? [],
      // 是否勾选了登录页的免登录
      isRemember: true,
      captchaCode: "",
      currentPage: 0,
      // 登录页的免登录存储几天，默认7天
      loginDay: 7
    };
  },
  actions: {
    /** 存储头像 */
    setAvatar(avatar: string) {
      this.avatar = avatar;
    },
    /** 存储用户名 */
    setUsername(username: string) {
      this.username = username;
    },
    /** 存储昵称 */
    setNickname(nickname: string) {
      this.nickname = nickname;
    },
    /** 存储角色 */
    setRoles(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    setPerms(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储用户id */
    setUid(uid: string) {
      this.uid = uid;
    },
    /** 存储是否勾选了登录页的免登录 */
    setIsRemembered(bool: boolean) {
      this.isRemember = bool;
    },
    /** 存储验证码 */
    setCaptchaCode(value: string) {
      this.captchaCode = value;
    },
    /** 存储当前页码 */
    setCurrentPage(value: number) {
      this.currentPage = value;
    },
    /** 设置登录页的免登录存储几天 */
    setLoginDay(value: number) {
      this.loginDay = Number(value);
    },
    /**
     * 用户登录
     * @param data - 登录凭据
     * @returns 登录结果（包含用户信息和 token）
     */
    async loginByUsername(data: LoginDto): Promise<UserResult> {
      const result = await getLogin(data);
      if (result?.data) {
        setToken(result.data);
      }
      return result;
    },
    /** 前端登出（不调用接口） */
    logOut() {
      // 使用 $reset() 清理所有用户状态
      this.$reset();
      removeToken();
      useMultiTagsStoreHook().handleTags(
        "equal",
        toMultiTypeArray([...routerArrays])
      );
      resetRouter();
      router.push("/login");
    },
    /**
     * 刷新 Token
     * @param data - 包含 refreshToken 的对象
     * @returns 新的 token 信息
     */
    async handRefreshToken(data: RefreshTokenDto): Promise<RefreshTokenResult> {
      const result = await refreshTokenApi(data);
      if (result?.data) {
        setToken(result.data);
      }
      return result;
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
