export interface TransferOrderDetail {
  id?: number;
  uid?: string;
  tireId: string;
  tireName?: string;
  count: number;
  isShipped?: boolean;
  isArrival?: boolean;
}

export interface TransferOrder {
  id?: number;
  uid: string;
  number?: string;
  docNo?: string;
  fromRepositoryId: string;
  toRepositoryId: string;
  fromRepository?: { uid: string; name: string };
  toRepository?: { uid: string; name: string };
  operatorId?: string;
  operator?: { uid: string; name: string };
  auditorId: string;
  auditor?: { uid: string; name: string };
  desc?: string | null;
  isApproved: boolean;
  isLocked: boolean;
  rejectReason?: string | null;
  details: TransferOrderDetail[];
  createAt?: string;
  auditAt?: string;
  updateAt?: string;
}

export interface TransferOrderQuery {
  fromRepositoryId?: string;
  toRepositoryId?: string;
  auditorId?: string;
  isApproved?: boolean;
  keyword?: string;
}

export type AuditStatus = "PENDING" | "APPROVED" | "REJECTED";

export function getAuditStatus(order: TransferOrder): AuditStatus {
  if (order.isApproved) return "APPROVED";
  if (order.rejectReason) return "REJECTED";
  return "PENDING";
}

export function getAuditStatusInfo(status: AuditStatus): {
  label: string;
  type: "info" | "warning" | "success" | "danger";
} {
  switch (status) {
    case "APPROVED":
      return { label: "已审核", type: "success" };
    case "REJECTED":
      return { label: "已拒绝", type: "danger" };
    default:
      return { label: "待审核", type: "warning" };
  }
}

export type LogisticsStatus = "PENDING_SHIP" | "SHIPPED" | "ARRIVED";

export function getLogisticsStatus(order: TransferOrder): LogisticsStatus {
  const details = order.details || [];
  if (details.length === 0) return "PENDING_SHIP";
  if (details.every(d => d.isArrival)) return "ARRIVED";
  if (details.some(d => d.isShipped)) return "SHIPPED";
  return "PENDING_SHIP";
}

export function getLogisticsStatusInfo(status: LogisticsStatus): {
  label: string;
  type: "info" | "warning" | "success";
} {
  switch (status) {
    case "ARRIVED":
      return { label: "已到货", type: "success" };
    case "SHIPPED":
      return { label: "已发货", type: "warning" };
    default:
      return { label: "待发货", type: "info" };
  }
}
