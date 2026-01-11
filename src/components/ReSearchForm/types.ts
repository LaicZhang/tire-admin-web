import type { FormRules } from "element-plus";
import type { CSSProperties } from "vue";

export interface SearchFormProps {
  form?: Record<string, unknown>;
  rules?: FormRules;
  loading?: boolean;
  /** el-card shadow attribute */
  shadow?: "always" | "hover" | "never";
  /** el-card body-style attribute */
  bodyStyle?: CSSProperties;
}

export interface SearchFormEmits {
  (e: "search"): void;
  (e: "reset"): void;
}
