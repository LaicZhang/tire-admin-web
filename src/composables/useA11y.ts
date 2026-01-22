/**
 * 可访问性工具 composable
 * 提供 aria-label 和 role 属性的辅助函数
 */

/**
 * 为按钮生成aria-label
 * @param action 操作名称，如 "添加"、"编辑"、"删除"
 * @param target 目标对象，如 "用户"、"订单"
 */
export function useA11yButton() {
  function ariaLabel(action: string, target: string): string {
    return `${action}${target}`;
  }

  return {
    ariaLabel
  };
}

/**
 * 为表单输入框生成aria-label
 * @param label 标签名称
 */
export function useA11yInput() {
  function ariaLabel(label: string): string {
    return `请输入${label}`;
  }

  return {
    ariaLabel
  };
}

/**
 * 为选择器生成aria-label
 * @param label 标签名称
 */
export function useA11ySelect() {
  function ariaLabel(label: string): string {
    return `请选择${label}`;
  }

  return {
    ariaLabel
  };
}

/**
 * 图标按钮的aria-label
 * @param action 操作名称
 */
export function useA11yIconButton() {
  function ariaLabel(action: string): string {
    return `${action}`;
  }

  return {
    ariaLabel
  };
}

/**
 * 表格操作的aria-label
 * @param action 操作名称
 * @param rowInfo 行标识信息
 */
export function useA11yTableAction() {
  function ariaLabel(action: string, rowInfo?: string): string {
    if (rowInfo) {
      return `${action}${rowInfo}`;
    }
    return action;
  }

  return {
    ariaLabel
  };
}

/**
 * 对话框的aria属性
 */
export function useA11yDialog() {
  function role(): string {
    return "dialog";
  }

  function ariaModal(): string {
    return "true";
  }

  return {
    role,
    ariaModal
  };
}

/**
 * 搜索框的aria-label
 */
export function useA11ySearch() {
  function placeholder(): string {
    return "搜索关键字";
  }

  function ariaLabel(): string {
    return "搜索";
  }

  return {
    placeholder,
    ariaLabel
  };
}

/**
 * 导出所有可访问性工具
 */
export function useA11y() {
  return {
    ...useA11yButton(),
    ...useA11yInput(),
    ...useA11ySelect(),
    ...useA11yIconButton(),
    ...useA11yTableAction(),
    ...useA11yDialog(),
    ...useA11ySearch()
  };
}
