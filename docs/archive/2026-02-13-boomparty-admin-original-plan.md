# boomparty 後台系統建置計畫

## 📊 專案概述

- **專案名稱**: boomparty-admin
- **技術棧**: Vue3 + Vite + TypeScript + Ant Design Vue
- **用途**: 電商後台管理系統（含數據分析）
- **部署方式**: 前後台分離部署

---

## 🎯 學習目標

1. 掌握 Vue3 Composition API
2. 學習 TypeScript 在 Vue 中的應用
3. 掌握 Pinia 狀態管理
4. 學習數據可視化（ECharts）
5. 掌握企業級後台系統架構

---

## 🛠️ 技術棧詳細規劃

### 核心技術

```yaml
框架: Vue 3.4+
構建工具: Vite 5+
語言: TypeScript 5+
包管理器: pnpm (推薦) 或 npm
Node 版本: 18+ 或 20+
```

### 主要依賴

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "ant-design-vue": "^4.0.0",
    "axios": "^1.6.0",
    "echarts": "^5.4.0",
    "vue-echarts": "^6.6.0",
    "dayjs": "^1.11.0",
    "lodash-es": "^4.17.0",
    "xlsx": "^0.18.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 📁 專案目錄結構

```
boomparty-admin/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                    # API 請求
│   │   ├── auth.ts            # 登入相關
│   │   ├── dashboard.ts       # 儀表板數據
│   │   ├── user.ts            # 用戶管理
│   │   ├── product.ts         # 商品管理
│   │   ├── order.ts           # 訂單管理
│   │   └── analytics.ts       # 數據分析
│   ├── assets/                # 靜態資源
│   │   ├── images/
│   │   └── styles/
│   │       ├── global.css
│   │       └── variables.css
│   ├── components/            # 共用組件
│   │   ├── Charts/           # 圖表組件
│   │   │   ├── LineChart.vue
│   │   │   ├── BarChart.vue
│   │   │   └── PieChart.vue
│   │   ├── Tables/           # 表格組件
│   │   │   └── DataTable.vue
│   │   └── Common/           # 通用組件
│   │       ├── PageHeader.vue
│   │       └── StatisticCard.vue
│   ├── layouts/              # 佈局組件
│   │   ├── BasicLayout.vue   # 基礎佈局（含側邊欄）
│   │   └── BlankLayout.vue   # 空白佈局（登入頁）
│   ├── router/               # 路由配置
│   │   ├── index.ts
│   │   ├── routes.ts
│   │   └── guards.ts         # 路由守衛
│   ├── stores/               # Pinia 狀態管理
│   │   ├── user.ts           # 用戶狀態
│   │   ├── app.ts            # 應用狀態
│   │   └── permission.ts     # 權限狀態
│   ├── types/                # TypeScript 型別定義
│   │   ├── api.d.ts
│   │   ├── user.d.ts
│   │   ├── product.d.ts
│   │   └── order.d.ts
│   ├── utils/                # 工具函式
│   │   ├── request.ts        # Axios 封裝
│   │   ├── auth.ts           # Token 處理
│   │   ├── permission.ts     # 權限判斷
│   │   └── export.ts         # Excel 導出
│   ├── views/                # 頁面組件
│   │   ├── login/
│   │   │   └── index.vue
│   │   ├── dashboard/        # 儀表板
│   │   │   └── index.vue
│   │   ├── analytics/        # 數據分析
│   │   │   ├── sales.vue     # 銷售分析
│   │   │   ├── user.vue      # 用戶分析
│   │   │   └── product.vue   # 商品分析
│   │   ├── user/             # 用戶管理
│   │   │   ├── list.vue
│   │   │   └── detail.vue
│   │   ├── product/          # 商品管理
│   │   │   ├── list.vue
│   │   │   ├── create.vue
│   │   │   └── edit.vue
│   │   └── order/            # 訂單管理
│   │       ├── list.vue
│   │       └── detail.vue
│   ├── App.vue
│   ├── main.ts
│   └── vite-env.d.ts
├── .env.development          # 開發環境變數
├── .env.production           # 生產環境變數
├── .eslintrc.js
├── .prettierrc
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 實作階段規劃

### Phase 1: 專案初始化（1-2 天）

#### 步驟 1: 選擇起手方式

**選項 A: 使用 vue-vben-admin 模板（推薦）**

```bash
cd /Users/elvis1056/Desktop/nasweb
pnpm create vben boomparty-admin
cd boomparty-admin
pnpm install
pnpm dev
```

**選項 B: 從零開始（學習完整流程）**

```bash
cd /Users/elvis1056/Desktop/nasweb
pnpm create vite boomparty-admin --template vue-ts
cd boomparty-admin
pnpm install
pnpm add vue-router pinia ant-design-vue axios echarts vue-echarts
pnpm add -D @types/node
pnpm dev
```

#### 步驟 2: 環境變數配置

創建 `.env.development`:

```env
# API 基礎路徑
VITE_API_BASE_URL=http://localhost:8080
VITE_API_PREFIX=/api/admin

