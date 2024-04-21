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

        isShow: true,
        meta: {
          roles: ["admin"],
          title: "反馈管理",
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
      roles: ["admin", "boss", "common", "officer"],
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
        name: "warehouseManager",
        path: "/business/warehouseManager",
        redirect: null,

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
        name: "order",
        path: "/business/order",
        redirect: null,

        isShow: true,
        meta: {
          roles: ["admin", "boss", "purchaser", "seller"],
          title: "订单管理",
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
        id: 32,
        uid: "36e19140-226e-43e5-abf5-051b4121f8c8",
        parentId: "d3637daf-db89-4ccf-a79e-1dd3437d5ddd",
        name: "assets",
        path: "/analysis/assets",
        redirect: null,

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

        isShow: true,
        meta: {
          roles: ["admin", "boss", "dataAnalyst"],
          title: "数据存档",
          icon: null
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
