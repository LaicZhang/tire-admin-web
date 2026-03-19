import http from "node:http";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";

const PORT = Number.parseInt(process.env.E2E_API_PORT || "19000", 10);

const nowIso = () => new Date().toISOString();

const sendJson = (res, statusCode, body) => {
  const text = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text)
  });
  res.end(text);
};

const sendBuffer = (res, statusCode, body, headers = {}) => {
  res.writeHead(statusCode, {
    "Content-Length": body.length,
    ...headers
  });
  res.end(body);
};

const readJsonBody = async req => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return null;
  return JSON.parse(raw);
};

const ok = data => ({ code: 200, msg: "ok", data });

const notFound = (res, method, pathname) => {
  sendJson(
    res,
    404,
    {
      code: 404,
      msg: `Not Found: ${method} ${pathname}`,
      data: null
    }
  );
};

const notImplemented = (res, method, pathname) => {
  console.error(`[mock-api] 501 ${method} ${pathname}`);
  sendJson(
    res,
    501,
    {
      code: 501,
      msg: `Not Implemented: ${method} ${pathname}`,
      data: null
    }
  );
};

// 1x1 transparent PNG
const CAPTCHA_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7WjYcAAAAASUVORK5CYII=",
  "base64"
);

let nextCustomerId = 1;
let nextTireId = 1;
let nextProviderId = 1;
let nextCustomerProductCodeId = 3;
let nextMenuId = 2;
let nextReceiptOrderId = 2;
let nextPaymentOrderId = 2;
let nextOtherIncomeOrderId = 2;
let nextOtherExpenseOrderId = 2;
let nextTransferOrderId = 2;
let nextWriteOffOrderId = 2;
let currentCompanyId = "company-1";

const customers = [
  {
    id: nextCustomerId++,
    uid: "customer-existing-1",
    code: "C-001",
    name: "存量客户",
    contact: "张三",
    phone: "13800000000",
    address: "杭州",
    desc: "用于页面冒烟验证",
    creditLimit: 500000,
    deleteAt: null
  }
];
const tires = [
  {
    id: nextTireId++,
    uid: "t1",
    name: "轮胎A",
    group: "审计组",
    brand: "Mock",
    pattern: "A1",
    format: "205/55R16",
    unit: "条",
    salePrice: 399,
    desc: "用于审计验证"
  },
  {
    id: nextTireId++,
    uid: "t2",
    name: "轮胎B",
    group: "审计组",
    brand: "Mock",
    pattern: "B1",
    format: "215/55R17",
    unit: "条",
    salePrice: 499,
    desc: "用于审计验证"
  }
];
const providers = [
  {
    id: nextProviderId++,
    uid: "provider-1",
    code: "P-001",
    name: "示例供应商",
    phone: "13900000000",
    address: "宁波",
    bankInfo: "工行宁波分行",
    desc: "用于资金页面冒烟验证",
    status: true,
    deleteAt: null,
    payableBalance: 58600
  },
  {
    id: nextProviderId++,
    uid: "provider-2",
    code: "P-002",
    name: "辅料供应商",
    phone: "13700000000",
    address: "嘉兴",
    bankInfo: "建行嘉兴分行",
    desc: "用于下拉和转账验证",
    status: true,
    deleteAt: null,
    payableBalance: 23500
  }
];
const paymentAccounts = [
  {
    id: 1,
    uid: "payment-1",
    companyUid: "company-1",
    name: "工商银行",
    bankName: "中国工商银行",
    bankAccount: "6222000000000001",
    type: "Bank",
    account: "6222000000000001",
    realName: "示例公司",
    balance: 156780,
    status: true,
    createAt: nowIso()
  },
  {
    id: 2,
    uid: "payment-2",
    companyUid: "company-1",
    name: "建设银行",
    bankName: "中国建设银行",
    bankAccount: "6227000000000002",
    type: "Bank",
    account: "6227000000000002",
    realName: "示例公司",
    balance: 98500,
    status: true,
    createAt: nowIso()
  },
  {
    id: 3,
    uid: "payment-3",
    companyUid: "company-1",
    name: "支付宝",
    bankName: "支付宝",
    bankAccount: "alipay-001",
    type: "Alipay",
    account: "alipay-001",
    realName: "示例公司",
    balance: 64320,
    status: true,
    createAt: nowIso()
  }
];
const receiptOrders = [
  {
    id: 1,
    uid: "receipt-order-1",
    billNo: "SKD-20260309-001",
    customerId: "customer-existing-1",
    customerName: "存量客户",
    paymentId: "payment-1",
    paymentName: "工商银行",
    amount: 128000,
    actualAmount: 128000,
    writeOffAmount: 40000,
    advanceAmount: 88000,
    paymentMethod: "BANK_TRANSFER",
    status: "DRAFT",
    receiptDate: "2026-03-09",
    remark: "mock 收款单",
    details: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];
const paymentOrders = [
  {
    id: 1,
    uid: "payment-order-1",
    billNo: "FKD-20260309-001",
    providerId: "provider-1",
    providerName: "示例供应商",
    paymentId: "payment-1",
    paymentName: "工商银行",
    amount: 8600,
    writeOffAmount: 3200,
    advanceAmount: 5400,
    paymentMethod: "BANK_TRANSFER",
    status: "DRAFT",
    paymentDate: "2026-03-09",
    remark: "mock 付款单",
    createdAt: nowIso(),
    details: []
  }
];
const otherIncomeOrders = [
  {
    id: 1,
    uid: "other-income-1",
    billNo: "QTSR-20260309-001",
    customerId: "customer-existing-1",
    customerName: "存量客户",
    incomeType: "OTHER",
    amount: 12800,
    receivedAmount: 2800,
    unpaidAmount: 10000,
    paymentId: "payment-1",
    paymentName: "工商银行",
    incomeDate: "2026-03-09",
    status: "DRAFT",
    category: "其他收入",
    remark: "mock 其他收入",
    createdAt: nowIso()
  }
];
const otherExpenseOrders = [
  {
    id: 1,
    uid: "other-expense-1",
    billNo: "QTZC-20260309-001",
    providerId: "provider-1",
    providerName: "示例供应商",
    expenseType: "OTHER",
    amount: 15600,
    paidAmount: 3600,
    unpaidAmount: 12000,
    paymentId: "payment-1",
    paymentName: "工商银行",
    expenseDate: "2026-03-09",
    status: "DRAFT",
    category: "其他支出",
    relatedOrderId: "order-1",
    relatedOrderNo: "SO-20260309-001",
    remark: "mock 其他支出",
    createdAt: nowIso()
  }
];
const transferOrders = [
  {
    id: 1,
    uid: "transfer-1",
    billNo: "ZZD-20260309-001",
    fromPaymentId: "payment-1",
    fromPaymentName: "工商银行",
    toPaymentId: "payment-2",
    toPaymentName: "建设银行",
    amount: 6600,
    fee: 200,
    feePaymentId: "payment-1",
    feePaymentName: "工商银行",
    status: "DRAFT",
    transferDate: "2026-03-09",
    remark: "mock 转账单",
    createdAt: nowIso()
  }
];
const writeOffOrders = [
  {
    id: 1,
    uid: "writeoff-1",
    billNo: "WO-20260309-001",
    businessType: "RECEIVE_TO_RECEIVE",
    writeOffAmount: 23400,
    status: "DRAFT",
    isApproved: false,
    writeOffDate: "2026-03-09",
    remark: "mock write-off order",
    createdAt: nowIso()
  }
];
const backups = [
  {
    id: 1,
    uid: "backup-1",
    fileName: "backup-20260309.zip",
    fileSizeText: "2 MB",
    backupType: "manual",
    backupTypeName: "手动备份",
    status: "success",
    statusName: "成功",
    createTime: nowIso(),
    remark: "用于下载冒烟"
  }
];
const customerInitialBalanceSummary = {
  "customer-existing-1": {
    latestRecord: { uid: "balance-1" },
    summary: {
      receivableBalance: 120500,
      advanceBalance: 30500,
      totalBalance: 90000
    }
  }
};
const documentCenterItems = [
  {
    id: 1,
    uid: "doc-fund-1",
    documentType: "PAYMENT",
    documentTypeLabel: "付款单",
    billNo: "FKD-20260309-001",
    targetName: "存量客户",
    amount: 8600,
    count: 1,
    status: "DRAFT",
    operatorName: "管理员",
    remark: "fund document",
    createdAt: nowIso()
  },
  {
    id: 2,
    uid: "doc-purchase-1",
    documentType: "PURCHASE_ORDER",
    documentTypeLabel: "采购订单",
    billNo: "CGDD-20260309-001",
    targetName: "示例供应商",
    amount: 12800,
    count: 2,
    status: "APPROVED",
    operatorName: "管理员",
    remark: "purchase document",
    createdAt: nowIso()
  },
  {
    id: 3,
    uid: "doc-sales-1",
    documentType: "SALE_ORDER",
    documentTypeLabel: "销售订单",
    billNo: "XSDD-20260309-001",
    targetName: "存量客户",
    amount: 22600,
    count: 3,
    status: "DRAFT",
    operatorName: "管理员",
    remark: "sales document",
    createdAt: nowIso()
  }
];
const units = [
  {
    id: 1,
    uid: "unit-1",
    name: "个",
    symbol: "pc",
    companyId: "company-1"
  },
  {
    id: 2,
    uid: "unit-2",
    name: "条",
    symbol: "t",
    companyId: "company-1"
  }
];
const companies = [
  {
    uid: "company-1",
    name: "E2E Company A"
  },
  {
    uid: "company-2",
    name: "E2E Company B"
  }
];
const customerOptions = [
  { uid: "c1", name: "客户A" },
  { uid: "c2", name: "客户B" },
  { uid: "c3", name: "客户C" }
];
const tireOptions = [
  { uid: "t1", name: "轮胎A" },
  { uid: "t2", name: "轮胎B" },
  { uid: "t3", name: "轮胎C" }
];
const customerProductCodesByCompany = {
  "company-1": [
    {
      id: 1,
      uid: "cpc-existing-1",
      customerId: "c1",
      tireId: "t1",
      customerCode: "CPC-001",
      customerProductName: "客户A轮胎A",
      remark: "公司A初始数据",
      createdAt: nowIso()
    }
  ],
  "company-2": [
    {
      id: 2,
      uid: "cpc-existing-2",
      customerId: "c2",
      tireId: "t2",
      customerCode: "CPC-B-001",
      customerProductName: "客户B轮胎B",
      remark: "公司B初始数据",
      createdAt: nowIso()
    }
  ]
};
const exportTasks = new Map();
const menuItems = [
  {
    id: 1,
    uid: "menu-existing-1",
    code: 0,
    parentId: "",
    title: "系统菜单",
    path: "/system/menu",
    component: "/src/views/system/menu/index.vue",
    rank: 1,
    auths: "",
    frameSrc: "",
    redirect: "",
    isShow: true,
    showLink: true,
    keepAlive: false,
    hidden: false,
    fixedTag: false,
    hiddenTag: false,
    enterTransition: "",
    leaveTransition: "",
    deleteAt: null
  }
];

const listWithPagination = (items, page, pageSize) => {
  const size = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
  const p = Number.isFinite(page) && page > 0 ? page : 1;
  const start = (p - 1) * size;
  const end = start + size;
  const sliced = items.slice(start, end);
  return {
    list: sliced,
    count: items.length,
    total: items.length,
    page: p,
    pageSize: size
  };
};

const buildBillNo = prefix => {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const serial = String(Date.now()).slice(-6);
  return `${prefix}-${date}-${serial}`;
};

const toSafeNumber = value => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const findCustomerByUid = uid => customers.find(item => item.uid === uid);
const findProviderByUid = uid => providers.find(item => item.uid === uid);
const findPaymentByUid = uid => paymentAccounts.find(item => item.uid === uid);

const matchPath = (pathname, pattern) => {
  const a = pathname.split("/").filter(Boolean);
  const b = pattern.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    const part = b[i];
    if (part.startsWith(":")) {
      params[part.slice(1)] = a[i];
    } else if (part !== a[i]) {
      return null;
    }
  }
  return params;
};

