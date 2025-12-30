export type PriceRuleConfig = {
  saleRules: unknown[];
  purchaseRules: unknown[];
};

const STORAGE_KEY = "data:price-rule";

export async function getPriceRuleConfigApi(): Promise<PriceRuleConfig | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PriceRuleConfig;
    if (!parsed || typeof parsed !== "object") return null;
    if (
      !Array.isArray(parsed.saleRules) ||
      !Array.isArray(parsed.purchaseRules)
    )
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function savePriceRuleConfigApi(
  config: PriceRuleConfig
): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
