import { reactive } from "vue";
import { isPhone } from "@pureadmin/utils";
import type { FormRules } from "element-plus";

/** 6位数字验证码正则 */
export const REGEXP_SIX = /^\d{6}$/;

/** 密码正则（密码格式应为8-18位数字、字母、符号的任意两种组合） */
export const REGEXP_PWD =
  /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)]|[()])+$)(?!^.*[\u4E00-\u9FA5].*$)([^(0-9a-zA-Z)]|[()]|[a-z]|[A-Z]|[0-9]){8,18}$/;

export enum ERROR_TIPS {
  passwordReg = "密码不能为空",
  passwordRuleReg = "密码格式应为8-18位数字、字母、符号的任意两种组合",
  captchaCodeReg = "验证码不能为空",
  captchaCodeCorrectReg = "验证码不正确",
  captchaCodeSixReg = "请输入6位数字验证码",
  phoneReg = "手机号码不能为空",
  phoneCorrectReg = "手机号码格式不正确"
}

/** 登录校验 */
const loginRules = reactive<FormRules>({
  password: [
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error(ERROR_TIPS.passwordReg));
        } else if (!REGEXP_PWD.test(value)) {
          callback(new Error(ERROR_TIPS.passwordRuleReg));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  captchaCode: [
    {
      /**
       * 验证码校验完全由后端处理，
       * 客户端仅进行非空校验以提升用户体验
       */
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error(ERROR_TIPS.captchaCodeReg));
        } else if (value.length < 4) {
          callback(new Error("请输入完整的验证码"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
});

/** 手机登录校验 */
const phoneRules = reactive<FormRules>({
  phone: [
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error(ERROR_TIPS.phoneReg));
        } else if (!isPhone(value)) {
          callback(new Error(ERROR_TIPS.phoneCorrectReg));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  captchaCode: [
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error(ERROR_TIPS.captchaCodeReg));
        } else if (!REGEXP_SIX.test(value)) {
          callback(new Error(ERROR_TIPS.captchaCodeCorrectReg));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
});

/** 忘记密码校验 */
const updateRules = reactive<FormRules>({
  phone: [
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error(ERROR_TIPS.phoneReg));
        } else if (!isPhone(value)) {
          callback(new Error(ERROR_TIPS.phoneCorrectReg));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  captchaCode: [
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error(ERROR_TIPS.captchaCodeReg));
        } else if (!REGEXP_SIX.test(value)) {
          callback(new Error(ERROR_TIPS.captchaCodeSixReg));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  password: [
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error(ERROR_TIPS.passwordReg));
        } else if (!REGEXP_PWD.test(value)) {
          callback(new Error(ERROR_TIPS.passwordRuleReg));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
});

export { loginRules, phoneRules, updateRules };
