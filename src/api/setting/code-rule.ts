import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult } from "../type";
import { unsupportedBackendRoute } from "../route-gap";

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

const DOCUMENT_TYPES = new Set([
  "SALE",
  "PURCHASE",
  "PURCHASE_INBOUND",
  "RETURN",
  "CLAIM",
  "TRANSFER",
  "WASTE",
  "SURPLUS",
  "ASSEMBLY",
  "EXPENSE",
  "COST_ADJUST",
  "WRITE_OFF",
  "SALE_QUOTATION",
  "SALE_CONTRACT",
  "PURCHASE_CONTRACT"
]);

function asDocumentType(value: unknown): string | null {
  return typeof value === "string" && DOCUMENT_TYPES.has(value) ? value : null;
}

function resolveDocumentType(
  data: Partial<CodeRuleDto>,
  fallbackId?: string
): string | null {
  if (data.targetCode) return asDocumentType(data.targetCode);
  return asDocumentType(fallbackId);
}

function ruleBody(documentType: string, data: Partial<CodeRuleDto>) {
  const body: {
    documentType: string;
    prefix: string;
    dateFormat?: string;
    sequenceDigits?: number;
    separator?: string;
    resetDaily?: boolean;
    resetMonthly?: boolean;
    resetYearly?: boolean;
  } = {
    documentType,
    prefix: data.prefix ?? ""
  };
  if (typeof data.dateFormat === "string" && data.dateFormat) {
    body.dateFormat = data.dateFormat;
  }
  if (typeof data.serialDigits === "number") {
    body.sequenceDigits = data.serialDigits;
  }
  const separator = (data as { separator?: unknown }).separator;
  if (typeof separator === "string" && separator) body.separator = separator;
  if (data.resetType === "daily") body.resetDaily = true;
  if (data.resetType === "monthly") body.resetMonthly = true;
  if (data.resetType === "yearly") body.resetYearly = true;
  return body;
}

function mapResetType(row: {
  resetDaily?: unknown;
  resetMonthly?: unknown;
  resetYearly?: unknown;
}) {
  if (row.resetDaily === true) return "daily" as const;
  if (row.resetMonthly === true) return "monthly" as const;
  if (row.resetYearly === true) return "yearly" as const;
  return undefined;
}

function mapRuleRow(row: Record<string, unknown>) {
  const documentType =
    typeof row.documentType === "string" ? row.documentType : "";
  return {
    ...row,
    uid: documentType,
    targetCode: documentType,
    targetType: "document" as const,
    serialDigits:
      typeof row.sequenceDigits === "number" ? row.sequenceDigits : undefined,
    resetType: mapResetType(row)
  };
}

async function upsertCodeRule(data: Partial<CodeRuleDto>, fallbackId?: string) {
  const documentType = resolveDocumentType(data, fallbackId);
  if (!documentType || typeof data.prefix !== "string" || !data.prefix) {
    return unsupportedBackendRoute("POST /document-number/rule");
  }
  return await http.request<CommonResult>(
    "post",
    baseUrlApi("/document-number/rule"),
    { data: ruleBody(documentType, data) }
  );
}

/** 后端是 GET /document-number/rules，不是 /code-rule。 */
export async function getCodeRulesApi(_params?: CodeRuleQueryDto) {
  const result = await http.request<CommonResult<unknown>>(
    "get",
    baseUrlApi("/document-number/rules")
  );
  const raw = result.data;
  const rows = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === "object" &&
        Array.isArray((raw as { list?: unknown }).list)
      ? (raw as { list: unknown[] }).list
      : [];
  return {
    ...result,
    data: rows.map(row =>
      row && typeof row === "object"
        ? mapRuleRow(row as Record<string, unknown>)
        : row
    )
  };
}

export async function saveCodeRuleApi(data: CodeRuleDto) {
  return upsertCodeRule(data);
}

export async function updateCodeRuleApi(
  ruleId: string,
  data: Partial<CodeRuleDto>
) {
  return upsertCodeRule(data, ruleId);
}

/** 后端没有启用/停用路由。 */
export async function enableCodeRuleApi(_ruleId: string) {
  return unsupportedBackendRoute("POST /code-rule/:id/enable");
}

export async function disableCodeRuleApi(_ruleId: string) {
  return unsupportedBackendRoute("POST /code-rule/:id/disable");
}

export async function deleteCodeRuleApi(ruleId: string) {
  const documentType = asDocumentType(ruleId);
  if (!documentType) {
    return unsupportedBackendRoute(`DELETE /document-number/rule/${ruleId}`);
  }
  return await http.request<CommonResult>(
    "delete",
    baseUrlApi(`/document-number/rule/${documentType}`)
  );
}

export async function batchDeleteCodeRulesApi(_ruleIds: string[]) {
  return unsupportedBackendRoute("POST /code-rule/batch-delete");
}
