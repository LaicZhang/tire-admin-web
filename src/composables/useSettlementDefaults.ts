import { getCompanySettingGroupApi } from "@/api/setting/company-setting";

export type SettlementDefaults = Readonly<{
  defaultPaymentMethod?: string;
  defaultReceivableAccount?: string;
  defaultPayableAccount?: string;
  allowBackdateDays: number;
}>;

let cached: SettlementDefaults | null = null;
let inFlight: Promise<SettlementDefaults> | null = null;

export function invalidateSettlementDefaultsCache(): void {
  cached = null;
  inFlight = null;
}

function pickValue(
  list: { key: string; value: string }[] | undefined,
  key: string
): string | undefined {
  if (!Array.isArray(list)) return undefined;
  const found = list.find(i => i.key === key);
  const value = String(found?.value ?? "").trim();
  return value ? value : undefined;
}

function pickNumber(
  list: { key: string; value: string }[] | undefined,
  key: string,
  defaultValue: number
): number {
  const raw = pickValue(list, key);
  if (!raw) return defaultValue;
  const num = Number(raw);
  return Number.isFinite(num) ? num : defaultValue;
}

export async function loadSettlementDefaults(options?: {
  force?: boolean;
}): Promise<SettlementDefaults> {
  if (!options?.force && cached) return cached;
  if (!options?.force && inFlight) return inFlight;

  inFlight = (async () => {
    const [settlement, document] = await Promise.all([
      getCompanySettingGroupApi("settlement"),
      getCompanySettingGroupApi("document")
    ]);

    if (settlement.code !== 200) {
      throw new Error(settlement.msg || "加载结算默认值失败");
    }
    if (document.code !== 200) {
      throw new Error(document.msg || "加载单据配置失败");
    }

    const next: SettlementDefaults = Object.freeze({
      defaultPaymentMethod: pickValue(settlement.data, "defaultPaymentMethod"),
      defaultReceivableAccount: pickValue(
        settlement.data,
        "defaultReceivableAccount"
      ),
      defaultPayableAccount: pickValue(
        settlement.data,
        "defaultPayableAccount"
      ),
      allowBackdateDays: pickNumber(document.data, "allowBackdateDays", 0)
    });
    cached = next;
    return next;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
