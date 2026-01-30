import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type {
  CommonResult,
  PaginatedResponseDto,
  CountResponseDto
} from "../type";

const prefix = "/employee/";

export interface EmployeeUserDto {
  username: string;
  phone?: string;
  email?: string;
  password?: string;
}

export interface EmployeeNameDto {
  name: string;
  nickname?: string;
  desc?: string;
  status?: number;
}

export interface EmployeeCreateDto {
  user: EmployeeUserDto;
  connectEmployeeDto: {
    jobs: unknown[];
    companyId: string;
  };
  name: EmployeeNameDto;
}

export interface EmployeeUpdateDto {
  user?: Partial<EmployeeUserDto>;
  name?: Partial<EmployeeNameDto>;
  jobs?: unknown[];
}

export interface Employee {
  id: number;
  uid: string;
  name: string;
  nickname?: string;
  desc?: string;
  status?: number;
  updateAt?: string;
  layoffAt?: string | null;
  deleteAt?: string | null;
  jobs?: unknown[];
  user?: EmployeeUserDto;
}

/** 员工查询参数 */
export interface EmployeeQueryDto {
  scope?: "active" | "nonDeleted" | "deleted" | "all";
  keyword?: string;
  name?: string;
  status?: number;
  jobId?: number;
  desc?: string;
}

export async function getAllEmployeeApi(params?: EmployeeQueryDto) {
  return await http.request<CommonResult<Employee[]>>(
    "get",
    baseUrlApi(prefix),
    {
      params
    }
  );
}

export async function getEmployeeListApi(
  index: number,
  params?: EmployeeQueryDto
) {
  return await http.request<CommonResult<PaginatedResponseDto<Employee>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addEmployeeApi(data: EmployeeCreateDto) {
  return await http.request<CommonResult<Employee>>(
    "post",
    baseUrlApi(prefix),
    {
      data
    }
  );
}

export async function getEmployeeApi(uid: string) {
  return await http.request<CommonResult<Employee>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateEmployeeApi(uid: string, data: EmployeeUpdateDto) {
  return await http.request<CommonResult<Employee>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function deleteEmployeeApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

export async function restoreEmployeeApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + uid + "/restore")
  );
}

export async function layoffEmployeeApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + uid + "/layoff")
  );
}

export async function reinstateEmployeeApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + uid + "/reinstate")
  );
}

export async function suspendEmployeeApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + uid + "/suspend")
  );
}

export async function unsuspendEmployeeApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "post",
    baseUrlApi(prefix + uid + "/unsuspend")
  );
}

/** 获取员工数量 */
export async function getEmployeeCountApi() {
  return await http.request<CommonResult<CountResponseDto>>(
    "get",
    baseUrlApi(prefix + "count")
  );
}
