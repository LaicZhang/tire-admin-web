export interface PriceLimitRecord {
  tireId: string;
  enablePurchaseLimit: boolean;
  enableSaleLimit: boolean;
  maxPurchasePrice?: number;
  minSalePrice?: number;
  updatedAt?: string;
}

const STORAGE_KEY = "data:price-limit";

function readAll(): Record<string, PriceLimitRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PriceLimitRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, PriceLimitRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function nowText() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function getPriceLimitMapApi(): Promise<
  Record<string, PriceLimitRecord>
> {
  return readAll();
}

export async function upsertPriceLimitApi(
  data: Omit<PriceLimitRecord, "updatedAt"> & { updatedAt?: string }
): Promise<void> {
  const map = readAll();
  map[data.tireId] = { ...data, updatedAt: data.updatedAt ?? nowText() };
  writeAll(map);
}

export async function deletePriceLimitApi(tireId: string): Promise<void> {
  const map = readAll();
  delete map[tireId];
  writeAll(map);
}
