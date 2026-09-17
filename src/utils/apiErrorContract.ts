/**
 * 统一 Error Contract —— 前端解析入口
 *
 * 契约来源：`be-core/src/common/filter/all-exceptions.filter.ts`（失败信封）、
 * `be-core/src/common/interceptor/transform.interceptor.ts`（成功信封）。
 * 同步审计：`docs/audit/2026-09-17-error-contract-frontend-sync-audit.md` §1 / §2 / §5.4。
 *
 * 四条约定（前端侧）：
 * 1. 响应体 `code` = HTTP 状态码，不是业务码；业务分支一律判断 `errorCode`。
 * 2. `errorCode` 只读响应体**顶层**；`meta.errorCode` 为过渡期双写字段，
 *    仅在顶层缺失时兜底（审计 §4 第 3 项：前端切换完成后由后端单独 PR 删除）。
 * 3. 成功响应**不携带** `errorCode`，`code` 固定 200。
 * 4. 码格式三类：业务码 `DOMAIN.REASON`、系统码 `SYSTEM.*`、传输层兜底 `HTTP_<status>`；
 *    未注册 / 不合法取值一律按 `HTTP_<status>` 等价处理，不新增分支（审计 §2.3）。
 *
 * ⚠️ 本文件与 `uni-mini/src/utils/apiErrorContract.ts` 是镜像实现（两仓独立发版、无共享包）。
 * 改一侧必须同步另一侧，并同步两端用例。
 *
 * 本模块是纯函数，不抛异常、不改入参，可安全用于拦截器与业务层。
 */

/** 业务码：`DOMAIN.REASON`（如 `STATE.ORDER_LOCKED`）。 */
export const DOMAIN_ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*$/;

/** 系统码：`SYSTEM.*`（如 `SYSTEM.DB_UNIQUE_VIOLATION`）。 */
export const SYSTEM_ERROR_CODE_PATTERN = /^SYSTEM\.[A-Z][A-Z0-9_]*$/;

/** 传输层兜底：`HTTP_<status>`（如 `HTTP_404`）。 */
export const TRANSPORT_ERROR_CODE_PATTERN = /^HTTP_\d{3}$/;

/** 错误分类：成功 / 状态码型失败 / 业务码型失败 / 系统码型失败 / 传输层兜底。 */
export type ApiErrorKind =
  | "success"
  | "static"
  | "dynamic"
  | "system"
  | "transport";

/** DTO 校验字段级明细（后端 `data.errors` 元素）。 */
export interface ApiFieldError {
  /** 嵌套路径，点号连接（如 `nested.code`）。 */
  field: string;
  /** class-validator 约束名。 */
  constraint: string;
  message: string;
}

/** 失败响应的顶层信封形状（字段全部可选，便于接收任意 `unknown`）。 */
export interface ApiEnvelope {
  code: number;
  msg: string;
  errorCode?: string;
  data?: unknown;
  meta?: Record<string, unknown>;
}

/**
 * 判定 payload 是否为统一信封（`code: number` + `msg: string`）。
 *
 * 审计 §2.5：未匹配路由的兜底中间件同样走该信封，因此本判定对
 * 「已匹配路由」与「未匹配路由」一致成立，不需要再依赖 HTML 响应判定。
 */
export function isApiEnvelope(value: unknown): value is ApiEnvelope {
  return (
    isRecord(value) &&
    typeof value.code === "number" &&
    typeof value.msg === "string"
  );
}

/** 契约解析结果。 */
export interface ResolvedApiError {
  kind: ApiErrorKind;
  /** 响应体 `code`（HTTP 状态码）；缺失时为 `undefined`。 */
  code?: number;
  /** 唯一码位；成功响应为 `undefined`。 */
  errorCode?: string;
  /** 展示文案；禁止用于分支判断。 */
  msg?: string;
  /** 仅 DTO 校验失败（`VALIDATION.REQUEST_INVALID`）时非空。 */
  fieldErrors: ApiFieldError[];
  /** 过渡期兜底来源标记（审计 §4 第 3 项）。 */
  errorCodeSource: "errorCode" | "meta.errorCode" | "http-fallback";
  meta?: Record<string, unknown>;
}

