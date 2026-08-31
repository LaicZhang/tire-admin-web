import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

const prefix = "/salary/";

/** Nested total components in fen (string or number from form). */
export interface SalaryTotalInput {
  base: string | number;
  performance: string | number;
  fulltimeAttendanceAward?: string | number;
  subsidy: string | number;
  other?: string | number;
}

export interface SalarySocialInput {
  pension?: string | number;
  medical?: string | number;
  unemployment?: string | number;
  fertility?: string | number;
  injury?: string | number;
  birth?: string | number;
  housing?: string | number;
  tax?: string | number;
}

/** Create payload aligned with BE CreateSalaryDto (monthly payroll). */
export interface CreateSalaryDto {
  employeeId: string;
  /** YYYYMM as number, e.g. 202607 */
  date: number;
  total?: SalaryTotalInput;
  eSocial?: SalarySocialInput;
  cSocial?: SalarySocialInput;
  /** Legacy FK path (optional when nested provided) */
  totalId?: number;
  eSocialInsuranceId?: number;
  cSocialInsuranceId?: number;
  payableWages?: string | number;
  actualWages?: string | number;
  desc?: string;
}

export type UpdateSalaryDto = Partial<CreateSalaryDto>;

export interface SalaryEmployeeSummary {
  uid?: string;
  name?: string;
}

export interface Salary {
  id: number;
  uid: string;
  employeeId: string;
  date: number;
  payableWages: string | number;
  actualWages: string | number;
  confirmedAt?: string | null;
  desc?: string | null;
  createAt?: string;
  updateAt?: string;
  employee?: SalaryEmployeeSummary | null;
  operator?: SalaryEmployeeSummary | null;
  total?: Record<string, unknown> | null;
  eSocial?: Record<string, unknown> | null;
  cSocial?: Record<string, unknown> | null;
}

export interface SalaryQuery {
  employeeId?: string;
  date?: number;
  operatorId?: string;
  scope?: "nonDeleted" | "deleted" | "all";
}

export async function getSalaryListApi(index: number, params?: SalaryQuery) {
  return await http.request<CommonResult<PaginatedResponseDto<Salary>>>(
    "get",
    baseUrlApi(prefix + "page/" + index),
    { params }
  );
}

export async function addSalaryApi(data: CreateSalaryDto) {
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

export async function updateSalaryApi(uid: string, data: UpdateSalaryDto) {
  return await http.request<CommonResult<Salary>>(
    "patch",
    baseUrlApi(prefix + uid),
    {
      data
    }
  );
}

export async function confirmSalaryApi(uid: string) {
  return await http.request<CommonResult<Salary>>(
    "post",
    baseUrlApi(prefix + uid + "/confirm")
  );
}

export async function deleteSalaryApi(uid: string) {
  return await http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(prefix + uid)
  );
}

export async function restoreSalaryApi(uid: string) {
  return await http.request<CommonResult<Salary>>(
    "post",
    baseUrlApi(prefix + uid + "/restore")
  );
}
