export interface FormItemProps {
  /** 方法：get/post/patch/delete */
  type?: string;
  /** 模块（用于归类展示） */
  module?: string;
  /** 路径（建议以 / 开头） */
  path: string;
  /** 描述 */
  desc?: string;
  /** 归属：1-个人 2-部门 */
  belong?: number;
}

export interface FormProps {
  formInline: FormItemProps;
}
