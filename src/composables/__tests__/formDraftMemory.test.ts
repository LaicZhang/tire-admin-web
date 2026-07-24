import { describe, expect, it } from "vitest";
import {
  applyFormDraftHeader,
  FORM_DRAFT_TTL_MS,
  isFormDraftExpired,
  sanitizeFormDraft
} from "../formDraftMemory";

describe("sanitizeFormDraft", () => {
  it("keeps whitelist header and line qty/ids only", () => {
    const payload = sanitizeFormDraft(
      {
        customerId: "c1",
        customerName: " Cust ",
        amount: 99900,
        password: "secret",
        bankAccount: "6222",
        details: [
          {
            tireId: "t1",
            tireName: "Tire A",
            qty: 4,
            price: 100,
            amount: 400
          },
          { tireId: "t2", count: 2, unitCost: 50 }
        ],
        remark: "  call back  "
      },
      1000
    );
    expect(payload).toEqual({
      savedAt: 1000,
      header: { customerId: "c1", customerName: "Cust" },
      lines: [
        { tireId: "t1", tireName: "Tire A", qty: 4 },
        { tireId: "t2", count: 2 }
      ],
      remark: "call back"
    });
  });

  it("returns null for empty sensitive-only payload", () => {
    expect(
      sanitizeFormDraft({ amount: 1, password: "x", details: [{ price: 1 }] })
    ).toBeNull();
  });
});

describe("isFormDraftExpired", () => {
  it("expires after TTL", () => {
    const payload = sanitizeFormDraft({ customerId: "c1" }, 0)!;
    expect(isFormDraftExpired(payload, FORM_DRAFT_TTL_MS - 1)).toBe(false);
    expect(isFormDraftExpired(payload, FORM_DRAFT_TTL_MS + 1)).toBe(true);
  });
});

describe("applyFormDraftHeader", () => {
  it("prefer mode does not overwrite filled fields", () => {
    const target: Record<string, unknown> = {
      customerId: "existing",
      repoId: ""
    };
    applyFormDraftHeader(
      target,
      {
        savedAt: 1,
        header: { customerId: "draft", repoId: "r1" },
        lines: [],
        remark: "hi"
      },
      "prefer"
    );
    expect(target.customerId).toBe("existing");
    expect(target.repoId).toBe("r1");
    expect(target.remark).toBe("hi");
  });
});
