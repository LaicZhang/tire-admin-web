import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  buildAssemblyCreatePayload,
  buildAssemblyUpdatePayload,
  buildDisassemblyCreatePayload,
  buildDisassemblyUpdatePayload
} from "../inventory-adapters";

const forbiddenFields = [
  "auditor",
  "auditorId",
  "isApproved",
  "isLocked",
  "rejectReason"
] as const;

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}

function getWriteInterfaceBodies(source: string) {
  const results: Array<{ name: string; body: string }> = [];
  const declaration =
    /export interface ((?:Create|Update)\w*(?:Dto|Params|Payload))[^\{]*\{/g;
  for (const match of source.matchAll(declaration)) {
    const start = (match.index ?? 0) + match[0].length;
    let depth = 1;
    let cursor = start;
    while (cursor < source.length && depth > 0) {
      if (source[cursor] === "{") depth += 1;
      if (source[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    results.push({ name: match[1], body: source.slice(start, cursor - 1) });
  }
  return results;
}

describe("order approval write contracts", () => {
  it("keeps approval-owned fields out of API create and update types", () => {
    const apiRoot = join(process.cwd(), "src/api");
    const violations = listTypeScriptFiles(apiRoot).flatMap(path => {
      const source = readFileSync(path, "utf8");
      return getWriteInterfaceBodies(source).flatMap(({ name, body }) =>
        forbiddenFields.flatMap(field =>
          new RegExp(`^\\s*${field}\\??\\s*:`, "m").test(body)
            ? [`${relative(process.cwd(), path)}:${name}.${field}`]
            : []
        )
      );
    });

    expect(violations).toEqual([]);
  });

  it("does not expose auditor selection or relations in order edit views", () => {
    const viewRoot = join(process.cwd(), "src/views");
    const violations = listTypeScriptFiles(viewRoot)
      .concat(
        readdirSync(viewRoot, { recursive: true, withFileTypes: true })
          .filter(entry => entry.isFile() && entry.name.endsWith(".vue"))
          .map(entry => join(entry.parentPath, entry.name))
      )
      .flatMap(path => {
        if (path.includes("/__tests__/") || path.endsWith(".test.ts"))
          return [];
        const source = readFileSync(path, "utf8");
        return [
          path.endsWith("/form.vue") && /v-model="[^"]*auditorId"/.test(source)
            ? "auditor-control"
            : "",
          /auditor\s*:\s*\{\s*connect/.test(source) ? "auditor-relation" : ""
        ]
          .filter(Boolean)
          .map(kind => `${relative(process.cwd(), path)}:${kind}`);
      });

    expect(violations).toEqual([]);
  });

  it("does not send auditor state from assembly builders", () => {
    const data = {
      targetTireId: "target-tire",
      targetRepoId: "repo",
      quantity: 1,
      components: [{ tireId: "component-tire", quantity: 1 }]
    };

    expect(
      buildAssemblyCreatePayload(data, "company", "user", "order").order
    ).not.toHaveProperty("auditor");
    expect(
      buildAssemblyUpdatePayload(data, "company", "user")
    ).not.toHaveProperty("auditor");
  });

  it("does not send auditor state from disassembly builders", () => {
    const data = {
      sourceTireId: "source-tire",
      sourceRepoId: "repo",
      quantity: 1,
      components: [{ tireId: "component-tire", quantity: 1 }]
    };

    expect(
      buildDisassemblyCreatePayload(data, "company", "user", "order").order
    ).not.toHaveProperty("auditor");
    expect(
      buildDisassemblyUpdatePayload(data, "company", "user")
    ).not.toHaveProperty("auditor");
  });
});
