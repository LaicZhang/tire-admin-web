import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/menu";

export interface MenuDto {
  /** 菜单类型（0代表菜单、1代表iframe、2代表外链、3代表按钮） */
  code?: number;
  parentId?: string;
  /** 菜单名称（pure-admin 字段为 title） */
  title?: string;
  /** 菜单图标 */
  icon?: string;
  /** 路由路径 */
  path?: string;
  /** 组件路径 */
  component?: string;
  /** 排序（pure-admin 字段为 rank） */
  rank?: number;
  /** auths */
  auths?: string;
  /** iframe 链接 */
  frameSrc?: string;
  /** 路由重定向 */
  redirect?: string;
  /** 角色约束（后端 Menu.roles 字段，字符串） */
  roles?: string;
  /** 是否显示 */
  showLink?: boolean;
  /** 后端字段：是否显示 */
  isShow?: boolean;
  /** 是否缓存 */
  keepAlive?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 是否固定标签页 */
  fixedTag?: boolean;
  /** 是否隐藏标签页 */
  hiddenTag?: boolean;
  /** Enter transition */
  enterTransition?: string;
  /** Leave transition */
  leaveTransition?: string;

  /** 兼容旧字段 */
  name?: string;
  sort?: number;
}

export interface MenuItem extends MenuDto {
  uid: string;
  id: number;
  deleteAt?: string | null;
  children?: MenuItem[];
}

function toBackendMenuDto(input: MenuDto): Record<string, unknown> {
  return {
    code: input.code,
    parentId: input.parentId,
    name: input.name,
    title: input.title,
    path: input.path,
    icon: input.icon,
    component: input.component,
    rank: input.rank,
    redirect: input.redirect,
    frameSrc: input.frameSrc,
    auths: input.auths,
    isShow: input.showLink ?? input.isShow,
    roles: input.roles
  };
}

function normalizeMenuItem(item: MenuItem): MenuItem {
  const isShow = item.isShow ?? item.showLink;
  return {
    ...item,
    showLink: typeof isShow === "boolean" ? isShow : item.showLink
  };
}

export async function getMenuListApi(params?: Record<string, unknown>) {
  const res = await http.request<CommonResult<MenuItem[]>>(
    "get",
    baseUrlApi(`${prefix}/list`),
    {
      params
    }
  );
  return {
    ...res,
    data: Array.isArray(res.data) ? res.data.map(normalizeMenuItem) : res.data
  };
}

export async function createMenuApi(data: MenuDto) {
  const res = await http.request<CommonResult<MenuItem>>(
    "post",
    baseUrlApi(prefix),
    {
      data: toBackendMenuDto(data)
    }
  );
  return {
    ...res,
    data: res.data ? normalizeMenuItem(res.data) : res.data
  };
}

export async function updateMenuApi(uid: string, data: Partial<MenuDto>) {
  const res = await http.request<CommonResult<MenuItem>>(
    "patch",
    baseUrlApi(`${prefix}/${uid}`),
    {
      data: toBackendMenuDto(data)
    }
  );
  return {
    ...res,
    data: res.data ? normalizeMenuItem(res.data) : res.data
  };
}

export async function deleteMenuApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

export async function restoreMenuApi(uid: string) {
  const res = await http.request<CommonResult<MenuItem>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/restore`)
  );
  return {
    ...res,
    data: res.data ? normalizeMenuItem(res.data) : res.data
  };
}
