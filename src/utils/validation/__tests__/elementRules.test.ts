import { describe, expect, it } from "vitest";
import { elementRules } from "../elementRules";
import type { FormItemRule } from "element-plus";

function run(rule: FormItemRule, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    rule.validator({}, value, (err?: Error) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

describe("elementRules", () => {
  it("requiredStringTrim: trims and rejects empty", async () => {
    const rule = elementRules.requiredStringTrim("必填");
    await expect(run(rule, "")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "   ")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "a")).resolves.toBeUndefined();
  });

  it("optionalPhoneCN: allows empty, validates format", async () => {
    const rule = elementRules.optionalPhoneCN("手机号不正确");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, undefined)).resolves.toBeUndefined();
    await expect(run(rule, "123")).rejects.toBeInstanceOf(Error);
    await expect(run(rule, "13800138000")).resolves.toBeUndefined();
  });

  it("optionalEmail: allows empty, validates format", async () => {
    const rule = elementRules.optionalEmail("邮箱不正确");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, "a@b.com")).resolves.toBeUndefined();
    await expect(run(rule, "a@b")).rejects.toBeInstanceOf(Error);
  });

  it("uuidV4: allows empty, validates uuid", async () => {
    const rule = elementRules.uuidV4("uuid不正确");
    await expect(run(rule, "")).resolves.toBeUndefined();
    await expect(run(rule, "not-uuid")).rejects.toBeInstanceOf(Error);
    await expect(
      run(rule, "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    ).resolves.toBeUndefined();
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
