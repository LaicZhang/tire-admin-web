export default [
  {
    id: 1,
    uid: "d3137daf-db89-4ccf-a79e-1dd3437d5ddd",
    parentId: null,
    name: "home",
    path: "/home",
    redirect: null,

    isShow: true,
    meta: {
      roles: ["admin", "boss", "common", "officer"],
      title: "工作台",
      icon: "ep:folder",
      rank: 1
    }
  },
  {
    id: 2,
    uid: "d3237daf-db89-4ccf-a79e-1dd3437d5ddd",
    parentId: null,
    name: "auth",
    path: "/auth",
    redirect: null,

    isShow: true,
    meta: {
      roles: ["admin", "boss", "common", "officer"],
      title: "个人管理",
      icon: "ri:admin-line",
      rank: 10
    },
    children: [
      {
        id: 8,
        uid: "811180d0-8ebc-4b85-a633-760615a70796",
        parentId: "d3237daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "history",
        path: "/auth/history",
        redirect: null,
        isShow: true,
        component: () => import("@/views/auth/history.vue"),
        meta: {
          roles: ["admin", "boss", "common", "officer"],
          title: "个人记录",
          icon: "ri:history-fill"
        }
      },
      {
        id: 7,
        uid: "4787b83e-0c53-4d25-aa6f-06ddb077e750",
        parentId: "d3237daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "profile",
        path: "/auth/profile",
        redirect: null,
        isShow: true,
        component: () => import("@/views/auth/profile.vue"),
        meta: {
          roles: ["admin", "boss", "common", "officer"],
          title: "个人信息",
          icon: "ri:admin-fill"
        }
      }
    ]
  },
  {
    id: 3,
    uid: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
    parentId: null,
    name: "system",
    path: "/system",
    redirect: null,

    isShow: true,
    meta: {
      roles: ["admin"],
      title: "系统管理",
      icon: "ep:cpu",
      rank: 10
    },
    children: [
      {
        id: 9,
        uid: "a8c2777a-2170-403c-a79f-1f155a3f1835",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "user",
        path: "/system/user",
        redirect: null,
        isShow: true,
        component: () => import("@/views/system/user/index.vue"),
        meta: {
          roles: ["admin"],
          title: "用户管理",
          icon: null
        }
      },
      {
        id: 10,
        uid: "484684db-6b44-409d-9102-fa512ed905d8",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "permission",
        path: "/system/permission",
        redirect: null,
        component: () => import("@/views/system/permission/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin"],
          title: "权限管理",
          icon: null
        }
      },
      {
        id: 11,
        uid: "1726e81d-4e0f-45b2-a35e-247012199cd0",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "role",
        path: "/system/role",
        redirect: null,
        isShow: true,
        component: () => import("@/views/system/role/index.vue"),
        meta: {
          roles: ["admin"],
          title: "角色管理",
          icon: null
        }
      },
      {
        id: 12,
        uid: "ca0fce98-7352-4b9b-83b8-8a103a192181",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "companies",
        path: "/system/companies",
        redirect: null,
        component: () => import("@/views/system/companies/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin"],
          title: "公司管理",
          icon: null
        }
      },
      {
        id: 13,
        uid: "42e642e6-8fcf-46f5-a658-e3d56f07ca01",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "log",
        path: "/system/log",
        redirect: null,
        component: () => import("@/views/system/log/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin"],
          title: "日志管理",
          icon: null
        }
      },
      {
        id: 14,
        uid: "de35a616-458c-442a-8791-c4b327aa563a",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "menu",
        path: "/system/menu",
        redirect: null,
        component: () => import("@/views/system/menu/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin"],
          title: "菜单管理",
          icon: null
        }
      },
      {
        id: 15,
        uid: "8a63b7a5-0c0b-43dc-8da8-93f9512fbb51",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "dict",
        path: "/system/dict",
        redirect: null,
        component: () => import("@/views/system/dict/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin"],
          title: "字典管理",
          icon: null
        }
      },
      {
        id: 16,
        uid: "e7163505-0c54-469d-b04e-7a230ee86625",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "static",
        path: "/system/static",
        redirect: null,
        component: () => import("@/views/system/file/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin"],
          title: "文件管理",
          icon: null
        }
      },
      {
        id: 17,
        uid: "7376ca47-8e9a-46dd-bd3b-d01ec20818d7",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "notice",
        path: "/system/notice",
        redirect: null,
        component: () => import("@/views/system/notice/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin"],
          title: "公告管理",
          icon: null
        }
      },
      {
        id: 18,
        uid: "9172028a-4cd7-49a8-9737-1ddf33938540",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "task",
        path: "/system/task",
        redirect: null,
        component: () => import("@/views/system/task/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin"],
          title: "任务管理",
          icon: null
        }
      },
      {
        id: 19,
        uid: "ce0e0f69-b995-43bf-a18f-dc2599bb4694",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "feedback",
        path: "/system/feedback",
        redirect: null,
        component: () => import("@/views/system/feedback/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin"],
          title: "反馈管理",
          icon: null
        }
      },
      {
        id: 56,
        uid: "de0e0f69-b995-43bf-a18f-dc2599bb4695",
        parentId: "d3337daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "updateHistory",
        path: "/system/updateHistory",
        redirect: null,
        component: () => import("@/views/system/updateHistory/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss"],
          title: "更新历史",
          icon: null
        }
      }
    ]
  },
  {
    id: 4,
    uid: "d3437daf-db89-4ccf-a79e-1dd3437d5ddd",
    parentId: null,
    name: "company",
    path: "/company",
    redirect: null,

    isShow: true,
    meta: {
      roles: ["admin", "boss"],
      title: "公司管理",
      icon: "ep:office-building",
      rank: 10
    },
    children: [
      {
        id: 20,
        uid: "7ea26f47-c628-42fd-9ad4-9eff60336b92",
        parentId: "d3437daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "companyInfo",
        path: "/company/info",
        redirect: null,
        component: () => import("@/views/company/info/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss"],
          title: "公司信息",
          icon: null
        }
      },
      {
        id: 21,
        uid: "3dce3577-8d89-4647-aefa-b48dbfb9b603",
        parentId: "d3437daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "department",
        path: "/company/department",
        redirect: null,
        component: () => import("@/views/company/department/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "manager"],
          title: "部门管理",
          icon: null
        }
      },
      {
        id: 22,
        uid: "d420be39-ad72-4dc7-a0ba-ac5677c1c550",
        parentId: "d3437daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "employee",
        path: "/company/employee",
        redirect: null,
        component: () => import("@/views/company/employee/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "manager"],
          title: "员工管理",
          icon: null
        }
      },
      {
        id: 23,
        uid: "f233ec36-4507-418d-8883-1263325f82df",
        parentId: "d3437daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "salary",
        path: "/company/salary",
        redirect: null,
        component: () => import("@/views/company/salary/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "manager"],
          title: "工资管理",
          icon: null
        }
      },
      {
        id: 24,
        uid: "a3159aa9-1bbe-4336-8341-3b96e9d1cf51",
        parentId: "d3437daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "position",
        path: "/company/position",
        redirect: null,
        component: () => import("@/views/company/position/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss"],
          title: "职位管理",
          icon: null
        }
      },
      {
        id: 25,
        uid: "610f059f-851a-4759-8b96-dcc6b7e286cf",
        parentId: "d3437daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "repo",
        path: "/company/repo",
        redirect: null,
        component: () =>
          import("@/views/business/warehouseManagement/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "warehouseManager"],
          title: "仓库管理",
          icon: null
        }
      },
      {
        id: 26,
        uid: "d2002795-e50f-40ed-a1bd-f39857c773f6",
        parentId: "d3437daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "chat",
        path: "/company/chat",
        redirect: null,
        component: () => import("@/views/company/chat/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss"],
          title: "AI顾问",
          icon: null
        }
      }
    ]
  },
  {
    id: 5,
    uid: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
    parentId: null,
    name: "business",
    path: "/business",
    redirect: null,
    isShow: true,
    meta: {
      roles: ["admin", "boss", "officer"],
      title: "业务管理",
      icon: "ep:management",
      rank: 10
    },
    children: [
      {
        id: 27,
        uid: "7c8e1570-082c-411d-92bb-f745b91ca45b",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "tire",
        path: "/business/tire",
        redirect: null,
        component: () => import("@/views/business/tire/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "warehouseManager"],
          title: "轮胎管理",
          icon: null
        }
      },
      {
        id: 28,
        uid: "dd712740-a20f-4618-8a4a-b6c94dc4a93a",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "warehouseManagement",
        path: "/business/warehouseManagement",
        redirect: null,
        component: () =>
          import("@/views/business/warehouseManagement/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "warehouseManager", "purchaser", "seller"],
          title: "库存管理",
          icon: null
        }
      },
      {
        id: 29,
        uid: "59633b54-2d56-4ea4-875d-6b30323a1d92",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "provider",
        path: "/business/provider",
        redirect: null,
        component: () => import("@/views/business/provider/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "purchaser"],
          title: "供应商管理",
          icon: null
        }
      },
      {
        id: 30,
        uid: "4efa5408-62bb-4181-b9c6-b10a1a65725c",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "customer",
        path: "/business/customer",
        redirect: null,
        component: () => import("@/views/business/customer/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "seller"],
          title: "客户管理",
          icon: null
        }
      },
      {
        id: 31,
        uid: "5cd4bf61-a0bf-449f-b4d4-cf8254745b27",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "tireNumber",
        path: "/business/tireNumber",
        redirect: null,
        component: () => import("@/views/business/tireNumber/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "purchaser", "seller"],
          title: "胎号管理",
          icon: null
        }
      },
      {
        id: 32,
        uid: "6cd4bf61-a0bf-449f-b4d4-cf8254745b28",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "order",
        path: "/business/order",
        redirect: null,
        component: () => import("@/views/business/order/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "purchaser", "seller"],
          title: "订单管理",
          icon: null
        }
      },
      {
        id: 41,
        uid: "7cd4bf61-a0bf-449f-b4d4-cf8254745b29",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "stockTaking",
        path: "/business/stockTaking",
        redirect: null,
        component: () => import("@/views/business/stockTaking/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "warehouseManager"],
          title: "库存盘点",
          icon: null
        }
      },
      {
        id: 42,
        uid: "8cd4bf61-a0bf-449f-b4d4-cf8254745b30",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "batch",
        path: "/business/batch",
        redirect: null,
        component: () => import("@/views/business/batch/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "warehouseManager"],
          title: "批次管理",
          icon: null
        }
      },
      {
        id: 43,
        uid: "9cd4bf61-a0bf-449f-b4d4-cf8254745b31",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "purchasePlan",
        path: "/business/purchasePlan",
        component: () => import("@/views/business/purchase/plan/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "purchaser"],
          title: "采购计划",
          icon: null
        }
      },
      {
        id: 44,
        uid: "acd4bf61-a0bf-449f-b4d4-cf8254745b32",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "purchaseInquiry",
        path: "/business/purchaseInquiry",
        component: () => import("@/views/business/purchase/inquiry/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "purchaser"],
          title: "采购询价",
          icon: null
        }
      },
      {
        id: 45,
        uid: "bcd4bf61-a0bf-449f-b4d4-cf8254745b33",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "salesQuotation",
        path: "/business/salesQuotation",
        component: () => import("@/views/business/sales/quotation/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "seller"],
          title: "销售报价",
          icon: null
        }
      },
      {
        id: 46,
        uid: "ccd4bf61-a0bf-449f-b4d4-cf8254745b34",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "priceList",
        path: "/business/priceList",
        component: () => import("@/views/business/price/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "seller"],
          title: "价目表",
          icon: null
        }
      },
      {
        id: 47,
        uid: "dcd4bf61-a0bf-449f-b4d4-cf8254745b35",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "stockLocation",
        path: "/business/stockLocation",
        component: () => import("@/views/business/stock/location/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "warehouseManager"],
          title: "库区货位",
          icon: null
        }
      },
      {
        id: 48,
        uid: "ecd4bf61-a0bf-449f-b4d4-cf8254745b36",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "unit",
        path: "/business/unit",
        component: () => import("@/views/business/unit/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss"],
          title: "计量单位",
          icon: null
        }
      },
      {
        id: 49,
        uid: "fcd4bf61-a0bf-449f-b4d4-cf8254745b37",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "financeItem",
        path: "/business/financeItem",
        component: () => import("@/views/business/financeItem/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "accountant"],
          title: "收支项目",
          icon: null
        }
      },
      {
        id: 50,
        uid: "0dd4bf61-a0bf-449f-b4d4-cf8254745b38",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "stockAlert",
        path: "/business/stockAlert",
        component: () => import("@/views/business/stockAlert/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "warehouseManager"],
          title: "库存预警",
          icon: null
        }
      },
      {
        id: 51,
        uid: "1dd4bf61-a0bf-449f-b4d4-cf8254745b39",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "expiryAlert",
        path: "/business/expiryAlert",
        component: () => import("@/views/business/expiryAlert/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "warehouseManager"],
          title: "效期预警",
          icon: null
        }
      },
      {
        id: 54,
        uid: "2dd4bf61-a0bf-449f-b4d4-cf8254745b40",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "audit",
        path: "/business/audit",
        component: () => import("@/views/business/audit/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "auditor"],
          title: "审核中心",
          icon: null
        }
      },
      {
        id: 57,
        uid: "3dd4bf61-a0bf-449f-b4d4-cf8254745b41",
        parentId: "d3537daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "serialNumber",
        path: "/business/serialNumber",
        component: () =>
          import("@/views/business/stock/serialNumber/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "warehouseManager"],
          title: "序列号管理",
          icon: null
        }
      }
    ]
  },
  {
    id: 6,
    uid: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
    parentId: null,
    name: "analysis",
    path: "/analysis",
    redirect: null,
    isShow: true,
    meta: {
      roles: ["admin", "boss"],
      title: "统计管理",
      icon: "ep:data-analysis",
      rank: 10
    },
    children: [
      {
        id: 36,
        uid: "36e19140-226e-43e5-abf5-051b4121f8c8",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "assets",
        path: "/analysis/assets",
        redirect: null,
        component: () => import("@/views/analysis/assets/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "资产数据",
          icon: null
        }
      },
      {
        id: 33,
        uid: "a731e443-88b3-4d2f-9ff2-881e50150536",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "sales",
        path: "/analysis/sales",
        redirect: null,
        component: () => import("@/views/analysis/sales/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "销售数据",
          icon: null
        }
      },
      {
        id: 34,
        uid: "24c31eb9-6044-4bd9-bbe6-ae1ec1a68cd5",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "dataSettings",
        path: "/analysis/dataSettings",
        redirect: null,
        component: () => import("@/views/analysis/dataSettings/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "数据设置",
          icon: null
        }
      },
      {
        id: 35,
        uid: "9286aeb4-cc70-4b36-b283-f7a1c7c8d28c",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "archiving",
        path: "/analysis/archiving",
        redirect: null,
        component: () => import("@/views/analysis/archiving/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "数据存档",
          icon: null
        }
      },
      {
        id: 37,
        uid: "12345678-cc70-4b36-b283-f7a1c7c8d28c",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "purchaseAnalysis",
        path: "/analysis/purchase",
        redirect: null,
        component: () => import("@/views/analysis/purchase/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "采购分析",
          icon: null
        }
      },
      {
        id: 38,
        uid: "23456789-cc70-4b36-b283-f7a1c7c8d28c",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "inventoryAnalysis",
        path: "/analysis/inventory",
        redirect: null,
        component: () => import("@/views/analysis/inventory/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "库存分析",
          icon: null
        }
      },
      {
        id: 39,
        uid: "34567890-cc70-4b36-b283-f7a1c7c8d28c",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "rankingAnalysis",
        path: "/analysis/ranking",
        redirect: null,
        component: () => import("@/views/analysis/ranking/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "排行榜",
          icon: null
        }
      },
      {
        id: 40,
        uid: "45678901-cc70-4b36-b283-f7a1c7c8d28c",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "agingAnalysis",
        path: "/analysis/aging",
        redirect: null,
        component: () => import("@/views/analysis/aging/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "账龄分析",
          icon: null
        }
      },
      {
        id: 52,
        uid: "56789012-cc70-4b36-b283-f7a1c7c8d28c",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "profitAnalysis",
        path: "/analysis/profit",
        redirect: null,
        component: () => import("@/views/analysis/profit/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "利润核算",
          icon: null
        }
      },
      {
        id: 53,
        uid: "67890123-cc70-4b36-b283-f7a1c7c8d28c",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "financeAnalysis",
        path: "/analysis/finance",
        redirect: null,
        component: () => import("@/views/analysis/finance/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "资金分析",
          icon: null
        }
      },
      {
        id: 55,
        uid: "78901234-cc70-4b36-b283-f7a1c7c8d28c",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "comprehensiveAnalysis",
        path: "/analysis/comprehensive",
        redirect: null,
        component: () => import("@/views/analysis/comprehensive/index.vue"),
        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "综合分析",
          icon: null
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