const xlsxBuffer = Buffer.from("mock-xlsx-content", "utf8");
const zipBuffer = Buffer.from("mock-zip-content", "utf8");
const buildDataUrl = (content, mime) =>
  `data:${mime};base64,${Buffer.from(content, "utf8").toString("base64")}`;

const listDocumentCenter = (searchParams, page) => {
  const pageSize = Number.parseInt(searchParams.get("pageSize") || "", 10);
  const keyword = searchParams.get("keyword") || "";
  const status = searchParams.get("status") || "";
  const documentType = searchParams.get("documentType") || "";

  let list = documentCenterItems.slice();
  if (documentType) {
    list = list.filter(item => item.documentType === documentType);
  }
  if (status) {
    list = list.filter(item => item.status === status);
  }
  if (keyword) {
    list = list.filter(item => {
      const hay = `${item.billNo} ${item.targetName ?? ""} ${item.documentTypeLabel}`;
      return hay.includes(keyword);
    });
  }

  return listWithPagination(list, page, pageSize);
};

const getCurrentCompanyScopedCustomerProductCodes = () =>
  customerProductCodesByCompany[currentCompanyId] ?? [];

const ensureCurrentCompanyScopedCustomerProductCodes = () => {
  if (!customerProductCodesByCompany[currentCompanyId]) {
    customerProductCodesByCompany[currentCompanyId] = [];
  }
  return customerProductCodesByCompany[currentCompanyId];
};

