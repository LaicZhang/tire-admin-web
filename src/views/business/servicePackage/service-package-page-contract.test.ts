import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("service-package page contract", () => {
  it("supports package CRUD with Auth gates", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/views/business/servicePackage/index.vue"),
      "utf8"
    );
    expect(source).toContain("createServicePackageApi");
    expect(source).toContain("updateServicePackageApi");
    expect(source).toContain("deleteServicePackageApi");
    expect(source).toContain('value="post/service-package"');
    expect(source).toContain('value="patch/service-package"');
    expect(source).toContain('value="delete/service-package"');
  });
});
