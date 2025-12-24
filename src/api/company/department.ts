import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/department/";

export async function getDepartmentListApi(index: number, params?: object) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addDepartmentApi(data: object) {
  return await http.request<CommonResult>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getDepartmentApi(uid: string) {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + uid));
}

export async function updateDepartmentApi(uid: string, data: object) {
  return await http.request<CommonResult>("patch", baseUrlApi(prefix + uid), {
    data
  });
}

export async function deleteDepartmentApi(uid: string) {
  return await http.request<CommonResult>("delete", baseUrlApi(prefix + uid));
}

export async function getDepartmentWithEmpApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + "with-employee")
  );
}

// ============ 部门角色管理 ============

/** 获取部门角色 */
export async function getDepartmentRolesApi(uid: string) {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(prefix + `${uid}/roles`)
  );
}

/** 分配部门角色 */
export async function setDepartmentRolesApi(uid: string, roleUids: string[]) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(prefix + `${uid}/roles`),
    { data: { roleUids } }
  );
}

/** 移除部门角色 */
export async function removeDepartmentRolesApi(
  uid: string,
  roleUids: string[]
) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(prefix + `${uid}/roles`),
    { data: { roleUids } }
  );
}

/** 获取部门数量 */
export async function getDepartmentCountApi() {
  return await http.request<CommonResult>("get", baseUrlApi(prefix + "count"));
}
