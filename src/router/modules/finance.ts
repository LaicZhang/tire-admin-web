export default {
  path: "/finance",
  redirect: "/finance/expense",
  meta: {
    icon: "ep:money",
    title: "财务管理"
  },
  children: [
    {
      path: "/finance/expense",
      name: "FinanceExpense",
      component: () => import("@/views/business/finance/expense/index.vue"),
      meta: {
        title: "费用管理"
      }
    },
    {
      path: "/finance/statement",
      name: "FinanceStatement",
      component: () => import("@/views/business/finance/statement/index.vue"),
      meta: {
        title: "对账单管理"
      }
    },
    {
      path: "/finance/invoice",
      name: "FinanceInvoice",
      component: () => import("@/views/business/finance/invoice/index.vue"),
      meta: {
        title: "发票管理"
      }
    },
    {
      path: "/finance/ar-temp",
      name: "FinanceArTemp",
      component: () => import("@/views/business/finance/arTemp/index.vue"),
      meta: {
        title: "发货暂估应收"
      }
    },
    {
      path: "/finance/stock-reservation",
      name: "FinanceStockReservation",
      component: () =>
        import("@/views/business/finance/stockReservation/index.vue"),
      meta: {
        title: "统一预占"
      }
    },
    {
      path: "/finance/sale-allocation",
      name: "FinanceSaleAllocation",
      component: () =>
        import("@/views/business/finance/saleAllocation/index.vue"),
      meta: {
        title: "分配单工作台"
      }
    },
    {
      path: "/finance/sale-picking",
      name: "FinanceSalePicking",
      component: () => import("@/views/business/finance/salePicking/index.vue"),
      meta: {
        title: "拣货单工作台"
      }
    },
    {
      path: "/finance/invoice/detail/:uid",
      name: "FinanceInvoiceDetail",
      component: () => import("@/views/business/finance/invoice/detail.vue"),
      meta: {
        title: "发票详情",
        showLink: false
      }
    },
    {
      path: "/finance/advance",
      name: "FinanceAdvance",
      component: () => import("@/views/business/finance/advance/index.vue"),
      meta: {
        title: "预收预付"
      }
    },
    {
      path: "/finance/transfer",
      name: "FinanceTransfer",
      component: () => import("@/views/business/finance/transfer/index.vue"),
      meta: {
        title: "转账管理"
      }
    },
    {
      path: "/finance/reminder",
      name: "FinanceReminder",
      component: () => import("@/views/business/finance/reminder/index.vue"),
      meta: {
        title: "提醒管理"
      }
    },
    {
      path: "/finance/writeOff",
      name: "FinanceWriteOff",
      component: () => import("@/views/business/finance/writeOff/index.vue"),
      meta: {
        title: "核销单管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