export interface ResolveApiErrorOptions {
  /** HTTP 状态码（axios `response.status` / `res.statusCode`）；缺失时用响应体 `code`。 */
  status?: number;
}

/** 常规 HTTP 状态码视为状态码型失败（`static`），其余数值按业务码解析。 */
const HTTP_ERROR_STATUS_MIN = 400;
const HTTP_ERROR_STATUS_MAX = 599;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readNumber(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function toHttpFallbackCode(status: number) {
  return `HTTP_${status}`;
}

/** 是否为 `DOMAIN.REASON` 业务码。 */
export function isDomainErrorCode(value: string): boolean {
  return DOMAIN_ERROR_CODE_PATTERN.test(value);
}

/** 是否为 `SYSTEM.*` 系统码。 */
export function isSystemErrorCode(value: string): boolean {
  return SYSTEM_ERROR_CODE_PATTERN.test(value);
}

/** 是否为 `HTTP_<status>` 传输层兜底码。 */
export function isTransportErrorCode(value: string): boolean {
  return TRANSPORT_ERROR_CODE_PATTERN.test(value);
}

/** 是否为已注册格式的 errorCode（三类之一）。 */
export function isApiErrorCode(value: string): boolean {
  return isDomainErrorCode(value) || isSystemErrorCode(value);
}

/**
 * 审计 §2.3「只信注册表」的前端等价实现：
 * 非 `DOMAIN.REASON` / 非 `SYSTEM.*` / 非 `HTTP_<status>` 的取值一律降级为 `HTTP_<status>`。
 */
export function resolveBoundedErrorCode(
  value: unknown,
  status: number
): string {
  if (typeof value === "string" && value.length > 0) {
    if (isApiErrorCode(value) || isTransportErrorCode(value)) return value;
  }
  return toHttpFallbackCode(status);
}

/** 从 `meta` 中读过渡期双写的 `errorCode`。 */
function readMetaErrorCode(meta: Record<string, unknown> | undefined) {
  return meta ? readString(meta, "errorCode") : undefined;
}

/**
 * 提取 DTO 校验字段级明细。
 *
 * 仅在「失败信封」上调用：`data` 为普通对象且 `data.errors` 为数组时逐项收取
 * `{ field, constraint, message }`（三项均为 string；允许元素带额外键）。
 * 成功信封的 `data.errors`（如导入预览的行级错误）不在此列。
 */
export function extractFieldErrors(data: unknown): ApiFieldError[] {
  if (!isRecord(data)) return [];
  const raw = data.errors;
  if (!Array.isArray(raw)) return [];

  const collected: ApiFieldError[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const field = readString(item, "field");
    const constraint = readString(item, "constraint");
    const message = readString(item, "message");
    if (
      field === undefined ||
      constraint === undefined ||
      message === undefined
    )
      continue;
    collected.push({ field, constraint, message });
  }
  return collected;
}

function createResolved(
  partial: Partial<ResolvedApiError> & { kind: ApiErrorKind }
): ResolvedApiError {
  return { fieldErrors: [], errorCodeSource: "http-fallback", ...partial };
}

/**
 * 把任意后端响应解析为统一的错误契约结构。
 *
 * - `kind: 'success'`：`code === 200`，`errorCode` 为 `undefined`（成功响应不带该字段）。
 * - `kind: 'static'`：`code` 落在 400–599，`errorCode` 为 `HTTP_<code>`。
 * - `kind: 'dynamic' | 'system'`：`code` 为业务码，`errorCode` 取顶层（回退 `meta.errorCode`）。
 * - `kind: 'transport'`：无法判定或码不合法，按 `HTTP_<status>` 等价处理。
 */
export function resolveApiError(
  payload: unknown,
  options: ResolveApiErrorOptions = {}
): ResolvedApiError {
  const fallbackStatus = options.status ?? 0;
  if (!isRecord(payload)) {
    return createResolved({
      kind: "transport",
      errorCode: toHttpFallbackCode(fallbackStatus)
    });
  }

  const source = payload as Record<string, unknown>;
  const code = readNumber(source, "code");
  const status = options.status ?? code ?? fallbackStatus;
  const msg = readString(source, "msg") ?? readString(source, "message");
  const meta = isRecord(source.meta) ? source.meta : undefined;
  const base = {
    ...(msg !== undefined ? { msg } : {}),
    ...(meta !== undefined ? { meta } : {})
  };

  if (code === undefined) {
    return createResolved({
      kind: "transport",
      errorCode: toHttpFallbackCode(status),
      ...base
    });
  }

  // 成功响应不携带 errorCode（审计 §2.8）。
  if (code === 200) {
    return createResolved({ kind: "success", code, ...base });
  }

  const fieldErrors = extractFieldErrors(source.data);
  const validationDetail = fieldErrors.length > 0 ? { fieldErrors } : {};

  /** 已解析出的码位与来源；不合法或缺失时按传输层兜底降级。 */
  const resolvedCode = resolveApiErrorCodeFrom(source, status);

  return createResolved({
    kind: resolvedCode.kind,
    code,
    errorCode: resolvedCode.errorCode,
    errorCodeSource: resolvedCode.errorCodeSource,
    ...base,
    ...validationDetail
  });
}

type ResolvedCode = Pick<
  ResolvedApiError,
  "kind" | "errorCode" | "errorCodeSource"
>;

function kindForErrorCode(errorCode: string) {
  return isSystemErrorCode(errorCode) ? "system" : "dynamic";
}

/**
 * 码位解析顺序：
 * 1. 顶层 `errorCode` 格式合法 → 采信该码（`DOMAIN.REASON` / `SYSTEM.*`）。
 * 2. `code` 落在常规 HTTP 状态区间 → `HTTP_<code>`（§1 约定 1：`code` 是状态码）。
 * 3. 顶层 `errorCode` 显式存在但格式不合法 → 按 `HTTP_<status>` 降级，不再回退
 *    `meta.errorCode`（避免用双写旧值覆盖显式给出的新值）。
 * 4. 顶层缺失 → 回退 `meta.errorCode`（过渡期双写，审计 §4 第 3 项）。
 * 5. 仍无合法码 → `HTTP_<status>`（审计 §2.3：不新增分支）。
 */
function resolveApiErrorCodeFrom(
  source: Record<string, unknown>,
  status: number
): ResolvedCode {
  const topLevel = readString(source, "errorCode");
  if (topLevel !== undefined && isApiErrorCode(topLevel)) {
    return {
      kind: kindForErrorCode(topLevel),
      errorCode: topLevel,
      errorCodeSource: "errorCode"
    };
  }

  const code = readNumber(source, "code");
  if (
    code !== undefined &&
    code >= HTTP_ERROR_STATUS_MIN &&
    code <= HTTP_ERROR_STATUS_MAX
  ) {
    return {
      kind: "static",
      errorCode: toHttpFallbackCode(code),
      errorCodeSource: "http-fallback"
    };
  }

  if (topLevel === undefined) {
    const meta = isRecord(source.meta) ? source.meta : undefined;
    const fromMeta = readMetaErrorCode(meta);
    if (fromMeta !== undefined && isApiErrorCode(fromMeta)) {
      return {
        kind: kindForErrorCode(fromMeta),
        errorCode: fromMeta,
        errorCodeSource: "meta.errorCode"
      };
    }
  }

  return {
    kind: "transport",
    errorCode: toHttpFallbackCode(status),
    errorCodeSource: "http-fallback"
  };
}

/** 便捷取码：拿不到合法码时返回 `HTTP_<status>`。 */
export function getApiErrorCode(payload: unknown, status?: number): string {
  return (
    resolveApiError(payload, status === undefined ? {} : { status })
      .errorCode ?? toHttpFallbackCode(status ?? 0)
  );
}
