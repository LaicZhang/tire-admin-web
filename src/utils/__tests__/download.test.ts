import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import {
  resolveSameOriginDownloadUrl,
  parseContentDispositionFilename,
  sanitizeDownloadFilename,
  assertAllowedDownloadMime,
  downloadBlob,
  downloadFromRequest,
  downloadFromUrl,
  generateFilenameWithTimestamp
} from "../download";

const mocks = vi.hoisted(() => ({
  logError: vi.fn(),
  message: vi.fn()
}));

vi.mock("@/utils/logger", () => ({ logger: { error: mocks.logError } }));
vi.mock("@/utils/message", () => ({ message: mocks.message }));

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

    it("accepts page-created blob URLs and trims input", () => {
      const url = resolveSameOriginDownloadUrl(
        "  blob:https://admin.example.com/uuid  ",
        origin
      );
      expect(url.protocol).toBe("blob:");
    });

    it("uses localhost as the default base and reports invalid URLs", () => {
      expect(resolveSameOriginDownloadUrl("/x").origin).toBe(
        window.location.origin
      );
      expect(() => resolveSameOriginDownloadUrl("http://[", origin)).toThrow(
        /解析失败/
      );
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

    it("falls back when filename* cannot be decoded", () => {
      expect(
        parseContentDispositionFilename(
          "attachment; filename*=UTF-8''%E0%A4%A; filename=\"fallback.pdf\""
        )
      ).toBe("fallback.pdf");
    });

    it("accepts lowercase encoding and unescaped quoted names", () => {
      expect(
        parseContentDispositionFilename(
          "attachment; filename*=utf-8''report%20one.csv"
        )
      ).toBe("report one.csv");
      expect(
        parseContentDispositionFilename(
          'attachment; filename="say \\"hi\\".txt"'
        )
      ).toBe('say "hi".txt');
    });
  });

  describe("sanitizeDownloadFilename", () => {
    it("strips path and control chars", () => {
      expect(sanitizeDownloadFilename("a/b\\c\u0000.xlsx")).toBe("c.xlsx");
    });

    it("rejects empty and dot paths and caps long names", () => {
      expect(sanitizeDownloadFilename("")).toBeUndefined();
      expect(sanitizeDownloadFilename(".")).toBeUndefined();
      expect(sanitizeDownloadFilename("..")).toBeUndefined();
      expect(sanitizeDownloadFilename(`/${"a".repeat(220)}`)).toHaveLength(200);
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

    it("allows missing types unless a specific type is required", () => {
      expect(() => assertAllowedDownloadMime(null)).not.toThrow();
      expect(() => assertAllowedDownloadMime(undefined, [])).not.toThrow();
      expect(() => assertAllowedDownloadMime("", "application/pdf")).toThrow(
        /缺失/
      );
    });

    it("handles expected MIME arrays and unexpected types", () => {
      expect(() =>
        assertAllowedDownloadMime("IMAGE/PNG; charset=binary", [
          "application/pdf",
          "image/"
        ])
      ).not.toThrow();
      expect(() =>
        assertAllowedDownloadMime("application/pdf", [])
      ).not.toThrow();
      expect(() =>
        assertAllowedDownloadMime("application/json; charset=utf-8")
      ).toThrow(/伪装/);
      expect(() =>
        assertAllowedDownloadMime("application/zip", "application/pdf")
      ).toThrow(/不被允许/);
    });

    it("normalizes case and parameters before matching", () => {
      expect(() =>
        assertAllowedDownloadMime(" APPLICATION/PDF ; charset=binary")
      ).not.toThrow();
    });
  });

  describe("downloadBlob MIME gate", () => {
    const realCreate = URL.createObjectURL;
    const realRevoke = URL.revokeObjectURL;
    let click: ReturnType<typeof vi.fn>;
    let anchor: { href: string; download: string; click: typeof click };

    beforeEach(() => {
      mocks.logError.mockClear();
      mocks.message.mockClear();
      URL.createObjectURL = vi.fn(
        () => "blob:mock"
      ) as typeof URL.createObjectURL;
      URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL;
      click = vi.fn();
      anchor = { href: "", download: "", click };
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "a") {
          return anchor as unknown as HTMLAnchorElement;
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

    it("creates, clicks, revokes and reports successful downloads", async () => {
      const blob = new Blob(["%PDF"], { type: "application/pdf" });
      downloadBlob(blob, "report.pdf", {
        addTimestamp: true,
        showMessage: true
      });
      await flushPromises();

      expect(anchor.download).toMatch(/^report_\d+\.pdf$/);
      expect(anchor.click).toHaveBeenCalledOnce();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
      expect(mocks.message).toHaveBeenCalledWith("下载成功", {
        type: "success"
      });
    });

    it("uses a timestamp fallback name for extensionless blank input", () => {
      const blob = new Blob(["%PDF"], { type: "application/pdf" });
      downloadBlob(blob, "  ", { addTimestamp: true });
      expect(anchor.download).toMatch(/^download_\d+_\d+$/);
    });

    it("logs and reports rejected Blob downloads", async () => {
      const blob = new Blob(['{"error":1}'], { type: "application/json" });
      expect(() => downloadBlob(blob, "data.xlsx")).toThrow(/伪装/);
      await flushPromises();
      expect(mocks.logError).toHaveBeenCalledWith(
        "下载文件失败:",
        expect.any(Error)
      );
      expect(mocks.message).toHaveBeenCalledWith(
        expect.stringMatching(/伪装/),
        { type: "error" }
      );
    });

    it("downloads resolved request blobs and reports request failures", async () => {
      const blob = new Blob(["%PDF"], { type: "application/pdf" });
      await expect(
        downloadFromRequest(Promise.resolve(blob), "a.pdf")
      ).resolves.toBeUndefined();
      expect(anchor.click).toHaveBeenCalledOnce();

      await expect(
        downloadFromRequest(Promise.reject("offline"), "a.pdf")
      ).rejects.toBe("offline");
      await flushPromises();
      expect(mocks.logError).toHaveBeenCalledWith("下载请求失败:", "offline");
      expect(mocks.message).toHaveBeenCalledWith("下载失败", { type: "error" });
    });
  });

  describe("downloadFromUrl same-origin fetch", () => {
    const origin = "https://admin.example.com";
    const realCreate = URL.createObjectURL;
    const realRevoke = URL.revokeObjectURL;
    let anchor: {
      href: string;
      download: string;
      target: string;
      rel: string;
      click: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mocks.logError.mockClear();
      mocks.message.mockClear();
      vi.stubGlobal("location", { origin });
      anchor = {
        href: "",
        download: "",
        target: "",
        rel: "",
        click: vi.fn()
      };
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "a") return anchor as unknown as HTMLAnchorElement;
        return document.createElement(tag);
      });
      vi.spyOn(document.body, "appendChild").mockImplementation(n => n as Node);
      vi.spyOn(document.body, "removeChild").mockImplementation(n => n as Node);
      URL.createObjectURL = vi.fn(
        () => "blob:url"
      ) as typeof URL.createObjectURL;
      URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL;
    });

    afterEach(() => {
      URL.createObjectURL = realCreate;
      URL.revokeObjectURL = realRevoke;
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

    it("uses direct navigation and reports success without fetch", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      await downloadFromUrl("/files/report.pdf", undefined, {
        directLink: true,
        showMessage: true
      });
      await flushPromises();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(anchor.href).toBe("https://admin.example.com/files/report.pdf");
      expect(anchor.download).toBe("report.pdf");
      expect(anchor.target).toBe("_blank");
      expect(anchor.rel).toBe("noopener noreferrer");
      expect(anchor.click).toHaveBeenCalledOnce();
      expect(mocks.message).toHaveBeenCalledWith("下载成功", {
        type: "success"
      });
    });

    it("downloads fetched Blobs using the disposition filename", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: true,
          status: 200,
          headers: {
            get: (key: string) => {
              if (key === "Content-Type") return "application/pdf";
              if (key === "Content-Disposition") {
                return 'attachment; filename="server.pdf"';
              }
              return null;
            }
          },
          blob: async () => new Blob(["%PDF"], { type: "" })
        }))
      );

      await downloadFromUrl("/api/export", "");
      expect(anchor.download).toBe("server.pdf");
      expect(anchor.click).toHaveBeenCalledOnce();
    });

    it("falls back to the URL basename and filename* disposition", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: true,
          status: 200,
          headers: {
            get: (key: string) => {
              if (key === "Content-Type") return "text/csv";
              if (key === "Content-Disposition") {
                return "attachment; filename*=UTF-8''from%20server.csv";
              }
              return null;
            }
          },
          blob: async () => new Blob(["a,b"], { type: "text/csv" })
        }))
      );

      await downloadFromUrl("/api/path?token=x", " ");
      expect(anchor.download).toBe("from server.csv");
    });

    it("reports HTTP and transport failures", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({ ok: false, status: 503 }))
      );
      await expect(downloadFromUrl("/api/export")).rejects.toThrow(/503/);
      await flushPromises();
      expect(mocks.message).toHaveBeenCalledWith(expect.stringMatching(/503/), {
        type: "error"
      });

      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Promise.reject("offline"))
      );
      await expect(downloadFromUrl("/api/export")).rejects.toBe("offline");
      await flushPromises();
      expect(mocks.message).toHaveBeenCalledWith("下载失败", { type: "error" });
    });

    it("uses explicit direct-link filenames and the default path fallback", async () => {
      await downloadFromUrl("/files/ignored.pdf", "chosen.pdf", {
        directLink: true
      });
      expect(anchor.download).toBe("chosen.pdf");

      await downloadFromUrl("/", undefined, { directLink: true });
      expect(anchor.download).toMatch(/^download_\d+$/);
    });

    it("prefers a valid fetch filename and falls back to the URL basename", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: true,
          status: 200,
          headers: {
            get: (key: string) => (key === "Content-Type" ? "text/plain" : null)
          },
          blob: async () => new Blob(["ok"], { type: "" })
        }))
      );

      await downloadFromUrl("/files/path-report.txt", "explicit.txt");
      expect(anchor.download).toBe("explicit.txt");

      await downloadFromUrl("/files/path-report.txt");
      expect(anchor.download).toBe("path-report.txt");
    });

    it("uses a timestamp fallback for a fetched root URL", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: true,
          status: 200,
          headers: { get: () => null },
          blob: async () => new Blob(["ok"], { type: "" })
        }))
      );

      await downloadFromUrl("/");
      expect(anchor.download).toMatch(/^download_\d+$/);
    });

    it("generates filenames with a normalized extension", () => {
      expect(generateFilenameWithTimestamp("orders", "csv")).toMatch(
        /^orders_\d+\.csv$/
      );
      expect(generateFilenameWithTimestamp("orders", ".pdf")).toMatch(
        /^orders_\d+\.pdf$/
      );
      expect(generateFilenameWithTimestamp("orders")).toMatch(
        /^orders_\d+\.xlsx$/
      );
    });
  });
});