const asyncRoutes = () => [
  {
    path: "/data/customer",
    name: "E2EDataCustomer",
    meta: { title: "客户管理", roles: ["admin"] }
  },
  {
    path: "/data/product",
    name: "E2EDataProduct",
    meta: { title: "商品管理", roles: ["admin"] }
  },
  {
    path: "/data/importExport",
    name: "E2EImportExport",
    meta: { title: "导入导出", roles: ["admin"] }
  },
  {
    path: "/data/customerProductCode",
    name: "E2EDataCustomerProductCode",
    meta: { title: "客户商品编码", roles: ["admin"] }
  },
  {
    path: "/business/payment",
    name: "E2EBusinessPayment",
    meta: { title: "支付账户", roles: ["admin"] }
  },
  {
    path: "/business/customer",
    name: "E2EBusinessCustomer",
    meta: { title: "客户管理", roles: ["admin"] }
  },
  {
    path: "/fund/receipt",
    name: "E2EFundReceipt",
    meta: { title: "预收款", roles: ["admin"] }
  },
  {
    path: "/fund/payment",
    name: "E2EFundPayment",
    meta: { title: "付款单", roles: ["admin"] }
  },
  {
    path: "/fund/otherIncome",
    name: "E2EFundOtherIncome",
    meta: { title: "其他收入", roles: ["admin"] }
  },
  {
    path: "/fund/otherExpense",
    name: "E2EFundOtherExpense",
    meta: { title: "其他支出", roles: ["admin"] }
  },
  {
    path: "/fund/transfer",
    name: "E2EFundTransfer",
    meta: { title: "转账单", roles: ["admin"] }
  },
  {
    path: "/fund/writeOff",
    name: "E2EFundWriteOff",
    meta: { title: "核销单", roles: ["admin"] }
  },
  {
    path: "/business/order",
    name: "E2EBusinessOrder",
    meta: { title: "业务订单", roles: ["admin"] }
  },
  {
    path: "/business/provider",
    name: "E2EBusinessProvider",
    meta: { title: "供应商管理", roles: ["admin"] }
  },
  {
    path: "/settings/backup",
    name: "E2ESettingsBackup",
    meta: { title: "数据备份", roles: ["admin"] }
  },
  {
    path: "/system/menu",
    name: "E2ESystemMenu",
    meta: { title: "菜单管理", roles: ["admin"] }
  },
  {
    path: "/fund/documents",
    name: "E2EFundDocuments",
    meta: { title: "资金文档", roles: ["admin"] }
  },
  {
    path: "/purchase/documents",
    name: "E2EPurchaseDocuments",
    meta: { title: "采购文档", roles: ["admin"] }
  },
  {
    path: "/sales/documents",
    name: "E2ESalesDocuments",
    meta: { title: "销售文档", roles: ["admin"] }
  },
  {
    path: "/audit/export-dialog",
    name: "E2EAuditExportDialog",
    meta: { title: "审计导出弹窗", roles: ["admin"] }
  },
  {
    path: "/audit/permission",
    name: "E2EAuditPermission",
    meta: {
      title: "审计权限预览",
      roles: ["admin", "auditor"],
      auths: ["audit:export", "audit:delete"]
    }
  },
  {
    path: "/audit/frame-same-origin",
    name: "E2EAuditFrameSameOrigin",
    meta: {
      title: "审计同源 iframe",
      roles: ["admin"],
      frameSrc: "/platform-config.json"
    }
  },
  {
    path: "/audit/frame-whitelist",
    name: "E2EAuditFrameWhitelist",
    meta: {
      title: "审计白名单 iframe",
      roles: ["admin"],
      frameSrc: "https://trusted.example.com/embed"
    }
  },
  {
    path: "/audit/frame-blocked",
    name: "E2EAuditFrameBlocked",
    meta: {
      title: "审计阻断 iframe",
      roles: ["admin"],
      frameSrc: "https://evil.example.com/embed"
    }
  }
];

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
    const { pathname } = url;
    const method = (req.method || "GET").toUpperCase();

    // Health check
    if (method === "GET" && pathname === "/api/v1/__health") {
      return sendJson(res, 200, ok({ status: "ok", time: nowIso() }));
    }

    // Auth
    if (method === "POST" && pathname === "/api/v1/auth/login") {
      const body = await readJsonBody(req);
      const username =
        (body && typeof body.username === "string" && body.username) || "admin";
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      return sendJson(
        res,
        200,
        ok({
          avatar: "",
          username,
          nickname: "E2E",
          roles: ["admin"],
          permissions: [
            "get/payment/page",
            "get/write-off-order/page",
            "get/document-center/page",
            "get/backup",
            "get/tools/export/schema",
            "audit:export",
            "audit:delete"
          ],
          accessToken: "e2e-access-token",
          refreshToken: "e2e-refresh-token",
          expires
        })
      );
    }

    if (method === "GET" && pathname === "/api/v1/auth/session") {
      return sendJson(
        res,
        200,
        ok({
          authenticated: true,
          user: {
            uid: "e2e-admin",
            username: "admin",
            currentCompanyId
          }
        })
      );
    }

    if (method === "GET" && pathname === "/api/v1/auth/current-company") {
      return sendJson(res, 200, ok(companies));
    }

    if (method === "POST" && pathname === "/api/v1/auth/current-company") {
      const body = (await readJsonBody(req)) || {};
      if (typeof body.companyId !== "string" || !body.companyId) {
        return sendJson(res, 400, {
          code: 400,
          msg: "companyId is required",
          data: null
        });
      }
      if (!companies.some(item => item.uid === body.companyId)) {
        return sendJson(res, 404, {
          code: 404,
          msg: "company not found",
          data: null
        });
      }
      currentCompanyId = body.companyId;
      return sendJson(
        res,
        200,
        ok({
          companyId: currentCompanyId
        })
      );
    }

    if (method === "GET" && pathname === "/api/v1/auth/async-routes") {
      return sendJson(res, 200, ok(asyncRoutes()));
    }

    // Captcha
    if (method === "GET" && pathname === "/api/v1/verify/captcha") {
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": CAPTCHA_PNG.length,
        "Cache-Control": "no-store"
      });
      return res.end(CAPTCHA_PNG);
    }

    // Units
    if (method === "GET" && pathname === "/api/v1/unit/all") {
      return sendJson(res, 200, { code: 200, data: units });
    }

    // Customer list
    {
      const params = matchPath(pathname, "/api/v1/customer/page/:index");
      if (method === "GET" && params) {
        const index = Number.parseInt(params.index || "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") || "", 10);
        const scope = url.searchParams.get("scope") || "nonDeleted";
        const name = url.searchParams.get("name") || "";
        const keyword = url.searchParams.get("keyword") || "";

        let list = customers.slice();
        if (scope === "deleted") list = list.filter(x => !!x.deleteAt);
        else if (scope === "all") list = list;
        else list = list.filter(x => !x.deleteAt);

        if (name) list = list.filter(x => (x.name || "").includes(name));
        if (keyword) {
          list = list.filter(x => {
            const hay = `${x.name || ""} ${x.code || ""} ${x.phone || ""} ${x.contact || ""}`;
            return hay.includes(keyword);
          });
        }

        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }
    }

    {
      const balanceMatch = matchPath(pathname, "/api/v1/customer/:uid/initial-balance");
      if (method === "GET" && balanceMatch) {
        return sendJson(
          res,
          200,
          ok(
            customerInitialBalanceSummary[balanceMatch.uid] || {
              latestRecord: null,
              summary: {
                receivableBalance: 0,
                advanceBalance: 0,
                totalBalance: 0
              }
            }
          )
        );
      }
    }

    if (method === "GET" && pathname === "/api/v1/customer/tag") {
      return sendJson(
        res,
        200,
        ok([{ id: 1, name: "重点客户", color: "#409EFF" }])
      );
    }

    if (method === "GET" && pathname === "/api/v1/customer/level") {
      return sendJson(
        res,
        200,
        ok([{ id: 1, name: "普通客户", discount: 100 }])
      );
    }

    if (method === "POST" && pathname === "/api/v1/customer/batch") {
      const body = (await readJsonBody(req)) || {};
      const uids = Array.isArray(body.uids) ? body.uids : [];
      return sendJson(
        res,
        200,
        ok(customerOptions.filter(item => uids.includes(item.uid)))
      );
    }

    // Customer CRUD
    {
      const createMatch = matchPath(pathname, "/api/v1/customer");
      if (method === "POST" && (pathname === "/api/v1/customer/" || createMatch)) {
        const body = (await readJsonBody(req)) || {};
        const input = body.customer && typeof body.customer === "object" ? body.customer : body;
        if ("initialBalance" in input) {
          return sendJson(res, 400, {
            code: 400,
            msg: "initialBalance must not be submitted from customer form",
            data: null
          });
        }
        const name = typeof input.name === "string" ? input.name.trim() : "";
        if (!name) {
          return sendJson(res, 400, { code: 400, msg: "name is required", data: null });
        }
        const record = {
          id: nextCustomerId++,
          uid: randomUUID(),
          code: typeof input.code === "string" ? input.code : `C${Date.now()}`,
          name,
          contact: typeof input.contact === "string" ? input.contact : "",
          phone: typeof input.phone === "string" ? input.phone : "",
          address: typeof input.address === "string" ? input.address : "",
          desc: typeof input.desc === "string" ? input.desc : "",
          creditLimit: typeof input.creditLimit === "number" ? input.creditLimit : undefined,
          deleteAt: null
        };
        customers.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const getMatch = matchPath(pathname, "/api/v1/customer/:uid");
      if (getMatch && method === "GET") {
        const found = customers.find(x => x.uid === getMatch.uid);
        if (!found) return notFound(res, method, pathname);
        return sendJson(res, 200, ok(found));
      }

      const patchMatch = matchPath(pathname, "/api/v1/customer/:uid");
      if (patchMatch && method === "PATCH") {
        const found = customers.find(x => x.uid === patchMatch.uid);
        if (!found) return notFound(res, method, pathname);
        const body = (await readJsonBody(req)) || {};
        const input = body.customer && typeof body.customer === "object" ? body.customer : body;
        if (typeof input.name === "string") found.name = input.name;
        if (typeof input.code === "string") found.code = input.code;
        if (typeof input.contact === "string") found.contact = input.contact;
        if (typeof input.phone === "string") found.phone = input.phone;
        if (typeof input.address === "string") found.address = input.address;
        if (typeof input.desc === "string") found.desc = input.desc;
        if (typeof input.creditLimit === "number") found.creditLimit = input.creditLimit;
        return sendJson(res, 200, ok(found));
      }

      const delMatch = matchPath(pathname, "/api/v1/customer/:uid");
      if (delMatch && method === "DELETE") {
        const found = customers.find(x => x.uid === delMatch.uid);
        if (!found) return notFound(res, method, pathname);
        found.deleteAt = nowIso();
        return sendJson(res, 200, ok(true));
      }

      const restoreMatch = matchPath(pathname, "/api/v1/customer/restore/:uid");
      if (restoreMatch && method === "POST") {
        const found = customers.find(x => x.uid === restoreMatch.uid);
        if (!found) return notFound(res, method, pathname);
        found.deleteAt = null;
        return sendJson(res, 200, ok(found));
      }
    }

    // Tire list
    {
      const providerParams = matchPath(pathname, "/api/v1/provider/page/:index");
      if (method === "GET" && providerParams) {
        const index = Number.parseInt(providerParams.index || "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") || "", 10);
        const keyword = url.searchParams.get("keyword") || "";
        const scope = url.searchParams.get("scope") || "nonDeleted";

        let list = providers.slice();
        if (scope === "deleted") list = list.filter(item => !!item.deleteAt);
        else if (scope !== "all") list = list.filter(item => !item.deleteAt);

        if (keyword) {
          list = list.filter(item => {
            const hay = `${item.name} ${item.code || ""} ${item.phone || ""}`;
            return hay.includes(keyword);
          });
        }

        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }

      if (method === "POST" && pathname === "/api/v1/provider/batch") {
        const body = (await readJsonBody(req)) || {};
        const uids = Array.isArray(body.uids) ? body.uids : [];
        return sendJson(
          res,
          200,
          ok(providers.filter(item => uids.includes(item.uid)))
        );
      }

      if (method === "GET" && pathname === "/api/v1/payment/list") {
        return sendJson(res, 200, ok(paymentAccounts.slice()));
      }

      const paymentListByCompanyMatch = matchPath(pathname, "/api/v1/payment/list/:companyUid");
      if (method === "GET" && paymentListByCompanyMatch) {
        return sendJson(
          res,
          200,
          ok(
            paymentAccounts.filter(
              item => item.companyUid === paymentListByCompanyMatch.companyUid
            )
          )
        );
      }

      const paymentDetailMatch = matchPath(pathname, "/api/v1/payment/:uid");
      if (method === "GET" && paymentDetailMatch) {
        const found = findPaymentByUid(paymentDetailMatch.uid);
        if (!found) return notFound(res, method, pathname);
        return sendJson(res, 200, ok(found));
      }

      const companySettingGroupMatch = matchPath(
        pathname,
        "/api/v1/company-setting/group/:group"
      );
      if (method === "GET" && companySettingGroupMatch) {
        if (companySettingGroupMatch.group === "settlement") {
          return sendJson(
            res,
            200,
            ok([
              { key: "defaultPaymentMethod", value: "BANK_TRANSFER" },
              { key: "defaultReceivableAccount", value: "payment-1" },
              { key: "defaultPayableAccount", value: "payment-1" }
            ])
          );
        }

        if (companySettingGroupMatch.group === "document") {
          return sendJson(
            res,
            200,
            ok([{ key: "allowBackdateDays", value: "30" }])
          );
        }
      }

      const receiptOrderListMatch = matchPath(pathname, "/api/v1/receipt-order/:index");
      if (method === "GET" && receiptOrderListMatch) {
        const index = Number.parseInt(receiptOrderListMatch.index || "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") || "", 10);
        const billNo = url.searchParams.get("billNo") || "";
        const customerName = url.searchParams.get("customerName") || "";
        const status = url.searchParams.get("status") || "";

        let list = receiptOrders.slice();
        if (billNo) list = list.filter(item => item.billNo.includes(billNo));
        if (customerName) {
          list = list.filter(item => (item.customerName || "").includes(customerName));
        }
        if (status) list = list.filter(item => item.status === status);

        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }

      if (method === "POST" && pathname === "/api/v1/receipt-order") {
        const body = (await readJsonBody(req)) || {};
        const customerId =
          typeof body.customerId === "string" ? body.customerId : "";
        const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
        const customer = findCustomerByUid(customerId);
        const payment = findPaymentByUid(paymentId);
        const amount = Math.max(0, Math.round(toSafeNumber(body.amount)));
        const writeOffAmount = Array.isArray(body.details)
          ? body.details.reduce(
              (sum, item) =>
                sum + Math.max(0, Math.round(toSafeNumber(item.writeOffAmount))),
              0
            )
          : 0;
        const advanceAmount = Math.max(amount - writeOffAmount, 0);
        const record = {
          id: ++nextReceiptOrderId,
          uid: randomUUID(),
          billNo: buildBillNo("SKD"),
          customerId,
          customerName: customer?.name || "",
          paymentId,
          paymentName: payment?.name || "",
          amount,
          actualAmount: amount,
          writeOffAmount,
          advanceAmount,
          paymentMethod:
            typeof body.paymentMethod === "string"
              ? body.paymentMethod
              : "BANK_TRANSFER",
          status: "DRAFT",
          receiptDate:
            typeof body.receiptDate === "string" ? body.receiptDate : "2026-03-10",
          remark: typeof body.remark === "string" ? body.remark : "",
          details: Array.isArray(body.details) ? body.details : [],
          createdAt: nowIso(),
          updatedAt: nowIso()
        };
        receiptOrders.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const receiptOrderApproveMatch = matchPath(
        pathname,
        "/api/v1/receipt-order/:uid/approve"
      );
      if (method === "POST" && receiptOrderApproveMatch) {
        const found = receiptOrders.find(
          item => item.uid === receiptOrderApproveMatch.uid
        );
        if (!found) return notFound(res, method, pathname);
        found.status = "APPROVED";
        found.updatedAt = nowIso();
        return sendJson(res, 200, ok(true));
      }

      const receiptOrderDetailMatch = matchPath(pathname, "/api/v1/receipt-order/:uid");
      if (method === "DELETE" && receiptOrderDetailMatch) {
        const index = receiptOrders.findIndex(
          item => item.uid === receiptOrderDetailMatch.uid
        );
        if (index === -1) return notFound(res, method, pathname);
        receiptOrders.splice(index, 1);
        return sendJson(res, 200, ok(true));
      }

      const paymentOrderListMatch = matchPath(pathname, "/api/v1/payment-order/:index");
      if (method === "GET" && paymentOrderListMatch) {
        const index = Number.parseInt(paymentOrderListMatch.index || "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") || "", 10);
        const billNo = url.searchParams.get("billNo") || "";
        const providerName = url.searchParams.get("providerName") || "";
        const status = url.searchParams.get("status") || "";

        let list = paymentOrders.slice();
        if (billNo) list = list.filter(item => item.billNo.includes(billNo));
        if (providerName) {
          list = list.filter(item => (item.providerName || "").includes(providerName));
        }
        if (status) list = list.filter(item => item.status === status);

        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }

      if (method === "POST" && pathname === "/api/v1/payment-order") {
        const body = (await readJsonBody(req)) || {};
        const provider = findProviderByUid(body.providerId);
        const payment = findPaymentByUid(body.paymentId);
        const amount = Math.max(0, Math.round(toSafeNumber(body.amount)));
        const writeOffAmount = Array.isArray(body.details)
          ? body.details.reduce(
              (sum, item) => sum + Math.max(0, Math.round(toSafeNumber(item.writeOffAmount))),
              0
            )
          : 0;
        const record = {
          id: ++nextPaymentOrderId,
          uid: randomUUID(),
          billNo: buildBillNo("FKD"),
          providerId: typeof body.providerId === "string" ? body.providerId : "",
          providerName: provider?.name || "",
          paymentId: typeof body.paymentId === "string" ? body.paymentId : "",
          paymentName: payment?.name || "",
          amount,
          writeOffAmount,
          advanceAmount: Math.max(amount - writeOffAmount, 0),
          paymentMethod:
            typeof body.paymentMethod === "string"
              ? body.paymentMethod
              : "BANK_TRANSFER",
          status: "DRAFT",
          paymentDate:
            typeof body.paymentDate === "string" ? body.paymentDate : "2026-03-10",
          remark: typeof body.remark === "string" ? body.remark : "",
          createdAt: nowIso(),
          details: Array.isArray(body.details) ? body.details : []
        };
        paymentOrders.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const paymentOrderDetailMatch = matchPath(pathname, "/api/v1/payment-order/:uid");
      if (method === "PUT" && paymentOrderDetailMatch) {
        const found = paymentOrders.find(item => item.uid === paymentOrderDetailMatch.uid);
        if (!found) return notFound(res, method, pathname);
        const body = (await readJsonBody(req)) || {};
        const provider = findProviderByUid(body.providerId);
        const payment = findPaymentByUid(body.paymentId);
        if (typeof body.providerId === "string") found.providerId = body.providerId;
        if (typeof body.paymentId === "string") found.paymentId = body.paymentId;
        if (provider) found.providerName = provider.name;
        if (payment) found.paymentName = payment.name;
        if ("amount" in body) found.amount = Math.max(0, Math.round(toSafeNumber(body.amount)));
        if (typeof body.paymentMethod === "string") {
          found.paymentMethod = body.paymentMethod;
        }
        if (typeof body.paymentDate === "string") found.paymentDate = body.paymentDate;
        if (typeof body.remark === "string") found.remark = body.remark;
        if (Array.isArray(body.details)) found.details = body.details;
        return sendJson(res, 200, ok(found));
      }

      if (method === "DELETE" && paymentOrderDetailMatch) {
        const index = paymentOrders.findIndex(
          item => item.uid === paymentOrderDetailMatch.uid
        );
        if (index === -1) return notFound(res, method, pathname);
        paymentOrders.splice(index, 1);
        return sendJson(res, 200, ok(true));
      }

      const paymentOrderApproveMatch = matchPath(
        pathname,
        "/api/v1/payment-order/:uid/approve"
      );
      if (method === "POST" && paymentOrderApproveMatch) {
        const found = paymentOrders.find(
          item => item.uid === paymentOrderApproveMatch.uid
        );
        if (!found) return notFound(res, method, pathname);
        found.status = "APPROVED";
        return sendJson(res, 200, ok(true));
      }

      const otherIncomeListMatch = matchPath(pathname, "/api/v1/other-income-order/:index");
      if (method === "GET" && otherIncomeListMatch) {
        const index = Number.parseInt(otherIncomeListMatch.index || "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") || "", 10);
        const billNo = url.searchParams.get("billNo") || "";
        const customerName = url.searchParams.get("customerName") || "";
        const incomeType = url.searchParams.get("incomeType") || "";

        let list = otherIncomeOrders.slice();
        if (billNo) list = list.filter(item => item.billNo.includes(billNo));
        if (customerName) {
          list = list.filter(item => (item.customerName || "").includes(customerName));
        }
        if (incomeType) list = list.filter(item => item.incomeType === incomeType);

        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }

      if (method === "POST" && pathname === "/api/v1/other-income-order") {
        const body = (await readJsonBody(req)) || {};
        const customer = findCustomerByUid(body.customerId);
        const payment = findPaymentByUid(body.paymentId);
        const amount = Math.max(0, Math.round(toSafeNumber(body.amount)));
        const receivedAmount = Math.max(0, Math.round(toSafeNumber(body.receivedAmount)));
        const record = {
          id: ++nextOtherIncomeOrderId,
          uid: randomUUID(),
          billNo: buildBillNo("QTSR"),
          customerId: typeof body.customerId === "string" ? body.customerId : "",
          customerName: customer?.name || "",
          incomeType: typeof body.incomeType === "string" ? body.incomeType : "OTHER",
          amount,
          receivedAmount,
          unpaidAmount: Math.max(amount - receivedAmount, 0),
          paymentId: typeof body.paymentId === "string" ? body.paymentId : "",
          paymentName: payment?.name || "",
          incomeDate:
            typeof body.incomeDate === "string" ? body.incomeDate : "2026-03-10",
          status: "DRAFT",
          category: typeof body.category === "string" ? body.category : "",
          remark: typeof body.remark === "string" ? body.remark : "",
          createdAt: nowIso()
        };
        otherIncomeOrders.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const otherIncomeDetailMatch = matchPath(pathname, "/api/v1/other-income-order/:uid");
      if (method === "DELETE" && otherIncomeDetailMatch) {
        const index = otherIncomeOrders.findIndex(
          item => item.uid === otherIncomeDetailMatch.uid
        );
        if (index === -1) return notFound(res, method, pathname);
        otherIncomeOrders.splice(index, 1);
        return sendJson(res, 200, ok(true));
      }

      const otherExpenseListMatch = matchPath(pathname, "/api/v1/expense-order/:index");
      if (method === "GET" && otherExpenseListMatch) {
        const index = Number.parseInt(otherExpenseListMatch.index || "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") || "", 10);
        const billNo = url.searchParams.get("billNo") || "";
        const providerName = url.searchParams.get("providerName") || "";
        const expenseType = url.searchParams.get("expenseType") || "";

        let list = otherExpenseOrders.slice();
        if (billNo) list = list.filter(item => item.billNo.includes(billNo));
        if (providerName) {
          list = list.filter(item => (item.providerName || "").includes(providerName));
        }
        if (expenseType) list = list.filter(item => item.expenseType === expenseType);

        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }

      if (method === "POST" && pathname === "/api/v1/expense-order") {
        const body = (await readJsonBody(req)) || {};
        const provider = findProviderByUid(body.providerId);
        const payment = findPaymentByUid(body.paymentId);
        const amount = Math.max(0, Math.round(toSafeNumber(body.amount)));
        const paidAmount = Math.max(0, Math.round(toSafeNumber(body.paidAmount)));
        const record = {
          id: ++nextOtherExpenseOrderId,
          uid: randomUUID(),
          billNo: buildBillNo("QTZC"),
          providerId: typeof body.providerId === "string" ? body.providerId : "",
          providerName: provider?.name || "",
          expenseType:
            typeof body.expenseType === "string" ? body.expenseType : "OTHER",
          amount,
          paidAmount,
          unpaidAmount: Math.max(amount - paidAmount, 0),
          paymentId: typeof body.paymentId === "string" ? body.paymentId : "",
          paymentName: payment?.name || "",
          expenseDate:
            typeof body.expenseDate === "string" ? body.expenseDate : "2026-03-10",
          status: "DRAFT",
          category: typeof body.category === "string" ? body.category : "",
          relatedOrderId:
            typeof body.relatedOrderId === "string" ? body.relatedOrderId : "",
          relatedOrderNo:
            typeof body.relatedOrderId === "string" && body.relatedOrderId
              ? `ORDER-${body.relatedOrderId}`
              : "",
          remark: typeof body.remark === "string" ? body.remark : "",
          createdAt: nowIso()
        };
        otherExpenseOrders.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const otherExpenseDetailMatch = matchPath(pathname, "/api/v1/expense-order/:uid");
      if (method === "DELETE" && otherExpenseDetailMatch) {
        const index = otherExpenseOrders.findIndex(
          item => item.uid === otherExpenseDetailMatch.uid
        );
        if (index === -1) return notFound(res, method, pathname);
        otherExpenseOrders.splice(index, 1);
        return sendJson(res, 200, ok(true));
      }

      const transferListMatch = matchPath(
        pathname,
        "/api/v1/finance-extension/account-transfer/:index"
      );
      if (method === "GET" && transferListMatch) {
        const index = Number.parseInt(transferListMatch.index || "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") || "", 10);
        const billNo = url.searchParams.get("billNo") || "";
        const fromPaymentId = url.searchParams.get("fromPaymentId") || "";
        const toPaymentId = url.searchParams.get("toPaymentId") || "";

        let list = transferOrders.slice();
        if (billNo) list = list.filter(item => item.billNo.includes(billNo));
        if (fromPaymentId) {
          list = list.filter(item => item.fromPaymentId === fromPaymentId);
        }
        if (toPaymentId) list = list.filter(item => item.toPaymentId === toPaymentId);

        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }

      if (method === "POST" && pathname === "/api/v1/finance-extension/account-transfer") {
        const body = (await readJsonBody(req)) || {};
        const fromPaymentId =
          typeof body.fromPayment === "string" ? body.fromPayment : "";
        const toPaymentId = typeof body.toPayment === "string" ? body.toPayment : "";
        const feePaymentId =
          typeof body.feePayment === "string" ? body.feePayment : "";
        const fromPayment = findPaymentByUid(fromPaymentId);
        const toPayment = findPaymentByUid(toPaymentId);
        const feePayment = findPaymentByUid(feePaymentId);
        const record = {
          id: ++nextTransferOrderId,
          uid: randomUUID(),
          billNo: buildBillNo("ZZD"),
          fromPaymentId,
          fromPaymentName: fromPayment?.name || "",
          toPaymentId,
          toPaymentName: toPayment?.name || "",
          amount: Math.max(0, Math.round(toSafeNumber(body.amount))),
          fee: Math.max(0, Math.round(toSafeNumber(body.fee))),
          feePaymentId,
          feePaymentName: feePayment?.name || "",
          status: "DRAFT",
          transferDate: "2026-03-10",
          remark: typeof body.remark === "string" ? body.remark : "",
          createdAt: nowIso()
        };
        transferOrders.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const transferDetailMatch = matchPath(
        pathname,
        "/api/v1/finance-extension/account-transfer/:uid"
      );
      if (method === "DELETE" && transferDetailMatch) {
        const index = transferOrders.findIndex(
          item => item.uid === transferDetailMatch.uid
        );
        if (index === -1) return notFound(res, method, pathname);
        transferOrders.splice(index, 1);
        return sendJson(res, 200, ok(true));
      }

      const transferApproveMatch = matchPath(
        pathname,
        "/api/v1/finance-extension/account-transfer/:uid/approve"
      );
      if (method === "POST" && transferApproveMatch) {
        const found = transferOrders.find(
          item => item.uid === transferApproveMatch.uid
        );
        if (!found) return notFound(res, method, pathname);
        found.status = "APPROVED";
        return sendJson(res, 200, ok(true));
      }

      const paymentParams = matchPath(pathname, "/api/v1/payment/page/:index");
      if (method === "GET" && paymentParams) {
        const index = Number.parseInt(paymentParams.index || "1", 10);
        const pageSize = Number.parseInt(
          url.searchParams.get("pageSize") || "",
          10
        );
        const keyword = url.searchParams.get("keyword") || "";
        const status = url.searchParams.get("status");
        let list = paymentAccounts.slice();
        if (keyword) {
          list = list.filter(item => {
            const hay = `${item.name} ${item.account} ${item.realName}`;
            return hay.includes(keyword);
          });
        }
        if (status === "true") list = list.filter(item => item.status === true);
        if (status === "false") {
          list = list.filter(item => item.status === false);
        }
        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }

      const writeOffParams = matchPath(pathname, "/api/v1/write-off-order/page/:index");
      if (method === "GET" && writeOffParams) {
        const index = Number.parseInt(writeOffParams.index || "1", 10);
        const pageSize = Number.parseInt(
          url.searchParams.get("pageSize") || "",
          10
        );
        return sendJson(
          res,
          200,
          ok(listWithPagination(writeOffOrders, index, pageSize))
        );
      }

      if (method === "POST" && pathname === "/api/v1/write-off-order") {
        const body = (await readJsonBody(req)) || {};
        const record = {
          id: ++nextWriteOffOrderId,
          uid: randomUUID(),
          billNo: buildBillNo("WO"),
          businessType:
            typeof body.businessType === "string"
              ? body.businessType
              : "ADVANCE_RECEIVABLE",
          fromCustomerId:
            typeof body.fromCustomerId === "string" ? body.fromCustomerId : "",
          toCustomerId: typeof body.toCustomerId === "string" ? body.toCustomerId : "",
          fromProviderId:
            typeof body.fromProviderId === "string" ? body.fromProviderId : "",
          toProviderId: typeof body.toProviderId === "string" ? body.toProviderId : "",
          receivableAmount: Math.max(
            0,
            Math.round(toSafeNumber(body.receivableAmount))
          ),
          payableAmount: Math.max(0, Math.round(toSafeNumber(body.payableAmount))),
          writeOffAmount: Math.max(
            0,
            Math.round(toSafeNumber(body.writeOffAmount))
          ),
          status: "DRAFT",
          isApproved: false,
          writeOffDate:
            typeof body.writeOffDate === "string" ? body.writeOffDate : "2026-03-10",
          reason: typeof body.reason === "string" ? body.reason : "",
          remark: typeof body.remark === "string" ? body.remark : "",
          createdAt: nowIso()
        };
        writeOffOrders.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const approveMatch = matchPath(pathname, "/api/v1/write-off-order/:uid/approve");
      if (method === "POST" && approveMatch) {
        const found = writeOffOrders.find(item => item.uid === approveMatch.uid);
        if (!found) return notFound(res, method, pathname);
        found.status = "APPROVED";
        found.isApproved = true;
        return sendJson(res, 200, ok(true));
      }

      const rejectMatch = matchPath(pathname, "/api/v1/write-off-order/:uid/reject");
      if (method === "POST" && rejectMatch) {
        const found = writeOffOrders.find(item => item.uid === rejectMatch.uid);
        if (!found) return notFound(res, method, pathname);
        found.status = "REJECTED";
        found.isApproved = false;
        return sendJson(res, 200, ok(true));
      }

      const writeOffDeleteMatch = matchPath(pathname, "/api/v1/write-off-order/:uid");
      if (method === "DELETE" && writeOffDeleteMatch) {
        const index = writeOffOrders.findIndex(
          item => item.uid === writeOffDeleteMatch.uid
        );
        if (index === -1) return notFound(res, method, pathname);
        writeOffOrders.splice(index, 1);
        return sendJson(res, 200, ok(true));
      }

      if (method === "GET" && pathname === "/api/v1/backup/") {
        return sendJson(
          res,
          200,
          ok({
            list: backups,
            total: backups.length,
            count: backups.length,
            page: 1,
            pageSize: backups.length
          })
        );
      }

      const backupDownloadMatch = matchPath(pathname, "/api/v1/backup/:uid/download");
      if (method === "GET" && backupDownloadMatch) {
        return sendBuffer(res, 200, zipBuffer, {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="backup.zip"'
        });
      }

      const templateMatch = matchPath(
        pathname,
        "/api/v1/tools/import/template/:type/download"
      );
      if (method === "GET" && templateMatch) {
        return sendBuffer(res, 200, xlsxBuffer, {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
      }

      const importMatch = matchPath(pathname, "/api/v1/tools/import/:type");
      if (method === "POST" && importMatch) {
        return sendJson(
          res,
          200,
          ok({
            total: 1,
            success: 1,
            failed: 0,
            errors: []
          })
        );
      }

      const schemaMatch = matchPath(pathname, "/api/v1/tools/export/schema/:type");
      if (method === "GET" && schemaMatch) {
        return sendJson(
          res,
          200,
          ok({
            type: schemaMatch.type,
            fields: [
              {
                key: "name",
                label: "名称",
                defaultSelected: true,
                required: true
              },
              {
                key: "code",
                label: "编码",
                defaultSelected: true,
                required: false
              }
            ]
          })
        );
      }

      const exportMatch = matchPath(pathname, "/api/v1/tools/export/:type");
      if (method === "GET" && exportMatch) {
        return sendJson(
          res,
          200,
          ok({
            format: "xlsx",
            content: buildDataUrl(
              `export:${exportMatch.type}`,
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
          })
        );
      }

      const asyncExportMatch = matchPath(pathname, "/api/v1/tools/export/async/:type");
      if (method === "POST" && asyncExportMatch) {
        const taskId = `export-task-${randomUUID()}`;
        exportTasks.set(taskId, {
          id: taskId,
          type: asyncExportMatch.type,
          status: "completed",
          progress: 100,
          createdAt: nowIso()
        });
        return sendJson(
          res,
          200,
          ok({
            id: taskId,
            status: "processing",
            progress: 0
          })
        );
      }

      const exportTaskMatch = matchPath(pathname, "/api/v1/tools/export/task/:taskId");
      if (method === "GET" && exportTaskMatch) {
        const task = exportTasks.get(exportTaskMatch.taskId);
        if (!task) return notFound(res, method, pathname);
        return sendJson(
          res,
          200,
          ok({
            id: task.id,
            status: task.status,
            progress: task.progress
          })
        );
      }

      const exportDownloadMatch = matchPath(
        pathname,
        "/api/v1/tools/export/download/:taskId"
      );
      if (method === "GET" && exportDownloadMatch) {
        if (!exportTasks.has(exportDownloadMatch.taskId)) {
          return notFound(res, method, pathname);
        }
        return sendBuffer(res, 200, xlsxBuffer, {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="audit-export.xlsx"'
        });
      }

      const customerProductCodeListMatch = matchPath(
        pathname,
        "/api/v1/data-config/customer-product-code/page/:index"
      );
      if (method === "GET" && customerProductCodeListMatch) {
        const index = Number.parseInt(customerProductCodeListMatch.index || "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") || "", 10);
        const customerId = url.searchParams.get("customerId") || "";
        const tireId = url.searchParams.get("tireId") || "";
        const keyword = url.searchParams.get("keyword") || "";
        let list = getCurrentCompanyScopedCustomerProductCodes().slice();
        if (customerId) {
          list = list.filter(item => item.customerId === customerId);
        }
        if (tireId) {
          list = list.filter(item => item.tireId === tireId);
        }
        if (keyword) {
          list = list.filter(item =>
            `${item.customerCode} ${item.customerProductName || ""}`.includes(keyword)
          );
        }
        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }

      if (method === "POST" && pathname === "/api/v1/data-config/customer-product-code") {
        const body = (await readJsonBody(req)) || {};
        const companyRecords = ensureCurrentCompanyScopedCustomerProductCodes();
        const record = {
          id: nextCustomerProductCodeId++,
          uid: randomUUID(),
          customerId: typeof body.customerId === "string" ? body.customerId : "",
          tireId: typeof body.tireId === "string" ? body.tireId : "",
          customerCode:
            typeof body.customerCode === "string" ? body.customerCode : "",
          customerProductName:
            typeof body.customerProductName === "string"
              ? body.customerProductName
              : "",
          remark: typeof body.remark === "string" ? body.remark : "",
          createdAt: nowIso()
        };
        companyRecords.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const customerProductCodeDetailMatch = matchPath(
        pathname,
        "/api/v1/data-config/customer-product-code/:uid"
      );
      if (method === "PATCH" && customerProductCodeDetailMatch) {
        const body = (await readJsonBody(req)) || {};
        const found = ensureCurrentCompanyScopedCustomerProductCodes().find(
          item => item.uid === customerProductCodeDetailMatch.uid
        );
        if (!found) return notFound(res, method, pathname);
        if (typeof body.customerId === "string") found.customerId = body.customerId;
        if (typeof body.tireId === "string") found.tireId = body.tireId;
        if (typeof body.customerCode === "string") {
          found.customerCode = body.customerCode;
        }
        if (typeof body.customerProductName === "string") {
          found.customerProductName = body.customerProductName;
        }
        if (typeof body.remark === "string") found.remark = body.remark;
        return sendJson(res, 200, ok(found));
      }

      if (method === "DELETE" && customerProductCodeDetailMatch) {
        const companyRecords = ensureCurrentCompanyScopedCustomerProductCodes();
        const index = companyRecords.findIndex(
          item => item.uid === customerProductCodeDetailMatch.uid
        );
        if (index === -1) return notFound(res, method, pathname);
        companyRecords.splice(index, 1);
        return sendJson(res, 200, ok(true));
      }

      if (method === "GET" && pathname === "/api/v1/menu/list") {
        return sendJson(res, 200, ok(menuItems.slice()));
      }

      if (method === "POST" && pathname === "/api/v1/menu") {
        const body = (await readJsonBody(req)) || {};
        const record = {
          id: nextMenuId++,
          uid: randomUUID(),
          code: typeof body.code === "number" ? body.code : 0,
          parentId: typeof body.parentId === "string" ? body.parentId : "",
          title: typeof body.title === "string" ? body.title : "",
          path: typeof body.path === "string" ? body.path : "",
          component:
            typeof body.component === "string" ? body.component : "",
          rank: typeof body.rank === "number" ? body.rank : 99,
          auths: typeof body.auths === "string" ? body.auths : "",
          frameSrc: typeof body.frameSrc === "string" ? body.frameSrc : "",
          redirect: typeof body.redirect === "string" ? body.redirect : "",
          isShow:
            typeof body.isShow === "boolean"
              ? body.isShow
              : typeof body.showLink === "boolean"
                ? body.showLink
                : true,
          showLink:
            typeof body.showLink === "boolean"
              ? body.showLink
              : typeof body.isShow === "boolean"
                ? body.isShow
                : true,
          keepAlive: Boolean(body.keepAlive),
          hidden: Boolean(body.hidden),
          fixedTag: Boolean(body.fixedTag),
          hiddenTag: Boolean(body.hiddenTag),
          enterTransition:
            typeof body.enterTransition === "string" ? body.enterTransition : "",
          leaveTransition:
            typeof body.leaveTransition === "string" ? body.leaveTransition : "",
          deleteAt: null
        };
        menuItems.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const menuDetailMatch = matchPath(pathname, "/api/v1/menu/:uid");
      if (method === "PATCH" && menuDetailMatch) {
        const body = (await readJsonBody(req)) || {};
        const found = menuItems.find(item => item.uid === menuDetailMatch.uid);
        if (!found) return notFound(res, method, pathname);
        Object.assign(found, body);
        return sendJson(res, 200, ok(found));
      }

      if (method === "DELETE" && menuDetailMatch) {
        const found = menuItems.find(item => item.uid === menuDetailMatch.uid);
        if (!found) return notFound(res, method, pathname);
        found.deleteAt = nowIso();
        return sendJson(res, 200, ok(true));
      }

      const menuRestoreMatch = matchPath(pathname, "/api/v1/menu/:uid/restore");
      if (method === "POST" && menuRestoreMatch) {
        const found = menuItems.find(item => item.uid === menuRestoreMatch.uid);
        if (!found) return notFound(res, method, pathname);
        found.deleteAt = null;
        return sendJson(res, 200, ok(found));
      }

      const documentCenterListMatch = matchPath(
        pathname,
        "/api/v1/document-center/page/:index"
      );
      if (method === "GET" && documentCenterListMatch) {
        const index = Number.parseInt(documentCenterListMatch.index || "1", 10);
        return sendJson(res, 200, ok(listDocumentCenter(url.searchParams, index)));
      }

      if (method === "POST" && pathname === "/api/v1/document-center/approve") {
        const body = (await readJsonBody(req)) || {};
        const items = Array.isArray(body.items) ? body.items : [];
        const result = items.map(item => {
          const found = documentCenterItems.find(
            entry =>
              entry.uid === item.uid && entry.documentType === item.documentType
          );
          if (found) {
            found.status = "APPROVED";
            return {
              documentType: item.documentType,
              uid: item.uid,
              success: true,
              message: "ok"
            };
          }
          return {
            documentType: item.documentType,
            uid: item.uid,
            success: false,
            message: "not found"
          };
        });
        return sendJson(res, 200, ok(result));
      }

      if (method === "GET" && pathname === "/api/v1/document-center/export") {
        return sendBuffer(res, 200, xlsxBuffer, {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
      }

      const documentCenterPrintMatch = matchPath(
        pathname,
        "/api/v1/document-center/print/:documentType/:uid"
      );
      if (method === "GET" && documentCenterPrintMatch) {
        const found = documentCenterItems.find(
          item =>
            item.documentType === documentCenterPrintMatch.documentType &&
            item.uid === documentCenterPrintMatch.uid
        );
        if (!found) return notFound(res, method, pathname);
        return sendJson(
          res,
          200,
          ok({
            documentType: found.documentTypeLabel,
            uid: found.uid,
            billNo: found.billNo,
            status: found.status,
            targetName: found.targetName,
            detail: {
              金额: String(found.amount ?? 0),
              单据类型: found.documentTypeLabel
            }
          })
        );
      }

      const params = matchPath(pathname, "/api/v1/tire/page/:index");
      if (method === "GET" && params) {
        const index = Number.parseInt(params.index || "1", 10);
        const pageSize = Number.parseInt(url.searchParams.get("pageSize") || "", 10);
        const keyword = url.searchParams.get("keyword") || "";
        const group = url.searchParams.get("group") || "";

        let list = tires.slice();
        if (keyword) list = list.filter(x => (x.name || "").includes(keyword));
        if (group) list = list.filter(x => (x.group || "") === group);

        return sendJson(res, 200, ok(listWithPagination(list, index, pageSize)));
      }

      if (method === "POST" && pathname === "/api/v1/tire/batch") {
        const body = (await readJsonBody(req)) || {};
        const uids = Array.isArray(body.uids) ? body.uids : [];
        return sendJson(
          res,
          200,
          ok(tireOptions.filter(item => uids.includes(item.uid)))
        );
      }
    }

    // Tire CRUD
    {
      const createMatch = matchPath(pathname, "/api/v1/tire");
      if (method === "POST" && (pathname === "/api/v1/tire/" || createMatch)) {
        const body = (await readJsonBody(req)) || {};
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name) return sendJson(res, 400, { code: 400, msg: "name is required", data: null });
        const record = {
          id: nextTireId++,
          uid: randomUUID(),
          name,
          group: typeof body.group === "string" ? body.group : "默认",
          brand: typeof body.brand === "string" ? body.brand : "",
          pattern: typeof body.pattern === "string" ? body.pattern : "",
          format: typeof body.format === "string" ? body.format : "",
          unit: typeof body.unit === "string" ? body.unit : "个",
          purchasePrice: typeof body.purchasePrice === "number" ? body.purchasePrice : undefined,
          salePrice: typeof body.salePrice === "number" ? body.salePrice : 1,
          desc: typeof body.desc === "string" ? body.desc : ""
        };
        tires.unshift(record);
        return sendJson(res, 200, ok(record));
      }

      const getMatch = matchPath(pathname, "/api/v1/tire/:uid");
      if (getMatch && method === "GET") {
        const found = tires.find(x => x.uid === getMatch.uid);
        if (!found) return notFound(res, method, pathname);
        return sendJson(res, 200, ok(found));
      }

      const patchMatch = matchPath(pathname, "/api/v1/tire/:uid");
      if (patchMatch && method === "PATCH") {
        const found = tires.find(x => x.uid === patchMatch.uid);
        if (!found) return notFound(res, method, pathname);
        const body = (await readJsonBody(req)) || {};
        if (typeof body.name === "string") found.name = body.name;
        if (typeof body.group === "string") found.group = body.group;
        if (typeof body.brand === "string") found.brand = body.brand;
        if (typeof body.pattern === "string") found.pattern = body.pattern;
        if (typeof body.format === "string") found.format = body.format;
        if (typeof body.unit === "string") found.unit = body.unit;
        if (typeof body.purchasePrice === "number") found.purchasePrice = body.purchasePrice;
        if (typeof body.salePrice === "number") found.salePrice = body.salePrice;
        if (typeof body.desc === "string") found.desc = body.desc;
        return sendJson(res, 200, ok(found));
      }

      const delMatch = matchPath(pathname, "/api/v1/tire/:uid");
      if (delMatch && method === "DELETE") {
        const idx = tires.findIndex(x => x.uid === delMatch.uid);
        if (idx === -1) return notFound(res, method, pathname);
        tires.splice(idx, 1);
        return sendJson(res, 200, ok(true));
      }
    }

    if (pathname.startsWith("/api/v1/")) return notImplemented(res, method, pathname);
    return notFound(res, method, pathname);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[mock-api] error:", error);
    sendJson(res, 500, { code: 500, msg: "mock server error", data: null });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-api] listening on http://127.0.0.1:${PORT}`);
});
