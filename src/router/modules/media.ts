const Layout = () => import("@/layout/index.vue");

export default {
  path: "/media",
  name: "Media",
  component: Layout,
  redirect: "/media/list",
  meta: {
    icon: "ep/picture",
    title: "媒體庫",
    rank: 5
  },
  children: [
    {
      path: "/media/list",
      name: "MediaList",
      component: () => import("@/views/media/index.vue"),
      meta: {
        title: "圖片管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
