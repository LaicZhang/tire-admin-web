import { createApiEnvelope } from "../helpers/universal-fixture";

type Row = Record<string, unknown>;

const detail: Row = {
  id: 1,
  uid: "fixture-detail",
  key: "fixture",
  name: "Fixture detail",
  label: "Fixture detail",
  status: "APPROVED",
  documentType: "STOCKTAKING",
  tireId: "tire-1",
  productId: "tire-1",
  repoId: "repo-1",
  warehouseId: "warehouse-1",
  storeId: "store-1",
  customerId: "customer-1",
  providerId: "provider-1",
  serialNo: "SN-1",
  batchNo: "BATCH-1",
  count: 1,
  qty: 1,
  quantity: 1,
  amount: 100,
  price: 100,
  total: 100,
  isArrival: true,
  isApproved: true,
  createdAt: "2026-01-01T00:00:00.000Z"
};

const arrayFields = [
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
  "rules",
  "detailList",
  "attachmentList",
  "paymentList",
  "receiptList",
  "reportList",
  "logList",
  "userList",
  "roleList",
  "menuList"
];

function makeRow(): Row {
  const row: Row = {
    ...detail,
    name: "Fixture",
    label: "Fixture",
    title: "Fixture",
    billNo: "BILL-0001",
    code: "FIXTURE",
    type: "primary",
    action: "primary",
    role: "admin",
    roles: ["admin"],
    permissions: ["*"],
    status: "APPROVED",
    orderStatus: 0,
    logisticsStatus: 1,
    auditStatus: "APPROVED",
    documentType: "STOCKTAKING",
    targetName: "Fixture target",
    operatorName: "Fixture operator",
    remark: "fixture",
    reason: "fixture",
    description: "fixture",
    message: "fixture",
    phone: "13800000000",
    email: "fixture@example.com",
    path: "/fixture",
    url: "https://example.com/",
    icon: "ep:document",
    page: 1,
    index: 1,
    pageSize: 10,
    size: 10,
    total: 1,
    count: 1,
    amount: 100,
    price: 100,
    qty: 1,
    quantity: 1,
    isApproved: true,
    isLocked: false,
    isArrival: true,
    enabled: true,
    disabled: false,
    visible: true,
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    info: { userId: "fixture-user", avatarId: "", isRealName: true },
    backup: {
      recentCount: 1,
      lastStatus: "SUCCESS",
      lastCompletedAt: "2026-01-01"
    },
    archive: { note: "fixture" },
    roleProfile: {
      key: "admin",
      label: "Fixture role",
      homeTitle: "Fixture workbench",
      description: "Fixture dashboard"
    }
  };
  for (const field of arrayFields) {
    row[field] =
      field === "details" || field === "detailsList" || field === "lines"
        ? [detail]
        : field === "tree" || field === "menus"
          ? [{ ...detail, path: "/fixture", children: [] }]
          : [detail];
  }
  return row;
}

function richPayload() {
  const row = makeRow();
  // Batch endpoints consume `data` directly as an array, while list endpoints
  // read `data.list`/`data.records`. An array carrying envelope fields serves
  // both contracts without making the mock endpoint-specific.
  return Object.assign([detail], {
    ...row,
    list: [row],
    rows: [row],
    records: [row],
    items: [row],
    total: 1,
    count: 1,
    page: 1,
    pageSize: 10
  });
}

export function richApiEnvelope() {
  return {
    ...createApiEnvelope(richPayload()),
    total: 1,
    count: 1
  };
}

const response = async () => richApiEnvelope();
export const { http } = {
  http: {
    request: response,
    get: response,
    post: response,
    put: response,
    patch: response,
    delete: response
  }
};
