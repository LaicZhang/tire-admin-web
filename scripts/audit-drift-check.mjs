import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const eslintConfigPath = path.join(projectRoot, "eslint.config.js");
const summaryPath = path.join(
  projectRoot,
  "docs",
  "audit-list",
  "00-summary.md"
);

function normalizeRuleValue(value) {
  if (Array.isArray(value)) return normalizeRuleValue(value[0]);
  if (value === 0 || value === "off") return "off";
  if (value === 1 || value === "warn") return "warn";
  if (value === 2 || value === "error") return "error";
  return String(value);
}

function findLastRuleValue(configs, ruleName) {
  let found;
  for (const cfg of configs) {
    if (
      cfg &&
      typeof cfg === "object" &&
      cfg.rules &&
      cfg.rules[ruleName] !== undefined
    ) {
      found = cfg.rules[ruleName];
    }
  }
  return found;
}

const eslintModule = await import(pathToFileURL(eslintConfigPath).href);
const eslintConfigs = eslintModule.default;
if (!Array.isArray(eslintConfigs)) {
  throw new Error("eslint.config.js default export is not an array");
}

const ruleName = "@typescript-eslint/no-explicit-any";
const eslintRuleRaw = findLastRuleValue(eslintConfigs, ruleName);
if (eslintRuleRaw === undefined) {
  throw new Error(`Rule not found in eslint config: ${ruleName}`);
}
const eslintRule = normalizeRuleValue(eslintRuleRaw);

const summary = await fs.readFile(summaryPath, "utf8");
const match = summary.match(
  /@typescript-eslint\/no-explicit-any\s*:\s*(off|warn|error)/i
);
if (!match) {
  throw new Error(
    `Cannot find documented rule state in ${path.relative(projectRoot, summaryPath)}`
  );
}

const docRule = match[1].toLowerCase();

if (docRule !== eslintRule) {
  console.error(
    [
      "[audit:drift] ESLint rule drift detected:",
      `- ${ruleName} in eslint.config.js: ${eslintRule}`,
      `- ${ruleName} in docs/audit-list/00-summary.md: ${docRule}`,
      "",
      "Fix: update docs/audit-list/00-summary.md to match eslint.config.js"
    ].join("\n")
  );
  process.exit(1);
}

console.log(`[audit:drift] OK: ${ruleName}=${eslintRule}`);
