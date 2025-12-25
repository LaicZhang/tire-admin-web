import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type {
  CommonResult,
  PaginatedResponseDto,
  CountResponseDto
} from "../type";

const prefix = "/employee/";

export interface EmployeeDto {
  name: string;
  phone?: string;
  email?: string;
  departmentId?: string;
  positionId?: string;
  salaryId?: string;
}

export interface Employee extends EmployeeDto {
  id: number;
  uid: string;
  department?: { name: string };
  position?: { name: string };
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

export async function addEmployeeApi(data: EmployeeDto) {
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

export async function updateEmployeeApi(
  uid: string,
  data: Partial<EmployeeDto>
) {
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
