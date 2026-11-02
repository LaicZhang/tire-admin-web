const { requests, requestMock } = vi.hoisted(() => {
  const requests: Array<{ method: string; url: string; config?: unknown }> = [];
  const requestMock = vi.fn(
    async (method: string, url: string, config?: unknown) => {
      requests.push({ method, url, config });
      return {
        code: 200,
        message: "ok",
        data: Object.assign([], {
          uid: "fixture-uid",
          id: 1,
          list: [],
          records: [],
          rows: [],
          items: [],
          details: [],
          total: 0
        })
      };
    }
  );
  return { requests, requestMock };
});

vi.mock("@/utils/http", () => ({
  http: {
    request: requestMock,
    get: (url: string, config?: unknown) => requestMock("get", url, config),
    post: (url: string, config?: unknown) => requestMock("post", url, config),
    put: (url: string, config?: unknown) => requestMock("put", url, config),
    patch: (url: string, config?: unknown) => requestMock("patch", url, config),
    delete: (url: string, config?: unknown) =>
      requestMock("delete", url, config)
  }
}));

const apiLoaders = import.meta.glob<Record<string, unknown>>("../**/*.ts");

const entries = Object.entries(apiLoaders).filter(
  ([path]) =>
    !path.includes("__tests__") &&
    !path.endsWith(".test.ts") &&
    !path.endsWith(".d.ts") &&
    !path.endsWith("/type.ts") &&
    !path.endsWith("/monitor/types.ts") &&
    !path.endsWith("/index.ts")
);

function fixtureRecord() {
  const record = Object.assign([], {
    uid: "fixture-uid",
    id: 1,
    index: 1,
    name: "Fixture",
    title: "Fixture",
    code: "fixture",
    status: "DRAFT",
    type: "fixture",
    value: 1,
    page: 1,
    size: 10,
    pageSize: 10,
    total: 0,
    count: 0,
    details: [],
    components: [],
    steps: [],
    approverIds: [],
    roleIds: [],
    targetRepoId: "repo-1",
    targetTireId: "tire-1",
    sourceRepoId: "repo-1",
    quantity: 1,
    lines: [],
    items: [],
    rows: [],
    list: [],
    records: [],
    children: [],
    nodes: [],
    mappings: [],
    fields: [],
    options: [],
    rules: [],
    routeMethods: [],
    routePaths: [],
    backendRoutes: [],
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    isEnabled: true,
    enabled: true,
    isApproved: true,
    remark: "",
    desc: ""
  });
  return record;
}

function argumentSets(fn: (...args: unknown[]) => unknown): unknown[][] {
  const record = fixtureRecord();
  const body = new FormData();
  body.append("fixture", "value");
  const sets: unknown[][] = [
    [record],
    [record, record, 1],
    ["fixture", "PAYMENT", "uid"],
    ["fixture", "RECEIPT", "uid"],
    ["fixture", 1, record, body],
    [1, record, "fixture", body],
    [{ resource: "fixture", prefix: "/fixture/" }],
    [{ prefix: "/fixture/" }]
  ];
  return sets.map(args => args.slice(0, Math.max(0, Math.min(fn.length, 4))));
}

function isDocumentedGuard(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /后端未提供路由|当前账套不存在|不支持|requires|不能为空|不存在|缺少|请选择|invalid|required|must/i.test(
    error.message
  );
}

async function invokeReturnedFunctions(result: unknown, source: string) {
  if (!result || typeof result !== "object") return 0;
  let invoked = 0;
  for (const [key, value] of Object.entries(result)) {
    if (typeof value !== "function") continue;
    await invoke(value as (...args: unknown[]) => unknown, `${source}.${key}`);
    invoked += 1;
  }
  return invoked;
}

async function invoke(
  fn: (...args: unknown[]) => unknown,
  source: string
): Promise<void> {
  let successfulCall = false;
  let lastError: unknown;
  for (const args of argumentSets(fn)) {
    try {
      const result = await fn(...args);
      await invokeReturnedFunctions(result, source);
      successfulCall = true;
      break;
    } catch (error) {
      lastError = error;
      if (isDocumentedGuard(error)) {
        successfulCall = true;
        break;
      }
    }
  }
  if (!successfulCall) {
    throw new Error(`${source} rejected every documented fixture call`, {
      cause: lastError
    });
  }
}

describe("all API wrapper modules", () => {
  beforeEach(() => {
    requests.length = 0;
    requestMock.mockClear();
  });

  it.each(entries)(
    "%s exposes callable request wrappers",
    async (source, loadModule) => {
      const module = await loadModule();
      const exportedFunctions = Object.entries(module).filter(
        ([key, value]) =>
          typeof value === "function" &&
          !key.startsWith("__") &&
          !/^[A-Z]/.test(key)
      ) as Array<[string, (...args: unknown[]) => unknown]>;

      if (!exportedFunctions.length) return;
      let invoked = 0;
      for (const [key, fn] of exportedFunctions) {
        await invoke(fn, `${source}.${key}`);
        invoked += 1;
      }
      expect(invoked).toBe(exportedFunctions.length);
      for (const request of requests) {
        expect(request.method).toMatch(/^(get|post|put|patch|delete)$/);
        expect(request.url).toMatch(/^(?:\/api\/v1)?\//);
      }
    }
  );
});
