const Layout = () => import("@/layout/index.vue");

export default {
  path: "/user",
  name: "User",
  component: Layout,
  redirect: "/user/list",
  meta: {
    icon: "ep:user",
    title: "使用者管理",
    rank: 6
  },
  children: [
    {
      path: "/user/list",
      name: "UserList",
      component: () => import("@/views/user/index.vue"),
      meta: {
        title: "使用者列表",
        icon: "ep:user"
      }
    }
  ]
} satisfies RouteConfigsTable;
