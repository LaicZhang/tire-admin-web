import { fenToYuanNumber, yuanToFen } from "@/utils/formatMoney";
import type {
  CreateCostAdjustOrderDto,
  CreateCostAdjustDetailDto,
  CostAdjustOrder
} from "./types";
import type { CreateCostAdjustOrderDto as ApiCreateCostAdjustOrderDto } from "@/api/business/costAdjust";

export const toCostAdjustPayload = (
  formData: CreateCostAdjustOrderDto
): ApiCreateCostAdjustOrderDto => ({
  operatorId: formData.operatorId,
  reason: formData.reason,
  desc: formData.desc,
  details: formData.details.map(detail => ({
    repoId: detail.repoId,
    tireId: detail.tireId,
    originalCost: yuanToFen(detail.originalCost),
    adjustedCost: yuanToFen(detail.adjustedCost),
    count: detail.count,
    remark: detail.remark
  }))
});

type CostAdjustFormSource = {
  operatorId?: string;
  reason?: string;
  desc?: string;
  details?: Array<
    Pick<CreateCostAdjustDetailDto, "repoId" | "tireId" | "count"> & {
      _uid?: string;
    } & Partial<
        Pick<
          CreateCostAdjustDetailDto,
          "originalCost" | "adjustedCost" | "remark"
        >
      >
  >;
};

export const toCostAdjustFormData = (
  formData: CostAdjustFormSource | CostAdjustOrder
): CreateCostAdjustOrderDto => ({
  operatorId: "operatorId" in formData ? formData.operatorId || "" : "",
  reason: formData.reason || "",
  desc: formData.desc || "",
  details: (formData.details || []).map(detail => ({
    _uid: "_uid" in detail ? detail._uid : undefined,
    repoId: detail.repoId,
    tireId: detail.tireId,
    originalCost: fenToYuanNumber(Number(detail.originalCost || 0)),
    adjustedCost: fenToYuanNumber(Number(detail.adjustedCost || 0)),
    count: detail.count,
    remark: detail.remark
  }))
});
