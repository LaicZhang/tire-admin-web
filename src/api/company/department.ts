import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type {
  CommonResult,
  PaginatedResponseDto,
  CountResponseDto
} from "../type";

const prefix = "/department/";

export interface DepartmentDto {
  name: string;
  desc?: string;
  parentId?: string;
  company?: { connect: { uid: string } };
  managers?: { connect: Array<{ uid: string }> };
  employees?: { connect: Array<{ uid: string }> };
}

export type DepartmentCreateDto = DepartmentDto;

export interface Department extends Omit<
  DepartmentDto,
  "managers" | "employees" | "company"
> {
  id: number;
  uid: string;
  employees?: Array<{
    id: number;
    uid: string;
    name: string;
  }>;
}

export async function getDepartmentListApi(
  index: number,
  params?: Record<string, unknown>
) {
  return await http.request<CommonResult<PaginatedResponseDto<Department>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addDepartmentApi(data: DepartmentCreateDto) {
  return await http.request<CommonResult<Department>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function getDepartmentApi(uid: string) {
  return await http.request<CommonResult<Department>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateDepartmentApi(
  uid: string,
  data: Partial<DepartmentCreateDto>
) {
  return await http.request<CommonResult<Department>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function deleteDepartmentApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

export async function getDepartmentWithEmpApi() {
  return await http.request<CommonResult<Department[]>>(
    "get",
    baseUrlApi(prefix + "with-employee")
  );
}

// ============ 部门角色管理 ============

/** 获取部门角色 */
export async function getDepartmentRolesApi(uid: string) {
  return await http.request<CommonResult<string[]>>(
    "get",
    baseUrlApi(prefix + `${uid}/roles`)
  );
}

/** 分配部门角色 */
export async function setDepartmentRolesApi(uid: string, roleUids: string[]) {
  return await http.request<CommonResult<void>>(
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
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + `${uid}/roles`),
    { data: { roleUids } }
  );
}

/** 获取部门数量 */
export async function getDepartmentCountApi() {
  return await http.request<CommonResult<CountResponseDto>>(
    "get",
    baseUrlApi(prefix + "count")
  );
}
