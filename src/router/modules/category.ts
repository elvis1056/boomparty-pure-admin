const Layout = () => import("@/layout/index.vue");

export default {
  path: "/category",
  name: "Category",
  component: Layout,
  redirect: "/category/list",
  meta: {
    icon: "ep/menu",
    title: "分類管理",
    rank: 2
  },
  children: [
    {
      path: "/category/list",
      name: "CategoryList",
      component: () => import("@/views/category/index.vue"),
      meta: {
        title: "分類列表"
      }
    },
    {
      path: "/category/create",
      name: "CategoryCreate",
      component: () => import("@/views/category/create.vue"),
      meta: {
        title: "新增分類",
        showLink: false
      }
    },
    {
      path: "/category/edit/:id",
      name: "CategoryEdit",
      component: () => import("@/views/category/edit.vue"),
      meta: {
        title: "編輯分類",
        showLink: false
      }
    }
  ]
} satisfies RouteConfigsTable;
