import type { FormItemRule } from "element-plus";

type Trigger = "blur" | "change";

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function makeRule(
  rule: Omit<FormItemRule, "trigger"> & { trigger?: Trigger }
): FormItemRule {
  return {
    trigger: rule.trigger,
    ...rule
  } as FormItemRule;
}

export const elementRules = {
  requiredStringTrim(
    message = "请填写此字段",
    trigger: Trigger = "blur"
  ): FormItemRule {
    return makeRule({
      required: true,
      message,
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) callback(new Error(message));
        else callback();
      }
    });
  },

  requiredSelect(
    message = "请选择",
    trigger: Trigger = "change"
  ): FormItemRule {
    return makeRule({
      required: true,
      message,
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) callback(new Error(message));
        else callback();
      }
    });
  },

  maxLen(
    max: number,
    message?: string,
    trigger: Trigger = "blur"
  ): FormItemRule {
    const msg = message || `最多输入 ${max} 个字符`;
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined) return callback();
        const s = typeof value === "string" ? value : String(value);
        if (s.length > max) callback(new Error(msg));
        else callback();
      }
    });
  },

  lenRange({
    min,
    max,
    message,
    trigger = "blur"
  }: {
    min?: number;
    max?: number;
    message?: string;
    trigger?: Trigger;
  } = {}): FormItemRule {
    const msg = message || "长度不合法";
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (value === null || value === undefined) return callback();
        const s = typeof value === "string" ? value : String(value);
        if (typeof min === "number" && s.length < min)
          return callback(new Error(msg));
        if (typeof max === "number" && s.length > max)
          return callback(new Error(msg));
        callback();
      }
    });
  },

  alphanumeric(
    message = "只能包含字母和数字",
    trigger: Trigger = "blur"
  ): FormItemRule {
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();
        const s = typeof value === "string" ? value.trim() : String(value);
        if (!/^[0-9a-z]+$/i.test(s)) callback(new Error(message));
        else callback();
      }
    });
  },

  requiredPhoneCN(
    message = "请输入正确的手机号",
    trigger: Trigger = "blur"
  ): FormItemRule {
    return makeRule({
      required: true,
      message,
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback(new Error(message));
        const s = typeof value === "string" ? value.trim() : String(value);
        if (!/^1[3-9]\d{9}$/.test(s)) callback(new Error(message));
        else callback();
      }
    });
  },

  optionalPhoneCN(
    message = "请输入正确的手机号",
    trigger: Trigger = "blur"
  ): FormItemRule {
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();
        const s = typeof value === "string" ? value.trim() : String(value);
        if (!/^1[3-9]\d{9}$/.test(s)) callback(new Error(message));
        else callback();
      }
    });
  },

  requiredEmail(
    message = "请输入正确的邮箱",
    trigger: Trigger = "blur"
  ): FormItemRule {
    return makeRule({
      required: true,
      message,
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback(new Error(message));
        const s = typeof value === "string" ? value.trim() : String(value);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) callback(new Error(message));
        else callback();
      }
    });
  },

  optionalEmail(
    message = "请输入正确的邮箱",
    trigger: Trigger = "blur"
  ): FormItemRule {
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();
        const s = typeof value === "string" ? value.trim() : String(value);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) callback(new Error(message));
        else callback();
      }
    });
  },

  requiredDate(
    message = "请选择日期",
    trigger: Trigger = "change"
  ): FormItemRule {
    return makeRule({
      required: true,
      message,
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback(new Error(message));
        const t = new Date(value as string | number | Date).getTime();
        if (!Number.isFinite(t)) callback(new Error(message));
        else callback();
      }
    });
  },

  uuidV4(message = "格式不正确", trigger: Trigger = "blur"): FormItemRule {
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();
        const s = typeof value === "string" ? value.trim() : String(value);
        if (!UUID_V4.test(s)) callback(new Error(message));
        else callback();
      }
    });
  },

  positiveInt(
    message = "请输入正整数",
    trigger: Trigger = "blur"
  ): FormItemRule {
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isInteger(n) || n <= 0) callback(new Error(message));
        else callback();
      }
    });
  },

  intRange({
    min,
    max,
    message,
    trigger = "blur"
  }: {
    min?: number;
    max?: number;
    message?: string;
    trigger?: Trigger;
  } = {}): FormItemRule {
    const msg = message || "请输入正确的整数";
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isInteger(n)) return callback(new Error(msg));
        if (typeof min === "number" && n < min) return callback(new Error(msg));
        if (typeof max === "number" && n > max) return callback(new Error(msg));
        callback();
      }
    });
  },

  numberRange({
    min,
    max,
    minExclusive = false,
    maxExclusive = false,
    message,
    trigger = "blur"
  }: {
    min?: number;
    max?: number;
    minExclusive?: boolean;
    maxExclusive?: boolean;
    message?: string;
    trigger?: Trigger;
  } = {}): FormItemRule {
    const msg = message || "请输入正确的数字";
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n)) return callback(new Error(msg));
        if (typeof min === "number" && (minExclusive ? n <= min : n < min)) {
          return callback(new Error(msg));
        }
        if (typeof max === "number" && (maxExclusive ? n >= max : n > max)) {
          return callback(new Error(msg));
        }
        callback();
      }
    });
  },

  nonNegativeNumber(
    message = "请输入不小于 0 的数字",
    trigger: Trigger = "blur"
  ): FormItemRule {
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n) || n < 0) callback(new Error(message));
        else callback();
      }
    });
  },

  positiveNumber(
    message = "请输入大于 0 的数字",
    trigger: Trigger = "blur"
  ): FormItemRule {
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n) || n <= 0) callback(new Error(message));
        else callback();
      }
    });
  },

  arrayMinSize(
    min: number,
    message?: string,
    trigger: Trigger = "change"
  ): FormItemRule {
    const msg = message || `至少选择 ${min} 项`;
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();
        if (!Array.isArray(value) || value.length < min)
          callback(new Error(msg));
        else callback();
      }
    });
  },

  requiredArrayMinSize(
    min: number,
    message?: string,
    trigger: Trigger = "change"
  ): FormItemRule {
    const msg = message || `至少选择 ${min} 项`;
    return makeRule({
      required: true,
      message: msg,
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback(new Error(msg));
        if (!Array.isArray(value) || value.length < min)
          callback(new Error(msg));
        else callback();
      }
    });
  },

  moneyYuan({
    min = 0,
    minExclusive = false,
    max,
    message,
    trigger = "blur"
  }: {
    min?: number;
    minExclusive?: boolean;
    max?: number;
    message?: string;
    trigger?: Trigger;
  } = {}): FormItemRule {
    const msg =
      message ||
      (minExclusive
        ? `金额需大于 ${min}`
        : min > 0
          ? `金额需不小于 ${min}`
          : "金额不合法");

    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();

        if (typeof value === "string") {
          const s = value.trim();
          if (!/^\d+(\.\d{1,2})?$/.test(s))
            return callback(new Error("金额最多保留 2 位小数"));
          const n = Number(s);
          if (!Number.isFinite(n)) return callback(new Error(msg));
          if (minExclusive ? n <= min : n < min)
            return callback(new Error(msg));
          if (typeof max === "number" && n > max)
            return callback(new Error(`金额需不大于 ${max}`));
          return callback();
        }

        if (!isFiniteNumber(value)) {
          const n = Number(value);
          if (!Number.isFinite(n)) return callback(new Error(msg));
          if (minExclusive ? n <= min : n < min)
            return callback(new Error(msg));
          if (typeof max === "number" && n > max)
            return callback(new Error(`金额需不大于 ${max}`));
          return callback();
        }

        const decimals = String(value).split(".")[1]?.length || 0;
        if (decimals > 2) return callback(new Error("金额最多保留 2 位小数"));
        if (minExclusive ? value <= min : value < min)
          return callback(new Error(msg));
        if (typeof max === "number" && value > max)
          return callback(new Error(`金额需不大于 ${max}`));
        callback();
      }
    });
  },

  moneyYuanSigned({
    min,
    minExclusive = false,
    max,
    message = "金额不合法",
    trigger = "blur"
  }: {
    min?: number;
    minExclusive?: boolean;
    max?: number;
    message?: string;
    trigger?: Trigger;
  } = {}): FormItemRule {
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();

        if (typeof value === "string") {
          const s = value.trim();
          if (!/^-?\d+(\.\d{1,2})?$/.test(s))
            return callback(new Error("金额最多保留 2 位小数"));
          const n = Number(s);
          if (!Number.isFinite(n)) return callback(new Error(message));
          if (typeof min === "number" && (minExclusive ? n <= min : n < min))
            return callback(new Error(message));
          if (typeof max === "number" && n > max)
            return callback(new Error(`金额需不大于 ${max}`));
          return callback();
        }

        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n)) return callback(new Error(message));
        const decimals = String(n).split(".")[1]?.length || 0;
        if (decimals > 2) return callback(new Error("金额最多保留 2 位小数"));
        if (typeof min === "number" && (minExclusive ? n <= min : n < min))
          return callback(new Error(message));
        if (typeof max === "number" && n > max)
          return callback(new Error(`金额需不大于 ${max}`));
        callback();
      }
    });
  },

  dateRange(
    message = "请选择有效的日期范围",
    trigger: Trigger = "change"
  ): FormItemRule {
    return makeRule({
      trigger,
      validator: (_rule, value, callback) => {
        if (isEmptyValue(value)) return callback();
        if (!Array.isArray(value) || value.length !== 2)
          return callback(new Error(message));
        const [start, end] = value as unknown[];
        if (!start || !end) return callback(new Error(message));
        const s = new Date(start as string | number | Date).getTime();
        const e = new Date(end as string | number | Date).getTime();
        if (!Number.isFinite(s) || !Number.isFinite(e) || s > e)
          return callback(new Error(message));
        callback();
      }
    });
  }
};
