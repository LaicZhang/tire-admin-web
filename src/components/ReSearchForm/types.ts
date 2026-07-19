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
  /**
   * 搜索按钮防抖时间（毫秒）。
   * SEARCH-012: 默认 0（按钮提交模式不防抖）；若改为输入即搜必须设 >0（建议 300）。
   */
  debounceMs?: number;
}

export interface SearchFormEmits {
  (e: "search"): void;
  (e: "reset"): void;
}
