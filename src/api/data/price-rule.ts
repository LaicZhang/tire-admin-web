import { http } from "@/utils/http";
import { baseUrlApi } from "../utils";
import type { CommonResult, PaginatedResponseDto } from "../type";

export type PriceRuleConfig = {
  uid?: string;
  saleRules: unknown[];
  purchaseRules: unknown[];
  remark?: string;
};

const prefix = "/data-config/price-rule";

export async function getPriceRuleConfigApi(): Promise<PriceRuleConfig | null> {
  const res = await http.request<
    CommonResult<PaginatedResponseDto<PriceRuleConfig>>
  >("get", baseUrlApi(`${prefix}/page/1`));
  if (res.code !== 200) {
    throw new Error(res.msg || "获取价格规则失败");
  }
  return res.data?.list?.[0] ?? null;
}

export async function savePriceRuleConfigApi(
  config: PriceRuleConfig
): Promise<void> {
  const method = config.uid ? "patch" : "post";
  const url = config.uid ? `${prefix}/${config.uid}` : prefix;
  await http.request<CommonResult<PriceRuleConfig>>(method, baseUrlApi(url), {
    data: config
  });
}
