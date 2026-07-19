import { describe, expect, it, vi, beforeEach } from "vitest";

const downloadBlob = vi.fn();
vi.mock("@/utils/download", () => ({
  downloadBlob: (...args: unknown[]) => downloadBlob(...args),
  generateFilenameWithTimestamp: (base: string, ext: string) => `${base}${ext}`
}));

import { exportRowsAsCsv } from "../tablePresentation";

async function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === "function") {
    return blob.text();
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsText(blob);
  });
}

describe("fund exportRowsAsCsv FILE-009", () => {
  beforeEach(() => {
    downloadBlob.mockClear();
  });

  it("neutralizes formula prefixes in cells", async () => {
    exportRowsAsCsv(
      [{ name: "=cmd|'/c calc'!A0", note: "+123", tag: "@SUM(A1)" }],
      [
        { label: "名称", value: r => r.name },
        { label: "备注", value: r => r.note },
        { label: "标签", value: r => r.tag }
      ],
      "test-export"
    );
    expect(downloadBlob).toHaveBeenCalledTimes(1);
    const blob = downloadBlob.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    const text = await readBlobText(blob);
    // BOM + quoted cells; each formula cell must be neutralized with leading '
    expect(text).toContain(`"'=cmd|'/c calc'!A0"`);
    expect(text).toContain(`"'+123"`);
    expect(text).toContain(`"'@SUM(A1)"`);
  });
});
