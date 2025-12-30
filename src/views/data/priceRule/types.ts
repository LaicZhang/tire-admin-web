/** 价格取数规则 */
export interface PriceRule {
  id: number;
  uid: string;
  /** 规则名称 */
  name: string;
  /** 规则代码 */
  code: string;
  /** 规则描述 */
  description?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 优先级（数字越小优先级越高） */
  priority: number;
  /** 规则类型 */
  type: "purchase" | "sale";
}

/** 价格规则查询参数 */
export interface PriceRuleQuery {
  type?: "purchase" | "sale";
  enabled?: boolean;
}

/** 价格规则表单 */
export interface PriceRuleForm {
  id?: number;
  name: string;
  code: string;
  description?: string;
  enabled: boolean;
  priority: number;
  type: "purchase" | "sale";
}
