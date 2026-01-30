import type { TableColumnList } from "@/utils/columnFactories";
import type { CommonResult, PaginatedResponseDto } from "@/api/type";
import type { Component } from "vue";
import type { IconInput } from "@/components/ReIcon/src/hooks";

/**
 * CRUD API 接口
 */
export type CrudQuery = Record<string, unknown>;

export interface CrudApi<T, QueryDto extends CrudQuery = CrudQuery> {
  /** 分页查询列表 */
  getList: (
    index: number,
    params?: QueryDto
  ) => Promise<CommonResult<PaginatedResponseDto<T>>>;
  /** 创建 */
  add?: (data: Partial<T>) => Promise<CommonResult<T>>;
  /** 获取详情 */
  get?: (uid: string) => Promise<CommonResult<T>>;
  /** 更新 */
  update?: (uid: string, data: Partial<T>) => Promise<CommonResult<T>>;
  /** 删除 */
  delete?: (uid: string) => Promise<CommonResult<void>>;
  /** 批量获取 */
  batch?: (uids: string[]) => Promise<CommonResult<T[]>>;
  /** 恢复 */
  restore?: (uid: string) => Promise<CommonResult<T>>;
}

/**
 * 搜索表单字段配置
 */
export interface SearchFormField {
  /** 字段标签 */
  label: string;
  /** 字段名称 */
  prop: string;
  /** 字段类型 */
  type: "input" | "select" | "date" | "daterange" | "number";
  /** 占位符 */
  placeholder?: string;
  /** 宽度 */
  width?: string | number;
  /** 选项（select 类型） */
  options?: Array<{ label: string; value: unknown }>;
  /** 其他属性 */
  props?: Record<string, unknown>;
}

/**
 * 自定义操作按钮配置
 */
export interface CustomAction<Row = unknown> {
  /** 按钮标签 */
  label: string;
  /** 按钮类型 */
  type?: "primary" | "success" | "warning" | "danger" | "info";
  /** 是否显示图标 */
  icon?: IconInput;
  /** 点击事件 */
  handler: (row: Row) => void;
  /** 显示条件 */
  show?: (row: Row) => boolean;
}

/**
 * 表格操作配置
 */
export interface TableOperation<Row = unknown> {
  /** 是否显示查看按钮 */
  showView?: boolean;
  /** 是否显示编辑按钮 */
  showEdit?: boolean;
  /** 是否显示删除按钮 */
  showDelete?: boolean;
  /** 是否显示恢复按钮 */
  showRestore?: boolean;
  /** 自定义操作按钮 */
  customActions?: Array<CustomAction<Row>>;
}

/**
 * CRUD 页面配置
 */
export interface CrudPageConfig<
  T extends Record<string, unknown> = Record<string, unknown>,
  QueryDto extends CrudQuery = CrudQuery
> {
  /** API 接口 */
  api: CrudApi<T, QueryDto>;
  /** 表格列配置 */
  columns: TableColumnList;
  /** 搜索表单配置 */
  searchForm?: {
    /** 表单字段 */
    fields: SearchFormField[];
    /** 默认值 */
    defaultValues?: Record<string, unknown>;
  };
  /** 操作按钮配置 */
  actions?: {
    /** 是否显示新增按钮 */
    create?: boolean;
    /** 新增按钮文本 */
    createText?: string;
    /** 是否显示导入按钮 */
    import?: boolean;
    /** 是否显示导出按钮 */
    export?: boolean;
    /** 导入类型 */
    importType?: string;
    /** 导出类型 */
    exportType?: string;
    /** 导入标题 */
    importTitle?: string;
    /** 导出标题 */
    exportTitle?: string;
    /** 自定义操作按钮 */
    customActions?: Array<{
      label: string;
      type?: "primary" | "success" | "warning" | "danger" | "info";
      icon?: IconInput;
      handler: () => void;
    }>;
  };
  /** 表格操作配置 */
  tableOperation?: TableOperation<RowData<T>>;
  /** 表单组件 */
  formComponent?: Component;
  /** 是否支持恢复 */
  enableRestore?: boolean;
  /** 是否显示范围选择（未删除/已删除/全部） */
  showScope?: boolean;
  /** 是否显示分页 */
  showPagination?: boolean;
  /** 自定义搜索函数 */
  onSearch?: (params: QueryDto) => Promise<void>;
  /** 自定义删除函数 */
  onDelete?: (row: T) => Promise<void>;
  /** 自定义恢复函数 */
  onRestore?: (row: T) => Promise<void>;
}

/**
 * 分页配置
 */
export interface PaginationConfig {
  total: number;
  pageSize: number;
  currentPage: number;
  background: boolean;
}

/**
 * 表单引用
 */
export type FormRef = {
  resetFields: () => void;
  validate: (callback?: (valid: boolean) => void) => Promise<boolean>;
  clearValidate: (props?: string | string[]) => void;
};

/**
 * 行数据类型
 */
export type RowData<
  T extends Record<string, unknown> = Record<string, unknown>
> = T & {
  uid: string;
  deleteAt?: string | null;
};

/**
 * 表格大小
 */
export type TableSize = "large" | "default" | "small";
