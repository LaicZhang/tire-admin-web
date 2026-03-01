import { describe, expect, it } from "vitest";
import type { FormItemRule } from "element-plus";
import { fieldRules } from "../fieldRules";

type Validator = (
  rule: unknown,
  value: unknown,
  callback: (error?: Error) => void,
  source: Record<string, unknown>,
  options: Record<string, unknown>
) => void;

function run(rule: FormItemRule, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!rule.validator) return resolve();
    const validator = rule.validator as unknown as Validator;
    validator(
      {},
      value,
      (err?: Error) => {
        if (err) reject(err);
        else resolve();
      },
      {},
      {}
    );
  });
}

async function runAll(rules: FormItemRule[], value: unknown) {
  for (const rule of rules) await run(rule, value);
}

describe("fieldRules", () => {
  it("name: required + maxLen", async () => {
    const rules = fieldRules.name({ label: "客户名称", max: 3 });
    await expect(runAll(rules, "")).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, "   ")).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, "abcd")).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, "abc")).resolves.toBeUndefined();
  });

  it("uidSelect: required + uuid", async () => {
    const rules = fieldRules.uidSelect({ label: "供应商" });
    await expect(runAll(rules, "")).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, "not-uuid")).rejects.toBeInstanceOf(Error);
    await expect(
      runAll(rules, "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    ).resolves.toBeUndefined();
  });

  it("moneyYuan: required + bounds", async () => {
    const rules = fieldRules.moneyYuan({
      label: "金额",
      min: 0,
      minExclusive: true
    });
    await expect(runAll(rules, "")).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, 0)).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, 0.01)).resolves.toBeUndefined();
  });
});
