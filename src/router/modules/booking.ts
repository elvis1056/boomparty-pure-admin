const Layout = () => import("@/layout/index.vue");

export default {
  path: "/booking",
  name: "Booking",
  component: Layout,
  redirect: "/booking/list",
  meta: {
    icon: "ep/calendar",
    title: "預約管理",
    rank: 3
  },
  children: [
    {
      path: "/booking/list",
      name: "BookingList",
      component: () => import("@/views/booking/index.vue"),
      meta: {
        title: "預約列表",
        icon: "ep/calendar"
      }
    }
  ]
} satisfies RouteConfigsTable;
