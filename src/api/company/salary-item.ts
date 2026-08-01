import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/salary-item/";

export type SalaryItemCategory = "EARNING" | "DEDUCTION" | "EMPLOYER_COST";
export type SalaryItemCalcKind = "INPUT" | "FORMULA";

export interface SalaryItemDefinition {
  uid: string;
  code: string;
  name: string;
  category: SalaryItemCategory;
  calcKind: SalaryItemCalcKind;
  formula?: string | null;
  sort: number;
  active: boolean;
  isSystem: boolean;
}

export interface CreateSalaryItemInput {
  code: string;
  name: string;
  category: SalaryItemCategory;
  calcKind: SalaryItemCalcKind;
  formula?: string;
  sort?: number;
  active?: boolean;
}

export type UpdateSalaryItemInput = Partial<
  Omit<CreateSalaryItemInput, "code">
> & { active?: boolean };

export function getSalaryItemsApi(params?: { activeOnly?: boolean }) {
  return http.request<CommonResult<SalaryItemDefinition[]>>(
    "get",
    baseUrlApi(prefix),
    { params }
  );
}

export function createSalaryItemApi(data: CreateSalaryItemInput) {
  return http.request<CommonResult<SalaryItemDefinition>>(
    "post",
    baseUrlApi(prefix),
    { data }
  );
}

export function updateSalaryItemApi(uid: string, data: UpdateSalaryItemInput) {
  return http.request<CommonResult<SalaryItemDefinition>>(
    "patch",
    baseUrlApi(`${prefix}${uid}`),
    { data }
  );
}

export function deleteSalaryItemApi(uid: string) {
  return http.request<CommonResult<void>>(
    "delete",
    baseUrlApi(`${prefix}${uid}`)
  );
}

export function dryRunSalaryFormulaApi(data: {
  code: string;
  formula: string;
  inputs?: Record<string, number | string>;
}) {
  return http.request<CommonResult<{ amount: string }>>(
    "post",
    baseUrlApi(`${prefix}dry-run`),
    { data }
  );
}
