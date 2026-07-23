/**
 * Recent entities + last-used create form headers (REC-01 / REC-02).
 * Merge order: empty ← companyDefaults ← lastUsed (whitelist only).
 */
import { getToken } from "@/utils/auth";
import { localForage } from "@/utils/localforage";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";
import { useUserStoreHook } from "@/store/modules/user";

export const RECENT_ENTITY_MAX = 8;
/** localForage minutes: 30 days */
export const RECENT_FORM_TTL_MINUTES = 30 * 24 * 60;

export const RECENT_ENTITY_TYPES = [
  "customer",
  "provider",
  "repo",
  "payment"
] as const;
export type RecentEntityType = (typeof RECENT_ENTITY_TYPES)[number];

export const LAST_FORM_DOC_TYPES = [
  "saleOrder",
  "purchaseOrder",
  "purchaseInbound",
  "salesReturn",
  "purchaseReturn",
  "transfer",
  "stocktake",
  "receipt",
  "payment"
] as const;
export type LastFormDocType = (typeof LAST_FORM_DOC_TYPES)[number];

export type RecentEntityItem = {
  uid: string;
  name: string;
  at: number;
};

export type LastFormHeader = {
  customerId?: string;
  customerName?: string;
  providerId?: string;
  providerName?: string;
  repoId?: string;
  repoName?: string;
  paymentId?: string;
  paymentName?: string;
  paymentMethod?: string;
  managerId?: string;
  fromRepositoryId?: string;
  sourceRepoId?: string;
  targetRepoId?: string;
};

const LAST_FORM_KEYS: (keyof LastFormHeader)[] = [
  "customerId",
  "customerName",
  "providerId",
  "providerName",
  "repoId",
  "repoName",
  "paymentId",
  "paymentName",
  "paymentMethod",
  "managerId",
  "fromRepositoryId",
  "sourceRepoId",
  "targetRepoId"
];

const SCOPE_INDEX_KEY = "rfm:scopes";

export function isBlank(value: string | null | undefined): boolean {
  return value == null || String(value).trim().length === 0;
}

export function mergeRecentEntities(
  existing: RecentEntityItem[],
  next: { uid: string; name: string },
  max = RECENT_ENTITY_MAX,
  now = Date.now()
): RecentEntityItem[] {
  const uid = String(next.uid || "").trim();
  if (!uid) return existing.slice(0, max);
  const name = String(next.name || "").trim() || uid;
  const rest = existing.filter(item => item.uid !== uid);
  return [{ uid, name, at: now }, ...rest].slice(0, max);
}

