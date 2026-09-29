import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("fund report route contract", () => {
  it("does not call the retired statement read routes directly", () => {
    const source = readFileSync(resolve(__dirname, "index.vue"), "utf8");

    expect(source).toContain("getFundFlowListApi");
    expect(source).toContain("getAccountBalanceApi");
    expect(source).toContain("getContactDebtListApi");
    expect(source).not.toMatch(/http\.get[\s\S]*\/statement/);
  });
});
