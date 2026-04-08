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

  it("username: optional empty allowed, invalid chars and boundary enforced", async () => {
    const optionalRules = fieldRules.username({
      required: false,
      label: "用户名",
      max: 4
    });
    await expect(runAll(optionalRules, "")).resolves.toBeUndefined();
    await expect(runAll(optionalRules, "ab-c")).rejects.toBeInstanceOf(Error);
    await expect(runAll(optionalRules, "abcd")).resolves.toBeUndefined();
    await expect(runAll(optionalRules, "abcde")).rejects.toBeInstanceOf(Error);
  });

  it("password: required length range and optional empty behavior", async () => {
    const requiredRules = fieldRules.password({
      label: "密码",
      min: 6,
      max: 8
    });
    await expect(runAll(requiredRules, "")).rejects.toBeInstanceOf(Error);
    await expect(runAll(requiredRules, "12345")).rejects.toBeInstanceOf(Error);
    await expect(runAll(requiredRules, "12345678")).resolves.toBeUndefined();
    await expect(runAll(requiredRules, "123456789")).rejects.toBeInstanceOf(
      Error
    );

    const optionalRules = fieldRules.password({
      required: false,
      label: "密码",
      min: 6,
      max: 8
    });
    await expect(runAll(optionalRules, "")).resolves.toBeUndefined();
    await expect(runAll(optionalRules, "   ")).resolves.toBeUndefined();
    await expect(runAll(optionalRules, undefined)).resolves.toBeUndefined();
  });

  it("email: validates required, optional, format and max boundary", async () => {
    const requiredRules = fieldRules.email({
      required: true,
      label: "邮箱",
      max: 12
    });
    await expect(runAll(requiredRules, "")).rejects.toBeInstanceOf(Error);
    await expect(runAll(requiredRules, "bad@value")).rejects.toBeInstanceOf(
      Error
    );
    await expect(
      runAll(requiredRules, "toolong@email.com")
    ).rejects.toBeInstanceOf(Error);
    await expect(runAll(requiredRules, "a@b.com")).resolves.toBeUndefined();

    const optionalRules = fieldRules.email({
      required: false,
      label: "邮箱",
      max: 12
    });
    await expect(runAll(optionalRules, "")).resolves.toBeUndefined();
  });

  it("dateRange: required empty, invalid order and valid boundary", async () => {
    const requiredRules = fieldRules.dateRange({
      required: true,
      label: "账期"
    });
    await expect(runAll(requiredRules, "")).rejects.toBeInstanceOf(Error);
    await expect(
      runAll(requiredRules, ["2026-01-02", "2026-01-01"])
    ).rejects.toBeInstanceOf(Error);
    await expect(
      runAll(requiredRules, ["2026-01-01", "2026-01-01"])
    ).resolves.toBeUndefined();
  });

  it("arrayMinSize: optional empty allowed and required minimum enforced", async () => {
    const optionalRules = fieldRules.arrayMinSize({
      required: false,
      min: 2,
      label: "项目"
    });
    await expect(runAll(optionalRules, "")).resolves.toBeUndefined();
    await expect(runAll(optionalRules, [1])).rejects.toBeInstanceOf(Error);
    await expect(runAll(optionalRules, [1, 2])).resolves.toBeUndefined();

    const requiredRules = fieldRules.arrayMinSize({
      required: true,
      min: 2,
      label: "项目"
    });
    await expect(runAll(requiredRules, [])).rejects.toBeInstanceOf(Error);
  });

  it("positiveInt: rejects empty, invalid types and out-of-range values", async () => {
    const rules = fieldRules.positiveInt({
      label: "数量",
      min: 1,
      max: 3
    });
    await expect(runAll(rules, "")).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, true)).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, [1])).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, 1.5)).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, 0)).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, 4)).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, 3)).resolves.toBeUndefined();
  });

  it("nonNegativeNumber: required empty, invalid numeric types and upper boundary", async () => {
    const rules = fieldRules.nonNegativeNumber({
      required: true,
      label: "金额",
      min: 0,
      max: 10
    });
    await expect(runAll(rules, "")).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, true)).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, [1])).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, "NaN")).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, -0.01)).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, 10.01)).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, 10)).resolves.toBeUndefined();
  });
});
