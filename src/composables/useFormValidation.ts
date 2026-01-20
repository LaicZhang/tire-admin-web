import { ref, computed, type Ref } from "vue";

export interface ValidationRule {
  /** 验证函数 */
  validator: (value: unknown) => boolean | Promise<boolean>;
  /** 错误消息 */
  message: string;
  /** 触发时机 */
  trigger?: "blur" | "change" | "submit";
}

export interface FieldValidation {
  /** 是否验证通过 */
  valid: boolean;
  /** 错误消息 */
  message: string;
  /** 是否正在验证 */
  validating: boolean;
}

export interface UseFormValidationOptions<T extends Record<string, unknown>> {
  /** 表单数据 */
  formData: Ref<T>;
  /** 验证规则 */
  rules: Partial<Record<keyof T, ValidationRule[]>>;
}

export interface UseFormValidationReturn<T extends Record<string, unknown>> {
  /** 字段验证状态 */
  fieldState: Ref<Partial<Record<keyof T, FieldValidation>>>;
  /** 是否所有字段都验证通过 */
  isValid: Ref<boolean>;
  /** 验证单个字段 */
  validateField: (field: keyof T) => Promise<boolean>;
  /** 验证所有字段 */
  validateAll: () => Promise<boolean>;
  /** 重置验证状态 */
  resetValidation: () => void;
  /** 获取第一个错误消息 */
  firstError: Ref<string>;
}

/**
 * 预定义验证规则
 */
export const validators = {
  /** 必填 */
  required: (message = "此字段为必填项"): ValidationRule => ({
    validator: (value: unknown) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message,
    trigger: "blur"
  }),

  /** 最小长度 */
  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value: unknown) => {
      if (typeof value !== "string") return true;
      return value.length >= min;
    },
    message: message || `最少需要 ${min} 个字符`,
    trigger: "blur"
  }),

  /** 最大长度 */
  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value: unknown) => {
      if (typeof value !== "string") return true;
      return value.length <= max;
    },
    message: message || `最多允许 ${max} 个字符`,
    trigger: "change"
  }),

  /** 邮箱格式 */
  email: (message = "请输入有效的邮箱地址"): ValidationRule => ({
    validator: (value: unknown) => {
      if (!value || typeof value !== "string") return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message,
    trigger: "blur"
  }),

  /** 手机号码（中国大陆） */
  phone: (message = "请输入有效的手机号码"): ValidationRule => ({
    validator: (value: unknown) => {
      if (!value || typeof value !== "string") return true;
      return /^1[3-9]\d{9}$/.test(value);
    },
    message,
    trigger: "blur"
  }),

  /** 数字范围 */
  range: (min: number, max: number, message?: string): ValidationRule => ({
    validator: (value: unknown) => {
      const num = Number(value);
      if (isNaN(num)) return true;
      return num >= min && num <= max;
    },
    message: message || `数值需在 ${min} 到 ${max} 之间`,
    trigger: "blur"
  }),

  /** 正整数 */
  positiveInteger: (message = "请输入正整数"): ValidationRule => ({
    validator: (value: unknown) => {
      // 空值跳过验证（需配合 required 使用）
      if (value === null || value === undefined || value === "") return true;
      const num = Number(value);
      return Number.isInteger(num) && num > 0;
    },
    message,
    trigger: "blur"
  }),

  /** 正则匹配 */
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validator: (value: unknown) => {
      if (!value || typeof value !== "string") return true;
      return regex.test(value);
    },
    message,
    trigger: "blur"
  }),

  /** 自定义验证 */
  custom: (
    validator: (value: unknown) => boolean | Promise<boolean>,
    message: string,
    trigger: "blur" | "change" | "submit" = "blur"
  ): ValidationRule => ({
    validator,
    message,
    trigger
  })
};

/**
 * 表单验证 Composable
 *
 * @description 提供统一的表单验证逻辑，支持同步/异步验证
 *
 * @example
 * ```vue
 * <script setup>
 * import { ref } from 'vue';
 * import { useFormValidation, validators } from '@/composables/useFormValidation';
 *
 * const formData = ref({
 *   name: '',
 *   email: '',
 *   phone: ''
 * });
 *
 * const { fieldState, isValid, validateField, validateAll, firstError } = useFormValidation({
 *   formData,
 *   rules: {
 *     name: [validators.required(), validators.minLength(2)],
 *     email: [validators.required(), validators.email()],
 *     phone: [validators.phone()]
 *   }
 * });
 *
 * async function handleSubmit() {
 *   if (await validateAll()) {
 *     // 提交表单
 *   }
 * }
 * </script>
 * ```
 */
export function useFormValidation<T extends Record<string, unknown>>(
  options: UseFormValidationOptions<T>
): UseFormValidationReturn<T> {
  const { formData, rules } = options;

  const fieldState = ref<Partial<Record<keyof T, FieldValidation>>>({});

  // 初始化字段状态
  Object.keys(rules).forEach(field => {
    (fieldState.value as Record<string, FieldValidation>)[field] = {
      valid: true,
      message: "",
      validating: false
    };
  });

  const isValid = computed(() => {
    return Object.values(fieldState.value).every(
      state => (state as FieldValidation).valid
    );
  });

  const firstError = computed(() => {
    const invalidField = Object.values(fieldState.value).find(
      state => !(state as FieldValidation).valid
    ) as FieldValidation | undefined;
    return invalidField?.message || "";
  });

  async function validateField(field: keyof T): Promise<boolean> {
    const fieldRules = rules[field];
    if (!fieldRules) return true;

    const state = (fieldState.value as Record<keyof T, FieldValidation>)[field];
    if (!state) return true;

    state.validating = true;
    state.valid = true;
    state.message = "";

    try {
      const value = formData.value[field];

      for (const rule of fieldRules) {
        const result = await rule.validator(value);
        if (!result) {
          state.valid = false;
          state.message = rule.message;
          break;
        }
      }
    } finally {
      state.validating = false;
    }

    return state.valid;
  }

  async function validateAll(): Promise<boolean> {
    const fields = Object.keys(rules) as (keyof T)[];
    const results = await Promise.all(fields.map(validateField));
    return results.every(Boolean);
  }

  function resetValidation() {
    Object.keys(fieldState.value).forEach(field => {
      const state = (fieldState.value as Record<string, FieldValidation>)[
        field
      ];
      state.valid = true;
      state.message = "";
      state.validating = false;
    });
  }

  return {
    fieldState: fieldState as Ref<Partial<Record<keyof T, FieldValidation>>>,
    isValid,
    validateField,
    validateAll,
    resetValidation,
    firstError
  };
}
