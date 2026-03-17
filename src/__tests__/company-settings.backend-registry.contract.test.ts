import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseSettingsCsv,
  type SettingsCsvRow
} from "../../test-utils/settingsCsv";

type RegistryDefinition = Readonly<{
  group: string;
  key: string;
  displayName: string;
  settingType: string;
}>;

const REGISTRY_DEF_RE =
  /\{\s*group:\s*"([^"]+)",\s*key:\s*"([^"]+)",\s*displayName:\s*"([^"]+)",\s*type:\s*"([^"]+)",/gms;

function resolveRepoRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const tireAdminWebRoot = path.resolve(here, "..", "..");
  return path.resolve(tireAdminWebRoot, "..");
}

function resolveCompanySettingsCsvPath(): string {
  return path.join(resolveRepoRoot(), "docs", "settings.csv");
}

function resolveBackendRegistryPath(): string {
  return path.join(
    resolveRepoRoot(),
    "be-core",
    "src",
    "domains",
    "system",
    "company-setting",
    "company-setting.registry.ts"
  );
}

function normalizeCell(value: string | undefined): string {
  return (value ?? "").trim();
}

function parseRegistryDefinitions(registryText: string): RegistryDefinition[] {
  const defs: RegistryDefinition[] = [];
  for (const match of registryText.matchAll(REGISTRY_DEF_RE)) {
    const group = match[1] ?? "";
    const key = match[2] ?? "";
    const displayName = match[3] ?? "";
    const settingType = match[4] ?? "";
    defs.push({ group, key, displayName, settingType });
  }
  if (defs.length === 0) {
    throw new Error(
      "Failed to parse be-core company-setting registry: no definitions matched"
    );
  }

  const seen = new Set<string>();
  for (const d of defs) {
    const id = `${d.group}:${d.key}`;
    if (seen.has(id)) {
      throw new Error(`Duplicate registry definition: ${id}`);
    }
    seen.add(id);
  }
  return defs;
}

function buildCompanyScopeRowMap(
  rows: readonly SettingsCsvRow[]
): Map<string, SettingsCsvRow> {
  const map = new Map<string, SettingsCsvRow>();
  for (const r of rows) {
    if (normalizeCell(r.scope) !== "company") continue;
    const id = `${normalizeCell(r.group)}:${normalizeCell(r.key)}`;
    if (map.has(id)) {
      throw new Error(`Duplicate CSV row in company scope: ${id}`);
    }
    map.set(id, r);
  }
  return map;
}

describe("company-setting registry ↔ docs/settings.csv contract", () => {
  it("keeps backend registry definitions aligned with CSV (scope=company)", () => {
    const csvText = fs.readFileSync(resolveCompanySettingsCsvPath(), "utf-8");
    const csvRows = parseSettingsCsv(csvText);
    const companyRowMap = buildCompanyScopeRowMap(csvRows);

    const registryText = fs.readFileSync(resolveBackendRegistryPath(), "utf-8");
    const registryDefs = parseRegistryDefinitions(registryText);

    for (const d of registryDefs) {
      const id = `${d.group}:${d.key}`;
      const row = companyRowMap.get(id);
      expect(
        row,
        `Missing CSV row for registry definition: ${id}`
      ).toBeDefined();
      if (!row) {
        throw new Error(`Missing CSV row for registry definition: ${id}`);
      }

      expect(normalizeCell(row.backendExists)).toBe("yes");
      expect(normalizeCell(row.settingType)).toBe(normalizeCell(d.settingType));
      expect(normalizeCell(row.displayName)).toBe(normalizeCell(d.displayName));
    }
  });

  it('requires rows using "/company-setting/group/*" API to exist in backend registry', () => {
    const csvText = fs.readFileSync(resolveCompanySettingsCsvPath(), "utf-8");
    const csvRows = parseSettingsCsv(csvText);
    const companyRowMap = buildCompanyScopeRowMap(csvRows);

    const registryText = fs.readFileSync(resolveBackendRegistryPath(), "utf-8");
    const registryDefs = parseRegistryDefinitions(registryText);
    const registryIds = new Set(registryDefs.map(d => `${d.group}:${d.key}`));

    for (const [id, row] of companyRowMap.entries()) {
      const api = normalizeCell(row.api);
      if (!api.includes("/company-setting/group/")) continue;
      expect(
        registryIds.has(id),
        `CSV row references company-setting group API but is missing in registry: ${id}`
      ).toBe(true);
    }
  });
});
