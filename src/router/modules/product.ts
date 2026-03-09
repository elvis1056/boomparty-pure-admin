const Layout = () => import("@/layout/index.vue");

export default {
  path: "/product",
  name: "Product",
  component: Layout,
  redirect: "/product/list",
  meta: {
    icon: "ep/goods",
    title: "商品管理",
    rank: 1
  },
  children: [
    {
      path: "/product/list",
      name: "ProductList",
      component: () => import("@/views/product/index.vue"),
      meta: {
        title: "商品列表"
      }
    }
  ]
} satisfies RouteConfigsTable;
