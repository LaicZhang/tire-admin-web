// 拆卸单类型定义

export enum DisassemblyOrderStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed"
}

export const disassemblyOrderStatusMap: Record<
  DisassemblyOrderStatus,
  { label: string; type: "info" | "warning" | "success" | "danger" }
> = {
  [DisassemblyOrderStatus.DRAFT]: { label: "草稿", type: "info" },
  [DisassemblyOrderStatus.PENDING]: { label: "待审核", type: "warning" },
  [DisassemblyOrderStatus.APPROVED]: { label: "已审核", type: "success" },
  [DisassemblyOrderStatus.REJECTED]: { label: "已拒绝", type: "danger" },
  [DisassemblyOrderStatus.COMPLETED]: { label: "已完成", type: "success" }
};

export interface DisassemblyComponent {
  id?: number;
  tireId: string;
  tireName?: string;
  tireBarcode?: string;
  repoId?: string;
  repoName?: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  remark?: string;
  _uid?: string;
}

export interface DisassemblyOrder {
  id: number;
  uid: string;
  orderNumber?: string;
  sourceTireId: string;
  sourceTireName?: string;
  sourceTireBarcode?: string;
  sourceRepoId?: string;
  sourceRepoName?: string;
  quantity: number;
  disassemblyFee: number;
  autoAllocateCost: boolean;
  status: DisassemblyOrderStatus;
  isApproved: boolean;
  isLocked: boolean;
  operatorId?: string;
  operatorName?: string;
  auditorId?: string;
  auditorName?: string;
  orderDate?: string;
  bomId?: string;
  remark?: string;
  components: DisassemblyComponent[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDisassemblyOrderDto {
  sourceTireId: string;
  sourceRepoId: string;
  quantity: number;
  disassemblyFee?: number;
  autoAllocateCost?: boolean;
  orderDate?: string;
  bomId?: string;
  remark?: string;
  components: (Omit<
    DisassemblyComponent,
    "id" | "tireName" | "tireBarcode" | "repoName" | "totalCost"
  > & { _uid?: string })[];
}

export type UpdateDisassemblyOrderDto = Partial<CreateDisassemblyOrderDto>;

export interface DisassemblyOrderQuery {
  status?: DisassemblyOrderStatus;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}
