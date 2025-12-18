import { reactive } from "vue";
import type { FormRules } from "element-plus";

export const formRules = reactive<FormRules>({
  name: [{ required: true, message: "权限名称为必填项", trigger: "blur" }],
  code: [{ required: true, message: "权限标识为必填项", trigger: "blur" }]
});
