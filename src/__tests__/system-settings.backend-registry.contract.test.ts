import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseSettingsCsv,
  type SettingsCsvRow
} from "../../test-utils/settingsCsv";
import {
  resolveWorkspaceRoot,
  tryResolveWorkspaceRoot
} from "../../test-utils/workspaceRoot";

type RegistryDefinition = Readonly<{
  group: string;
  key: string;
  displayName: string;
  settingType: string;
}>;

const REGISTRY_DEF_RE =
  /\{\s*group:\s*(["'])([^"']+)\1,\s*key:\s*(["'])([^"']+)\3,\s*displayName:\s*(["'])([^"']+)\5,\s*type:\s*(["'])([^"']+)\7,/gms;

const here = path.dirname(fileURLToPath(import.meta.url));
const hasBackendSettings = tryResolveWorkspaceRoot(here) !== undefined;

function resolveRepoRoot(): string {
  return resolveWorkspaceRoot(here);
}

function resolveSystemSettingsCsvPath(): string {
  return path.join(resolveRepoRoot(), "be-core", "docs", "settings.csv");
}

function resolveBackendRegistryPath(): string {
  return path.join(
    resolveRepoRoot(),
    "be-core",
    "src",
    "common",
    "constant",
    "data",
    "systemSettingDefinitions.ts"
  );
}

function normalizeCell(value: string | undefined): string {
  return (value ?? "").trim();
}

function parseRegistryDefinitions(registryText: string): RegistryDefinition[] {
  const defs: RegistryDefinition[] = [];
  for (const match of registryText.matchAll(REGISTRY_DEF_RE)) {
    defs.push({
      group: match[2] ?? "",
      key: match[4] ?? "",
      displayName: match[6] ?? "",
      settingType: match[8] ?? ""
    });
  }
  if (defs.length === 0) {
    throw new Error(
      "Failed to parse be-core system setting registry: no definitions matched"
    );
  }

  const seen = new Set<string>();
  for (const def of defs) {
    const id = `${def.group}:${def.key}`;
    if (seen.has(id)) throw new Error(`Duplicate registry definition: ${id}`);
    seen.add(id);
  }
  return defs;
}

function buildSystemScopeRowMap(
  rows: readonly SettingsCsvRow[]
): Map<string, SettingsCsvRow> {
  const map = new Map<string, SettingsCsvRow>();
  for (const row of rows) {
    if (normalizeCell(row.scope) !== "system") continue;
    const id = `${normalizeCell(row.group)}:${normalizeCell(row.key)}`;
    if (map.has(id))
      throw new Error(`Duplicate CSV row in system scope: ${id}`);
    map.set(id, row);
  }
  return map;
}

describe("system-setting registry ↔ docs/settings.csv contract", () => {
  it("parses registry definitions formatted with single quotes", () => {
    expect(
      parseRegistryDefinitions(`
        {
          group: 'ops',
          key: 'requestTimeoutMs',
          displayName: '请求超时（毫秒）',
          type: 'number',
        },
      `)
    ).toEqual([
      {
        group: "ops",
        key: "requestTimeoutMs",
        displayName: "请求超时（毫秒）",
        settingType: "number"
      }
    ]);
  });

  it.skipIf(!hasBackendSettings)(
    "keeps backend registry definitions aligned with CSV (scope=system)",
    () => {
      const csvText = fs.readFileSync(resolveSystemSettingsCsvPath(), "utf-8");
      const csvRows = parseSettingsCsv(csvText);
      const systemRowMap = buildSystemScopeRowMap(csvRows);

      const registryText = fs.readFileSync(
        resolveBackendRegistryPath(),
        "utf-8"
      );
      const registryDefs = parseRegistryDefinitions(registryText);

      for (const def of registryDefs) {
        const id = `${def.group}:${def.key}`;
        const row = systemRowMap.get(id);
        expect(
          row,
          `Missing CSV row for registry definition: ${id}`
        ).toBeDefined();
        if (!row)
          throw new Error(`Missing CSV row for registry definition: ${id}`);

        expect(normalizeCell(row.backendExists)).toBe("yes");
        expect(normalizeCell(row.settingType)).toBe(
          normalizeCell(def.settingType)
        );
        expect(normalizeCell(row.displayName)).toBe(
          normalizeCell(def.displayName)
        );
      }
    }
  );

  it.skipIf(!hasBackendSettings)(
    'requires rows using "/system-setting/group/*" API to exist in backend registry',
    () => {
      const csvText = fs.readFileSync(resolveSystemSettingsCsvPath(), "utf-8");
      const csvRows = parseSettingsCsv(csvText);
      const systemRowMap = buildSystemScopeRowMap(csvRows);

      const registryText = fs.readFileSync(
        resolveBackendRegistryPath(),
        "utf-8"
      );
      const registryIds = new Set(
        parseRegistryDefinitions(registryText).map(
          def => `${def.group}:${def.key}`
        )
      );

      for (const [id, row] of systemRowMap.entries()) {
        const api = normalizeCell(row.api);
        if (!api.includes("/system-setting/group/")) continue;
        expect(
          registryIds.has(id),
          `CSV row references system-setting group API but is missing in registry: ${id}`
        ).toBe(true);
      }
    }
  );
});
