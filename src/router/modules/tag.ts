const Layout = () => import("@/layout/index.vue");

export default {
  path: "/tag",
  name: "Tag",
  component: Layout,
  redirect: "/tag/list",
  meta: {
    icon: "ep/price-tag",
    title: "標籤管理",
    rank: 6
  },
  children: [
    {
      path: "/tag/list",
      name: "TagList",
      component: () => import("@/views/tag/index.vue"),
      meta: {
        title: "標籤列表"
      }
    }
  ]
} satisfies RouteConfigsTable;
