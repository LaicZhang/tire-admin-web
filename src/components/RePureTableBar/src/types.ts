import type { PropType } from "vue";

/** 表格 ref 类型定义 */
export interface TableRefType<T = Record<string, unknown>> {
  size?: string;
  data?: Array<T>;
  toggleRowExpansion: (row: T, expanded?: boolean) => void;
}

/** PureTableBar 组件 Props */
export const tableBarProps = {
  /** 头部最左边的标题 */
  title: {
    type: String,
    default: "列表"
  },
  /** 对于树形表格，如果想启用展开和折叠功能，传入当前表格的ref即可 */
  tableRef: {
    type: Object as PropType<TableRefType>
  },
  /** 需要展示的列 */
  columns: {
    type: Array as PropType<TableColumnList>,
    default: () => []
  },
  isExpandAll: {
    type: Boolean,
    default: true
  },
  tableKey: {
    type: [String, Number] as PropType<string | number>,
    default: "0"
  }
};

export type TableBarProps = typeof tableBarProps;

/** 密度尺寸类型 */
export type TableSize = "large" | "default" | "small";

/** 密度尺寸选项 */
export const TABLE_SIZE_OPTIONS: Array<{ value: TableSize; label: string }> = [
  { value: "large", label: "宽松" },
  { value: "default", label: "默认" },
  { value: "small", label: "紧凑" }
];
