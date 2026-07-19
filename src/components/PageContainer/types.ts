export interface PageContainerProps {
  /**
   * 是否显示搜索区卡片。
   * 默认推荐：列表页 search 插槽 + content 卡片；
   * 已用 ReSearchForm 外置时设 showSearch=false，仅包内容区。
   * 弹窗创建/编辑默认走 addDialog / FormDialog，不嵌套 PageContainer。
   */
  showSearch?: boolean;
  /** 卡片阴影模式 */
  shadow?: "always" | "never" | "hover";
  /** 内边距 */
  padding?: string;
}
