// BOM表类型定义

export enum BomStatus {
  DRAFT = "draft",
  APPROVED = "approved",
  DISABLED = "disabled"
}

export const bomStatusMap: Record<
  BomStatus,
  { label: string; type: "info" | "success" | "danger" }
> = {
  [BomStatus.DRAFT]: { label: "草稿", type: "info" },
  [BomStatus.APPROVED]: { label: "已审核", type: "success" },
  [BomStatus.DISABLED]: { label: "已禁用", type: "danger" }
};

export interface BomComponent {
  id?: number;
  tireId: string;
  tireName?: string;
  tireBarcode?: string;
  quantity: number;
  estimatedCost?: number;
  remark?: string;
  _uid?: string;
}

export interface Bom {
  id: number;
  uid: string;
  name: string;
  code: string;
  targetTireId: string;
  targetTireName?: string;
  targetTireBarcode?: string;
  targetQuantity: number;
  status: BomStatus;
  isApproved: boolean;
  version?: string;
  estimatedMaterialCost?: number;
  remark?: string;
  components: BomComponent[];
  createdBy?: string;
  creatorName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBomDto {
  name: string;
  code?: string;
  targetTireId: string;
  targetQuantity: number;
  version?: string;
  remark?: string;
  components: (Omit<
    BomComponent,
    "id" | "tireName" | "tireBarcode" | "estimatedCost"
  > & { _uid?: string })[];
}

export type UpdateBomDto = Partial<CreateBomDto>;

export interface BomQuery {
  status?: BomStatus;
  targetTireId?: string;
  keyword?: string;
}
