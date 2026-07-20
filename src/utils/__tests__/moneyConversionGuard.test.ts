/**
 * UI-003 residual guard: bare *100 /100 amount conversions must not
 * reappear in high-frequency money paths. Non-amount uses (percent, time,
 * progress, CSS) are excluded; remaining known amount bare-sites are
 * whitelisted until migrated.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC_ROOT = path.resolve(__dirname, "../..");

/** Paths that must not contain bare fen/yuan amount conversions. */
const STRICT_PATH_PREFIXES = [
  "views/fund/",
  "views/sales/order/",
  "views/purchase/order/",
  "components/MoneyDisplay/",
  "views/data/customerBalance/",
  "views/data/supplierBalance/"
];

/**
 * Known residual amount bare-sites outside the strict zone (file relative to src/).
 * Remove entries when those files migrate to fenToYuan / fenToYuanNumber / yuanToFen.
 */
const ALLOWED_AMOUNT_BARE_FILES = new Set([
  "utils/formatMoney.ts", // helpers themselves
  "views/analysis/aging/index.vue",
  "views/business/finance/income/IncomeForm.vue",
  "views/business/finance/transfer/index.vue",
  "views/data/initialStock/index.vue",
  "views/data/priceInfo/form.vue",
  "views/data/priceInfo/index.vue",
  "views/data/priceLimit/index.vue",
  "views/other/aiEntry/composables/useAiEntryOrderSubmit.ts"
]);

const BARE_AMOUNT_PATTERN =
  /(?:amount|Amount|price|Price|fee|Fee|total|Total|balance|Balance|cost|Cost|money|Money|paid|Paid|receive|Receive|payable|Payable|receivable|Receivable|writeOff|WriteOff|advance|Advance|costPrice|minSalePrice|maxPurchasePrice|vipPrice|basePrice)\b[^\n;]{0,80}(?:\/|\*)\s*100\b|(?:\/|\*)\s*100\b[^\n;]{0,80}\b(?:amount|Amount|price|Price|fee|Fee|total|Total|balance|Balance|cost|Cost|money|Money|paid|Paid)/;

/** Non-amount semantics that commonly use *100 or /100. */
const NON_AMOUNT_LINE =
  /discountRate|percentage|percent|Percent|progress|expiresIn|timeout|interval|delay|3600|24\s*\*\s*60|60\s*\*\s*1000|1000|10000|w-\[|opacity|scale|zoom|ratio|Rate\b|loaded\s*\*\s*100|successRows|totalRows/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === "__tests__" ||
      entry.name === "dist" ||
      entry.name.startsWith(".")
    ) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (/\.(ts|tsx|vue)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function relFromSrc(abs: string): string {
  return path.relative(SRC_ROOT, abs).split(path.sep).join("/");
}

function isStrict(rel: string): boolean {
  return STRICT_PATH_PREFIXES.some(prefix => rel.startsWith(prefix));
}

function findBareAmountHits(
  content: string
): Array<{ line: number; text: string }> {
  const hits: Array<{ line: number; text: string }> = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("100")) continue;
    if (NON_AMOUNT_LINE.test(line)) continue;
    // share-of-total percentage, not fen/yuan conversion
    if (
      /totalAmount\s*>\s*0\s*\?\s*\(.*totalAmount.*\)\s*\*\s*100/.test(line) ||
      /\(.*\/\s*totalAmount\)\s*\*\s*100/.test(line)
    ) {
      continue;
    }
    if (
      /Math\.round\([^\n]*\*\s*100\)/.test(line) ||
      BARE_AMOUNT_PATTERN.test(line)
    ) {
      hits.push({ line: i + 1, text: line.trim() });
    }
  }
  return hits;
}

describe("UI-003 money conversion guard", () => {
  const files = walk(SRC_ROOT);

  it("strict money paths use money helpers (no bare amount *100 /100)", () => {
    const violations: string[] = [];
    for (const file of files) {
      const rel = relFromSrc(file);
      if (!isStrict(rel)) continue;
      if (rel === "utils/formatMoney.ts") continue;
      const content = fs.readFileSync(file, "utf8");
      for (const hit of findBareAmountHits(content)) {
        violations.push(`${rel}:${hit.line}: ${hit.text}`);
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("non-strict bare amount *100 /100 stay on explicit whitelist", () => {
    const unexpected: string[] = [];
    for (const file of files) {
      const rel = relFromSrc(file);
      if (isStrict(rel)) continue;
      if (rel === "utils/formatMoney.ts") continue;
      const content = fs.readFileSync(file, "utf8");
      const hits = findBareAmountHits(content);
      if (hits.length === 0) continue;
      if (ALLOWED_AMOUNT_BARE_FILES.has(rel)) continue;
      for (const hit of hits) {
        unexpected.push(`${rel}:${hit.line}: ${hit.text}`);
      }
    }
    expect(
      unexpected,
      [
        "New bare amount *100 /100 found outside whitelist.",
        "Prefer fenToYuan / fenToYuanNumber / yuanToFen, or add a justified whitelist entry.",
        ...unexpected
      ].join("\n")
    ).toEqual([]);
  });

  it("whitelist entries still exist (avoid stale allowlist drift)", () => {
    for (const rel of ALLOWED_AMOUNT_BARE_FILES) {
      if (rel === "utils/formatMoney.ts") {
        expect(fs.existsSync(path.join(SRC_ROOT, rel))).toBe(true);
        continue;
      }
      const abs = path.join(SRC_ROOT, rel);
      expect(fs.existsSync(abs), `missing whitelist file: ${rel}`).toBe(true);
      const hits = findBareAmountHits(fs.readFileSync(abs, "utf8"));
      expect(
        hits.length,
        `whitelist file has no bare hits (remove from allowlist): ${rel}`
      ).toBeGreaterThan(0);
    }
  });
});
