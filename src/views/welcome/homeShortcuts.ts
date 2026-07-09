export interface HomeShortcut {
  key: string;
  title: string;
  description: string;
  icon: string;
  path: string;
}

type RoleHomeKey =
  "executive" | "sales" | "purchase" | "warehouse" | "finance" | "analyst";

const executiveShortcuts: HomeShortcut[] = [
  {
    key: "dashboard",
    title: "经营驾驶舱",
    description: "查看经营全景和异常指标",
    icon: "ri:dashboard-line",
    path: "/analysis/dashboard"
  },
  {
    key: "sales-analysis",
    title: "销售分析",
    description: "跟踪销售额、交付和回款",
    icon: "ri:line-chart-line",
    path: "/analysis/sales"
  },
  {
    key: "purchase-analysis",
    title: "采购分析",
    description: "查看采购金额、到货和付款",
    icon: "ri:shopping-cart-2-line",
    path: "/analysis/purchase"
  },
  {
    key: "inventory-analysis",
    title: "库存分析",
    description: "聚焦库存价值和预警",
    icon: "ri:archive-stack-line",
    path: "/analysis/inventory"
  },
  {
    key: "audit-center",
    title: "审核中心",
    description: "集中处理待审核业务单据",
    icon: "ri:task-line",
    path: "/business/audit"
  },
  {
    key: "statement",
    title: "对账单管理",
    description: "跟踪应收应付对账情况",
    icon: "ri:file-list-3-line",
    path: "/finance/statement"
  }
];

const salesShortcuts: HomeShortcut[] = [
  {
    key: "sales-order",
    title: "销售订单",
    description: "处理开单、发货和履约",
    icon: "ri:file-list-3-line",
    path: "/business/order"
  },
  {
    key: "customer",
    title: "客户管理",
    description: "维护客户资料和往来情况",
    icon: "ri:user-3-line",
    path: "/business/customer"
  },
  {
    key: "sales-quotation",
    title: "销售报价",
    description: "管理询价和报价转单",
    icon: "ri:price-tag-3-line",
    path: "/business/salesQuotation"
  },
  {
    key: "sale-picking",
    title: "拣货工作台",
    description: "查看拣货和分配进度",
    icon: "ri:shopping-bag-3-line",
    path: "/finance/sale-picking"
  },
  {
    key: "sales-analysis",
    title: "销售分析",
    description: "查看销售趋势和排行",
    icon: "ri:bar-chart-grouped-line",
    path: "/analysis/sales"
  },
  {
    key: "statement",
    title: "对账单管理",
    description: "跟踪客户账期和对账状态",
    icon: "ri:receipt-line",
    path: "/finance/statement"
  }
];

const purchaseShortcuts: HomeShortcut[] = [
  {
    key: "purchase-plan",
    title: "采购计划",
    description: "汇总补货计划和转采购单",
    icon: "ri:list-check-3",
    path: "/business/purchasePlan"
  },
  {
    key: "purchase-inquiry",
    title: "采购询价",
    description: "管理询价、报价和比价",
    icon: "ri:search-eye-line",
    path: "/business/purchaseInquiry"
  },
  {
    key: "provider",
    title: "供应商管理",
    description: "维护供应商和往来信息",
    icon: "ri:store-2-line",
    path: "/business/provider"
  },
  {
    key: "supplier-claim",
    title: "供应商理赔",
    description: "跟踪供应商赔付进度",
    icon: "ri:shield-check-line",
    path: "/business/supplierClaim"
  },
  {
    key: "purchase-analysis",
    title: "采购分析",
    description: "查看采购金额、到货和付款",
    icon: "ri:pie-chart-2-line",
    path: "/analysis/purchase"
  },
  {
    key: "audit-center",
    title: "审核中心",
    description: "优先处理待审核采购单据",
    icon: "ri:task-line",
    path: "/business/audit"
  }
];

