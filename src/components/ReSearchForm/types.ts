import type { FormRules } from "element-plus";

export interface SearchFormProps {
  form?: Record<string, any>;
  rules?: FormRules;
  loading?: boolean;
  /** el-card shadow attribute */
  shadow?: "always" | "hover" | "never";
  /** el-card body-style attribute */
  bodyStyle?: Record<string, any>;
}

export interface SearchFormEmits {
  (e: "search"): void;
  (e: "reset"): void;
}
