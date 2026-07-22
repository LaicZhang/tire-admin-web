import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("sale-contract management page contract", () => {
  it("wires create submit approve reject terminate convert with Auth values", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/views/business/contract/sale/index.vue"),
      "utf8"
    );
    expect(source).toContain("createSaleContractApi");
    expect(source).toContain("submitSaleContractApi");
    expect(source).toContain("approveSaleContractApi");
    expect(source).toContain("rejectSaleContractApi");
    expect(source).toContain("terminateSaleContractApi");
    expect(source).toContain("convertSaleContractApi");
    expect(source).toContain('value="post/sale-contract"');
    expect(source).toContain('value="post/sale-contract/:uid/approve"');
    expect(source).toContain('value="post/sale-contract/:uid/terminate"');
    expect(source).toContain("PENDING_APPROVAL");
  });
});
