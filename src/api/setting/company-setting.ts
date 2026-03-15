import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

export interface CompanySettingItem {
  group: string;
  key: string;
  value: string;
  displayName?: string;
  description?: string;
  defaultValue?: string;
}

export async function getCompanySettingGroupApi(group: string) {
  return await http.request<CommonResult<CompanySettingItem[]>>(
    "get",
    baseUrlApi(`/company-setting/group/${group}`)
  );
}

export async function patchCompanySettingGroupApi(
  group: string,
  settings: Record<string, unknown>
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(`/company-setting/group/${group}`),
    { data: { settings } }
  );
}
