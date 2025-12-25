import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/salary/";

export interface SalaryDto {
  name: string;
  base?: number;
  performance?: number;
  fulltimeAttendanceAward?: number;
  subsidy?: number;
  desc?: string;
}

export interface Salary extends SalaryDto {
  id: number;
  uid: string;
}

export async function getSalaryListApi(index: number, params?: object) {
  return await http.request<CommonResult<PaginatedResponseDto<Salary>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addSalaryApi(data: SalaryDto) {
  return await http.request<CommonResult<Salary>>("post", baseUrlApi(prefix), {
    data
  });
}

export async function getSalaryApi(uid: string) {
  return await http.request<CommonResult<Salary>>(
    "get",
    baseUrlApi(prefix + uid)
  );
}

export async function updateSalaryApi(uid: string, data: Partial<SalaryDto>) {
  return await http.request<CommonResult<Salary>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function deleteSalaryApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}
