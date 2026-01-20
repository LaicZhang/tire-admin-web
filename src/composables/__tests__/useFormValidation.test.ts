import { describe, it, expect } from "vitest";
import { ref } from "vue";
import { useFormValidation, validators } from "../useFormValidation";

describe("useFormValidation", () => {
  describe("validators", () => {
    describe("required", () => {
      const rule = validators.required();

      it("should fail for empty string", () => {
        expect(rule.validator("")).toBe(false);
      });

      it("should fail for whitespace only", () => {
        expect(rule.validator("   ")).toBe(false);
      });

      it("should pass for non-empty string", () => {
        expect(rule.validator("hello")).toBe(true);
      });

      it("should fail for null", () => {
        expect(rule.validator(null)).toBe(false);
      });

      it("should fail for undefined", () => {
        expect(rule.validator(undefined)).toBe(false);
      });

      it("should fail for empty array", () => {
        expect(rule.validator([])).toBe(false);
      });

      it("should pass for non-empty array", () => {
        expect(rule.validator([1, 2, 3])).toBe(true);
      });
    });

    describe("minLength", () => {
      const rule = validators.minLength(3);

      it("should fail for short string", () => {
        expect(rule.validator("ab")).toBe(false);
      });

      it("should pass for exact length", () => {
        expect(rule.validator("abc")).toBe(true);
      });

      it("should pass for longer string", () => {
        expect(rule.validator("abcd")).toBe(true);
      });
    });

    describe("maxLength", () => {
      const rule = validators.maxLength(5);

      it("should pass for short string", () => {
        expect(rule.validator("abc")).toBe(true);
      });

      it("should pass for exact length", () => {
        expect(rule.validator("abcde")).toBe(true);
      });

      it("should fail for longer string", () => {
        expect(rule.validator("abcdef")).toBe(false);
      });
    });

    describe("email", () => {
      const rule = validators.email();

      it("should pass for valid email", () => {
        expect(rule.validator("test@example.com")).toBe(true);
      });

      it("should fail for invalid email", () => {
        expect(rule.validator("not-an-email")).toBe(false);
      });

      it("should pass for empty string (optional)", () => {
        expect(rule.validator("")).toBe(true);
      });
    });

    describe("phone", () => {
      const rule = validators.phone();

      it("should pass for valid phone", () => {
        expect(rule.validator("13812345678")).toBe(true);
      });

      it("should fail for invalid phone", () => {
        expect(rule.validator("12345678")).toBe(false);
      });
    });

    describe("range", () => {
      const rule = validators.range(1, 100);

      it("should pass for value in range", () => {
        expect(rule.validator(50)).toBe(true);
      });

      it("should pass for min value", () => {
        expect(rule.validator(1)).toBe(true);
      });

      it("should pass for max value", () => {
        expect(rule.validator(100)).toBe(true);
      });

      it("should fail for value below range", () => {
        expect(rule.validator(0)).toBe(false);
      });

      it("should fail for value above range", () => {
        expect(rule.validator(101)).toBe(false);
      });
    });

    describe("positiveInteger", () => {
      const rule = validators.positiveInteger();

      it("should pass for positive integer", () => {
        expect(rule.validator(5)).toBe(true);
      });

      it("should fail for zero", () => {
        expect(rule.validator(0)).toBe(false);
      });

      it("should fail for negative", () => {
        expect(rule.validator(-1)).toBe(false);
      });

      it("should fail for float", () => {
        expect(rule.validator(1.5)).toBe(false);
      });
    });

    describe("pattern", () => {
      const rule = validators.pattern(/^[A-Z]+$/, "只允许大写字母");

      it("should pass for matching pattern", () => {
        expect(rule.validator("ABC")).toBe(true);
      });

      it("should fail for non-matching pattern", () => {
        expect(rule.validator("abc")).toBe(false);
      });
    });
  });

  describe("useFormValidation composable", () => {
    it("should validate single field", async () => {
      const formData = ref({ name: "" });
      const { validateField, fieldState } = useFormValidation({
        formData,
        rules: {
          name: [validators.required()]
        }
      });

      const result = await validateField("name");
      expect(result).toBe(false);
      expect(fieldState.value.name?.valid).toBe(false);
      expect(fieldState.value.name?.message).toBe("此字段为必填项");
    });

    it("should validate all fields", async () => {
      const formData = ref({ name: "", email: "invalid" });
      const { validateAll, isValid } = useFormValidation({
        formData,
        rules: {
          name: [validators.required()],
          email: [validators.email()]
        }
      });

      const result = await validateAll();
      expect(result).toBe(false);
      expect(isValid.value).toBe(false);
    });

    it("should return true when all valid", async () => {
      const formData = ref({ name: "John", email: "john@example.com" });
      const { validateAll, isValid } = useFormValidation({
        formData,
        rules: {
          name: [validators.required()],
          email: [validators.email()]
        }
      });

      const result = await validateAll();
      expect(result).toBe(true);
      expect(isValid.value).toBe(true);
    });

    it("should reset validation", async () => {
      const formData = ref({ name: "" });
      const { validateField, resetValidation, fieldState } = useFormValidation({
        formData,
        rules: {
          name: [validators.required()]
        }
      });

      await validateField("name");
      expect(fieldState.value.name?.valid).toBe(false);

      resetValidation();
      expect(fieldState.value.name?.valid).toBe(true);
      expect(fieldState.value.name?.message).toBe("");
    });

    it("should return first error", async () => {
      const formData = ref({ name: "", email: "" });
      const { validateAll, firstError } = useFormValidation({
        formData,
        rules: {
          name: [validators.required("名称必填")],
          email: [validators.required("邮箱必填")]
        }
      });

      await validateAll();
      expect(firstError.value).toBe("名称必填");
    });
  });
});