# 應用配置
VITE_APP_TITLE=boomparty 後台管理系統
VITE_APP_SHORT_NAME=boomparty-admin
```

創建 `.env.production`:

```env
VITE_API_BASE_URL=https://api.boomparty.com
VITE_API_PREFIX=/api/admin
VITE_APP_TITLE=boomparty 後台管理系統
```

#### 步驟 3: Vite 配置

`vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  server: {
    port: 3001,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  }
});
```

---

### Phase 2: 基礎架構搭建（3-5 天）

#### 2.1 Axios 封裝

`src/utils/request.ts`:

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { message } from "ant-design-vue";

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000
});

// 請求攔截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 響應攔截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data, code, msg } = response.data;
    if (code === 200) {
      return data;
    } else {
      message.error(msg || "Request failed");
      return Promise.reject(new Error(msg));
    }
  },
  error => {
    if (error.response?.status === 401) {
      // Token 過期，跳轉到登入頁
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    message.error(error.message || "Network error");
    return Promise.reject(error);
  }
);

export default service;
```

#### 2.2 路由配置

`src/router/index.ts`:

```typescript
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import BasicLayout from "@/layouts/BasicLayout.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: { title: "登入", requiresAuth: false }
  },
  {
    path: "/",
    component: BasicLayout,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        meta: { title: "儀表板", icon: "dashboard" }
      },
      {
        path: "analytics",
        name: "Analytics",
        meta: { title: "數據分析", icon: "bar-chart" },
        children: [
          {
            path: "sales",
            name: "SalesAnalytics",
            component: () => import("@/views/analytics/sales.vue"),
            meta: { title: "銷售分析" }
          },
          {
            path: "user",
            name: "UserAnalytics",
            component: () => import("@/views/analytics/user.vue"),
            meta: { title: "用戶分析" }
          }
        ]
      },
      {
        path: "user",
        name: "UserManagement",
        component: () => import("@/views/user/list.vue"),
        meta: { title: "用戶管理", icon: "user" }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守衛
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");

  if (to.meta.requiresAuth !== false && !token) {
    next("/login");
  } else {
    next();
  }
});

export default router;
```

#### 2.3 Pinia Store

`src/stores/user.ts`:

```typescript
import { defineStore } from "pinia";
import { login as loginApi, getUserInfo } from "@/api/auth";

interface UserState {
  token: string;
  username: string;
  email: string;
  role: string;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    token: localStorage.getItem("token") || "",
    username: "",
    email: "",
    role: ""
  }),

  actions: {
    async login(username: string, password: string) {
      const data = await loginApi({ username, password });
      this.token = data.token;
      localStorage.setItem("token", data.token);
      await this.getInfo();
    },

    async getInfo() {
      const data = await getUserInfo();
      this.username = data.username;
      this.email = data.email;
      this.role = data.role;
    },

    logout() {
      this.token = "";
      this.username = "";
      this.email = "";
      this.role = "";
      localStorage.removeItem("token");
    }
  }
});
```

