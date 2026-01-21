import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export async function getPermissionUsersApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/permission/users"),
    {
      params
    }
  );
}

export async function getPermissionRolesApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi("/permission/roles")
  );
}

export async function savePermissionUserApi(data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/permission/users"),
    {
      data
    }
  );
}

export async function deletePermissionUserApi(userId: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi("/permission/users/" + userId)
  );
}

export async function saveRolePermissionsApi(
  roleId: string,
  permissions: string[]
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi("/permission/roles/" + roleId),
    { data: { permissions } }
  );
}

export async function createRoleApi(data: object) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/permission/roles"),
    {
      data
    }
  );
}

export async function deleteRoleApi(roleId: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi("/permission/roles/" + roleId)
  );
}
