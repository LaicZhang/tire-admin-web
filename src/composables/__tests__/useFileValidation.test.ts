import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateFile,
  validateExcelFile,
  validateExcelOrCsvFile,
  validateImageFile,
  formatFileSize,
  createUploadValidator,
  createUploadChangeHandler,
  FileTypePresets,
  type FileTypeConfig
} from "../useFileValidation";

interface UploadFile {
  raw: File;
  [key: string]: unknown;
}

// Mock message function
vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

describe("useFileValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("FileTypePresets", () => {
    it("should have excel preset with correct config", () => {
      expect(FileTypePresets.excel.mimeTypes).toContain(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      expect(FileTypePresets.excel.extensions).toEqual(/\.(xlsx|xls)$/i);
      expect(FileTypePresets.excel.maxSize).toBe(10 * 1024 * 1024);
    });

    it("should have image preset with correct config", () => {
      expect(FileTypePresets.image.mimeTypes).toContain("image/png");
      expect(FileTypePresets.image.mimeTypes).toContain("image/jpeg");
      expect(FileTypePresets.image.extensions).toEqual(
        /\.(png|jpg|jpeg|gif|webp)$/i
      );
    });

    it("should have pdf preset with correct config", () => {
      expect(FileTypePresets.pdf.mimeTypes).toContain("application/pdf");
      expect(FileTypePresets.pdf.extensions).toEqual(/\.pdf$/i);
    });

    it("should have json preset with correct config", () => {
      expect(FileTypePresets.json.mimeTypes).toContain("application/json");
      expect(FileTypePresets.json.maxSize).toBe(5 * 1024 * 1024);
    });
  });

  describe("validateFile", () => {
    it("should return valid for correct MIME type", () => {
      const file = new File(["content"], "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const result = validateFile(file, FileTypePresets.excel, false);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return valid for correct file extension", () => {
      const file = new File(["content"], "test.xlsx", { type: "" });
      const result = validateFile(file, FileTypePresets.excel, false);
      expect(result.valid).toBe(true);
    });

    it("should return invalid for wrong MIME type", () => {
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const result = validateFile(file, FileTypePresets.excel, false);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return invalid for file too large", () => {
      const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const result = validateFile(file, FileTypePresets.excel, false);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("10MB");
    });

    it("should use custom error messages", () => {
      const config: FileTypeConfig = {
        mimeTypes: ["image/png"],
        errorMessages: {
          invalidType: "Custom type error"
        }
      };
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const result = validateFile(file, config, false);
      expect(result.error).toBe("Custom type error");
    });

    it("should pass when no type restrictions", () => {
      const config: FileTypeConfig = {
        maxSize: 1024
      };
      const file = new File(["content"], "any.file", { type: "any/type" });
      const result = validateFile(file, config, false);
      expect(result.valid).toBe(true);
    });
  });

  describe("validateExcelFile", () => {
    it("should validate .xlsx files", () => {
      const file = new File(["content"], "data.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const result = validateExcelFile(file, false);
      expect(result.valid).toBe(true);
    });

    it("should validate .xls files", () => {
      const file = new File(["content"], "data.xls", {
        type: "application/vnd.ms-excel"
      });
      const result = validateExcelFile(file, false);
      expect(result.valid).toBe(true);
    });

    it("should reject non-Excel files", () => {
      const file = new File(["content"], "data.pdf", {
        type: "application/pdf"
      });
      const result = validateExcelFile(file, false);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateExcelOrCsvFile", () => {
    it("should validate .csv files", () => {
      const file = new File(["content"], "data.csv", { type: "text/csv" });
      const result = validateExcelOrCsvFile(file, false);
      expect(result.valid).toBe(true);
    });

    it("should validate .xlsx files", () => {
      const file = new File(["content"], "data.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const result = validateExcelOrCsvFile(file, false);
      expect(result.valid).toBe(true);
    });
  });

  describe("validateImageFile", () => {
    it("should validate PNG files", () => {
      const file = new File(["content"], "image.png", { type: "image/png" });
      const result = validateImageFile(file, undefined, false);
      expect(result.valid).toBe(true);
    });

    it("should validate JPEG files", () => {
      const file = new File(["content"], "image.jpg", { type: "image/jpeg" });
      const result = validateImageFile(file, undefined, false);
      expect(result.valid).toBe(true);
    });

    it("should respect custom maxSize", () => {
      const content = new Uint8Array(2000); // 2KB
      const file = new File([content], "image.png", { type: "image/png" });
      const result = validateImageFile(file, 1000, false); // 1KB limit
      expect(result.valid).toBe(false);
    });
  });

  describe("formatFileSize", () => {
    it("should format 0 bytes", () => {
      expect(formatFileSize(0)).toBe("0 B");
    });

    it("should format bytes", () => {
      expect(formatFileSize(500)).toBe("500 B");
    });

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
    });

    it("should format megabytes", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1 MB");
      expect(formatFileSize(5.5 * 1024 * 1024)).toBe("5.5 MB");
    });

    it("should format gigabytes", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
    });

    it("should respect decimals parameter", () => {
      expect(formatFileSize(1536, 0)).toBe("2 KB");
      expect(formatFileSize(1536, 3)).toBe("1.5 KB");
    });
  });

  describe("createUploadValidator", () => {
    it("should return a validator function", () => {
      const validator = createUploadValidator(FileTypePresets.excel);
      expect(typeof validator).toBe("function");
    });

    it("should return true for valid files", () => {
      const validator = createUploadValidator(FileTypePresets.excel);
      const file = new File(["content"], "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      expect(validator(file)).toBe(true);
    });

    it("should return false for invalid files", () => {
      const validator = createUploadValidator(FileTypePresets.excel);
      const file = new File(["content"], "test.txt", {
        type: "text/plain"
      });
      expect(validator(file)).toBe(false);
    });
  });

  describe("createUploadChangeHandler", () => {
    it("should return a handler function", () => {
      const handler = createUploadChangeHandler(FileTypePresets.excel);
      expect(typeof handler).toBe("function");
    });

    it("should call onValid callback for valid files", () => {
      const onValid = vi.fn();
      const handler = createUploadChangeHandler(FileTypePresets.excel, onValid);
      const uploadFile: UploadFile = {
        raw: new File(["content"], "test.xlsx", {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        })
      };
      handler(uploadFile);
      expect(onValid).toHaveBeenCalledWith(uploadFile);
    });

    it("should not call onValid callback for invalid files", () => {
      const onValid = vi.fn();
      const handler = createUploadChangeHandler(FileTypePresets.excel, onValid);
      const uploadFile: UploadFile = {
        raw: new File(["content"], "test.txt", { type: "text/plain" })
      };
      handler(uploadFile);
      expect(onValid).not.toHaveBeenCalled();
    });

    it("should handle uploadFile without raw", () => {
      const onValid = vi.fn();
      const handler = createUploadChangeHandler(FileTypePresets.excel, onValid);
      handler({} as UploadFile);
      expect(onValid).not.toHaveBeenCalled();
    });
  });
});
