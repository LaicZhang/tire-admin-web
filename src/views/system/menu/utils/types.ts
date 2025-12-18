export interface FormItemProps {
  /** 菜单类型（0代表菜单、1代表iframe、2代表外链、3代表按钮） */
  code: number;
  parentId: string;
  /** 菜单名称 */
  title: string;
  /** 菜单图标 */
  icon: string;
  /** 路由路径 */
  path: string;
  /** 排序 */
  rank: number;
  /** 组件路径 */
  component: string;
  /** auths */
  auths: string;
  /** iframe链接 */
  frameSrc: string;
  /** 路由重定向 */
  redirect: string;
  /** 菜单是否显示 */
  showLink: boolean;
  /** 菜单是否缓存 */
  keepAlive: boolean;
  /** 菜单是否隐藏 */
  hidden: boolean; // Note: hidden in pure-admin usually means hidden from sidebar
  /** 是否固定标签页 */
  fixedTag: boolean;
  /** 是否隐藏标签页 */
  hiddenTag: boolean;
  /** Enter transition */
  enterTransition: string;
  /** Leave transition */
  leaveTransition: string;
}

export interface FormProps {
  formInline: FormItemProps;
}
