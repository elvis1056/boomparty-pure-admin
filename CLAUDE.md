# boomparty-pure-admin 專案規範

Vue 3 + Vite + Element Plus 後台管理介面，串接 boomparty Java Spring Boot 後端。

---

## 資料夾結構

| 資料夾                | 用途                               | 注意事項                  |
| --------------------- | ---------------------------------- | ------------------------- |
| `src/api/`            | 所有 API 呼叫函式（按模組拆分）    | 只負責呼叫，不含業務邏輯  |
| `src/router/modules/` | 路由模組（自動掃描，無需手動匯入） | 每個業務一個檔案          |
| `src/views/`          | 頁面元件，按功能分資料夾           | 對應路由結構              |
| `src/components/`     | 全域可重用元件                     | 純 UI，無業務邏輯         |
| `src/store/modules/`  | Pinia 狀態管理                     | 全局狀態（如 auth、user） |
| `src/utils/`          | 工具函式（http、auth、format 等）  | 純函式，不含 UI           |
| `src/hooks/`          | 自訂 Composables                   | 命名以 `use` 開頭         |
| `src/types/`          | TypeScript 型別定義                | 集中管理                  |

### 路由模組規範

- 檔案放在 `src/router/modules/` 會自動被掃描，**不需要**手動 import 進 router/index.ts
- 每個業務模組獨立一個檔案（product.ts、order.ts、user.ts）
- `meta.rank` 決定側欄排序，數字越小越前面

---

## 環境設定

| 環境 | VITE_API_BASE_URL          | API 路由方式                         |
| ---- | -------------------------- | ------------------------------------ |
| 開發 | `""`（空字串）             | Vite proxy `/api` → `localhost:8080` |
| 生產 | `https://api.boomparty.tw` | 直接打 NAS API                       |

---

## API 模組規範

每個業務模組對應一個 API 檔案，放在 `src/api/`：

```typescript
// src/api/product.ts
import { http } from "@/utils/http";

export const getProducts = () =>
  http.request<Product[]>("get", "/api/products");
export const getProduct = (id: number) =>
  http.request<Product>("get", `/api/products/${id}`);
export const createProduct = (data: ProductForm) =>
  http.request<Product>("post", "/api/products", { data });
export const updateProduct = (id: number, data: ProductForm) =>
  http.request<Product>("put", `/api/products/${id}`, { data });
export const deleteProduct = (id: number) =>
  http.request<void>("delete", `/api/products/${id}`);
```

---

## Import 順序

```typescript
// 1. Vue 核心
import { ref, onMounted } from "vue";

// 2. 第三方套件
import { ElMessage, ElMessageBox } from "element-plus";

// 3. 絕對路徑引入（@/）
import { getProducts, deleteProduct } from "@/api/product";

// 4. 相對路徑引入
import ProductForm from "./ProductForm.vue";
```

---

## 規則參考

詳細程式碼規範見 `.claude/rules/`：

- `composition-api.md` — Vue 3 Composition API、命名規範、TypeScript、樣式
- `nas-troubleshooting.md` — NAS 部署除錯、PostgreSQL 使用者管理

Commit 格式見 `~/.claude/rules/commit.md`。
