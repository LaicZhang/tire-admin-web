import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createLogger,
  logger,
  httpLogger,
  authLogger,
  routerLogger
} from "../logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createLogger", () => {
    it("should create a logger with module name", () => {
      const testLogger = createLogger("TestModule");
      expect(testLogger).toHaveProperty("debug");
      expect(testLogger).toHaveProperty("info");
      expect(testLogger).toHaveProperty("warn");
      expect(testLogger).toHaveProperty("error");
      expect(testLogger).toHaveProperty("critical");
    });
  });

  describe("safeStringify", () => {
    it("should redact sensitive fields", () => {
      const testLogger = createLogger("Test");
      const sensitiveData = {
        username: "user",
        password: "secret123",
        token: "abc123",
        authorization: "Bearer xyz"
      };

      testLogger.error("Test error", sensitiveData);

      expect(console.error).toHaveBeenCalled();
      const callArg = (console.error as ReturnType<typeof vi.fn>).mock
        .calls[0][1];
      expect(callArg).toContain("[REDACTED]");
      expect(callArg).not.toContain("secret123");
      expect(callArg).not.toContain("abc123");
      expect(callArg).not.toContain("Bearer xyz");
    });

    it("should keep non-sensitive fields", () => {
      const testLogger = createLogger("Test");
      const data = { name: "John", age: 30 };

      testLogger.error("Test error", data);

      expect(console.error).toHaveBeenCalled();
      const callArg = (console.error as ReturnType<typeof vi.fn>).mock
        .calls[0][1];
      expect(callArg).toContain("John");
      expect(callArg).toContain("30");
    });
  });

  describe("log levels", () => {
    it("should log debug messages in dev", () => {
      const testLogger = createLogger("Test");
      testLogger.debug("Debug message");
      expect(console.debug).toHaveBeenCalled();
    });

    it("should log info messages", () => {
      const testLogger = createLogger("Test");
      testLogger.info("Info message");
      expect(console.info).toHaveBeenCalled();
    });

    it("should log warn messages", () => {
      const testLogger = createLogger("Test");
      testLogger.warn("Warn message");
      expect(console.warn).toHaveBeenCalled();
    });

    it("should log error messages", () => {
      const testLogger = createLogger("Test");
      testLogger.error("Error message");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("pre-configured loggers", () => {
    it("should export default logger", () => {
      expect(logger).toBeDefined();
    });

    it("should export httpLogger", () => {
      expect(httpLogger).toBeDefined();
    });

    it("should export authLogger", () => {
      expect(authLogger).toBeDefined();
    });

    it("should export routerLogger", () => {
      expect(routerLogger).toBeDefined();
    });
  });

  describe("message formatting", () => {
    it("should include timestamp in message", () => {
      const testLogger = createLogger("Test");
      testLogger.info("Test message");

      const callArg = (console.info as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      // Check for ISO timestamp pattern
      expect(callArg).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should include module name in message", () => {
      const testLogger = createLogger("MyModule");
      testLogger.info("Test message");

      const callArg = (console.info as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(callArg).toContain("[MyModule]");
    });

    it("should include log level in message", () => {
      const testLogger = createLogger("Test");
      testLogger.warn("Test message");

      const callArg = (console.warn as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(callArg).toContain("[WARN]");
    });
  });
});
