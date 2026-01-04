export interface StatusTagProps {
  /** 状态值 */
  status: string | number | boolean;
  /** 状态映射配置 */
  statusMap: Record<string | number, StatusConfig>;
  /** 标签尺寸 */
  size?: "large" | "default" | "small";
  /** 是否显示为圆形 */
  round?: boolean;
}

export interface StatusConfig {
  /** 显示文本 */
  label: string;
  /** 标签类型 */
  type?: "success" | "warning" | "danger" | "info" | "";
}

// 预设状态映射
export const APPROVAL_STATUS_MAP: Record<string, StatusConfig> = {
  true: { label: "已审核", type: "success" },
  false: { label: "未审核", type: "info" }
};

export const LOCK_STATUS_MAP: Record<string, StatusConfig> = {
  true: { label: "已锁定", type: "warning" },
  false: { label: "未锁定", type: "" }
};

export const ENABLE_STATUS_MAP: Record<string, StatusConfig> = {
  true: { label: "启用", type: "success" },
  false: { label: "禁用", type: "danger" }
};

export const DOCUMENT_STATUS_MAP: Record<string, StatusConfig> = {
  draft: { label: "草稿", type: "info" },
  pending: { label: "待审核", type: "warning" },
  approved: { label: "已审核", type: "success" },
  rejected: { label: "已驳回", type: "danger" }
};
