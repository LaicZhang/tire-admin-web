export type AdvanceReceiptStatus = "ACTIVE" | "EXHAUSTED";

export function calcAdvanceReceiptStatus(
  remainingAmount: string
): AdvanceReceiptStatus {
  try {
    return BigInt(remainingAmount || "0") > 0n ? "ACTIVE" : "EXHAUSTED";
  } catch {
    return "EXHAUSTED";
  }
}
