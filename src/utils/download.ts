import { logger } from "@/utils/logger";

/**
 * 文件下载工具函数
 * 统一处理 Blob 下载、URL 下载等场景，避免重复代码
 * FILE-013: 同源 URL 严格解析；Blob MIME 白名单/前缀校验；安全文件名
 */

/** 常见业务下载允许的 MIME 前缀或精确类型 */
export const DEFAULT_BLOB_MIME_ALLOWLIST: readonly string[] = [
  "application/pdf",
  "application/octet-stream",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "text/plain",
  "image/"
];

/** 明确拒绝的伪装类型（错误 JSON/HTML 不应落成 xlsx/pdf） */
export const REJECTED_BLOB_MIME_PREFIXES: readonly string[] = [
  "application/json",
  "text/html",
  "application/xhtml",
  "text/xml",
  "application/xml"
];

export type DownloadBlobOptions = {
  /**
   * 是否自动添加时间戳到文件名
   * @default false
   */
  addTimestamp?: boolean;
  /**
   * 是否在下载后显示成功消息
   * @default false
   */
  showMessage?: boolean;
  /**
   * 期望的 MIME 前缀（如 `application/pdf` / `image/`）或 allowlist 覆盖。
   * 未传时使用 DEFAULT_BLOB_MIME_ALLOWLIST，并拒绝 REJECTED_BLOB_MIME_PREFIXES。
   * 传空数组则跳过 MIME 校验（不推荐）。
   */
  expectedMime?: string | readonly string[];
  /**
   * 为 true 时跳过 MIME 校验（兼容极少数未知类型导出）。
   * @default false
   */
  skipMimeCheck?: boolean;
};

/**
 * 将下载 URL 解析为同源绝对 URL。
 * - 相对路径按 location.origin 解析
 * - 仅允许 http(s)
 * - origin 必须与 baseOrigin 完全一致（拒绝 `//evil`、外站、非 http(s)）
 */
export function resolveSameOriginDownloadUrl(
  value: string,
  baseOrigin: string = typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost"
): URL {
  const raw = (value ?? "").trim();
  if (!raw) {
    throw new Error("下载地址无效");
  }

  // protocol-relative //host/... must not be treated as same-origin path
  if (raw.startsWith("//")) {
    throw new Error("拒绝协议相对下载地址");
  }

  let parsed: URL;
  try {
    parsed = new URL(raw, baseOrigin);
  } catch {
    throw new Error("下载地址解析失败");
  }

  // blob: object URLs are page-created and safe for local download (barcode etc.)
  if (parsed.protocol === "blob:") {
    return parsed;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("仅允许 http(s) 下载地址");
  }

  const base = new URL(baseOrigin);
  if (parsed.origin !== base.origin) {
    throw new Error("拒绝跨源下载地址");
  }

  return parsed;
}

/**
 * 从 Content-Disposition 安全提取文件名（仅 basename，剥离路径与控制字符）。
 */
