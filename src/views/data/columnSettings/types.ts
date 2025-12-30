/** 列配置项 */
export interface ColumnSetting {
  id: number;
  uid: string;
  /** 模块名称 */
  module: string;
  /** 原始字段名 */
  field: string;
  /** 列名称 */
  label: string;
  /** 别名 */
  alias?: string;
  /** 是否显示 */
  visible: boolean;
  /** 排序顺序 */
  sortOrder: number;
  /** 列宽度 */
  width?: number;
  /** 是否固定 */
  fixed?: "left" | "right" | false;
}

/** 模块选项 */
export interface ModuleOption {
  label: string;
  value: string;
}

/** 列配置查询参数 */
export interface ColumnSettingQuery {
  module?: string;
}

/** 列配置表单数据 */
export interface ColumnSettingFormData {
  columns: ColumnSetting[];
}
