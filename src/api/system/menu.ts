import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/menu";

export interface MenuDto {
  name: string;
  path?: string;
  parentId?: string;
  icon?: string;
  sort?: number;
}

export interface MenuItem extends MenuDto {
  uid: string;
  id: number;
  children?: MenuItem[];
}

export async function getMenuListApi(params?: object) {
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
