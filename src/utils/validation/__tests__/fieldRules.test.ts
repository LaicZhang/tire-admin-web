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

  it("covers required and optional text wrappers with custom limits", async () => {
    const requiredTitle = fieldRules.title({
      required: true,
      label: "标题",
      max: 2,
      trigger: "change"
    });
    expect(requiredTitle[0].trigger).toBe("change");
    await expect(runAll(requiredTitle, "")).rejects.toBeInstanceOf(Error);
    await expect(runAll(requiredTitle, "abc")).rejects.toBeInstanceOf(Error);
    await expect(runAll(requiredTitle, "ab")).resolves.toBeUndefined();

    expect(fieldRules.title({ required: false })).toHaveLength(1);
    expect(fieldRules.code({ required: true })).toHaveLength(2);
    expect(fieldRules.code({ required: false })).toHaveLength(1);
    await expect(
      runAll(fieldRules.code({ required: true, max: 2 }), "")
    ).rejects.toBeInstanceOf(Error);
    await expect(
      runAll(fieldRules.code({ max: 2 }), "")
    ).resolves.toBeUndefined();
    await expect(
      runAll(fieldRules.code({ max: 2 }), "abc")
    ).rejects.toBeInstanceOf(Error);
    await expect(
      runAll(fieldRules.keyword({ label: "关键字", max: 2 }), "abc")
    ).rejects.toBeInstanceOf(Error);
  });

  it("covers required, default and custom remark/address/desc behavior", async () => {
    expect(fieldRules.remark()).toHaveLength(1);
    expect(fieldRules.remark({ required: true })).toHaveLength(2);
    expect(fieldRules.desc()).toHaveLength(1);
    expect(
      fieldRules.desc({ required: true, max: 3, label: "说明" })
    ).toHaveLength(2);
    expect(fieldRules.address()).toHaveLength(1);
    expect(fieldRules.address({ required: true })).toHaveLength(2);

    await expect(
      runAll(fieldRules.remark({ required: true }), "   ")
    ).rejects.toBeInstanceOf(Error);
    await expect(
      runAll(fieldRules.desc({ max: 2 }), "abc")
    ).rejects.toBeInstanceOf(Error);
    await expect(
      runAll(fieldRules.address({ max: 2 }), "abc")
    ).rejects.toBeInstanceOf(Error);
  });

  it("validates required and optional phone values", async () => {
    const optional = fieldRules.phone();
    expect(optional).toHaveLength(1);
    await expect(runAll(optional, "")).resolves.toBeUndefined();
    await expect(runAll(optional, "123")).rejects.toBeInstanceOf(Error);
    await expect(runAll(optional, "13800138000")).resolves.toBeUndefined();

    const required = fieldRules.phone({ required: true, label: "联系电话" });
    await expect(runAll(required, "")).rejects.toBeInstanceOf(Error);
    await expect(runAll(required, "13800138000")).resolves.toBeUndefined();
  });

  it("covers optional select variants and signed money bounds", async () => {
    expect(fieldRules.select({ required: true, label: "仓库" })).toHaveLength(
      1
    );
    expect(fieldRules.select({ required: false, label: "仓库" })).toHaveLength(
      0
    );
    expect(
      fieldRules.uidSelect({ required: false, label: "仓库" })
    ).toHaveLength(1);

    const rules = fieldRules.moneyYuanSigned({
      label: "调整金额",
      min: -10,
      minExclusive: true,
      max: 10
    });
    await expect(runAll(rules, "")).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, "-10")).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, 10.01)).rejects.toBeInstanceOf(Error);
    await expect(runAll(rules, "-9.5")).resolves.toBeUndefined();
    await expect(runAll(rules, 10)).resolves.toBeUndefined();
    expect(
      fieldRules.moneyYuanSigned({ required: false, label: "调整金额" })
    ).toHaveLength(1);
  });

  it("covers date wrappers, defaults and any() normalization", async () => {
    const optionalDate = fieldRules.date({ required: false });
    expect(optionalDate).toHaveLength(0);
    const requiredDate = fieldRules.date({ label: "生效日期" });
    await expect(runAll(requiredDate, "")).rejects.toBeInstanceOf(Error);

    expect(fieldRules.dateRange()).toHaveLength(1);
    expect(fieldRules.arrayMinSize()).toHaveLength(1);
    const rule = fieldRules.keyword()[0];
    expect(fieldRules.any(rule)).toEqual([rule]);
    expect(fieldRules.any([rule, rule])).toEqual([rule, rule]);
  });
});