---

### Phase 3: 數據分析功能實作（5-7 天）

#### 3.1 ECharts 圖表封裝

`src/components/Charts/LineChart.vue`:

```vue
<template>
  <v-chart :option="option" :style="{ height: height }" autoresize />
</template>

<script setup lang="ts">
import { computed } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from "echarts/components";

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent
]);

interface Props {
  data: any[];
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: "400px"
});

const option = computed(() => ({
  tooltip: { trigger: "axis" },
  legend: { data: ["銷售額"] },
  grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
  xAxis: { type: "category", data: props.data.map(item => item.date) },
  yAxis: { type: "value" },
  series: [
    {
      name: "銷售額",
      type: "line",
      data: props.data.map(item => item.value)
    }
  ]
}));
</script>
```

#### 3.2 儀表板頁面

`src/views/dashboard/index.vue`:

```vue
<template>
  <div class="dashboard">
    <a-row :gutter="16">
      <a-col :span="6">
        <a-statistic title="總用戶數" :value="stats.totalUsers" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="今日訂單" :value="stats.todayOrders" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="總銷售額" :value="stats.totalSales" prefix="$" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="月增長率" :value="stats.growthRate" suffix="%" />
      </a-col>
    </a-row>

    <a-card title="銷售趨勢" style="margin-top: 20px;">
      <LineChart :data="salesData" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import LineChart from "@/components/Charts/LineChart.vue";
import { getDashboardStats, getSalesTrend } from "@/api/dashboard";

const stats = ref({
  totalUsers: 0,
  todayOrders: 0,
  totalSales: 0,
  growthRate: 0
});

const salesData = ref([]);

onMounted(async () => {
  stats.value = await getDashboardStats();
  salesData.value = await getSalesTrend();
});
</script>
```

---

### Phase 4: CRUD 功能實作（3-5 天）

#### 4.1 用戶管理列表

`src/views/user/list.vue`:

```vue
<template>
  <div class="user-list">
    <a-table :columns="columns" :data-source="users" :loading="loading">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button type="link" @click="editUser(record)">編輯</a-button>
          <a-button type="link" danger @click="deleteUser(record)"
            >刪除</a-button
          >
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getUserList, deleteUser as deleteUserApi } from "@/api/user";

const columns = [
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "用戶名", dataIndex: "username", key: "username" },
  { title: "Email", dataIndex: "email", key: "email" },
  { title: "角色", dataIndex: "role", key: "role" },
  { title: "操作", key: "action" }
];

const users = ref([]);
const loading = ref(false);

const loadUsers = async () => {
  loading.value = true;
  users.value = await getUserList();
  loading.value = false;
};

const editUser = (user: any) => {
  // 跳轉到編輯頁面
};

const deleteUser = async (user: any) => {
  await deleteUserApi(user.id);
  loadUsers();
};

onMounted(() => {
  loadUsers();
});
</script>
```

---

## 🔐 後端 API 需求

### Spring Boot 需要新增的 Admin 端點

#### 權限管理

```java
// SecurityConfig.java 更新
.authorizeHttpRequests(auth -> {
    auth.requestMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().authenticated();
})
```

#### Admin Controller 範例

`AdminDashboardController.java`:

```java
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", 1250);
        stats.put("todayOrders", 45);
        stats.put("totalSales", 125000);
        stats.put("growthRate", 12.5);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/sales-trend")
    public ResponseEntity<?> getSalesTrend() {
        // 返回過去 30 天的銷售數據
        List<Map<String, Object>> data = new ArrayList<>();
        // ... 實作邏輯
        return ResponseEntity.ok(data);
    }
}
```

---

## 🚀 部署方案

### 前端部署（boomparty-admin）

**選項 1: Vercel（推薦）**

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
cd boomparty-admin
vercel
```

**選項 2: Netlify**

```bash
# 構建
pnpm build

