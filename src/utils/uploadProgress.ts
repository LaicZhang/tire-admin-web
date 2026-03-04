import type { UploadProgressEvent } from "element-plus";

export function toUploadProgressEvent(percent: number): UploadProgressEvent {
  const normalized = Number.isFinite(percent)
    ? Math.min(100, Math.max(0, percent))
    : 0;

  const base =
    typeof ProgressEvent !== "undefined"
      ? new ProgressEvent("progress", {
          lengthComputable: true,
          loaded: normalized,
          total: 100
        })
      : new Event("progress");

  return Object.assign(base, { percent: normalized }) as UploadProgressEvent;
}
