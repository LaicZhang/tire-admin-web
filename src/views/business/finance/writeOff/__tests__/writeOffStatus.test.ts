import { describe, expect, it } from "vitest";
import { getWriteOffStatusKey } from "../writeOffStatus";

describe("writeOffStatus", () => {
  it("returns PENDING when not approved", () => {
    expect(getWriteOffStatusKey({ isApproved: false, isReversed: false })).toBe(
      "PENDING"
    );
  });

  it("returns APPROVED when approved and not reversed", () => {
    expect(getWriteOffStatusKey({ isApproved: true, isReversed: false })).toBe(
      "APPROVED"
    );
  });

  it("returns REVERSED when reversed", () => {
    expect(getWriteOffStatusKey({ isApproved: true, isReversed: true })).toBe(
      "REVERSED"
    );
    expect(getWriteOffStatusKey({ isApproved: false, isReversed: true })).toBe(
      "REVERSED"
    );
  });
});
