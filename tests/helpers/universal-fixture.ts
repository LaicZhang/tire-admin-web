const ARRAY_FIELDS = [
  "list",
  "records",
  "rows",
  "items",
  "data",
  "result",
  "results",
  "details",
  "trend",
  "byReason",
  "buckets",
  "categories",
  "children",
  "options",
  "columns",
  "permissions",
  "roles",
  "ids",
  "uids",
  "tags",
  "focusCards",
  "todoItems",
  "sections",
  "batchList",
  "stocktakingItems",
  "orderItems",
  "detailsList",
  "productList",
  "customerList",
  "supplierList",
  "warehouseList",
  "tree",
  "menus",
  "nodes",
  "fields",
  "fieldMatrix",
  "summaryCards",
  "alerts",
  "ranking",
  "lines",
  "lineItems",
  "channels",
  "recipients",
  "keys",
  "featureKeys",
  "features",
  "summary",
  "totals",
  "groups",
  "tabs",
  "metrics",
  "actions",
  "buttons",
  "steps",
  "timeline",
  "logs",
  "fileList",
  "statusOptions",
  "saleRules",
  "purchaseRules",
  "rules"
] as const;

export function createEmptyApiPayload() {
  const payload: Record<string, unknown> = {
    uid: "fixture-uid",
    id: 1,
    status: "",
    name: "",
    title: "",
    label: "",
    description: "",
    message: "",
    reason: "",
    code: "fixture",
    type: "primary",
    policyType: "DISCOUNT",
    total: 0,
    count: 0,
    page: 1,
    index: 1,
    size: 10,
    pageSize: 10,
    isRealName: false,
    phone: "",
    email: "",
    username: "",
    info: {
      userId: "fixture-user",
      avatarId: "",
      isRealName: false,
      birthday: "",
      gender: 1,
      isCN: true
    },
    roleProfile: {
      key: "admin",
      label: "总览",
      homeTitle: "首页工作台",
      description: ""
    },
    kpi: {
      loginCount: 0,
      operationCount: 0,
      failureCount: 0,
      failureRate: 0,
      sensitiveCount: 0,
      cronFailureCount: 0,
      moneyEventCount: 0,
      activeCompanyCount: 0
    },
    activeCompanies: [],
    daily: [],
    saleOrder: 0,
    purchaseOrder: 0,
    transferOrder: 0,
    wasteOrder: 0,
    surplusOrder: 0,
    writeOffOrder: 0,
    receiptOrder: 0,
    paymentOrder: 0,
    backup: {
      recentCount: 0,
      lastStatus: "",
      lastCompletedAt: ""
    },
    archive: { note: "" }
  };
  for (const field of ARRAY_FIELDS) payload[field] = [];
  // Some endpoints return an array while others return a list envelope. An
  // array-with-fields satisfies both shapes without recursively fabricating
  // objects that leak into Vue props.
  return Object.assign([], payload);
}

/** Structured empty data for API mocks. It deliberately contains no rows. */
export const universalFixture = createEmptyApiPayload();

export function createApiPayload() {
  return createEmptyApiPayload();
}

export function createApiEnvelope(data: unknown = createApiPayload()) {
  return {
    code: 200,
    message: "ok",
    data,
    total: 0,
    count: 0,
    success: true
  };
}

export function createHttpMock() {
  // Return a structured empty payload rather than a JavaScript proxy. Several
  // pages assume list envelopes are arrays even when they are empty, while a
  // recursive proxy leaks fake objects into props and produces noisy warnings.
  const response = async () => createApiEnvelope();
  const request = async () => createApiEnvelope();
  return {
    http: {
      request,
      get: response,
      post: response,
      put: response,
      patch: response,
      delete: response
    }
  };
}
