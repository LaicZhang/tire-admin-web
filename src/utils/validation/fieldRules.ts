import type { FormItemRule } from "element-plus";
import { elementRules } from "./elementRules";
import {
  MAX_ADDRESS,
  MAX_CODE,
  MAX_DESC,
  MAX_EMAIL,
  MAX_KEYWORD,
  MAX_NAME,
  MAX_REMARK,
  MAX_TITLE
} from "./constraints";

type Trigger = "blur" | "change";

type TextRuleOptions = {
  required?: boolean;
  max?: number;
  label?: string;
  trigger?: Trigger;
};

function asArray(ruleOrRules: FormItemRule | FormItemRule[]): FormItemRule[] {
  return Array.isArray(ruleOrRules) ? ruleOrRules : [ruleOrRules];
}

export const fieldRules = {
  username({
    required = true,
    max = MAX_NAME,
    label = "用户名",
    trigger = "blur"
  }: TextRuleOptions = {}): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredStringTrim(`请输入${label}`, trigger));
    rules.push(
      elementRules.alphanumeric(`${label}只能包含字母和数字`, trigger)
    );
    rules.push(elementRules.maxLen(max, `${label}最多 ${max} 个字符`, trigger));
    return rules;
  },

  password({
    required = true,
    min = 6,
    max = 18,
    label = "密码",
    trigger = "blur"
  }: {
    required?: boolean;
    min?: number;
    max?: number;
    label?: string;
    trigger?: Trigger;
  } = {}): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredStringTrim(`请输入${label}`, trigger));
    rules.push(
      elementRules.lenRange({
        min,
        max,
        message: `${label}长度需在 ${min}-${max} 位`,
        trigger
      })
    );
    return rules;
  },

  name({
    required = true,
    max = MAX_NAME,
    label = "名称",
    trigger = "blur"
  }: TextRuleOptions = {}): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredStringTrim(`请输入${label}`, trigger));
    rules.push(elementRules.maxLen(max, `${label}最多 ${max} 个字符`, trigger));
    return rules;
  },

  title({
    required = true,
    max = MAX_TITLE,
    label = "名称",
    trigger = "blur"
  }: TextRuleOptions = {}): FormItemRule[] {
    return this.name({ required, max, label, trigger });
  },

  code({
    required = false,
    max = MAX_CODE,
    label = "编码",
    trigger = "blur"
  }: TextRuleOptions = {}): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredStringTrim(`请输入${label}`, trigger));
    rules.push(elementRules.maxLen(max, `${label}最多 ${max} 个字符`, trigger));
    return rules;
  },

  keyword({
    max = MAX_KEYWORD,
    label = "关键字",
    trigger = "blur"
  }: Omit<TextRuleOptions, "required"> = {}): FormItemRule[] {
    return [elementRules.maxLen(max, `${label}最多 ${max} 个字符`, trigger)];
  },

  remark({
    required = false,
    max = MAX_REMARK,
    label = "备注",
    trigger = "blur"
  }: TextRuleOptions = {}): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredStringTrim(`请输入${label}`, trigger));
    rules.push(elementRules.maxLen(max, `${label}最多 ${max} 个字符`, trigger));
    return rules;
  },

  desc(options: TextRuleOptions = {}): FormItemRule[] {
    return this.remark({
      ...options,
      max: options.max ?? MAX_DESC,
      label: options.label ?? "备注"
    });
  },

  address({
    required = false,
    max = MAX_ADDRESS,
    label = "地址",
    trigger = "blur"
  }: TextRuleOptions = {}): FormItemRule[] {
    return this.remark({ required, max, label, trigger });
  },

  email({
    required = false,
    max = MAX_EMAIL,
    label = "邮箱",
    trigger = "blur"
  }: TextRuleOptions = {}): FormItemRule[] {
    const rules: FormItemRule[] = [];
    rules.push(
      required
        ? elementRules.requiredEmail(`请输入正确的${label}`, trigger)
        : elementRules.optionalEmail(`请输入正确的${label}`, trigger)
    );
    rules.push(elementRules.maxLen(max, `${label}最多 ${max} 个字符`, trigger));
    return rules;
  },

  phone({
    required = false,
    label = "手机号",
    trigger = "blur"
  }: {
    required?: boolean;
    label?: string;
    trigger?: Trigger;
  } = {}): FormItemRule[] {
    return [
      required
        ? elementRules.requiredPhoneCN(`请输入正确的${label}`, trigger)
        : elementRules.optionalPhoneCN(`请输入正确的${label}`, trigger)
    ];
  },

  uidSelect({
    required = true,
    label,
    trigger = "change"
  }: {
    required?: boolean;
    label: string;
    trigger?: Trigger;
  }): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredSelect(`请选择${label}`, trigger));
    rules.push(elementRules.uuidV4(`${label}不合法`, trigger));
    return rules;
  },

  select({
    required = true,
    label,
    trigger = "change"
  }: {
    required?: boolean;
    label: string;
    trigger?: Trigger;
  }): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredSelect(`请选择${label}`, trigger));
    return rules;
  },

  moneyYuan({
    required = true,
    label = "金额",
    min = 0,
    minExclusive = false,
    max,
    trigger = "blur"
  }: {
    required?: boolean;
    label?: string;
    min?: number;
    minExclusive?: boolean;
    max?: number;
    trigger?: Trigger;
  } = {}): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredSelect(`请输入${label}`, trigger));
    rules.push(
      elementRules.moneyYuan({
        min,
        minExclusive,
        max,
        message: `${label}不合法`,
        trigger
      })
    );
    return rules;
  },

  moneyYuanSigned({
    required = true,
    label = "金额",
    min,
    minExclusive = false,
    max,
    trigger = "blur"
  }: {
    required?: boolean;
    label?: string;
    min?: number;
    minExclusive?: boolean;
    max?: number;
    trigger?: Trigger;
  } = {}): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredSelect(`请输入${label}`, trigger));
    rules.push(
      elementRules.moneyYuanSigned({
        min,
        minExclusive,
        max,
        message: `${label}不合法`,
        trigger
      })
    );
    return rules;
  },

  positiveInt({
    required = true,
    label,
    min = 1,
    max,
    trigger = "blur"
  }: {
    required?: boolean;
    label: string;
    min?: number;
    max?: number;
    trigger?: Trigger;
  }): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredSelect(`请输入${label}`, trigger));
    rules.push(
      elementRules.intRange({
        min,
        max,
        message: `${label}需为整数`,
        trigger
      })
    );
    return rules;
  },

  nonNegativeNumber({
    required = false,
    label,
    min = 0,
    max,
    trigger = "blur"
  }: {
    required?: boolean;
    label: string;
    min?: number;
    max?: number;
    trigger?: Trigger;
  }): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredSelect(`请输入${label}`, trigger));
    rules.push(
      elementRules.numberRange({
        min,
        max,
        message: `${label}不合法`,
        trigger
      })
    );
    return rules;
  },

  date({
    required = true,
    label = "日期",
    trigger = "change"
  }: {
    required?: boolean;
    label?: string;
    trigger?: Trigger;
  } = {}): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredDate(`请选择${label}`, trigger));
    return rules;
  },

  dateRange({
    required = false,
    label = "日期范围",
    trigger = "change"
  }: {
    required?: boolean;
    label?: string;
    trigger?: Trigger;
  } = {}): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(elementRules.requiredSelect(`请选择${label}`, trigger));
    rules.push(elementRules.dateRange(`请选择有效的${label}`, trigger));
    return rules;
  },

  arrayMinSize({
    required = false,
    min = 1,
    label = "选项",
    trigger = "change"
  }: {
    required?: boolean;
    min?: number;
    label?: string;
    trigger?: Trigger;
  } = {}): FormItemRule[] {
    const rules: FormItemRule[] = [];
    if (required)
      rules.push(
        elementRules.requiredArrayMinSize(
          min,
          `至少选择 ${min} 个${label}`,
          trigger
        )
      );
    else
      rules.push(
        elementRules.arrayMinSize(min, `至少选择 ${min} 个${label}`, trigger)
      );
    return rules;
  },

  any(ruleOrRules: FormItemRule | FormItemRule[]): FormItemRule[] {
    return asArray(ruleOrRules);
  }
};
