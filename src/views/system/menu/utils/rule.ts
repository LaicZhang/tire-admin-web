import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { resolveTrustedFrameSrc } from "@/utils/frame";

export const formRules = reactive<FormRules>({
  title: [{ required: true, message: "菜单名称为必填项", trigger: "blur" }],
  path: [{ required: true, message: "路由路径为必填项", trigger: "blur" }],
  // component: [{ required: true, message: "组件路径为必填项", trigger: "blur" }], // Not strictly required for all types
  auths: [{ required: true, message: "权限标识为必填项", trigger: "blur" }],
  frameSrc: [
    {
      trigger: "blur",
      validator: (_rule, value, callback) => {
        if (!value) {
          callback();
          return;
        }

        const result = resolveTrustedFrameSrc(String(value));
        callback(result.trusted ? undefined : new Error(result.reason));
      }
    }
  ]
});
