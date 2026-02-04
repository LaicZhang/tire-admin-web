export interface FormatFileSizeOptions {
  decimals?: number;
  emptyText?: string;
}

export function formatFileSize(
  bytes?: number | null,
  options: FormatFileSizeOptions = {}
): string {
  const { decimals = 2, emptyText = "-" } = options;
  if (bytes === null || bytes === undefined) return emptyText;
  if (!Number.isFinite(bytes)) return emptyText;
  if (bytes < 0) return emptyText;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(decimals)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(decimals)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(decimals)} GB`;
}
