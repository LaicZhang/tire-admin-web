import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";

const codeRulePrefix = "/code-rule/";

/** 编码规则查询参数 */
export interface CodeRuleQueryDto {
  keyword?: string;
  type?: string;
  isEnabled?: boolean;
}

/** 编码规则 DTO */
export interface CodeRuleDto {
  name?: string;
  /** 目标类型：document=单据, basic=基础资料 */
  targetType?: "document" | "basic";
  /** 目标代码：如 purchase_order, product 等 */
  targetCode?: string;
  /** 编码前缀 */
  prefix?: string;
  /** 日期格式 */
  dateFormat?: string;
  /** 序号位数 */
  serialDigits?: number;
  /** 序号起始值 */
  serialStart?: number;
  /** 重置类型 */
  resetType?: "daily" | "monthly" | "quarterly" | "yearly";
  /** 自动填补空缺 */
  autoFillGap?: boolean;
  /** 允许手动编辑 */
  allowManualEdit?: boolean;
  /** 日期变化时重置 */
  resetOnDateChange?: boolean;
}

export async function getCodeRulesApi(params?: CodeRuleQueryDto) {
  return await http.request<CommonResult>("get", baseUrlApi(codeRulePrefix), {
    params
  });
}

export async function saveCodeRuleApi(data: CodeRuleDto) {
  return await http.request<CommonResult>("post", baseUrlApi(codeRulePrefix), {
    data
  });
}

export async function updateCodeRuleApi(
  ruleId: string,
  data: Partial<CodeRuleDto>
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
