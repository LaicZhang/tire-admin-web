import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("document PDF contract", () => {
  it("uses backend-generated PDFs for sales and purchase document printing", () => {
    const api = readFileSync(
      resolve(process.cwd(), "src/api/document-center.ts"),
      "utf8"
    );
    const sales = readFileSync(
      resolve(process.cwd(), "src/views/sales/documents/index.vue"),
      "utf8"
    );
    const purchase = readFileSync(
      resolve(process.cwd(), "src/views/purchase/documents/index.vue"),
      "utf8"
    );
    expect(api).toContain("getDocumentCenterPdfApi");
    expect(api).toContain("/pdf`");
    expect(sales).toContain("getDocumentCenterPdfApi");
    expect(purchase).toContain("getDocumentCenterPdfApi");
    expect(sales).not.toContain("Object.entries(data.detail)");
    expect(purchase).not.toContain("Object.entries(data.detail)");
  });
});
