import { describe, expect, it } from "vitest";
import { elementRules } from "../elementRules";
import type { FormItemRule } from "element-plus";

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

describe("elementRules", () => {
  it("requiredStringTrim: trims and rejects empty", async () => {
    const rule = elementRules.requiredStringTrim("必填");
    await expect(run(rule, "")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "   ")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "a")).resolves.toBeUndefined();
  });

  it("requiredPhoneCN: rejects empty and validates format", async () => {
    const rule = elementRules.requiredPhoneCN("手机号不正确");
    await expect(run(rule, "")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "123")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "13800138000")).resolves.toBeUndefined();
  });

  it("lenRange: allows empty, validates string length", async () => {
    const rule = elementRules.lenRange({ min: 2, max: 3, message: "长度不对" });
    await expect(run(rule, undefined)).resolves.toBeUndefined();
    await expect(run(rule, "a")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "abcd")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "abc")).resolves.toBeUndefined();
  });

  it("alphanumeric: allows empty, validates characters", async () => {
    const rule = elementRules.alphanumeric("不合法");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, "a1")).resolves.toBeUndefined();
    await expect(run(rule, "a-1")).rejects.toBeInstanceOf(Error);
  });

  it("optionalPhoneCN: allows empty, validates format", async () => {
    const rule = elementRules.optionalPhoneCN("手机号不正确");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, undefined)).resolves.toBeUndefined();
    await expect(run(rule, "123")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "13800138000")).resolves.toBeUndefined();
  });

  it("requiredEmail: rejects empty and validates format", async () => {
    const rule = elementRules.requiredEmail("邮箱不正确");
    await expect(run(rule, "")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "a@b")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "a@b.com")).resolves.toBeUndefined();
  });

  it("optionalEmail: allows empty, validates format", async () => {
    const rule = elementRules.optionalEmail("邮箱不正确");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, "a@b.com")).resolves.toBeUndefined();
    await expect(run(rule, "a@b")).rejects.toBeInstanceOf(Error);
  });

  it("requiredDate: rejects empty and invalid date", async () => {
    const rule = elementRules.requiredDate("日期不正确");
    await expect(run(rule, "")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "not-a-date")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "2026-01-01")).resolves.toBeUndefined();
  });

  it("uuidV4: allows empty, validates uuid", async () => {
    const rule = elementRules.uuidV4("uuid不正确");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, "not-uuid")).rejects.toBeInstanceOf(Error);
    await expect(
      run(rule, "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    ).resolves.toBeUndefined();
  });

  it("intRange: allows empty, validates integer bounds", async () => {
    const rule = elementRules.intRange({ min: 1, max: 3, message: "不合法" });
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, 0)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, 1.1)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, 4)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, 2)).resolves.toBeUndefined();
  });

  it("numberRange: allows empty, validates numeric bounds", async () => {
    const rule = elementRules.numberRange({
      min: 0,
      max: 1,
      message: "不合法"
    });
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, -0.01)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, 1.01)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, 0.5)).resolves.toBeUndefined();
  });

  it("moneyYuan: validates decimals and bounds", async () => {
    const rule = elementRules.moneyYuan({ min: 0, minExclusive: true });
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, -1)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, 0)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, 0.01)).resolves.toBeUndefined();
    await expect(run(rule, "1.999")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "1.99")).resolves.toBeUndefined();
  });

  it("moneyYuanSigned: allows negative, validates decimals and bounds", async () => {
    const rule = elementRules.moneyYuanSigned({ min: -10, max: 10 });
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, "-1.999")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, -11)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, -1.99)).resolves.toBeUndefined();
    await expect(run(rule, 11)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, 1.99)).resolves.toBeUndefined();
  });

  it("arrayMinSize: allows empty, validates size", async () => {
    const rule = elementRules.arrayMinSize(2, "至少2项");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, [])).resolves.toBeUndefined();
    await expect(run(rule, [1])).rejects.toBeInstanceOf(Error);
    await expect(run(rule, [1, 2])).resolves.toBeUndefined();
  });

  it("requiredArrayMinSize: rejects empty, validates size", async () => {
    const rule = elementRules.requiredArrayMinSize(2, "至少2项");
    await expect(run(rule, "")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, [])).rejects.toBeInstanceOf(Error);
    await expect(run(rule, [1])).rejects.toBeInstanceOf(Error);
    await expect(run(rule, [1, 2])).resolves.toBeUndefined();
  });

  it("dateRange: validates length and ordering", async () => {
    const rule = elementRules.dateRange();
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, ["2026-01-02"])).rejects.toBeInstanceOf(Error);
    await expect(
      run(rule, ["2026-01-02", "2026-01-01"])
    ).rejects.toBeInstanceOf(Error);
    await expect(
      run(rule, ["2026-01-01", "2026-01-02"])
    ).resolves.toBeUndefined();
  });
});
