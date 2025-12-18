import { reactive } from "vue";
import type { FormRules } from "element-plus";

export const formRules = reactive<FormRules>({
  name: [{ required: true, message: "公司名称为必填项", trigger: "blur" }],
  contact: [{ required: true, message: "联系人为必填项", trigger: "blur" }],
  phone: [
    { required: true, message: "联系电话为必填项", trigger: "blur" }
    // Add regex for phone validation if needed
  ]
});
