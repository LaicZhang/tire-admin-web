export type ReceiptStatus = "ACTIVE" | "EXHAUSTED";

export interface ReceiptQueryParams {
  customerName?: string;
  status?: ReceiptStatus;
}

export const RECEIPT_STATUS_OPTIONS: {
  label: string;
  value: ReceiptStatus;
  type: "info" | "success";
}[] = [
  { label: "可用", value: "ACTIVE", type: "success" },
  { label: "已用完", value: "EXHAUSTED", type: "info" }
];

export function calcReceiptStatus(remainingAmount: string): ReceiptStatus {
  try {
    return BigInt(remainingAmount || "0") > 0n ? "ACTIVE" : "EXHAUSTED";
  } catch {
    return "EXHAUSTED";
  }
}

export function getStatusInfo(status: ReceiptStatus): {
  label: string;
  type: "info" | "success";
} {
  const option = RECEIPT_STATUS_OPTIONS.find(o => o.value === status);
  return option || { label: "未知", type: "info" };
}
