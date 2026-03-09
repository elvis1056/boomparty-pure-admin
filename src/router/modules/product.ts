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
    },
    {
      path: "/product/create",
      name: "ProductCreate",
      component: () => import("@/views/product/create.vue"),
      meta: {
        title: "新增商品",
        showLink: false
      }
    },
    {
      path: "/product/edit/:id",
      name: "ProductEdit",
      component: () => import("@/views/product/edit.vue"),
      meta: {
        title: "編輯商品",
        showLink: false
      }
    }
  ]
} satisfies RouteConfigsTable;
