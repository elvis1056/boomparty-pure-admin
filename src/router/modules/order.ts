const Layout = () => import("@/layout/index.vue");

export default {
  path: "/order",
  name: "Order",
  component: Layout,
  redirect: "/order/list",
  meta: {
    icon: "ep/tickets",
    title: "訂單管理",
    rank: 3
  },
  children: [
    {
      path: "/order/list",
      name: "OrderList",
      component: () => import("@/views/order/index.vue"),
      meta: {
        title: "訂單列表",
        icon: "ep/tickets"
      }
    }
  ]
} satisfies RouteConfigsTable;
