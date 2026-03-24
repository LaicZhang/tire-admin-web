// 盘点单类型定义

export enum StocktakingStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export const stocktakingStatusMap: Record<
  StocktakingStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  [StocktakingStatus.IN_PROGRESS]: { label: "进行中", type: "warning" },
  [StocktakingStatus.COMPLETED]: { label: "已完成", type: "success" },
  [StocktakingStatus.CANCELLED]: { label: "已取消", type: "info" }
};

export interface StocktakingDetail {
  id: number;
  taskId: number;
  tireId: string;
  tireName?: string;
  tireBarcode?: string;
  bookCount: number;
  actualCount?: number;
  difference?: number;
  reasonCode?: string | null;
  remark?: string;
  bookSerialNos?: string[];
  actualSerialNos?: string[];
  bookSerialNosText?: string;
  actualSerialNosText?: string;
}

export interface StocktakingTask {
  id: number;
  uid: string;
  companyId: string;
  repoId: string;
  repoName?: string;
  name?: string;
  status: StocktakingStatus;
  mode?: "quantity" | "serial";
  isAudited?: boolean;
  resultSavedAt?: string;
  auditedAt?: string;
  auditedBy?: string;
  surplusOrderUid?: string;
  wasteOrderUid?: string;
  startedAt: string;
  completedAt?: string;
  createdBy: string;
  creatorName?: string;
  remark?: string;
  createdAt: string;
  repo?: {
    uid: string;
    name: string;
  };
  details?: StocktakingDetail[];
}

export interface CreateStocktakingDto {
  repoId: string;
  name?: string;
  mode?: "quantity" | "serial";
  tireIds?: string[];
  includeZeroStock?: boolean;
  remark?: string;
}

export interface UpdateStocktakingDetailDto {
  details: {
    detailId: number;
    actualCount: number;
    reasonCode?: string;
    remark?: string;
    actualSerialNos?: string[];
  }[];
}

export const stocktakingReasonCodeOptions = [
  { label: "未记入入库", value: "UNRECORDED_INBOUND" },
  { label: "未记入出库", value: "UNRECORDED_OUTBOUND" },
  { label: "库存错放", value: "MISPLACED_STOCK" },
  { label: "盘点误差", value: "COUNTING_ERROR" },
  { label: "丢失/损坏", value: "LOSS_DAMAGE" },
  { label: "其他", value: "OTHER" }
] as const;

export function getStocktakingReasonCodeLabel(value?: string | null): string {
  if (!value) return "-";
  return (
    stocktakingReasonCodeOptions.find(item => item.value === value)?.label ||
    value
  );
}

export interface StocktakingQuery {
  status?: StocktakingStatus;
  repoId?: string;
  startDate?: string;
  endDate?: string;
}

export interface StocktakingResult {
  task: StocktakingTask;
  surplusOrderId?: string;
  wasteOrderId?: string;
}
