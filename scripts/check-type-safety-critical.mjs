import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const criticalFiles = [
  "src/composables/useImportExport.ts",
  "src/api/data/column-settings.ts",
  "src/views/settings/costParams/index.vue",
  "src/views/settings/costParams/settings.ts",
  "src/views/other/aiEntry/composables/useAiEntryRecognition.ts",
  "src/router/index.ts",
  "src/router/utils/dynamic.ts",
  "src/store/modules/permission.ts"
];

const forbiddenPatterns = [
  { name: "double assertion", regex: /\bas unknown as\b/g },
  { name: "raw JSON.parse", regex: /\bJSON\.parse\(/g }
];

const violations = [];

for (const relativePath of criticalFiles) {
  const absolutePath = path.join(projectRoot, relativePath);
  const content = await fs.readFile(absolutePath, "utf8");

  for (const pattern of forbiddenPatterns) {
    const matches = content.match(pattern.regex);
    if (matches?.length) {
      violations.push(
        `${relativePath}: found ${matches.length} ${pattern.name} occurrence(s)`
      );
    }
  }
}

if (violations.length > 0) {
  console.error(
    [
      "[audit:type-safety] Critical files contain unsafe patterns:",
      ...violations
    ].join("\n")
  );
  process.exit(1);
}

console.log(
  `[audit:type-safety] OK: ${criticalFiles.length} critical files are free of raw JSON.parse and double assertions`
);
