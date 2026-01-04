export interface DeleteButtonProps {
  /** 确认提示文本 */
  title?: string;
  /** 按钮文本 */
  text?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 按钮尺寸 */
  size?: "large" | "default" | "small";
  /** 确认按钮文本 */
  confirmButtonText?: string;
  /** 取消按钮文本 */
  cancelButtonText?: string;
}

export interface DeleteButtonEmits {
  (e: "confirm"): void;
  (e: "cancel"): void;
}
