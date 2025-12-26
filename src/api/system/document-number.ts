import { http } from "@/utils/http";

// 单据类型枚举
export const DocumentTypeOptions = [
  { value: "SALE", label: "销售订单" },
  { value: "PURCHASE", label: "采购订单" },
  { value: "RETURN", label: "退货单" },
  { value: "CLAIM", label: "理赔单" },
  { value: "TRANSFER", label: "调拨单" },
  { value: "WASTE", label: "报废单" },
  { value: "SURPLUS", label: "盘盈单" },
  { value: "ASSEMBLY", label: "组装单" },
  { value: "EXPENSE", label: "费用单" },
  { value: "COST_ADJUST", label: "成本调整单" },
  { value: "WRITE_OFF", label: "核销单" }
];

export interface DocumentNumberRule {
  uid: string;
  companyId: string;
  documentType: string;
  prefix: string;
  dateFormat?: string;
  sequenceDigits: number;
  separator?: string;
  resetDaily: boolean;
  resetMonthly: boolean;
  resetYearly: boolean;
  example?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertDocumentNumberRuleDto {
  documentType: string;
  prefix: string;
  dateFormat?: string;
  sequenceDigits?: number;
  separator?: string;
  resetDaily?: boolean;
  resetMonthly?: boolean;
  resetYearly?: boolean;
}

// 获取所有规则
export const getDocumentNumberRulesApi = () => {
  return http.request<{ data: DocumentNumberRule[]; code: number }>(
    "get",
    "/api/document-number/rules"
  );
};

// 获取单个规则
export const getDocumentNumberRuleApi = (documentType: string) => {
  return http.request<{ data: DocumentNumberRule; code: number }>(
    "get",
    `/api/document-number/rule/${documentType}`
  );
};

// 创建或更新规则
export const upsertDocumentNumberRuleApi = (
  data: UpsertDocumentNumberRuleDto
) => {
  return http.request<{ data: DocumentNumberRule; code: number }>(
    "post",
    "/api/document-number/rule",
    { data }
  );
};

// 删除规则
export const deleteDocumentNumberRuleApi = (documentType: string) => {
  return http.request<{ data: any; code: number }>(
    "delete",
    `/api/document-number/rule/${documentType}`
  );
};
