import { logger } from "@/utils/logger";

/**
 * 文件下载工具函数
 * 统一处理 Blob 下载、URL 下载等场景，避免重复代码
 */

/**
 * 下载 Blob 对象为文件
 * @param blob Blob 对象
 * @param filename 文件名（包含扩展名）
 * @param options 可选配置
 */
export function downloadBlob(
  blob: Blob,
  filename: string,
  options?: {
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
  }
): void {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // 处理文件名
    let finalFilename = filename;
    if (options?.addTimestamp) {
      const ext = filename.includes(".")
        ? filename.substring(filename.lastIndexOf("."))
        : "";
      const nameWithoutExt = filename.includes(".")
        ? filename.substring(0, filename.lastIndexOf("."))
        : filename;
      finalFilename = `${nameWithoutExt}_${Date.now()}${ext}`;
    }

    link.download = finalFilename;

    // 兼容性处理：某些浏览器需要将 link 添加到 DOM
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 释放 URL 对象
    window.URL.revokeObjectURL(url);

    if (options?.showMessage) {
      // 动态导入 message 避免循环依赖
      import("@/utils/message").then(({ message }) => {
        message("下载成功", { type: "success" });
      });
    }
  } catch (error) {
    logger.error("下载文件失败:", error);
    import("@/utils/message").then(({ message }) => {
      message("下载失败", { type: "error" });
    });
    throw error;
  }
}

/**
 * 从 Promise<Blob> 下载文件
 * @param promise 返回 Blob 的 Promise
 * @param filename 文件名
 * @param options 可选配置
 */
export async function downloadFromRequest(
  promise: Promise<Blob>,
  filename: string,
  options?: {
    addTimestamp?: boolean;
    showMessage?: boolean;
    onProgress?: (progress: number) => void;
  }
): Promise<void> {
  try {
    const blob = await promise;
    downloadBlob(blob, filename, options);
  } catch (error) {
    logger.error("下载请求失败:", error);
    import("@/utils/message").then(({ message }) => {
      message("下载失败", { type: "error" });
    });
    throw error;
  }
}

/**
 * 从 URL 下载文件（支持跨域 URL）
 * @param url 文件 URL
 * @param filename 可选的文件名（如果不提供，将尝试从 URL 提取）
 * @param options 可选配置
 */
export async function downloadFromUrl(
  url: string,
  filename?: string,
  options?: {
    addTimestamp?: boolean;
    showMessage?: boolean;
  }
): Promise<void> {
  try {
    // 如果是同源 URL，直接创建链接下载
    if (url.startsWith("/") || url.startsWith(window.location.origin)) {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || url.substring(url.lastIndexOf("/") + 1);
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

    // 跨域 URL，需要先 fetch 获取 Blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const finalFilename =
      filename ||
      url.substring(url.lastIndexOf("/") + 1).split("?")[0] ||
      `download_${Date.now()}`;

    downloadBlob(blob, finalFilename, options);
  } catch (error) {
    logger.error("从 URL 下载失败:", error);
    import("@/utils/message").then(({ message }) => {
      message("下载失败", { type: "error" });
    });
    throw error;
  }
}

/**
 * 生成带时间戳的文件名
 * @param baseName 基础文件名（不含扩展名）
 * @param extension 扩展名（含点号，如 .xlsx）
 */
export function generateFilenameWithTimestamp(
  baseName: string,
  extension: string = ".xlsx"
): string {
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${baseName}_${Date.now()}${ext}`;
}
