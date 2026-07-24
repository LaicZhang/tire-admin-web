/**
 * DRF-01: local create-form draft autosave (admin).
 * Key: draft:{company}:{user}:{docType}; TTL 7d; sensitive fields stripped.
 * Scope / logout cleanup mirrors recentFormMemory.
 */
import { getToken } from "@/utils/auth";
import { localForage } from "@/utils/localforage";
import { useCurrentCompanyStoreHook } from "@/store/modules/company";
import { useUserStoreHook } from "@/store/modules/user";
import {
  LAST_FORM_DOC_TYPES,
  type LastFormDocType,
  type LastFormHeader,
  pickLastFormHeader
} from "./recentFormMemory";

/** 7 days */
export const FORM_DRAFT_TTL_MINUTES = 7 * 24 * 60;
export const FORM_DRAFT_TTL_MS = FORM_DRAFT_TTL_MINUTES * 60 * 1000;
export const FORM_DRAFT_MAX_LINES = 200;

export type FormDraftDocType = LastFormDocType;

export type FormDraftLine = {
  tireId?: string;
  tireName?: string;
  qty?: number;
  count?: number;
  repoId?: string;
};

export type FormDraftPayload = {
  savedAt: number;
  header: LastFormHeader;
  lines: FormDraftLine[];
  /** opaque non-sensitive notes / remark only */
  remark?: string;
};

const SCOPE_INDEX_KEY = "fdm:scopes";
const LINE_KEYS = ["tireId", "tireName", "qty", "count", "repoId"] as const;

export function draftFormKey(
  companyUid: string,
  userUid: string,
  docType: FormDraftDocType
): string {
  return `draft:form:${companyUid}:${userUid}:${docType}`;
}

export function isFormDraftDocType(value: string): value is FormDraftDocType {
  return (LAST_FORM_DOC_TYPES as readonly string[]).includes(value);
}

function resolveScope(explicit?: {
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
    // ignore
  }
}

/**
 * Strip amounts, bank accounts, passwords, free-form detail prices.
 * Keeps header whitelist + limited line identity/qty only.
 */
export function sanitizeFormDraft(
  source: Record<string, unknown> | null | undefined,
  now = Date.now()
): FormDraftPayload | null {
  if (!source || typeof source !== "object") return null;

  const header = pickLastFormHeader(source);
  const lines: FormDraftLine[] = [];
  const rawLines = source.details ?? source.lines ?? source.items;
  if (Array.isArray(rawLines)) {
    for (const row of rawLines.slice(0, FORM_DRAFT_MAX_LINES)) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const line: FormDraftLine = {};
      for (const key of LINE_KEYS) {
        const v = r[key];
        if (key === "qty" || key === "count") {
          const n = typeof v === "number" ? v : Number(v);
          if (Number.isFinite(n) && n >= 0) {
            line[key] = n;
          }
          continue;
        }
        if (typeof v === "string" && v.trim()) {
          line[key] = v.trim().slice(0, 120);
        }
      }
      if (line.tireId || line.qty != null || line.count != null) {
        lines.push(line);
      }
    }
  }

  let remark: string | undefined;
  const remarkRaw = source.remark ?? source.note ?? source.memo;
  if (typeof remarkRaw === "string") {
    const t = remarkRaw.trim().slice(0, 200);
    if (t) remark = t;
  }

  if (
    Object.keys(header).length === 0 &&
    lines.length === 0 &&
    remark == null
  ) {
    return null;
  }

  return { savedAt: now, header, lines, ...(remark ? { remark } : {}) };
}

export function isFormDraftExpired(
  payload: FormDraftPayload | null | undefined,
  now = Date.now(),
  ttlMs = FORM_DRAFT_TTL_MS
): boolean {
  if (!payload || typeof payload.savedAt !== "number") return true;
  return now - payload.savedAt > ttlMs;
}

export function applyFormDraftHeader(
  target: Record<string, unknown>,
  payload: FormDraftPayload | null | undefined,
  mode: "prefer" | "override" = "prefer"
): void {
  if (!payload?.header) return;
  for (const [key, next] of Object.entries(payload.header)) {
    if (typeof next !== "string" || !next.trim()) continue;
    if (mode === "prefer") {
      const current = target[key];
      if (current != null && String(current).trim().length > 0) continue;
    }
    target[key] = next;
  }
  if (payload.remark && mode === "prefer") {
    const current = target.remark ?? target.note;
    if (current == null || String(current).trim() === "") {
      target.remark = payload.remark;
    }
  } else if (payload.remark && mode === "override") {
    target.remark = payload.remark;
  }
}

export async function readFormDraft(
  docType: FormDraftDocType,
  scope?: { companyUid?: string; userUid?: string }
): Promise<FormDraftPayload | null> {
  const resolved = resolveScope(scope);
  if (!resolved) return null;
  try {
    const raw = await localForage().getItem<FormDraftPayload>(
      draftFormKey(resolved.companyUid, resolved.userUid, docType)
    );
    if (!raw || typeof raw !== "object") return null;
    if (isFormDraftExpired(raw)) {
      await clearFormDraft(docType, scope);
      return null;
    }
    return {
      savedAt: raw.savedAt,
      header: pickLastFormHeader(raw.header as Record<string, unknown>),
      lines: Array.isArray(raw.lines)
        ? raw.lines.slice(0, FORM_DRAFT_MAX_LINES)
        : [],
      ...(typeof raw.remark === "string" ? { remark: raw.remark } : {})
    };
  } catch {
    return null;
  }
}

export async function writeFormDraft(
  docType: FormDraftDocType,
  source: Record<string, unknown>,
  scope?: { companyUid?: string; userUid?: string }
): Promise<FormDraftPayload | null> {
  const resolved = resolveScope(scope);
  if (!resolved) return null;
  const payload = sanitizeFormDraft(source);
  if (!payload) return null;
  try {
    await localForage().setItem(
      draftFormKey(resolved.companyUid, resolved.userUid, docType),
      payload,
      FORM_DRAFT_TTL_MINUTES
    );
    await registerScope(resolved.companyUid, resolved.userUid);
    return payload;
  } catch {
    return null;
  }
}

export async function clearFormDraft(
  docType: FormDraftDocType,
  scope?: { companyUid?: string; userUid?: string }
): Promise<void> {
  const resolved = resolveScope(scope);
  if (!resolved) return;
  try {
    await localForage().removeItem(
      draftFormKey(resolved.companyUid, resolved.userUid, docType)
    );
  } catch {
    // ignore
  }
}

async function clearScopeDrafts(
  companyUid: string,
  userUid: string
): Promise<void> {
  const storage = localForage();
  for (const docType of LAST_FORM_DOC_TYPES) {
    try {
      await storage.removeItem(draftFormKey(companyUid, userUid, docType));
    } catch {
      // ignore
    }
  }
}

/** Clear drafts for current scope or all scopes (logout). */
export async function clearFormDraftMemory(options?: {
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
          await clearScopeDrafts(companyUid, userUid);
        }
      }
      await storage.removeItem(SCOPE_INDEX_KEY);
    } catch {
      // ignore
    }
    return;
  }
  const resolved = resolveScope(options);
  if (!resolved) return;
  await clearScopeDrafts(resolved.companyUid, resolved.userUid);
}
