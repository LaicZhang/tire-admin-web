export interface FormItemProps {
  uid?: string;
  /** 公司名称 */
  name: string;
  /** 省 */
  province?: string | null;
  /** 市 */
  city?: string | null;
  /** 描述 */
  desc?: string | null;
  /** 负责人 */
  principalName?: string | null;
  /** 负责人电话 */
  principalPhone?: string | null;

  /** 启用状态（软删时会被置为 false） */
  status?: boolean | null;

  /** 创建时间 */
  createAt?: string | null;
  /** 删除时间（软删） */
  deleteAt?: string | null;
}

export interface FormProps {
  formInline: FormItemProps;
}
