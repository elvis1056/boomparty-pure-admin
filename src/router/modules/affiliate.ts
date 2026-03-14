export default {
  path: "/affiliate",
  meta: {
    title: "外部行銷專區",
    icon: "ri/user-star-line",
    rank: 4
  },
  children: [
    {
      path: "/affiliate/list",
      name: "AffiliateList",
      component: () => import("@/views/affiliate/index.vue"),
      meta: {
        title: "外部分享管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
