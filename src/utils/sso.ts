import { removeToken, setToken, type SetTokenPayload } from "./auth";

const ssoKeys = [
  "username",
  "accessToken",
  "roles",
  "uid",
  "avatar",
  "nickname",
  "permissions"
] as const;

type SsoKey = (typeof ssoKeys)[number];

function normalizeScalar(value: string | null): string {
  return String(value ?? "").trim();
}

function normalizeList(values: Array<string>): Array<string> {
  const parts = values
    .flatMap(v => v.split(","))
    .map(v => v.trim())
    .filter(Boolean);
  return parts;
}

function parseListParam(params: URLSearchParams, key: SsoKey): Array<string> {
  return normalizeList(params.getAll(key));
}

function parseHashQuery(url: URL): {
  hashPath: string;
  params: URLSearchParams;
} | null {
  const raw = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  if (!raw) return null;

  const index = raw.indexOf("?");
  if (index === -1) {
    return { hashPath: raw, params: new URLSearchParams() };
  }

  const hashPath = raw.slice(0, index);
  const query = raw.slice(index + 1);
  return { hashPath, params: new URLSearchParams(query) };
}

function parseSsoPayloadFromParams(
  params: URLSearchParams
): SetTokenPayload | null {
  const username = normalizeScalar(params.get("username"));
  const accessToken = normalizeScalar(params.get("accessToken"));
  const roles = parseListParam(params, "roles");

  if (!username || !accessToken || roles.length === 0) return null;

  const uid = normalizeScalar(params.get("uid")) || undefined;
  const avatar = normalizeScalar(params.get("avatar")) || undefined;
  const nickname = normalizeScalar(params.get("nickname")) || undefined;
  const permissions = parseListParam(params, "permissions");

  const payload: SetTokenPayload = {
    username,
    accessToken,
    roles,
    uid,
    avatar,
    nickname,
    ...(permissions.length > 0 ? { permissions } : {})
  };

  return payload;
}

export function parseSsoPayloadFromUrl(url: URL): SetTokenPayload | null {
  const fromSearch = parseSsoPayloadFromParams(url.searchParams);
  if (fromSearch) return fromSearch;

  const hash = parseHashQuery(url);
  if (!hash) return null;
  return parseSsoPayloadFromParams(hash.params);
}

export function removeSsoParamsFromUrl(url: URL): string {
  const next = new URL(url.toString());

  for (const key of ssoKeys) {
    next.searchParams.delete(key);
  }

  const hash = parseHashQuery(next);
  if (hash) {
    for (const key of ssoKeys) {
      hash.params.delete(key);
    }

    const query = hash.params.toString();
    const hashPath = hash.hashPath;
    next.hash = hashPath ? `#${hashPath}${query ? `?${query}` : ""}` : "";
  }

  return next.toString();
}

export function applySsoFromCurrentUrl(): boolean {
  if (typeof window === "undefined") return false;

  const url = new URL(window.location.href);
  const payload = parseSsoPayloadFromUrl(url);
  if (!payload) return false;

  removeToken();
  setToken(payload);

  const cleanedUrl = removeSsoParamsFromUrl(url);
  window.location.replace(cleanedUrl);
  return true;
}
