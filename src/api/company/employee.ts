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
  jobs?: unknown[];
  user?: EmployeeUserDto;
}

export async function getAllEmployeeApi(params?: object) {
  return await http.request<CommonResult<Employee[]>>(
    "get",
    baseUrlApi(prefix),
    {
      params
    }
  );
}

export async function getEmployeeListApi(index: number, params?: object) {
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

/** 获取员工数量 */
export async function getEmployeeCountApi() {
  return await http.request<CommonResult<CountResponseDto>>(
    "get",
    baseUrlApi(prefix + "count")
  );
}
