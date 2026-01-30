import { reactive } from "vue";
import type { FormRules } from "element-plus";

export const formRules = reactive<FormRules>({
  type: [{ required: true, message: "方法为必填项", trigger: "blur" }],
  path: [
    { required: true, message: "Path 为必填项", trigger: "blur" },
    { pattern: /^\//, message: "Path 需要以 / 开头", trigger: "blur" }
  ]
});
