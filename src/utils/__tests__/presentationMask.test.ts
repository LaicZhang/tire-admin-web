import { describe, expect, it } from "vitest";
import {
  maskBankAccountDisplay,
  maskEmailDisplay,
  maskPhoneDisplay
} from "../presentationMask";

describe("presentationMask", () => {
  it("masks phone numbers for list display", () => {
    expect(maskPhoneDisplay("13812345678")).toBe("138****5678");
  });

  it("masks bank accounts for list display", () => {
    expect(maskBankAccountDisplay("6222021234567890")).toBe("622202******7890");
  });

  it("masks emails for list display", () => {
    expect(maskEmailDisplay("alice@example.com")).toBe("a***@example.com");
  });

  it("renders missing values as dash", () => {
    expect(maskPhoneDisplay(undefined)).toBe("-");
    expect(maskEmailDisplay(null)).toBe("-");
    expect(maskBankAccountDisplay("")).toBe("-");
  });
});
