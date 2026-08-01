import { http } from "../../utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const prefix = "/social-rate";

export interface SocialRateConfig {
  uid?: string;
  contributionBase: string | number;
  employeePensionBp: number;
  employeeMedicalBp: number;
  employeeUnemploymentBp: number;
  employeeInjuryBp: number;
  employeeBirthBp: number;
  employeeHousingBp: number;
  companyPensionBp: number;
  companyMedicalBp: number;
  companyUnemploymentBp: number;
  companyInjuryBp: number;
  companyBirthBp: number;
  companyHousingBp: number;
  effectiveFrom?: number | null;
}

export function getSocialRateApi() {
  return http.request<CommonResult<SocialRateConfig | null>>(
    "get",
    baseUrlApi(prefix)
  );
}

export function upsertSocialRateApi(data: SocialRateConfig) {
  return http.request<CommonResult<SocialRateConfig>>(
    "put",
    baseUrlApi(prefix),
    {
      data
    }
  );
}
