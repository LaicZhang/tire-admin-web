import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("service-package API contract", () => {
  it("exposes CRUD routes under /service-package", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/api/business/service-package.ts"),
      "utf8"
    );
    expect(source).toContain('const prefix = "/service-package"');
    expect(source).toContain("`${prefix}/page/${index}`");
    expect(source).toContain("`${prefix}/${uid}`");
    expect(source).toContain("createServicePackageApi");
    expect(source).toContain("updateServicePackageApi");
    expect(source).toContain("deleteServicePackageApi");
  });
});
