import type { WriteOffOrder } from "@/api/business/writeOff";

export type WriteOffStatusKey = "PENDING" | "APPROVED" | "REVERSED";

export function getWriteOffStatusKey(
  order: Pick<WriteOffOrder, "isApproved" | "isReversed">
): WriteOffStatusKey {
  if (order.isReversed) return "REVERSED";
  return order.isApproved ? "APPROVED" : "PENDING";
}
