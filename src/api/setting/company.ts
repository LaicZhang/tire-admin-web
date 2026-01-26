import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const companyPrefix = "/company/";

/** 公司信息 DTO */
export interface CompanyInfoDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  desc?: string;
  principalName?: string;
  principalPhone?: string;
}

export async function getCompanyInfoApi() {
  return await http.request<CommonResult<CompanyInfoDto>>(
    "get",
    baseUrlApi(companyPrefix + "info")
  );
}

export async function updateCompanyInfoApi(data: CompanyInfoDto) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(companyPrefix + "info"),
    {
      data
    }
  );
}

export async function uploadCompanyLogoApi(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(companyPrefix + "logo"),
    { data: formData }
  );
}
