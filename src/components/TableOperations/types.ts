export interface TableOperationsProps {
  /** 数据行对象 */
  row: Record<string, unknown>;
  /** 是否显示查看按钮 */
  showView?: boolean;
  /** 是否显示修改按钮 */
  showEdit?: boolean;
  /** 是否显示审核按钮 */
  showAudit?: boolean;
  /** 是否显示删除按钮 */
  showDelete?: boolean;
  /** 删除确认文本 */
  deleteTitle?: string;
  /** 按钮尺寸 */
  size?: "large" | "default" | "small";
  /** 锁定字段名（用于控制修改和删除按钮的显示） */
  lockedField?: string;
  /** 审核字段名（用于控制审核按钮的显示） */
  approvedField?: string;
}

export interface TableOperationsEmits {
  (e: "view", row: Record<string, unknown>): void;
  (e: "edit", row: Record<string, unknown>): void;
  (e: "audit", row: Record<string, unknown>): void;
  (e: "delete", row: Record<string, unknown>): void;
}

/** 自定义操作按钮配置 */
export interface CustomAction {
  /** 按钮文本 */
  label: string;
  /** 按钮类型 */
  type?: "primary" | "success" | "warning" | "danger" | "info";
  /** 是否显示（可以是布尔值或返回布尔值的函数） */
  visible?: boolean | ((row: Record<string, unknown>) => boolean);
  /** 点击事件处理 */
  onClick: (row: Record<string, unknown>) => void;
}

export interface TableOperationsWithCustomizationProps extends TableOperationsProps {
  /** 自定义操作按钮列表（在审核按钮之后、删除按钮之前渲染） */
  customActions?: CustomAction[];
}