# 部署到 Netlify
# 將 dist/ 目錄拖到 Netlify 網站
```

**選項 3: 自己的伺服器（Nginx）**

```bash
# 構建
pnpm build

# 複製到伺服器
scp -r dist/ user@server:/var/www/boomparty-admin

# Nginx 配置
server {
    listen 80;
    server_name admin.boomparty.com;

    location / {
        root /var/www/boomparty-admin;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
    }
}
```

---

## 📚 學習資源

### Vue3 官方文檔

- [Vue3 中文文檔](https://cn.vuejs.org/)
- [Vue Router](https://router.vuejs.org/zh/)
- [Pinia](https://pinia.vuejs.org/zh/)

### UI 框架

- [Ant Design Vue](https://antdv.com/docs/vue/introduce-cn)
- [Element Plus](https://element-plus.org/zh-CN/)

### 圖表庫

- [Apache ECharts](https://echarts.apache.org/zh/index.html)
- [vue-echarts](https://github.com/ecomfe/vue-echarts)

### 推薦教程

- [Vue3 + TypeScript 全家桶實戰](https://juejin.cn/post/7118294114734440455)
- [從零搭建 Vue3 後台管理系統](https://juejin.cn/post/7089377403717287972)

### 參考專案

- [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin)
- [Soybean Admin](https://github.com/soybeanjs/soybean-admin)
- [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin) (Vue2，但可參考架構)

---

## ✅ 開發檢查清單

### 基礎設置

- [ ] 專案初始化（Vite + Vue3 + TypeScript）
- [ ] 安裝依賴（Vue Router, Pinia, Ant Design Vue, ECharts）
- [ ] 配置 Vite（alias, proxy）
- [ ] 配置環境變數（.env.development, .env.production）
- [ ] 配置 ESLint + Prettier

### 架構搭建

- [ ] Axios 封裝（請求/響應攔截器）
- [ ] 路由配置（基礎路由、路由守衛）
- [ ] Pinia Store（user, app, permission）
- [ ] Layout 組件（BasicLayout, BlankLayout）
- [ ] 登入功能（JWT 驗證）

### 數據分析功能

- [ ] 儀表板頁面（統計卡片 + 圖表）
- [ ] 銷售分析頁面（折線圖、柱狀圖）
- [ ] 用戶分析頁面（餅圖、用戶增長）
- [ ] 商品分析頁面（Top 商品、庫存預警）

### CRUD 功能

- [ ] 用戶管理（列表、新增、編輯、刪除）
- [ ] 商品管理（列表、新增、編輯、刪除、圖片上傳）
- [ ] 訂單管理（列表、詳情、狀態更新）
- [ ] Excel 導出功能

### 權限管理

- [ ] 角色權限配置
- [ ] 路由權限控制
- [ ] 按鈕權限控制

### 部署

- [ ] 打包優化（Code Splitting, Tree Shaking）
- [ ] 部署到 Vercel/Netlify
- [ ] 配置 HTTPS
- [ ] 配置 CDN（如需要）

---

## 🎯 下一步行動

### 立即開始（今天）

**如果選擇 vue-vben-admin 模板：**

```bash
cd /Users/elvis1056/Desktop/nasweb
pnpm create vben boomparty-admin
cd boomparty-admin
pnpm install
pnpm dev
```

**如果從零開始：**

```bash
cd /Users/elvis1056/Desktop/nasweb
pnpm create vite boomparty-admin --template vue-ts
cd boomparty-admin
pnpm install
pnpm add vue-router pinia ant-design-vue axios echarts vue-echarts dayjs lodash-es
pnpm add -D @types/node
```

### 本週目標

1. ✅ 完成專案初始化
2. ✅ 實作登入功能
3. ✅ 搭建基礎佈局
4. ✅ 實作儀表板頁面（包含至少 1 個圖表）

---

**文件建立時間：** 2026-02-13
**適用專案：** boomparty 後台管理系統
**技術棧：** Vue3 + Vite + TypeScript + Ant Design Vue + ECharts
