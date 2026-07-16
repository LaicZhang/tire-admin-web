import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as reserveApi from "../business/reserve";

describe("reserve write contract", () => {
  it("exposes reserve as read-only inventory projection", () => {
    const exports = reserveApi as Record<string, unknown>;
    expect(exports.stockTakingApi).toBeUndefined();
    expect(exports.batchStockTakingApi).toBeUndefined();
  });

  it("does not expose direct stock taking from the stock projection page", () => {
    const view = readFileSync(
      resolve(process.cwd(), "src/views/business/stock/index.vue"),
      "utf8"
    );
    const columns = readFileSync(
      resolve(process.cwd(), "src/views/business/stock/columns.ts"),
      "utf8"
    );

    expect(view).not.toContain("stockTakingApi");
    expect(view).not.toContain("openDialog");
    expect(view).not.toContain("盘点成功");
    expect(columns).not.toContain('slot: "operation"');
  });
});
