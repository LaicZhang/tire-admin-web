import { describe, expect, it } from "vitest";
import * as inventoryCheckApi from "../business/inventory-check";

describe("inventory check write contract", () => {
  it("uses the audited task workflow without the legacy complete route", () => {
    const exports = inventoryCheckApi as Record<string, unknown>;
    expect(exports.auditInventoryCheckTaskApi).toBeTypeOf("function");
    expect(exports.completeInventoryCheckTaskApi).toBeUndefined();
  });
});
