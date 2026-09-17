import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveWorkspaceRoot } from "../../../test-utils/workspaceRoot";

/**
 * 统一 Error Contract —— 前端「写死在代码/文档里的码字面量」↔ 后端注册表 一致性门禁。
 *
 * 为什么需要：前端不需要 827 个码的枚举（会漂移），但**确实**会在代码与文档里写死
 * 少量码字面量（已废弃禁用项、刻意保留对、示例）。这些字面量一旦与后端注册表脱节，
 * 就是永假分支或错误说明。本用例把「写死的部分」逐个对 `error-code.enum.ts` 校验。
 *
 * 单一来源：`be-core/src/common/enum/error/error-code.enum.ts`（生成文件，权威）。
 * 仓库分离时（如 admin 单独 CI checkout）跳过在线校验，不影响该仓独立可测。
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const adminRoot = path.resolve(here, "../../..");

function resolveBackendErrorCodeEnumPath(): string | undefined {
  try {
    const workspaceRoot = resolveWorkspaceRoot(here);
    const enumPath = path.join(
      workspaceRoot,
      "be-core",
      "src",
      "common",
      "enum",
      "error",
      "error-code.enum.ts"
    );
    return fs.existsSync(enumPath) ? enumPath : undefined;
  } catch {
    return undefined;
  }
}

const backendEnumPath = resolveBackendErrorCodeEnumPath();

/** 从生成枚举里取出全部码值（形如 `  AUTH_NO_PERMISSION = 'AUTH.NO_PERMISSION',`）。 */
function readBackendCodes(enumText: string): Set<string> {
  const codes = new Set<string>();
  for (const match of enumText.matchAll(
    /=\s*'([A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*)'/g
  )) {
    const code = match[1];
    if (code !== undefined) codes.add(code);
  }
  return codes;
}

/**
 * 前端**主动禁用**的旧码（审计 §2.6 合并结果）：必须已不在注册表中，
 * 否则说明后端把旧码加回来了，文档中的「已合并」说明会变成误导。
 */
const RETIRED_CODES = [
  "AUTH.SELF_AUDIT_FORBIDDEN",
  "BALANCE.STOCK_INSUFFICIENT",
  "RESOURCE.STORE_NOT_FOUND_IN_COMPANY"
] as const;

/** 文档中用来说明「码格式」与「已合并旧码」的非注册表串。 */
const NON_REGISTRY_LITERALS = new Set<string>([
  "DOMAIN.REASON",
  ...RETIRED_CODES
]);

const hasBackendRegistry = backendEnumPath !== undefined;

const adminDocPath = path.join(adminRoot, "src", "api", "ERROR_HANDLING.md");
const contractModulePath = path.join(
  adminRoot,
  "src",
  "utils",
  "apiErrorContract.ts"
);

describe("error contract: 前端码字面量 ↔ 后端注册表", () => {
  it.skipIf(!hasBackendRegistry)(
    "能从生成枚举中读出全部码值（防止解析方式失效后静默通过）",
    () => {
      const codes = readBackendCodes(
        fs.readFileSync(backendEnumPath as string, "utf-8")
      );
      expect(codes.size).toBeGreaterThan(700);
      expect(codes.has("AUTH.NO_PERMISSION")).toBe(true);
    }
  );

  it.skipIf(!hasBackendRegistry)(
    "ERROR_HANDLING.md 中出现的每个码都在后端注册表内",
    () => {
      const backendCodes = readBackendCodes(
        fs.readFileSync(backendEnumPath as string, "utf-8")
      );
      const docText = fs.readFileSync(adminDocPath, "utf-8");

      const documented = new Set(
        [...docText.matchAll(/`([A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*)`/g)]
          .map(match => match[1] as string)
          .filter(code => !NON_REGISTRY_LITERALS.has(code))
      );
      expect(documented.size).toBeGreaterThan(0);

      const unknown = [...documented]
        .filter(code => !backendCodes.has(code))
        .sort();
      expect(
        unknown,
        `ERROR_HANDLING.md 引用了后端注册表中不存在的码（文档已过期）：${unknown.join(", ")}`
      ).toEqual([]);
    }
  );

  it("文档中标注「已合并」的旧码已不在注册表内", () => {
    const docText = fs.readFileSync(adminDocPath, "utf-8");
    for (const code of RETIRED_CODES) {
      expect(docText, `文档应说明旧码 ${code} 已合并`).toContain(code);
    }
    if (!hasBackendRegistry) return;

    const backendCodes = readBackendCodes(
      fs.readFileSync(backendEnumPath as string, "utf-8")
    );
    for (const code of RETIRED_CODES) {
      expect(backendCodes.has(code), `旧码 ${code} 重新出现在注册表中`).toBe(
        false
      );
    }
  });

  it("契约模块与文档不引用已废弃的旧 data.code 业务码串", () => {
    const legacyCodes = [
      "ASYNC_EXPORT_REQUIRED",
      "EXPORT_ROW_LIMIT_EXCEEDED",
      "EXPORT_TASK_QUOTA_EXCEEDED",
      "PAYROLL_EMPLOYEE_SALARY_CONFLICT",
      "INVENTORY_CHECK_SNAPSHOT_INVALIDATED",
      "INVENTORY_CHECK_RECOUNT_REQUIRED"
    ];
    const sources = [contractModulePath, adminDocPath]
      .filter(file => fs.existsSync(file))
      .map(file => ({ file, text: fs.readFileSync(file, "utf-8") }));
    expect(sources.length).toBeGreaterThan(0);

    for (const { file, text } of sources) {
      for (const legacy of legacyCodes) {
        expect(
          text.includes(legacy),
          `${file} 不应引用旧 data.code：${legacy}`
        ).toBe(false);
      }
    }
  });
});
