export default {
  path: "/result",
  redirect: "/result/success",
  meta: {
    icon: "ri:checkbox-circle-line",
    showLink: false,
    title: "结果页面"
  },
  children: [
    {
      path: "/result/success",
      name: "Success",
      component: () => import("@/views/result/success.vue"),
      meta: {
        title: "成功"
      }
    },
    {
      path: "/result/fail",
      name: "Fail",
      component: () => import("@/views/result/fail.vue"),
      meta: {
        title: "失败"
      }
    }
  ]
} satisfies RouteConfigsTable;
