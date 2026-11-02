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

  it("requiredSelect: rejects empty array and accepts falsy selected values", async () => {
    const rule = elementRules.requiredSelect("请选择");
    await expect(run(rule, "")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, [])).rejects.toBeInstanceOf(Error);
    await expect(run(rule, 0)).resolves.toBeUndefined();
    await expect(run(rule, false)).resolves.toBeUndefined();
  });

  it("requiredPhoneCN: rejects empty and validates format", async () => {
    const rule = elementRules.requiredPhoneCN("手机号不正确");
    await expect(run(rule, "")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "123")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "13800138000")).resolves.toBeUndefined();
    await expect(run(rule, 13800138000)).resolves.toBeUndefined();
  });

  it("lenRange: allows empty, validates string length", async () => {
    const rule = elementRules.lenRange({ min: 2, max: 3, message: "长度不对" });
    await expect(run(rule, undefined)).resolves.toBeUndefined();
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, "   ")).resolves.toBeUndefined();
    await expect(run(rule, "a")).rejects.toThrow("长度不对");
    await expect(run(rule, "abcd")).rejects.toThrow("长度不对");
    await expect(run(rule, "abc")).resolves.toBeUndefined();
  });

  it("lenRange: stringifies non-strings and uses the default message", async () => {
    const rule = elementRules.lenRange({ min: 2, max: 4 });
    await expect(run(rule, 1)).rejects.toThrow("长度不合法");
    await expect(run(rule, 12345)).rejects.toThrow("长度不合法");
    await expect(run(rule, 123)).resolves.toBeUndefined();
  });

  it("maxLen: stringifies non-string values and enforces the boundary", async () => {
    const rule = elementRules.maxLen(3, "最多3位");
    await expect(run(rule, undefined)).resolves.toBeUndefined();
    await expect(run(rule, null)).resolves.toBeUndefined();
    await expect(run(rule, 123)).resolves.toBeUndefined();
    await expect(run(rule, 1234)).rejects.toThrow("最多3位");
  });

  it("maxLen: uses a generated message when omitted", async () => {
    await expect(run(elementRules.maxLen(2), "abc")).rejects.toThrow(
      "最多输入 2 个字符"
    );
  });

  it("alphanumeric: allows empty, validates characters", async () => {
    const rule = elementRules.alphanumeric("不合法");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, "a1")).resolves.toBeUndefined();
    await expect(run(rule, " a1 ")).resolves.toBeUndefined();
    await expect(run(rule, "a-1")).rejects.toThrow("不合法");
    await expect(run(rule, 123)).resolves.toBeUndefined();
    await expect(run(rule, 1.2)).rejects.toThrow("不合法");
  });

  it("optionalPhoneCN: allows empty, validates format", async () => {
    const rule = elementRules.optionalPhoneCN("手机号不正确");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, undefined)).resolves.toBeUndefined();
    await expect(run(rule, "123")).rejects.toThrow("手机号不正确");
    await expect(run(rule, " 13800138000 ")).resolves.toBeUndefined();
    await expect(run(rule, 13800138000)).resolves.toBeUndefined();
  });

  it("requiredEmail: rejects empty and validates format", async () => {
    const rule = elementRules.requiredEmail("邮箱不正确");
    await expect(run(rule, "")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "a@b")).rejects.toThrow("邮箱不正确");
    await expect(run(rule, " a@b.com ")).resolves.toBeUndefined();
    await expect(
      run(rule, { toString: () => "a@b.com" })
    ).resolves.toBeUndefined();
  });

  it("optionalEmail: allows empty, validates format", async () => {
    const rule = elementRules.optionalEmail("邮箱不正确");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, "a@b.com")).resolves.toBeUndefined();
    await expect(run(rule, "a@b")).rejects.toThrow("邮箱不正确");
    await expect(run(rule, { toString: () => "a@b" })).rejects.toThrow(
      "邮箱不正确"
    );
  });

  it("requiredDate: rejects empty and invalid date", async () => {
    const rule = elementRules.requiredDate("日期不正确");
    await expect(run(rule, "")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "not-a-date")).rejects.toThrow("日期不正确");
    await expect(run(rule, " 2026-01-01 ")).resolves.toBeUndefined();
    await expect(run(rule, 0)).resolves.toBeUndefined();
  });

  it("uuidV4: allows empty, validates uuid", async () => {
    const rule = elementRules.uuidV4("uuid不正确");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, "not-uuid")).rejects.toThrow("uuid不正确");
    await expect(run(rule, 123)).rejects.toThrow("uuid不正确");
    await expect(
      run(rule, " 3fa85f64-5717-4562-b3fc-2c963f66afa6 ")
    ).resolves.toBeUndefined();
    await expect(
      run(rule, "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    ).resolves.toBeUndefined();
  });

  it("positiveInt: allows empty and accepts only positive integers", async () => {
    const rule = elementRules.positiveInt("必须为正整数");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, true)).rejects.toThrow("必须为正整数");
    await expect(run(rule, "1.5")).rejects.toThrow("必须为正整数");
    await expect(run(rule, "0")).rejects.toThrow("必须为正整数");
    await expect(run(rule, " 2 ")).resolves.toBeUndefined();
    await expect(run(rule, 3)).resolves.toBeUndefined();
  });

  it("intRange: allows empty, validates integer bounds", async () => {
    const rule = elementRules.intRange({ min: 1, max: 3, message: "不合法" });
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, true)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, [1])).rejects.toBeInstanceOf(Error);
    await expect(run(rule, 0)).rejects.toThrow("不合法");
    await expect(run(rule, 1.1)).rejects.toThrow("不合法");
    await expect(run(rule, 4)).rejects.toThrow("不合法");
    await expect(run(rule, 2)).resolves.toBeUndefined();
    await expect(run(elementRules.intRange(), "2")).resolves.toBeUndefined();
  });

  it("intRange: uses the default message", async () => {
    await expect(run(elementRules.intRange(), "1.2")).rejects.toThrow(
      "请输入正确的整数"
    );
  });

  it("numberRange: allows empty, validates numeric bounds", async () => {
    const rule = elementRules.numberRange({
      min: 0,
      max: 1,
      message: "不合法"
    });
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, true)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, [0.5])).rejects.toBeInstanceOf(Error);
    await expect(run(rule, -0.01)).rejects.toThrow("不合法");
    await expect(run(rule, 1.01)).rejects.toThrow("不合法");
    await expect(run(rule, 0.5)).resolves.toBeUndefined();
    await expect(
      run(elementRules.numberRange(), "0.5")
    ).resolves.toBeUndefined();
  });

  it("numberRange: uses the default message for invalid values", async () => {
    await expect(run(elementRules.numberRange(), true)).rejects.toThrow(
      "请输入正确的数字"
    );
  });

  it("numberRange: supports exclusive bounds and invalid numeric strings", async () => {
    const rule = elementRules.numberRange({
      min: 0,
      max: 1,
      minExclusive: true,
      maxExclusive: true,
      message: "不合法"
    });
    await expect(run(rule, 0)).rejects.toBeInstanceOf(Error);
    await expect(run(rule, 1)).rejects.toThrow("不合法");
    await expect(run(rule, "Infinity")).rejects.toThrow("不合法");
    await expect(run(rule, "0.5")).resolves.toBeUndefined();
  });

  it("nonNegativeNumber: allows zero and rejects negatives or non-numbers", async () => {
    const rule = elementRules.nonNegativeNumber("不能为负");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, true)).rejects.toThrow("不能为负");
    await expect(run(rule, -0.1)).rejects.toThrow("不能为负");
    await expect(run(rule, 0)).resolves.toBeUndefined();
    await expect(run(rule, "2.5")).resolves.toBeUndefined();
  });

  it("positiveNumber: allows only values greater than zero", async () => {
    const rule = elementRules.positiveNumber("必须大于零");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, true)).rejects.toThrow("必须大于零");
    await expect(run(rule, 0)).rejects.toThrow("必须大于零");
    await expect(run(rule, -1)).rejects.toThrow("必须大于零");
    await expect(run(rule, "0.1")).resolves.toBeUndefined();
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

  it("moneyYuan: handles non-number values and all fallback bounds", async () => {
    const rule = elementRules.moneyYuan({ min: 1, max: 10 });
    await expect(run(rule, { valueOf: () => Number.NaN })).rejects.toThrow(
      "金额需不小于 1"
    );
    await expect(run(rule, false)).rejects.toThrow("金额需不小于 1");
    await expect(run(rule, "1e400")).rejects.toThrow("金额最多保留 2 位小数");
    await expect(run(rule, "9".repeat(400))).rejects.toThrow("金额需不小于 1");
    await expect(run(rule, true)).resolves.toBeUndefined();
    await expect(run(rule, [5])).resolves.toBeUndefined();
    await expect(run(rule, 10.001)).rejects.toThrow("金额最多保留 2 位小数");
    await expect(run(rule, 11)).rejects.toThrow("金额需不大于 10");
    await expect(run(rule, [11])).rejects.toThrow("金额需不大于 10");
    await expect(
      run(elementRules.moneyYuan({ min: 0, minExclusive: true }), [0])
    ).rejects.toThrow("金额需大于 0");
    await expect(run(rule, "11")).rejects.toThrow("金额需不大于 10");
    await expect(run(rule, "0.5")).rejects.toThrow("金额需不小于 1");
  });

  it("moneyYuan: uses default messages", async () => {
    await expect(run(elementRules.moneyYuan(), -1)).rejects.toThrow(
      "金额不合法"
    );
    await expect(
      run(elementRules.moneyYuan({ minExclusive: true }), "0")
    ).rejects.toThrow("金额需大于 0");
  });

  it("moneyYuan: trims strings and enforces the upper bound", async () => {
    const rule = elementRules.moneyYuan({ min: 0, max: 100 });
    await expect(run(rule, " 100 ")).resolves.toBeUndefined();
    await expect(run(rule, "100.01")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "abc")).rejects.toBeInstanceOf(Error);
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

  it("moneyYuanSigned: handles non-number values and string bounds", async () => {
    const rule = elementRules.moneyYuanSigned({
      min: -10,
      minExclusive: true,
      max: 10
    });
    await expect(run(rule, "-10")).rejects.toThrow("金额不合法");
    await expect(run(rule, "11")).rejects.toThrow("金额需不大于 10");
    await expect(run(rule, "bad")).rejects.toThrow("金额最多保留 2 位小数");
    await expect(run(rule, "1e400")).rejects.toThrow("金额最多保留 2 位小数");
    await expect(run(rule, "9".repeat(400))).rejects.toThrow("金额不合法");
    await expect(run(rule, true)).resolves.toBeUndefined();
    await expect(run(rule, "null")).rejects.toThrow("金额最多保留 2 位小数");
    await expect(run(rule, { valueOf: () => Number.NaN })).rejects.toThrow(
      "金额不合法"
    );
    await expect(run(rule, -9.99)).resolves.toBeUndefined();
  });

  it("moneyYuanSigned: handles numeric branches and default bounds", async () => {
    const strict = elementRules.moneyYuanSigned({ min: 0, minExclusive: true });
    await expect(run(strict, 0)).rejects.toThrow("金额不合法");
    await expect(run(strict, "0")).rejects.toThrow("金额不合法");
    await expect(run(strict, 1.999)).rejects.toThrow("金额最多保留 2 位小数");
    await expect(
      run(elementRules.moneyYuanSigned(), -100)
    ).resolves.toBeUndefined();
    await expect(
      run(elementRules.moneyYuanSigned(), "-100")
    ).resolves.toBeUndefined();
  });

  it("arrayMinSize: allows empty, validates size", async () => {
    const rule = elementRules.arrayMinSize(2, "至少2项");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, [])).resolves.toBeUndefined();
    await expect(run(rule, [1])).rejects.toThrow("至少2项");
    await expect(run(rule, 2)).rejects.toThrow("至少2项");
    await expect(run(rule, [1, 2])).resolves.toBeUndefined();
    await expect(run(elementRules.arrayMinSize(2), [1])).rejects.toThrow(
      "至少选择 2 项"
    );
  });

  it("requiredArrayMinSize: rejects empty, validates size", async () => {
    const rule = elementRules.requiredArrayMinSize(2, "至少2项");
    await expect(run(rule, "")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, [])).rejects.toBeInstanceOf(Error);
    await expect(run(rule, [1])).rejects.toThrow("至少2项");
    await expect(run(rule, 2)).rejects.toThrow("至少2项");
    await expect(run(rule, [1, 2])).resolves.toBeUndefined();
    await expect(
      run(elementRules.requiredArrayMinSize(1), "x")
    ).rejects.toThrow("至少选择 1 项");
  });

  it("dateRange: validates length and ordering", async () => {
    const rule = elementRules.dateRange();
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, ["2026-01-02"])).rejects.toBeInstanceOf(Error);
    await expect(run(rule, ["2026-01-02", "2026-01-01"])).rejects.toThrow(
      "请选择有效的日期范围"
    );
    await expect(run(rule, [null, "2026-01-01"])).rejects.toThrow(
      "请选择有效的日期范围"
    );
    await expect(run(rule, ["not-a-date", "2026-01-01"])).rejects.toThrow(
      "请选择有效的日期范围"
    );
    await expect(run(rule, ["2026-01-01", "not-a-date"])).rejects.toThrow(
      "请选择有效的日期范围"
    );
    await expect(
      run(rule, ["2026-01-01", "2026-01-02"])
    ).resolves.toBeUndefined();
  });
});
