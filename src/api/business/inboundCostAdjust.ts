import { http } from "@/utils/http";

export type InboundCostAdjustSourceType = "ASSEMBLY" | "OTHER_INBOUND";

export interface InboundCostAdjustDetail {
  repoId: string;
  repoName?: string;
  tireId: string;
  tireName?: string;
  count: number;
  unitPrice: string;
}

export interface InboundCostAdjustItem {
  uid: string;
  billNo: string;
  sourceType: InboundCostAdjustSourceType;
  sourceTypeLabel: string;
  status: string;
  operatorName?: string;
  createdAt?: string;
  totalCost: string;
  details: InboundCostAdjustDetail[];
}

export const getInboundCostAdjustListApi = (
  index: number,
  params?: {
    sourceType?: InboundCostAdjustSourceType;
    keyword?: string;
    pageSize?: number;
  }
) => {
  return http.request<{
    data: { count: number; list: InboundCostAdjustItem[] };
    code: number;
  }>("get", `/api/v1/inbound-cost-adjust/page/${index}`, { params });
};

export const saveInboundCostAdjustApi = (
  sourceType: InboundCostAdjustSourceType,
  uid: string,
  details: Array<{
    repoId: string;
    tireId: string;
    count: number;
    unitPrice: number;
  }>
) => {
  return http.request<{ data: InboundCostAdjustItem; code: number }>(
    "post",
    `/api/v1/inbound-cost-adjust/${sourceType}/${uid}/save`,
    {
      data: { details }
    }
  );
};
