export interface InitialStockRecord {
  uid: string;
  tireId: string;
  repoId: string;
  quantity: number;
  costPrice?: number;
  batchNo?: string;
  remark?: string;
  createdAt?: string;
}

const STORAGE_KEY = "data:initial-stock";

function readAll(): InitialStockRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InitialStockRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: InitialStockRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function nowText() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function getInitialStockListApi(): Promise<InitialStockRecord[]> {
  return readAll();
}

export async function upsertInitialStockApi(
  record: Omit<InitialStockRecord, "uid" | "createdAt"> & {
    uid?: string;
    createdAt?: string;
  }
): Promise<InitialStockRecord> {
  const list = readAll();
  const uid = record.uid ?? crypto.randomUUID();
  const existedIndex = list.findIndex(i => i.uid === uid);
  const saved: InitialStockRecord = {
    uid,
    tireId: record.tireId,
    repoId: record.repoId,
    quantity: record.quantity,
    costPrice: record.costPrice,
    batchNo: record.batchNo,
    remark: record.remark,
    createdAt: existedIndex >= 0 ? list[existedIndex].createdAt : nowText()
  };
  if (existedIndex >= 0) list[existedIndex] = saved;
  else list.unshift(saved);
  writeAll(list);
  return saved;
}

export async function deleteInitialStockApi(uid: string): Promise<void> {
  const list = readAll().filter(i => i.uid !== uid);
  writeAll(list);
}
