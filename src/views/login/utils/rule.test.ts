import { describe, expect, it } from "vitest";
import { ERROR_TIPS, loginRules, phoneRules, updateRules } from "./rule";

type ValidatorRule = {
  validator?: (
    rule: unknown,
    value: string,
    callback: (error?: Error) => void
  ) => void;
};

function firstRule(ruleGroup: unknown): ValidatorRule {
  return ((ruleGroup as ValidatorRule[] | undefined) ?? [])[0] ?? {};
}

function run(rule: ValidatorRule, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!rule.validator) return resolve();
    rule.validator({}, value, (error?: Error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

describe("login rule validators", () => {
  it("password validator rejects empty values and weak passwords", async () => {
    const passwordRule = firstRule(loginRules.password);

    await expect(run(passwordRule, "")).rejects.toThrow(ERROR_TIPS.passwordReg);
    await expect(run(passwordRule, "12345678")).rejects.toThrow(
      ERROR_TIPS.passwordRuleReg
    );
    await expect(run(passwordRule, "中文Abcd1234")).rejects.toThrow(
      ERROR_TIPS.passwordRuleReg
    );
  });

  it("password validator accepts valid boundary values and rejects overlong values", async () => {
    const passwordRule = firstRule(loginRules.password);

    await expect(run(passwordRule, "Abcd1234")).resolves.toBeUndefined();
    await expect(
      run(passwordRule, "A1bcdefghijklmno12")
    ).resolves.toBeUndefined();
    await expect(run(passwordRule, "Abcd1234!Abcd1234!x")).rejects.toThrow(
      ERROR_TIPS.passwordRuleReg
    );
  });

  it("login captcha validator enforces missing and incomplete values", async () => {
    const captchaRule = firstRule(loginRules.captchaCode);

    await expect(run(captchaRule, "")).rejects.toThrow(
      ERROR_TIPS.captchaCodeReg
    );
    await expect(run(captchaRule, "123")).rejects.toThrow("请输入完整的验证码");
    await expect(run(captchaRule, "1234")).resolves.toBeUndefined();
  });

  it("phone login rules reject invalid phone numbers and non-six-digit codes", async () => {
    const phoneRule = firstRule(phoneRules.phone);
    const captchaRule = firstRule(phoneRules.captchaCode);

    await expect(run(phoneRule, "")).rejects.toThrow(ERROR_TIPS.phoneReg);
    await expect(run(phoneRule, "123456")).rejects.toThrow(
      ERROR_TIPS.phoneCorrectReg
    );
    await expect(run(phoneRule, "13800138000")).resolves.toBeUndefined();

    await expect(run(captchaRule, "")).rejects.toThrow(
      ERROR_TIPS.captchaCodeReg
    );
    await expect(run(captchaRule, "12345")).rejects.toThrow(
      ERROR_TIPS.captchaCodeCorrectReg
    );
    await expect(run(captchaRule, "123456")).resolves.toBeUndefined();
  });

  it("update rules keep the stronger six-digit captcha contract", async () => {
    const captchaRule = firstRule(updateRules.captchaCode);

    await expect(run(captchaRule, "12345")).rejects.toThrow(
      ERROR_TIPS.captchaCodeSixReg
    );
    await expect(run(captchaRule, "123456")).resolves.toBeUndefined();
  });
});