export function parseContentDispositionFilename(
  header: string | null | undefined
): string | undefined {
  if (!header || typeof header !== "string") return undefined;

  // filename*=UTF-8''encoded
  const star = /filename\*\s*=\s*(?:UTF-8''|utf-8'')([^;]+)/i.exec(header);
  if (star?.[1]) {
    try {
      const decoded = decodeURIComponent(
        star[1].trim().replace(/^["']|["']$/g, "")
      );
      return sanitizeDownloadFilename(decoded);
    } catch {
      // fall through
    }
  }

  // filename="..." or filename=...
  const plain =
    /filename\s*=\s*"((?:\\.|[^"\\])*)"/i.exec(header) ||
    /filename\s*=\s*([^;]+)/i.exec(header);
  if (plain?.[1]) {
    const name = plain[1]
      .trim()
      .replace(/\\"/g, '"')
      .replace(/^["']|["']$/g, "");
    return sanitizeDownloadFilename(name);
  }

  return undefined;
}

export function sanitizeDownloadFilename(name: string): string | undefined {
  if (!name) return undefined;
  // strip path segments and NUL/control chars
  const base = name
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  if (!base || base === "." || base === "..") return undefined;
  // cap length
  return base.length > 200 ? base.slice(0, 200) : base;
}

function normalizeMime(type: string): string {
  return type.split(";")[0]?.trim().toLowerCase() ?? "";
}

/**
 * 校验 Blob/响应 Content-Type 是否允许落盘。
 * @throws Error 当类型被拒绝或不在 allowlist/期望前缀内
 */
export function assertAllowedDownloadMime(
  contentType: string | null | undefined,
  expectedMime?: string | readonly string[],
  options?: { skipMimeCheck?: boolean }
): void {
  if (options?.skipMimeCheck) return;

  const mime = normalizeMime(contentType ?? "");
  // empty type: some servers omit it; allow only when caller skipped or expected empty
  if (!mime) {
    // treat missing type as soft-pass only when expectedMime is not strict single type
    // Prefer fail-open for empty when using default allowlist (legacy APIs).
    // Reject if caller demanded a specific MIME.
    if (typeof expectedMime === "string" && expectedMime.length > 0) {
      throw new Error("下载内容类型缺失，与期望不符");
    }
    return;
  }

  for (const rejected of REJECTED_BLOB_MIME_PREFIXES) {
    if (mime === rejected || mime.startsWith(rejected)) {
      throw new Error(`拒绝下载伪装内容类型: ${mime}`);
    }
  }

  const allow: readonly string[] =
    expectedMime === undefined
      ? DEFAULT_BLOB_MIME_ALLOWLIST
      : typeof expectedMime === "string"
        ? [expectedMime]
        : expectedMime;

  if (allow.length === 0) return;

  const ok = allow.some(
    prefix =>
      mime === prefix.toLowerCase() || mime.startsWith(prefix.toLowerCase())
  );
  if (!ok) {
    throw new Error(`下载内容类型不被允许: ${mime}`);
  }
}

/**
 * 下载 Blob 对象为文件
 */
export function downloadBlob(
  blob: Blob,
  filename: string,
  options?: DownloadBlobOptions
): void {
  try {
    assertAllowedDownloadMime(blob.type, options?.expectedMime, {
      skipMimeCheck: options?.skipMimeCheck
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    let finalFilename =
      sanitizeDownloadFilename(filename) || `download_${Date.now()}`;
    if (options?.addTimestamp) {
      const ext = finalFilename.includes(".")
        ? finalFilename.substring(finalFilename.lastIndexOf("."))
        : "";
      const nameWithoutExt = finalFilename.includes(".")
        ? finalFilename.substring(0, finalFilename.lastIndexOf("."))
        : finalFilename;
      finalFilename = `${nameWithoutExt}_${Date.now()}${ext}`;
    }

    link.download = finalFilename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);

    if (options?.showMessage) {
      import("@/utils/message").then(({ message }) => {
        message("下载成功", { type: "success" });
      });
    }
  } catch (error) {
    logger.error("下载文件失败:", error);
    import("@/utils/message").then(({ message }) => {
      const text =
        error instanceof Error && error.message ? error.message : "下载失败";
      message(text, { type: "error" });
    });
    throw error;
  }
}

/**
 * 从 Promise<Blob> 下载文件
 */
export async function downloadFromRequest(
  promise: Promise<Blob>,
  filename: string,
  options?: DownloadBlobOptions
): Promise<void> {
  try {
    const blob = await promise;
    downloadBlob(blob, filename, options);
  } catch (error) {
    logger.error("下载请求失败:", error);
    import("@/utils/message").then(({ message }) => {
      const text =
        error instanceof Error && error.message ? error.message : "下载失败";
      message(text, { type: "error" });
    });
    throw error;
  }
}

/**
 * 从同源 URL 下载文件（FILE-013：严格同源，禁止跨站与协议相对）
 */
export async function downloadFromUrl(
  url: string,
  filename?: string,
  options?: DownloadBlobOptions & {
    /**
     * 为 true 时仅创建 <a> 导航下载（仍须同源）；
     * 为 false 时 fetch Blob 并校验 MIME（默认 false，更安全）。
     * @default false
     */
    directLink?: boolean;
  }
): Promise<void> {
  try {
    const resolved = resolveSameOriginDownloadUrl(url);
    const href = resolved.toString();

    if (options?.directLink) {
      const link = document.createElement("a");
      link.href = href;
      link.download =
        sanitizeDownloadFilename(filename || "") ||
        sanitizeDownloadFilename(resolved.pathname.split("/").pop() || "") ||
        `download_${Date.now()}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (options?.showMessage) {
        import("@/utils/message").then(({ message }) => {
          message("下载成功", { type: "success" });
        });
      }
      return;
    }

    const response = await fetch(href, { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("Content-Type");
    assertAllowedDownloadMime(contentType, options?.expectedMime, {
      skipMimeCheck: options?.skipMimeCheck
    });

    const blob = await response.blob();
    // re-check blob.type if present (may differ from header)
    if (blob.type) {
      assertAllowedDownloadMime(blob.type, options?.expectedMime, {
        skipMimeCheck: options?.skipMimeCheck
      });
    }

    const fromHeader = parseContentDispositionFilename(
      response.headers.get("Content-Disposition")
    );
    const finalFilename =
      sanitizeDownloadFilename(filename || "") ||
      fromHeader ||
      sanitizeDownloadFilename(
        href.substring(href.lastIndexOf("/") + 1).split("?")[0] || ""
      ) ||
      `download_${Date.now()}`;

    // blob may have empty type after fetch; pass header-validated type via new Blob if needed
    const typedBlob =
      blob.type || !contentType
        ? blob
        : new Blob([blob], { type: normalizeMime(contentType) });

    downloadBlob(typedBlob, finalFilename, {
      ...options,
      skipMimeCheck: true // already validated
    });
  } catch (error) {
    logger.error("从 URL 下载失败:", error);
    import("@/utils/message").then(({ message }) => {
      const text =
        error instanceof Error && error.message ? error.message : "下载失败";
      message(text, { type: "error" });
    });
    throw error;
  }
}

/**
 * 生成带时间戳的文件名
 */
export function generateFilenameWithTimestamp(
  baseName: string,
  extension: string = ".xlsx"
): string {
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${baseName}_${Date.now()}${ext}`;
}
