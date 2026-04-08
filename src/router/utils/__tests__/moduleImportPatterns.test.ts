import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routerIndexSource = readFileSync(
  resolve(__dirname, "../../index.ts"),
  "utf8"
);

describe("router module import patterns", () => {
  it("excludes route test files from import.meta.glob", () => {
    expect(routerIndexSource).toMatch(/!\.\/modules\/\*\*\/\*\.test\.ts/);
    expect(routerIndexSource).toMatch(/!\.\/modules\/\*\*\/\*\.spec\.ts/);
  });
});
