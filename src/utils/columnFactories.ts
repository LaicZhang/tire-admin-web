import { formatDate } from "@/utils/time";
import { fenToYuan } from "@/utils/formatMoney";

/**
 * 表格列类型
 */
export type TableColumn = {
  label: string;
  prop: string;
  minWidth?: number;
  fixed?: "left" | "right";
  slot?: string;
  formatter?: (
    row: Record<string, unknown>,
    column: unknown,
    cellValue: unknown,
    index: number
  ) => string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  resizable?: boolean;
};

/**
 * 表格列列表类型
 */
export type TableColumnList = TableColumn[];

/**
 * 通用列配置选项
 */
export interface CommonColumnOptions {
  /** 是否显示 ID 列 */
  showId?: boolean;
  /** ID 列的 prop 名称 */
  idProp?: string;
  /** ID 列宽度 */
  idWidth?: number;
  /** 是否显示备注列 */
  showDesc?: boolean;
  /** 备注列的 prop 名称 */
  descProp?: string;
  /** 是否显示创建时间列 */
  showCreatedAt?: boolean;
  /** 创建时间列的 prop 名称 */
  createdAtProp?: string;
  /** 是否显示更新时间列 */
  showUpdatedAt?: boolean;
  /** 更新时间列的 prop 名称 */
  updatedAtProp?: string;
  /** 是否显示删除时间列 */
  showDeletedAt?: boolean;
  /** 删除时间列的 prop 名称 */
  deletedAtProp?: string;
}

/**
 * 操作列配置选项
 */
export interface OperationColumnOptions {
  /** 列标签 */
  label?: string;
  /** 最小宽度 */
  minWidth?: number;
  /** 是否固定在右侧 */
  fixed?: "left" | "right" | false;
  /** 对齐方式 */
  align?: "left" | "center" | "right";
}

/**
 * 金额列配置选项
 */
export interface MoneyColumnOptions {
  /** 列标签 */
  label: string;
  /** prop 名称 */
  prop: string;
  /** 金额单位：1=分转元，100=直接显示 */
  unit?: 1 | 100;
  /** 保留小数位数 */
  decimals?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 对齐方式 */
  align?: "left" | "center" | "right";
}

/**
 * 布尔列配置选项
 */
export interface BooleanColumnOptions {
  /** 列标签 */
  label: string;
  /** prop 名称 */
  prop: string;
  /** true 时的显示文本 */
  trueText?: string;
  /** false 时的显示文本 */
  falseText?: string;
  /** 最小宽度 */
  minWidth?: number;
  /** 对齐方式 */
  align?: "left" | "center" | "right";
}

/**
 * 创建 ID 列
 */
export function createIdColumn(
  options?: Partial<{ prop: string; width: number }>
): TableColumn {
  return {
    label: "ID",
    prop: options?.prop || "id",
    minWidth: options?.width || 80,
    align: "center"
  };
}

/**
 * 创建名称列
 */
export function createNameColumn(
  options?: Partial<{ prop: string; minWidth: number }>
): TableColumn {
  return {
    label: "名称",
    prop: options?.prop || "name",
    minWidth: options?.minWidth || 120
  };
}

/**
 * 创建备注列
 */
export function createDescColumn(
  options?: Partial<{ prop: string; minWidth: number }>
): TableColumn {
  return {
    label: "备注",
    prop: options?.prop || "desc",
    minWidth: options?.minWidth || 120
  };
}

/**
 * 创建日期列
 */
export function createDateColumn(options: {
  label: string;
  prop: string;
  format?: string;
  minWidth?: number;
}): TableColumn {
  return {
    label: options.label,
    prop: options.prop,
    minWidth: options.minWidth || 160,
    formatter: (row, column, cellValue) => {
      const date =
        typeof cellValue === "string" || cellValue instanceof Date
          ? cellValue
          : null;
      return formatDate(date);
    }
  };
}

/**
 * 创建金额列（自动分转元）
 */
export function createMoneyColumn(options: MoneyColumnOptions): TableColumn {
  return {
    label: options.label,
    prop: options.prop,
    minWidth: options.minWidth || 100,
    align: options.align || "right",
    formatter: (row, column, cellValue) => {
      if (cellValue === null || cellValue === undefined) return "-";
      if (options.unit === 1) {
        const fen =
          typeof cellValue === "number" || typeof cellValue === "bigint"
            ? cellValue
            : typeof cellValue === "string" && cellValue !== ""
              ? Number(cellValue)
              : null;
        return fenToYuan(
          typeof fen === "number" && Number.isNaN(fen) ? null : fen,
          options.decimals || 2
        );
      }
      return Number(cellValue).toFixed(options.decimals || 2);
    }
  };
}

/**
 * 创建布尔列
 */
export function createBooleanColumn(
  options: BooleanColumnOptions
): TableColumn {
  return {
    label: options.label,
    prop: options.prop,
    minWidth: options.minWidth || 100,
    align: options.align || "center",
    formatter: (row, column, cellValue) => {
      return cellValue === true
        ? options.trueText || "是"
        : options.falseText || "否";
    }
  };
}

