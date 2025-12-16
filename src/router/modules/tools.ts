export default {
  path: "/tools",
  redirect: "/tools/verify",
  meta: {
    icon: "ri:tools-line",
    title: "工具服务",
    rank: 100
  },
  children: [
    {
      path: "/tools/verify",
      name: "VerifyTool",
      component: () => import("@/views/tools/verify/index.vue"),
      meta: {
        title: "验证服务测试"
      }
    },
    {
      path: "/tools/io",
      name: "IoTool",
      component: () => import("@/views/tools/io/index.vue"),
      meta: {
        title: "数据导入导出"
      }
    }
  ]
} as RouteConfigsTable;
