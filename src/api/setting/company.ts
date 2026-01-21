import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const companyPrefix = "/company/";

export async function getCompanyInfoApi() {
  return await http.request<CommonResult>(
    "get",
    baseUrlApi(companyPrefix + "info")
  );
}

export async function updateCompanyInfoApi(data: Record<string, unknown>) {
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
