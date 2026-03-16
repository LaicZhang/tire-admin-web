import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCompanySettingsCsv } from "../../test-utils/companySettingsCsv";

function resolveCompanySettingsCsvPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const tireAdminWebRoot = path.resolve(here, "..", "..");
  const repoRoot = path.resolve(tireAdminWebRoot, "..");
  return path.join(repoRoot, "docs", "company-settings.csv");
}

describe("docs/company-settings.csv contract", () => {
  it("is well-formed and keeps implemented rows consistent", () => {
    const csvPath = resolveCompanySettingsCsvPath();
    const csvText = fs.readFileSync(csvPath, "utf-8");
    const rows = parseCompanySettingsCsv(csvText);

    const allowedTypes = new Set([
      "string",
      "number",
      "boolean",
      "enum",
      "json",
      "list",
      "object"
    ]);
    const allowedStatus = new Set([
      "frontend_only",
      "backend_only",
      "suggested",
      "implemented",
      "storage_only"
    ]);

    const seen = new Set<string>();
    for (const r of rows) {
      expect(allowedTypes.has((r.settingType ?? "").trim())).toBe(true);
      expect(allowedStatus.has((r.status ?? "").trim())).toBe(true);

      const k = `${r.scope}:${r.group}:${r.key}`;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }

    const implemented = rows.filter(
      r => (r.status ?? "").trim() === "implemented"
    );
    for (const r of implemented) {
      expect((r.frontendExists ?? "").trim()).toBe("yes");
      expect((r.backendExists ?? "").trim()).toBe("yes");
      expect((r.uiEntry ?? "").trim().length).toBeGreaterThan(0);
      expect((r.api ?? "").trim().length).toBeGreaterThan(0);
    }
  });
});
