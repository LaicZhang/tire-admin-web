import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  resolveSameOriginDownloadUrl,
  parseContentDispositionFilename,
  sanitizeDownloadFilename,
  assertAllowedDownloadMime,
  downloadBlob,
  downloadFromUrl
} from "../download";

describe("download utils (FILE-013)", () => {
  describe("resolveSameOriginDownloadUrl", () => {
    const origin = "https://admin.example.com";

    it("resolves relative path against origin", () => {
      const u = resolveSameOriginDownloadUrl("/api/v1/files/a.pdf", origin);
      expect(u.href).toBe("https://admin.example.com/api/v1/files/a.pdf");
      expect(u.origin).toBe(origin);
    });

    it("accepts same-origin absolute https URL", () => {
      const u = resolveSameOriginDownloadUrl(
        "https://admin.example.com/files/x.xlsx",
        origin
      );
      expect(u.pathname).toBe("/files/x.xlsx");
    });

    it("rejects protocol-relative //evil", () => {
      expect(() =>
        resolveSameOriginDownloadUrl("//evil.example/file", origin)
      ).toThrow(/协议相对|跨源|拒绝/);
    });

    it("rejects external https host", () => {
      expect(() =>
        resolveSameOriginDownloadUrl("https://evil.example/file.pdf", origin)
      ).toThrow(/跨源/);
    });

    it("rejects non-http(s) schemes", () => {
      expect(() =>
        resolveSameOriginDownloadUrl("javascript:alert(1)", origin)
      ).toThrow();
      expect(() =>
        resolveSameOriginDownloadUrl("data:text/html,hi", origin)
      ).toThrow();
      expect(() =>
        resolveSameOriginDownloadUrl("ftp://admin.example.com/a", origin)
      ).toThrow(/http/);
    });

    it("rejects empty", () => {
      expect(() => resolveSameOriginDownloadUrl("  ", origin)).toThrow();
    });

    it("does not treat origin string-prefix spoof as same origin", () => {
      expect(() =>
        resolveSameOriginDownloadUrl(
          "https://admin.example.com.evil.com/x",
          origin
        )
      ).toThrow(/跨源/);
    });
  });

  describe("parseContentDispositionFilename", () => {
    it("parses quoted filename", () => {
      expect(
        parseContentDispositionFilename('attachment; filename="report.xlsx"')
      ).toBe("report.xlsx");
    });

    it("parses RFC5987 filename*", () => {
      expect(
        parseContentDispositionFilename(
          "attachment; filename*=UTF-8''%E6%8A%A5%E8%A1%A8.pdf"
        )
      ).toBe("报表.pdf");
    });

    it("strips path traversal from disposition name", () => {
      expect(
        parseContentDispositionFilename(
          'attachment; filename="../../etc/passwd"'
        )
      ).toBe("passwd");
    });

    it("returns undefined for empty", () => {
      expect(parseContentDispositionFilename(null)).toBeUndefined();
      expect(parseContentDispositionFilename("inline")).toBeUndefined();
    });
  });

  describe("sanitizeDownloadFilename", () => {
    it("strips path and control chars", () => {
      expect(sanitizeDownloadFilename("a/b\\c\u0000.xlsx")).toBe("c.xlsx");
    });
  });

  describe("assertAllowedDownloadMime", () => {
    it("allows pdf and xlsx", () => {
      expect(() => assertAllowedDownloadMime("application/pdf")).not.toThrow();
      expect(() =>
        assertAllowedDownloadMime(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
      ).not.toThrow();
      expect(() =>
        assertAllowedDownloadMime("application/octet-stream")
      ).not.toThrow();
    });

    it("rejects json/html masquerade", () => {
      expect(() => assertAllowedDownloadMime("application/json")).toThrow(
        /伪装|拒绝/
      );
      expect(() =>
        assertAllowedDownloadMime("text/html; charset=utf-8")
      ).toThrow(/伪装|拒绝/);
    });

    it("enforces expectedMime prefix", () => {
      expect(() =>
        assertAllowedDownloadMime("image/png", "image/")
      ).not.toThrow();
      expect(() =>
        assertAllowedDownloadMime("application/pdf", "image/")
      ).toThrow(/不被允许/);
    });

    it("skipMimeCheck bypasses", () => {
      expect(() =>
        assertAllowedDownloadMime("text/html", undefined, {
          skipMimeCheck: true
        })
      ).not.toThrow();
    });
  });

  describe("downloadBlob MIME gate", () => {
    const realCreate = URL.createObjectURL;
    const realRevoke = URL.revokeObjectURL;

    beforeEach(() => {
      URL.createObjectURL = vi.fn(
        () => "blob:mock"
      ) as typeof URL.createObjectURL;
      URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL;
      const click = vi.fn();
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "a") {
          return {
            href: "",
            download: "",
            click,
            style: {}
          } as unknown as HTMLAnchorElement;
        }
        return document.createElement(tag);
      });
      vi.spyOn(document.body, "appendChild").mockImplementation(n => n as Node);
      vi.spyOn(document.body, "removeChild").mockImplementation(n => n as Node);
    });

    afterEach(() => {
      URL.createObjectURL = realCreate;
      URL.revokeObjectURL = realRevoke;
      vi.restoreAllMocks();
    });

    it("refuses json blob download as xlsx", () => {
      const blob = new Blob(['{"error":1}'], { type: "application/json" });
      expect(() => downloadBlob(blob, "data.xlsx")).toThrow(/伪装|拒绝/);
    });

    it("allows pdf blob", () => {
      const blob = new Blob(["%PDF"], { type: "application/pdf" });
      expect(() => downloadBlob(blob, "a.pdf")).not.toThrow();
    });
  });

  describe("downloadFromUrl same-origin fetch", () => {
    const origin = "https://admin.example.com";

    beforeEach(() => {
      vi.stubGlobal("location", { origin });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("rejects //evil before fetch", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      await expect(downloadFromUrl("//evil.example/x")).rejects.toThrow();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("rejects external host before fetch", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      await expect(
        downloadFromUrl("https://evil.example/x.pdf")
      ).rejects.toThrow(/跨源/);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("rejects JSON Content-Type on success response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: true,
          headers: {
            get: (k: string) =>
              k.toLowerCase() === "content-type" ? "application/json" : null
          },
          blob: async () => new Blob(['{"e":1}'], { type: "application/json" })
        }))
      );
      await expect(
        downloadFromUrl("/api/export.xlsx", "export.xlsx")
      ).rejects.toThrow(/伪装|拒绝/);
    });
  });
});
