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
