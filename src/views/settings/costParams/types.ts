// 成本参数 - 类型定义
export interface CostParams {
  // 成本核算方法
  costMethod: "moving_average" | "fifo";
  // 成本核算方式
  costCalcType: "total_warehouse" | "sub_warehouse";
  // 异常成本处理顺序
  abnormalCostOrder: AbnormalCostItem[];
}

export interface AbnormalCostItem {
  id: string;
  name: string;
  order: number;
}

export interface CostParamsFormProps {
  formInline: CostParams;
}
