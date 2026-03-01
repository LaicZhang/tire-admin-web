import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { fieldRules } from "@/utils/validation/fieldRules";

/** 自定义表单规则校验 */
export const rule = reactive<FormRules>({
  username: fieldRules.username({ label: "用户名" }),
  phone: fieldRules.phone({ required: true, label: "手机号" }),
  password: fieldRules.password({ label: "密码" }),
  status: fieldRules.select({ label: "状态" })
});
