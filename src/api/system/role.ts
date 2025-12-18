import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export type CompanyRoleItem = {
  uid: string;
  name: string;
  cn: string;
  desc?: string | null;
  level?: number | null;
  type?: number | null;
  status?: boolean | null;
};

export async function getRoleListApi() {
  return await http.request<CommonResult>("get", baseUrlApi("/role/page/0"));
}

export async function getRolesApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(`/role/page/${index}`),
    {
      params
    }
  );
}

export async function getOneRoleApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(`/role/${uid}`));
}

export async function getRoleMenusApi(uid: string, companyId?: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(`/role/${uid}/menus`),
    {
      params: companyId ? { companyId } : undefined
    }
  );
}

export async function setRoleMenusApi(
  uid: string,
  menuUids: string[],
  companyId?: string
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/role/${uid}/menus`),
    {
      data: { menuUids },
      params: companyId ? { companyId } : undefined
    }
  );
}

export async function createRoleApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi("/role"), {
    data
  });
}

export async function updateRoleApi(uid: string, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(`/role/${uid}`), {
    data
  });
}

export async function deleteRoleApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(`/role/${uid}`));
}
