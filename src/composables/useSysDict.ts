import { computed, onMounted, ref } from "vue";
import {
  getDictItemsApi,
  type DictDataSource,
  type DictItem
} from "@/api/system/dict";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";
import { localForage, SYS } from "@/utils";
import { logger } from "@/utils/logger";

export type SysDictItem = DictItem & { [key: string]: unknown };
export type DictSource = DictDataSource;

export type SysDictOption = {
  label: string;
  value: string | number;
  key?: number;
  raw: SysDictItem;
};

type DictCachePayload = {
  source: DictSource;
  companyId?: string;
  updatedAt: number;
  expiresAt: number;
  itemsByName: Record<string, SysDictItem[]>;
};

type UseDictOptions = {
  source?: DictSource;
  companyId?: string;
};

type GetDictItemsOptions = UseDictOptions & {
  force?: boolean;
  ensureFresh?: boolean;
};

const DEFAULT_SOURCE: DictSource = "system";
const DICT_CACHE_TTL_MS = 60 * 60 * 1000;

function buildDictCacheKey(source: DictSource, companyId?: string) {
  if (source === "company") return `${SYS.dict}:company:${companyId}`;
  return `${SYS.dict}:system`;
}

function groupByName(items: SysDictItem[]) {
  const result: Record<string, SysDictItem[]> = {};
  for (const item of items) {
    const key = item?.name;
    if (!key) continue;
    (result[key] ||= []).push(item);
  }
  return result;
}

function resolveSource(options?: UseDictOptions) {
  return options?.source ?? DEFAULT_SOURCE;
}

function resolveCompanyId(options?: UseDictOptions) {
  const source = resolveSource(options);
  if (source !== "company") return undefined;
  const companyId =
    options?.companyId ?? useCurrentCompanyStoreHook().companyId;
  if (!companyId) throw new Error("当前公司未确定，无法加载公司字典");
  return companyId;
}

function normalizeCachePayload(payload: unknown): DictCachePayload | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as Partial<DictCachePayload>;
  if (candidate.source !== "system" && candidate.source !== "company") {
    return null;
  }
  if (typeof candidate.updatedAt !== "number") return null;
  if (typeof candidate.expiresAt !== "number") return null;
  if (!candidate.itemsByName || typeof candidate.itemsByName !== "object") {
    return null;
  }
  return {
    source: candidate.source,
    companyId: candidate.companyId,
    updatedAt: candidate.updatedAt,
    expiresAt: candidate.expiresAt,
    itemsByName: candidate.itemsByName as Record<string, SysDictItem[]>
  };
}

async function readDictCache(
  options?: UseDictOptions
): Promise<DictCachePayload | null> {
  const source = resolveSource(options);
  const companyId = resolveCompanyId(options);
  const payload = await localForage().getItem<DictCachePayload>(
    buildDictCacheKey(source, companyId)
  );
  const normalized = normalizeCachePayload(payload);
  if (!normalized) return null;
  if (normalized.expiresAt <= Date.now()) return null;
  return normalized;
}

async function writeDictCache(
  items: SysDictItem[],
  options?: UseDictOptions
): Promise<DictCachePayload> {
  const source = resolveSource(options);
  const companyId = resolveCompanyId(options);
  const now = Date.now();
  const payload: DictCachePayload = {
    source,
    companyId,
    updatedAt: now,
    expiresAt: now + DICT_CACHE_TTL_MS,
    itemsByName: groupByName(items)
  };
  await localForage().setItem(buildDictCacheKey(source, companyId), payload);
  return payload;
}

async function fetchAndCache(
  options?: UseDictOptions
): Promise<DictCachePayload> {
  const source = resolveSource(options);
  const companyId = resolveCompanyId(options);
  const { code, data, msg } = await getDictItemsApi({ type: source });
  if (code !== 200) throw new Error(msg || "加载字典失败");
  const items = Array.isArray(data) ? (data as SysDictItem[]) : [];
  return writeDictCache(items, { source, companyId });
}

function toOption(item: SysDictItem): SysDictOption | null {
  const label =
    (typeof item.cn === "string" && item.cn.trim()) ||
    (typeof item.en === "string" && item.en.trim()) ||
    (typeof item.key === "number" ? String(item.key) : "");
  if (!label) return null;
  return {
    label,
    value: typeof item.key === "number" ? item.key : label,
    key: typeof item.key === "number" ? item.key : undefined,
    raw: item
  };
}

function matchesDictValue(item: SysDictItem, value: unknown) {
  if (typeof item.key === "number" && Number(value) === item.key) return true;
  if (typeof item.cn === "string" && value === item.cn) return true;
  if (typeof item.en === "string" && value === item.en) return true;
  return false;
}

export async function invalidateDictCache(options?: UseDictOptions) {
  const source = resolveSource(options);
  const companyId = resolveCompanyId(options);
  await localForage().removeItem(buildDictCacheKey(source, companyId));
}

export async function ensureDictCache(
  options?: GetDictItemsOptions
): Promise<DictCachePayload> {
  if (!options?.force) {
    const cached = await readDictCache(options);
    if (cached) return cached;
  }
  return fetchAndCache(options);
}

export async function preloadDicts(options?: GetDictItemsOptions) {
  try {
    await ensureDictCache(options);
  } catch (error) {
    logger.error("预热字典缓存失败", error);
    throw error;
  }
}

export async function getDictItems(
  dictName: string,
  options?: GetDictItemsOptions
): Promise<SysDictItem[]> {
  const payload =
    options?.ensureFresh === false
      ? await readDictCache(options)
      : await ensureDictCache(options);
  return Array.isArray(payload?.itemsByName?.[dictName])
    ? payload.itemsByName[dictName]
    : [];
}

export async function getDictLabel(
  dictName: string,
  value: unknown,
  options?: GetDictItemsOptions
) {
  const items = await getDictItems(dictName, options);
  const matched = items.find(item => matchesDictValue(item, value));
  return (
    matched?.cn ||
    matched?.en ||
    (typeof matched?.key === "number" ? String(matched.key) : "") ||
    ""
  );
}

export function useDictItems(dictName: string, options?: UseDictOptions) {
  const dictItems = ref<SysDictItem[]>([]);
  const isLoading = ref(false);

  const refresh = async (
    refreshOptions?: Pick<GetDictItemsOptions, "force">
  ) => {
    isLoading.value = true;
    try {
      dictItems.value = await getDictItems(dictName, {
        ...options,
        force: refreshOptions?.force
      });
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    void refresh();
  });

  return { dictItems, isLoading, refresh };
}

export function useSysDictOptions(dictName: string, options?: UseDictOptions) {
  const { dictItems, isLoading, refresh } = useDictItems(dictName, options);

  const optionsRef = computed<SysDictOption[]>(() => {
    const seen = new Set<string>();
    const result: SysDictOption[] = [];
    for (const item of dictItems.value) {
      const opt = toOption(item);
      if (!opt) continue;
      if (seen.has(String(opt.value))) continue;
      seen.add(String(opt.value));
      result.push(opt);
    }
    return result;
  });

  return { dictItems, options: optionsRef, isLoading, refresh };
}