/**
 * 创建状态列
 */
export function createStatusColumn(
  options: Partial<{ prop: string; minWidth: number }>
): TableColumn {
  return {
    label: "状态",
    prop: options?.prop || "status",
    minWidth: options?.minWidth || 100,
    slot: "status"
  };
}

/**
 * 创建操作列
 */
export function createOperationColumn(
  options?: OperationColumnOptions
): TableColumn {
  return {
    label: options?.label || "操作",
    prop: "operation",
    slot: "operation",
    minWidth: options?.minWidth || 120,
    fixed: options?.fixed !== false ? options?.fixed || "right" : undefined,
    align: options?.align || "center"
  };
}

/**
 * 创建通用列（包含 ID、备注、创建时间、更新时间等）
 */
export function createCommonColumns(
  options: CommonColumnOptions = {}
): TableColumn[] {
  const columns: TableColumn[] = [];

  // ID 列
  if (options.showId !== false) {
    columns.push(
      createIdColumn({ prop: options.idProp, width: options.idWidth })
    );
  }

  // 备注列
  if (options.showDesc) {
    columns.push(createDescColumn({ prop: options.descProp }));
  }

  // 创建时间列
  if (options.showCreatedAt) {
    columns.push(
      createDateColumn({
        label: "创建时间",
        prop: options.createdAtProp || "createdAt",
        minWidth: 160
      })
    );
  }

  // 更新时间列
  if (options.showUpdatedAt) {
    columns.push(
      createDateColumn({
        label: "更新时间",
        prop: options.updatedAtProp || "updatedAt",
        minWidth: 160
      })
    );
  }

  // 删除时间列
  if (options.showDeletedAt) {
    columns.push(
      createDateColumn({
        label: "删除时间",
        prop: options.deletedAtProp || "deletedAt",
        minWidth: 160
      })
    );
  }

  return columns;
}

/**
 * 创建标准 CRUD 列（ID + 自定义列 + 通用列 + 操作列）
 */
export function createCrudColumns(
  customColumns: TableColumn[],
  options: {
    commonColumns?: CommonColumnOptions;
    operationColumn?: OperationColumnOptions;
  } = {}
): TableColumnList {
  return [
    ...customColumns,
    ...createCommonColumns(options.commonColumns),
    createOperationColumn(options.operationColumn)
  ];
}

/**
 * 创建带序号的列
 */
export function createIndexColumn(
  options?: Partial<{ label: string; width: number }>
): TableColumn {
  return {
    label: options?.label || "序号",
    prop: "index",
    minWidth: options?.width || 60,
    align: "center",
    formatter: (row, column, cellValue, index) => {
      return String(index + 1);
    }
  };
}

/**
 * 创建自定义列
 */
export function createCustomColumn(
  column: Omit<TableColumn, "label" | "prop"> & { label: string; prop: string }
): TableColumn {
  return column;
}

/**
 * 批量创建列
 */
export function createBatchColumns(columns: TableColumn[]): TableColumnList {
  return columns;
}

/**
 * 创建搜索列（用于搜索表单）
 */
export interface SearchColumn {
  label: string;
  prop: string;
  type: "input" | "select" | "date" | "daterange" | "number";
  placeholder?: string;
  options?: Array<{ label: string; value: unknown }>;
  props?: Record<string, unknown>;
}

export function createSearchColumns(columns: SearchColumn[]): SearchColumn[] {
  return columns;
}

/**
 * 工具函数：合并列配置
 */
export function mergeColumns(
  ...columnGroups: TableColumnList[]
): TableColumnList {
  return columnGroups.flat();
}

/**
 * 工具函数：过滤列
 */
export function filterColumns(
  columns: TableColumnList,
  predicate: (column: TableColumn) => boolean
): TableColumnList {
  return columns.filter(predicate);
}

/**
 * 工具函数：查找列
 */
export function findColumn(
  columns: TableColumnList,
  prop: string
): TableColumn | undefined {
  return columns.find(column => column.prop === prop);
}

/**
 * 工具函数：更新列
 */
export function updateColumn(
  columns: TableColumnList,
  prop: string,
  updates: Partial<TableColumn>
): TableColumnList {
  return columns.map(column =>
    column.prop === prop ? { ...column, ...updates } : column
  );
}

/**
 * 工具函数：删除列
 */
export function removeColumn(
  columns: TableColumnList,
  prop: string
): TableColumnList {
  return columns.filter(column => column.prop !== prop);
}

/**
 * 工具函数：移动列
 */
export function moveColumn(
  columns: TableColumnList,
  prop: string,
  newIndex: number
): TableColumnList {
  const newColumns = [...columns];
  const index = newColumns.findIndex(column => column.prop === prop);
  if (index !== -1) {
    const [column] = newColumns.splice(index, 1);
    newColumns.splice(newIndex, 0, column);
  }
  return newColumns;
}
