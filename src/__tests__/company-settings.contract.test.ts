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

type ExistenceFlag = "yes" | "no";

function normalizeExistenceFlag(raw: string | undefined): ExistenceFlag {
  const v = (raw ?? "").trim();
  if (v !== "yes" && v !== "no") {
    throw new Error(`Unexpected existence flag: "${v}" (expected "yes"|"no")`);
  }
  return v;
}

function expectNonEmptyField(value: string | undefined, field: string): void {
  expect(
    (value ?? "").trim().length,
    `${field} should be non-empty`
  ).toBeGreaterThan(0);
}

type DefaultValueCheckInput = Readonly<{
  id: string;
  settingType: string;
  defaultValue: string;
}>;

function validateDefaultValue(input: DefaultValueCheckInput): void {
  const type = input.settingType.trim();
  const raw = input.defaultValue;
  const value = raw.trim();
  if (!value) return;

  expect(
    raw,
    `${input.id} defaultValue should not contain leading/trailing spaces`
  ).toBe(value);

  if (type === "number") {
    const num = Number(value);
    expect(
      Number.isFinite(num),
      `${input.id} defaultValue should be a finite number`
    ).toBe(true);
    return;
  }

  if (type === "boolean") {
    expect(
      value === "true" || value === "false",
      `${input.id} defaultValue should be "true"|"false"`
    ).toBe(true);
  }
}

type UiEntryCheckInput = Readonly<{
  id: string;
  uiEntry: string;
}>;

function validateUiEntry(input: UiEntryCheckInput): void {
  const value = input.uiEntry.trim();
  expect(
    input.uiEntry,
    `${input.id} uiEntry should not contain leading/trailing spaces`
  ).toBe(value);
  expect(
    value.startsWith("/"),
    `${input.id} uiEntry should start with "/"`
  ).toBe(true);
  expect(
    value.includes(" "),
    `${input.id} uiEntry should not contain spaces`
  ).toBe(false);
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

      const frontendExists = normalizeExistenceFlag(r.frontendExists);
      const backendExists = normalizeExistenceFlag(r.backendExists);

      validateDefaultValue({
        id: k,
        settingType: (r.settingType ?? "").trim(),
        defaultValue: r.defaultValue ?? ""
      });

      if (frontendExists === "yes") {
        expectNonEmptyField(r.uiEntry, "uiEntry");
        validateUiEntry({ id: k, uiEntry: r.uiEntry ?? "" });
      }
      if (backendExists === "yes") {
        expectNonEmptyField(r.api, "api");
      }

      const status = (r.status ?? "").trim();
      if (status === "backend_only") {
        expect(frontendExists).toBe("no");
        expect(backendExists).toBe("yes");
        expect((r.uiEntry ?? "").trim().length).toBe(0);
      }
      if (status === "frontend_only") {
        expect(frontendExists).toBe("yes");
        expect(backendExists).toBe("no");
      }
      if (status === "storage_only") {
        expect(frontendExists).toBe("yes");
        expect(backendExists).toBe("yes");
        expectNonEmptyField(r.uiEntry, "uiEntry");
        expectNonEmptyField(r.api, "api");
      }
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