const warehouseShortcuts: HomeShortcut[] = [
  {
    key: "stock-taking",
    title: "盘点工作台",
    description: "快速盘点并生成差异单据",
    icon: "ri:checkbox-multiple-line",
    path: "/business/stockTaking"
  },
  {
    key: "serial-number",
    title: "胎号管理",
    description: "查询和跟踪胎号流转",
    icon: "ri:qr-scan-2-line",
    path: "/business/serialNumber"
  },
  {
    key: "stock-alert",
    title: "库存预警",
    description: "处理低库存和异常库存",
    icon: "ri:alarm-warning-line",
    path: "/business/stockAlert"
  },
  {
    key: "expiry-alert",
    title: "临期预警",
    description: "跟踪临期批次和处置动作",
    icon: "ri:timer-line",
    path: "/business/expiryAlert"
  },
  {
    key: "inventory-analysis",
    title: "库存分析",
    description: "查看库存价值、周转和预警",
    icon: "ri:database-2-line",
    path: "/analysis/inventory"
  },
  {
    key: "batch",
    title: "批次查询",
    description: "按批次追踪库存与状态",
    icon: "ri:stack-line",
    path: "/business/batch"
  }
];

const financeShortcuts: HomeShortcut[] = [
  {
    key: "statement",
    title: "对账单管理",
    description: "集中管理对账与差异确认",
    icon: "ri:receipt-line",
    path: "/finance/statement"
  },
  {
    key: "invoice",
    title: "发票管理",
    description: "跟踪开票、收票和明细",
    icon: "ri:invoice-line",
    path: "/finance/invoice"
  },
  {
    key: "advance",
    title: "预收预付",
    description: "查看预收预付资金情况",
    icon: "ri:exchange-funds-line",
    path: "/finance/advance"
  },
  {
    key: "writeoff",
    title: "核销单管理",
    description: "处理收付款核销",
    icon: "ri:check-double-line",
    path: "/finance/writeOff"
  },
  {
    key: "finance-analysis",
    title: "财务分析",
    description: "查看资金风险和收支表现",
    icon: "ri:funds-line",
    path: "/analysis/finance"
  },
  {
    key: "transfer",
    title: "转账管理",
    description: "管理账户调拨和资金流向",
    icon: "ri:bank-card-transfer-line",
    path: "/finance/transfer"
  }
];

const analystShortcuts: HomeShortcut[] = [
  ...executiveShortcuts.slice(0, 4),
  {
    key: "ranking",
    title: "排行分析",
    description: "查看商品、客户和供应商排行",
    icon: "ri:medal-line",
    path: "/analysis/ranking"
  },
  {
    key: "comprehensive",
    title: "综合分析",
    description: "横向比较经营结构与走势",
    icon: "ri:bubble-chart-line",
    path: "/analysis/comprehensive"
  }
];

const defaultShortcuts: HomeShortcut[] = [
  {
    key: "dashboard",
    title: "经营驾驶舱",
    description: "进入完整经营分析视图",
    icon: "ri:dashboard-line",
    path: "/analysis/dashboard"
  },
  {
    key: "order",
    title: "业务单据",
    description: "处理订单和业务履约",
    icon: "ri:file-list-3-line",
    path: "/business/order"
  },
  {
    key: "customer",
    title: "客户管理",
    description: "维护客户和往来情况",
    icon: "ri:user-3-line",
    path: "/business/customer"
  },
  {
    key: "inventory-analysis",
    title: "库存分析",
    description: "查看库存价值和预警",
    icon: "ri:archive-stack-line",
    path: "/analysis/inventory"
  },
  {
    key: "statement",
    title: "对账单管理",
    description: "查看应收应付对账情况",
    icon: "ri:receipt-line",
    path: "/finance/statement"
  },
  {
    key: "notice",
    title: "公告管理",
    description: "查看系统公告和通知",
    icon: "ri:notification-3-line",
    path: "/system/notice"
  }
];

const roleShortcutMap: Record<RoleHomeKey, HomeShortcut[]> = {
  executive: executiveShortcuts,
  sales: salesShortcuts,
  purchase: purchaseShortcuts,
  warehouse: warehouseShortcuts,
  finance: financeShortcuts,
  analyst: analystShortcuts
};

export function getRoleHomeShortcuts(roleKey?: string): HomeShortcut[] {
  if (!roleKey) return defaultShortcuts;
  return roleShortcutMap[roleKey as RoleHomeKey] ?? defaultShortcuts;
}

export function getDefaultHomeShortcuts() {
  return defaultShortcuts;
}
