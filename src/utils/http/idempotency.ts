import type { PureHttpRequestConfig } from "./types.d";
import { createUid } from "@/utils/uid";

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);
const IDEMPOTENCY_HEADER = "x-idempotency-key";

type CacheValue = { key: string; expireAtMs: number };
const cache = new Map<string, CacheValue>();

function fnv1a32Hex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Convert unsigned 32-bit to fixed 8 hex chars
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "string") return JSON.stringify(value);
  if (t === "number" || t === "boolean") return String(value);
  if (t !== "object") return "";

  if (Array.isArray(value)) {
    return `[${value.map(v => stableStringify(v)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map(k => `${JSON.stringify(k)}:${stableStringify(record[k])}`)
    .join(",")}}`;
}

function cleanup(nowMs: number) {
  if (cache.size <= 500) return;
  for (const [k, v] of cache.entries()) {
    if (v.expireAtMs <= nowMs) cache.delete(k);
  }
}

export function ensureIdempotencyKey(
  config: PureHttpRequestConfig,
  options?: { nowMs?: number; reuseMs?: number; generateKey?: () => string }
): string | undefined {
  const method = String(config.method || "get").toLowerCase();
  if (!MUTATING_METHODS.has(method)) return undefined;

  config.headers ??= {};
  const existing = (config.headers as Record<string, unknown>)[
    IDEMPOTENCY_HEADER
  ];
  if (typeof existing === "string" && existing.trim().length > 0) {
    return existing.trim();
  }

  const nowMs = options?.nowMs ?? Date.now();
  const reuseMs = options?.reuseMs ?? 3000;
  cleanup(nowMs);

  const url = String(config.url || "");
  const params = stableStringify(config.params);
  const data = stableStringify(config.data);
  const signature = `${method} ${url}|p=${params}|d=${data}`;
  const signatureKey = fnv1a32Hex(signature);

  const cached = cache.get(signatureKey);
  if (cached && cached.expireAtMs > nowMs) {
    (config.headers as Record<string, unknown>)[IDEMPOTENCY_HEADER] =
      cached.key;
    return cached.key;
  }

  const key = options?.generateKey ? options.generateKey() : createUid();
  cache.set(signatureKey, { key, expireAtMs: nowMs + reuseMs });
  (config.headers as Record<string, unknown>)[IDEMPOTENCY_HEADER] = key;
  return key;
}
