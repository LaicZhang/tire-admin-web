import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSettingsCsv } from "../../test-utils/settingsCsv";

function resolveSettingsCsvPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const tireAdminWebRoot = path.resolve(here, "..", "..");
  const repoRoot = path.resolve(tireAdminWebRoot, "..");
  return path.join(repoRoot, "docs", "settings.csv");
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

function computeUiScope(
  uiEntry: string | undefined
): "system_ui" | "company_ui" | "none" {
  const v = (uiEntry ?? "").trim();
  if (!v) return "none";
  if (v.startsWith("/settings/")) return "system_ui";
  if (v.startsWith("/company/")) return "company_ui";
  return "none";
}

describe("docs/settings.csv contract", () => {
  it("is well-formed and keeps implemented rows consistent", () => {
    const csvPath = resolveSettingsCsvPath();
    const csvText = fs.readFileSync(csvPath, "utf-8");
    const rows = parseSettingsCsv(csvText);

    const allowedTypes = new Set([
      "string",
      "number",
      "boolean",
      "enum",
      "json",
      "list",
      "object"
    ]);
    const allowedUiScope = new Set(["system_ui", "company_ui", "none"]);
    const allowedExposureStatus = new Set([
      "frontend_only",
      "backend_only",
      "suggested",
      "implemented",
      "storage_only",
      "internal_only"
    ]);
    const allowedLifecycle = new Set(["", "planned", "implemented"]);

    const seen = new Set<string>();
    for (const r of rows) {
      expect(allowedTypes.has((r.settingType ?? "").trim())).toBe(true);
      expect(allowedUiScope.has((r.uiScope ?? "").trim())).toBe(true);
      expect(allowedExposureStatus.has((r.exposureStatus ?? "").trim())).toBe(
        true
      );
      expect(allowedLifecycle.has((r.lifecycle ?? "").trim())).toBe(true);

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
        expect((r.uiScope ?? "").trim()).toBe(computeUiScope(r.uiEntry));
      }
      if (backendExists === "yes") {
        expectNonEmptyField(r.api, "api");
      }

      const exposureStatus = (r.exposureStatus ?? "").trim();
      if (exposureStatus === "backend_only") {
        expect(frontendExists).toBe("no");
        expect(backendExists).toBe("yes");
        expect((r.uiEntry ?? "").trim().length).toBe(0);
      }
      if (exposureStatus === "frontend_only") {
        expect(frontendExists).toBe("yes");
        expect(backendExists).toBe("no");
      }
      if (exposureStatus === "storage_only") {
        expect(frontendExists).toBe("yes");
        expect(backendExists).toBe("yes");
        expectNonEmptyField(r.uiEntry, "uiEntry");
        expectNonEmptyField(r.api, "api");
      }
      if (exposureStatus === "internal_only") {
        expect(frontendExists).toBe("no");
        expect(backendExists).toBe("no");
        expect((r.uiEntry ?? "").trim().length).toBe(0);
        expect((r.api ?? "").trim().length).toBe(0);
      }
    }

    const implemented = rows.filter(
      r => (r.exposureStatus ?? "").trim() === "implemented"
    );
    for (const r of implemented) {
      expect((r.frontendExists ?? "").trim()).toBe("yes");
      expect((r.backendExists ?? "").trim()).toBe("yes");
      expect((r.uiEntry ?? "").trim().length).toBeGreaterThan(0);
      expect((r.api ?? "").trim().length).toBeGreaterThan(0);
    }
  });
});
