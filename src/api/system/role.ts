import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";

export type CompanyRoleItem = {
  uid: string;
  name: string;
  cn: string;
  desc?: string | null;
  level?: number | null;
  type?: number | null;
  status?: boolean | null;
  deleteAt?: string | null;
};

function getCompanyId() {
  return useCurrentCompanyStoreHook().companyId;
}

export interface RoleDto {
  cn: string;
  name: string;
  desc?: string | null;
  status?: boolean | null;
  level?: number | null;
  type?: number | null;
  company?: { connect: { uid: string } };
}

export async function getRoleListApi() {
  return await http.request<
    CommonResult<PaginatedResponseDto<CompanyRoleItem>>
  >("get", baseUrlApi("/role/page/0"));
}

export async function getRolesApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<
    CommonResult<PaginatedResponseDto<CompanyRoleItem>>
  >("get", baseUrlApi(`/role/page/${index}`), {
    params
  });
}

export async function getOneRoleApi(uid: string) {
  return await http.request<CommonResult<CompanyRoleItem>>(
    "get",
    baseUrlApi(`/role/${uid}`)
  );
}

export async function getRoleMenusApi(uid: string, companyId?: string) {
  return await http.request<CommonResult<string[]>>(
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
  return await http.request<CommonResult<void>>(
    "patch",
    baseUrlApi(`/role/${uid}/menus`),
    {
      data: { menuUids },
      params: companyId ? { companyId } : undefined
    }
  );
}

export async function createRoleApi(data: RoleDto) {
  return await http.request<CommonResult<CompanyRoleItem>>(
    "post",
    baseUrlApi("/role"),
    {
      data: {
        ...data,
        company: data.company ?? { connect: { uid: getCompanyId() } }
      }
    }
  );
}

export async function updateRoleApi(uid: string, data: Partial<RoleDto>) {
  return await http.request<CommonResult<CompanyRoleItem>>(
    "patch",
    baseUrlApi(`/role/${uid}`),
    {
      data
    }
  );
}

export async function deleteRoleApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`/role/${uid}`)
  );
}

export async function restoreRoleApi(uid: string) {
  return await http.request<CommonResult<CompanyRoleItem>>(
    "post",
    baseUrlApi(`/role/${uid}/restore`)
  );
}
