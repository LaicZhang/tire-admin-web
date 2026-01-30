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
  /** 是否显示 */
  showLink?: boolean;
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

export async function getMenuListApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult<MenuItem[]>>(
    "get",
    baseUrlApi(`${prefix}/list`),
    {
      params
    }
  );
}

export async function createMenuApi(data: MenuDto) {
  return await http.request<CommonResult<MenuItem>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function updateMenuApi(uid: string, data: Partial<MenuDto>) {
  return await http.request<CommonResult<MenuItem>>(
    "patch",
    baseUrlApi(`${prefix}/${uid}`),
    {
      data
    }
  );
}

export async function deleteMenuApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}/${uid}`)
  );
}

export async function restoreMenuApi(uid: string) {
  return await http.request<CommonResult<MenuItem>>(
    "post",
    baseUrlApi(`${prefix}/${uid}/restore`)
  );
}
