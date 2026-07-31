import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("installation-record API contract", () => {
  it("allows optional serviceWorkOrderUid on create", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/api/business/installationRecord.ts"),
      "utf8"
    );
    expect(source).toContain('const prefix = "/installation-record"');
    expect(source).toContain("serviceWorkOrderUid");
    expect(source).toContain("createInstallationRecordApi");
  });
});
