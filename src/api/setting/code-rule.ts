import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const codeRulePrefix = "/code-rule/";

export async function getCodeRulesApi(params?: Record<string, unknown>) {
  return await http.request<CommonResult>("get", baseUrlApi(codeRulePrefix), {
    params
  });
}

export async function saveCodeRuleApi(data: Record<string, unknown>) {
  return await http.request<CommonResult>("post", baseUrlApi(codeRulePrefix), {
    data
  });
}

export async function updateCodeRuleApi(
  ruleId: string,
  data: Record<string, unknown>
) {
  return await http.request<CommonResult>(
    "patch",
    baseUrlApi(codeRulePrefix + ruleId),
    { data }
  );
}

export async function enableCodeRuleApi(ruleId: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(codeRulePrefix + ruleId + "/enable")
  );
}

export async function disableCodeRuleApi(ruleId: string) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(codeRulePrefix + ruleId + "/disable")
  );
}

export async function deleteCodeRuleApi(ruleId: string) {
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(codeRulePrefix + ruleId)
  );
}

export async function batchDeleteCodeRulesApi(ruleIds: string[]) {
  return await http.request<CommonResult>(
    "post",
    baseUrlApi(codeRulePrefix + "batch-delete"),
    { data: { ruleIds } }
  );
}
