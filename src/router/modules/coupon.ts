const Layout = () => import("@/layout/index.vue");

export default {
  path: "/coupon",
  name: "Coupon",
  component: Layout,
  redirect: "/coupon/list",
  meta: {
    title: "優惠碼",
    icon: "ri/coupon-3-line",
    rank: 5
  },
  children: [
    {
      path: "/coupon/list",
      name: "CouponList",
      component: () => import("@/views/coupon/index.vue"),
      meta: {
        title: "優惠碼管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
