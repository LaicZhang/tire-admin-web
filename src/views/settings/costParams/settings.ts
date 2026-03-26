import type { CompanySettingItem } from "@/api/setting";
import {
  isFiniteNumber,
  isObject,
  isString,
  parseJsonWithGuard
} from "@/utils/type-guards";
import type { AbnormalCostItem, CostParams } from "./types";

const COST_METHODS = ["moving_average", "fifo"];
const COST_CALC_TYPES = ["total_warehouse", "sub_warehouse"];

function isCostMethod(value: unknown): value is CostParams["costMethod"] {
  return isString(value) && COST_METHODS.includes(value);
}

function isCostCalcType(value: unknown): value is CostParams["costCalcType"] {
  return isString(value) && COST_CALC_TYPES.includes(value);
}

function isAbnormalCostItem(value: unknown): value is AbnormalCostItem {
  if (!isObject(value)) return false;

  return (
    isString(value.id) && isString(value.name) && isFiniteNumber(value.order)
  );
}

function parseAbnormalCostOrder(raw: string): AbnormalCostItem[] {
  return parseJsonWithGuard(
    raw,
    (value): value is AbnormalCostItem[] =>
      Array.isArray(value) && value.every(isAbnormalCostItem),
    "异常成本处理顺序配置不合法"
  );
}

export function applyCostParamsSettings(
  settings: CompanySettingItem[],
  form: CostParams
) {
  settings.forEach(setting => {
    if (setting.key === "costMethod") {
      if (!isCostMethod(setting.value)) {
        throw new Error("成本核算方法配置不合法");
      }
      form.costMethod = setting.value;
      return;
    }

    if (setting.key === "costCalcType") {
      if (!isCostCalcType(setting.value)) {
        throw new Error("成本核算方式配置不合法");
      }
      form.costCalcType = setting.value;
      return;
    }

    if (setting.key === "abnormalCostOrder") {
      form.abnormalCostOrder = parseAbnormalCostOrder(setting.value);
    }
  });
}
