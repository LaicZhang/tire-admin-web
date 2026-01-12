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
  /** 搜索按钮防抖时间（毫秒），0 或不设置表示不防抖 */
  debounceMs?: number;
}

export interface SearchFormEmits {
  (e: "search"): void;
  (e: "reset"): void;
}
