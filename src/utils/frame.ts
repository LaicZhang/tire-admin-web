import { getConfig } from "@/config";

const HOST_SEPARATOR = /[\s,;]+/;

export const DEFAULT_IFRAME_SANDBOX =
  "allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts";
export const DEFAULT_IFRAME_REFERRER_POLICY = "no-referrer";

type TrustedFrameResult =
  | {
      trusted: true;
      src: string;
    }
  | {
      trusted: false;
      reason: string;
    };

function isLocalHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".localhost")
  );
}

function normalizeTrustedFrameHosts(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .filter((item): item is string => typeof item === "string")
      .flatMap(item => item.split(HOST_SEPARATOR))
      .map(item => item.trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(HOST_SEPARATOR)
      .map(item => item.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
}

function getTrustedFrameHosts(): string[] {
  const runtimeHosts = normalizeTrustedFrameHosts(
    getConfig("TrustedFrameHosts")
  );
  const envHosts = normalizeTrustedFrameHosts(
    import.meta.env.VITE_TRUSTED_FRAME_HOSTS
  );
  return [...new Set([...runtimeHosts, ...envHosts])];
}

function matchesTrustedHost(url: URL, trustedHost: string): boolean {
  const normalizedHost = trustedHost.trim().toLowerCase();
  if (!normalizedHost) return false;

  const origin = url.origin.toLowerCase();
  const hostname = url.hostname.toLowerCase();
  const hostWithPort = `${hostname}${url.port ? `:${url.port}` : ""}`;

  if (normalizedHost.includes("://")) {
    return origin === normalizedHost;
  }

  return (
    hostname === normalizedHost ||
    hostname.endsWith(`.${normalizedHost}`) ||
    hostWithPort === normalizedHost
  );
}

function hasAllowedProtocol(url: URL): boolean {
  if (url.protocol === "https:") return true;
  if (url.protocol !== "http:") return false;

  return import.meta.env.DEV || isLocalHost(url.hostname);
}

export function resolveTrustedFrameSrc(
  input: string | null | undefined
): TrustedFrameResult {
  const raw = input?.trim();
  if (!raw) {
    return {
      trusted: false,
      reason: "未配置链接地址"
    };
  }

  let url: URL;
  try {
    url = new URL(raw, window.location.origin);
  } catch {
    return {
      trusted: false,
      reason: "链接地址格式无效"
    };
  }

  if (!hasAllowedProtocol(url)) {
    return {
      trusted: false,
      reason: "仅允许 HTTPS 或本地开发 HTTP 地址"
    };
  }

  if (url.origin === window.location.origin) {
    return {
      trusted: true,
      src: url.toString()
    };
  }

  const trustedHosts = getTrustedFrameHosts();
  if (trustedHosts.some(host => matchesTrustedHost(url, host))) {
    return {
      trusted: true,
      src: url.toString()
    };
  }

  return {
    trusted: false,
    reason: "当前链接不在受信任域名范围内"
  };
}

export function withFrameCacheBust(input: string, timestamp = Date.now()) {
  const url = new URL(input, window.location.origin);
  url.searchParams.set("t", String(timestamp));
  return url.toString();
}
