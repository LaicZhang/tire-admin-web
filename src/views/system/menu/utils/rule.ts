import { reactive } from "vue";
import type { FormRules } from "element-plus";

export const formRules = reactive<FormRules>({
  title: [{ required: true, message: "菜单名称为必填项", trigger: "blur" }],
  path: [{ required: true, message: "路由路径为必填项", trigger: "blur" }],
  // component: [{ required: true, message: "组件路径为必填项", trigger: "blur" }], // Not strictly required for all types
  auths: [{ required: true, message: "权限标识为必填项", trigger: "blur" }]
});