export function pickLastFormHeader(
  source: Record<string, unknown> | null | undefined
): LastFormHeader {
  if (!source || typeof source !== "object") return {};
  const out: LastFormHeader = {};
  for (const key of LAST_FORM_KEYS) {
    const raw = source[key];
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Apply last-used whitelist onto create form.
 * - mode "prefer": only fill blank fields
 * - mode "override": last-used wins over company defaults (merge step 3)
 * Never touches non-whitelist keys (amounts, details, etc.).
 */
export function applyLastFormHeader(
  target: Record<string, unknown>,
  header: LastFormHeader | null | undefined,
  mode: "prefer" | "override" = "override"
): void {
  if (!header) return;
  for (const key of LAST_FORM_KEYS) {
    const next = header[key];
    if (!next || isBlank(next)) continue;
    if (mode === "prefer") {
      const current = target[key];
      if (!isBlank(current as string | null | undefined)) continue;
    }
    target[key] = next;
  }
}

export function resolveMemoryScope(explicit?: {
  companyUid?: string;
  userUid?: string;
}): { companyUid: string; userUid: string } | null {
  if (explicit?.companyUid && explicit?.userUid) {
    const companyUid = explicit.companyUid.trim();
    const userUid = explicit.userUid.trim();
    if (companyUid && userUid) return { companyUid, userUid };
  }

  try {
    const companyUid = String(
      useCurrentCompanyStoreHook().companyId || ""
    ).trim();
    const fromStore = String(useUserStoreHook().uid || "").trim();
    const fromToken = String(getToken()?.uid || "").trim();
    const userUid = fromStore || fromToken;
    if (!companyUid || !userUid) return null;
    return { companyUid, userUid };
  } catch {
    return null;
  }
}

export function recentEntityKey(
  companyUid: string,
  userUid: string,
  type: RecentEntityType
): string {
  return `recent:entity:${companyUid}:${userUid}:${type}`;
}

export function lastFormKey(
  companyUid: string,
  userUid: string,
  docType: LastFormDocType
): string {
  return `last:form:${companyUid}:${userUid}:${docType}`;
}

function scopeId(companyUid: string, userUid: string): string {
  return `${companyUid}:${userUid}`;
}

async function registerScope(
  companyUid: string,
  userUid: string
): Promise<void> {
  const storage = localForage();
  const id = scopeId(companyUid, userUid);
  try {
    const existing = (await storage.getItem<string[]>(SCOPE_INDEX_KEY)) ?? [];
    if (existing.includes(id)) return;
    await storage.setItem(SCOPE_INDEX_KEY, [...existing, id], 0);
  } catch {
    // ignore index failures
  }
}

export async function listRecentEntities(
  type: RecentEntityType,
  scope?: { companyUid?: string; userUid?: string }
): Promise<RecentEntityItem[]> {
  const resolved = resolveMemoryScope(scope);
  if (!resolved) return [];
  try {
    const raw = await localForage().getItem<RecentEntityItem[]>(
      recentEntityKey(resolved.companyUid, resolved.userUid, type)
    );
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        item =>
          item &&
          typeof item.uid === "string" &&
          item.uid.trim().length > 0 &&
          typeof item.name === "string"
      )
      .slice(0, RECENT_ENTITY_MAX);
  } catch {
    return [];
  }
}

export async function touchRecentEntity(
  type: RecentEntityType,
  entity: { uid: string; name: string },
  scope?: { companyUid?: string; userUid?: string }
): Promise<void> {
  const resolved = resolveMemoryScope(scope);
  if (!resolved) return;
  const uid = String(entity.uid || "").trim();
  if (!uid) return;
  try {
    const key = recentEntityKey(resolved.companyUid, resolved.userUid, type);
    const existing =
      (await localForage().getItem<RecentEntityItem[]>(key)) ?? [];
    const next = mergeRecentEntities(existing, {
      uid,
      name: entity.name
    });
    await localForage().setItem(key, next, RECENT_FORM_TTL_MINUTES);
    await registerScope(resolved.companyUid, resolved.userUid);
  } catch {
    // silent
  }
}

export async function readLastFormHeader(
  docType: LastFormDocType,
  scope?: { companyUid?: string; userUid?: string }
): Promise<LastFormHeader | null> {
  const resolved = resolveMemoryScope(scope);
  if (!resolved) return null;
  try {
    const raw = await localForage().getItem<LastFormHeader>(
      lastFormKey(resolved.companyUid, resolved.userUid, docType)
    );
    if (!raw || typeof raw !== "object") return null;
    return pickLastFormHeader(raw as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function writeLastFormHeader(
  docType: LastFormDocType,
  source: Record<string, unknown>,
  scope?: { companyUid?: string; userUid?: string }
): Promise<void> {
  const resolved = resolveMemoryScope(scope);
  if (!resolved) return;
  const header = pickLastFormHeader(source);
  if (Object.keys(header).length === 0) return;
  try {
    await localForage().setItem(
      lastFormKey(resolved.companyUid, resolved.userUid, docType),
      header,
      RECENT_FORM_TTL_MINUTES
    );
    await registerScope(resolved.companyUid, resolved.userUid);
  } catch {
    // silent
  }
}

export async function applyLastFormHeaderAsync(
  target: Record<string, unknown>,
  docType: LastFormDocType,
  scope?: { companyUid?: string; userUid?: string }
): Promise<LastFormHeader | null> {
  const header = await readLastFormHeader(docType, scope);
  if (header) applyLastFormHeader(target, header);
  return header;
}

/** After successful create: persist last header + touch related entities. */
export async function recordSuccessfulCreate(
  docType: LastFormDocType,
  source: Record<string, unknown>,
  scope?: { companyUid?: string; userUid?: string }
): Promise<void> {
  await writeLastFormHeader(docType, source, scope);
  const customerId = String(source.customerId ?? "").trim();
  const customerName = String(source.customerName ?? "").trim();
  if (customerId) {
    await touchRecentEntity(
      "customer",
      { uid: customerId, name: customerName || customerId },
      scope
    );
  }
  const providerId = String(source.providerId ?? "").trim();
  const providerName = String(source.providerName ?? "").trim();
  if (providerId) {
    await touchRecentEntity(
      "provider",
      { uid: providerId, name: providerName || providerId },
      scope
    );
  }
  const repoId = String(source.repoId ?? "").trim();
  const repoName = String(source.repoName ?? "").trim();
  if (repoId) {
    await touchRecentEntity(
      "repo",
      { uid: repoId, name: repoName || repoId },
      scope
    );
  }
  const paymentId = String(source.paymentId ?? "").trim();
  const paymentName = String(source.paymentName ?? "").trim();
  if (paymentId) {
    await touchRecentEntity(
      "payment",
      { uid: paymentId, name: paymentName || paymentId },
      scope
    );
  }
}

async function clearScopeKeys(
  companyUid: string,
  userUid: string
): Promise<void> {
  const storage = localForage();
  for (const type of RECENT_ENTITY_TYPES) {
    try {
      await storage.removeItem(recentEntityKey(companyUid, userUid, type));
    } catch {
      // ignore
    }
  }
  for (const docType of LAST_FORM_DOC_TYPES) {
    try {
      await storage.removeItem(lastFormKey(companyUid, userUid, docType));
    } catch {
      // ignore
    }
  }
}

/** Clear memory for current user/company, or all tracked scopes on logout. */
export async function clearRecentFormMemory(options?: {
  allScopes?: boolean;
  companyUid?: string;
  userUid?: string;
}): Promise<void> {
  const storage = localForage();
  if (options?.allScopes) {
    try {
      const scopes = (await storage.getItem<string[]>(SCOPE_INDEX_KEY)) ?? [];
      for (const id of scopes) {
        const [companyUid, userUid] = id.split(":");
        if (companyUid && userUid) {
          await clearScopeKeys(companyUid, userUid);
        }
      }
      await storage.removeItem(SCOPE_INDEX_KEY);
    } catch {
      // ignore
    }
    return;
  }

  const resolved = resolveMemoryScope(options);
  if (!resolved) return;
  await clearScopeKeys(resolved.companyUid, resolved.userUid);
}
