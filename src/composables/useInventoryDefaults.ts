import { getCompanySettingGroupApi } from "@/api/setting/company-setting";

export type InventoryDefaults = Readonly<{
  defaultWarehouseId?: string;
}>;

let cached: InventoryDefaults | null = null;
let inFlight: Promise<InventoryDefaults> | null = null;

export function invalidateInventoryDefaultsCache(): void {
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

export async function loadInventoryDefaults(options?: {
  force?: boolean;
}): Promise<InventoryDefaults> {
  if (!options?.force && cached) return cached;
  if (!options?.force && inFlight) return inFlight;

  inFlight = (async () => {
    const res = await getCompanySettingGroupApi("inventory");
    if (res.code !== 200) {
      throw new Error(res.msg || "加载库存默认设置失败");
    }
    const next: InventoryDefaults = Object.freeze({
      defaultWarehouseId: pickValue(res.data, "defaultWarehouseId")
    });
    cached = next;
    return next;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
