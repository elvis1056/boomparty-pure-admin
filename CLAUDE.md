# boomparty-pure-admin 專案規範

Vue 3 + Vite + Element Plus 後台管理介面，串接 boomparty Java Spring Boot 後端。

---

## 🚨 CRITICAL RULES - READ FIRST

### ❌ ABSOLUTE PROHIBITIONS

- **NEVER** create new files in root directory → use proper module structure
- **NEVER** create documentation files (.md) unless explicitly requested by user
- **NEVER** use git commands with -i flag (interactive mode not supported)
- **NEVER** use `find`, `grep`, `cat`, `head`, `tail`, `ls` commands → use Read, Grep, Glob tools instead
- **NEVER** create duplicate files (manager_v2.ts, enhanced_xyz.ts) → ALWAYS extend existing files
- **NEVER** hardcode values that should be configurable → use env vars or config files
- **NEVER** use naming like enhanced\*, improved\*, new\*, v2\* → extend original files instead
- **NEVER** add Co-Authored-By to commit messages

### 📝 MANDATORY REQUIREMENTS

- **READ FILES FIRST** before editing - Edit/Write tools will fail if you didn't read the file first
- **SEARCH BEFORE CREATING** - Use Grep/Glob to find existing code before creating new files
- **PLAN FIRST, ASK BEFORE ACTING** - 做事情之前都先計畫然後問使用者再動作

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
| `src/types/`          | TypeScript 型別定義                | 集中管理                  |

### 路由模組規範

- 檔案放在 `src/router/modules/` 會自動被掃描，**不需要**手動 import 進 router/index.ts
- 每個業務模組獨立一個檔案（product.ts、order.ts、user.ts）
- `meta.rank` 決定側欄排序，數字越小越前面

---

## 程式碼規範

### Vue 3 Composition API

1. **使用 `<script setup>` 語法**

   ```vue
   <!-- ✅ 正確 -->
   <script setup lang="ts">
   import { ref, onMounted } from "vue";
   </script>

   <!-- ❌ 錯誤：不使用 Options API -->
   <script>
   export default { data() {} };
   </script>
   ```

2. **響應式資料**

   ```typescript
   // ✅ 基本值用 ref，物件/陣列用 reactive
   const loading = ref(false);
   const list = ref<Product[]>([]);
   const form = reactive({ name: "", price: 0 });
   ```

3. **❌ 函式命名：禁止使用 handle 前綴**

   ```typescript
   // ❌ 錯誤：看不出在做什麼
   const handleSubmit = () => {};
   const handleDelete = id => {};

   // ✅ 正確：直接用動作命名
   const submitForm = () => {};
   const deleteProduct = id => {};
   const fetchProducts = async () => {};
   ```

4. **不使用 nullish coalescing（??），用三元運算子**

   ```typescript
   // ❌ 錯誤
   const value = data ?? defaultValue;

   // ✅ 正確
   const value = data !== null && data !== undefined ? data : defaultValue;
   ```

### API 模組規範

每個業務模組對應一個 API 檔案，放在 `src/api/`：

```typescript
// src/api/product.ts
import { http } from "@/utils/http";

export type Product = {
  id: number;
  name: string;
  price: number;
  // ...
};

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

### 樣式規範

1. **使用 `<style scoped>`**，避免污染全域

   ```vue
   <style scoped>
   .product-list {
     padding: 16px;
   }
   </style>
   ```

2. **優先使用 Element Plus 元件與屬性**，減少自訂樣式

3. **禁止 inline style**（非必要情況）

   ```vue
   <!-- ❌ 錯誤 -->
   <div style="margin-top: 16px"></div>
   ```

### 字串常數化

避免 magic string：

```typescript
// ❌ 錯誤
if (status === "active") {
}

// ✅ 正確
export const PRODUCT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive"
} as const;

if (status === PRODUCT_STATUS.ACTIVE) {
}
```

### Import 順序

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

## Commit 規範

### Commit Message 格式

```
<type>: <English short description>

English details:
- point 1
- point 2

中文說明：
- 點 1
- 點 2

【Revert 說明】
📦 依賴項：<列出此 commit 依賴的其他 commit 或「無」>
✅ 獨立 revert：<說明是否可以單獨 revert>
🔧 影響功能：<列出會受影響的功能>
```

**語言規範**：

- 第一行（標題）：**英文**
- Body 先寫英文說明，再附上中文翻譯
- 標題和 body 中間空一行

**❌ 重要：不要添加 Co-Authored-By**

### Type 類型

| Type     | 說明                   |
| -------- | ---------------------- |
| feat     | 新功能                 |
| fix      | 修正錯誤               |
| perf     | 效能優化               |
| refactor | 重構（不改變功能）     |
| style    | 樣式調整（不影響邏輯） |
| docs     | 文件更新               |
| chore    | 建構工具、依賴更新     |

### 切分 Commit 原則

**✅ 好的切分**：

- 每個 commit 完成一個完整的小功能
- 可以單獨 revert 而不影響其他功能
- 相關的檔案放在同一個 commit
- 先 commit 被依賴的，後 commit 依賴的

**❌ 避免**：

- 太大的 commit（難以 revert）
- 混合不相關的改動

### Commit 前檢查清單

- [ ] Commit message 包含 type
- [ ] 標題簡短清楚（<50 字）
- [ ] 包含完整的 Revert 說明
- [ ] 執行 `pnpm lint` 確認無錯誤
- [ ] 可以獨立編譯/運行

---

## 環境設定

| 環境 | VITE_API_BASE_URL          | API 路由方式                         |
| ---- | -------------------------- | ------------------------------------ |
| 開發 | `""`（空字串）             | Vite proxy `/api` → `localhost:8080` |
| 生產 | `https://api.boomparty.tw` | 直接打 NAS API                       |

---

## 核心原則

- ✅ 搜尋後再建立，避免重複
- ✅ Edit 前先 Read
- ✅ 完成功能後立即 Lint，Lint 後再 commit
- ✅ 做事情之前先計畫，問完使用者再動作

---

## NAS 部署 Troubleshooting

### macOS `._*` AppleDouble 檔案導致 Docker build 失敗

**症狀**：`pnpm build` 在 Docker 內失敗，錯誤訊息類似：

```
Utf8Error { valid_up_to: 45, error_len: Some(1) }
```

Tailwind v4 oxide（Rust 引擎）掃描到 `._*.vue` 等 binary 檔案，無法解析 UTF-8 而 panic。

**原因**：macOS 用 zip/tar 打包時會產生 `._*` companion 檔案（AppleDouble 格式），解壓縮到 NAS 後殘留在 `src/` 目錄。

**確認數量**：

```bash
sudo find /var/services/homes/nasweb/boomparty-pure-admin -name "._*" | wc -l
```

**清除指令**：

```bash
sudo find /var/services/homes/nasweb/boomparty-pure-admin -name "._*" -delete
```

**預防措施**（已設定）：

- `.dockerignore` 已加入 `._*` — Docker build context 不含這些檔案
- 打包時用 `COPYFILE_DISABLE=1 tar czf ...` 可避免產生 `._*`

---

### nginx 403 Permission Denied

**症狀**：admin.boomparty.tw 出現 403 Forbidden，NAS log 顯示 `Permission denied (13)`

**原因**：Docker COPY 複製的靜態檔案權限為 `rwx--x--x`（711），nginx worker（非 root）無法讀取。

**臨時修復**（不重 build）：

```bash
sudo docker exec boomparty-admin chmod -R 755 /usr/share/nginx/html
```

**永久修復**（已寫入 Dockerfile）：

```dockerfile
RUN chmod -R 755 /usr/share/nginx/html
```

---

### PostgreSQL 使用者管理

以下指令在 NAS 上透過 SSH 執行。

**查詢所有使用者**：

```bash
sudo docker exec boomparty-postgres psql -U dbuser -d boomparty -c "SELECT id, username, role FROM users;"
```

**產生 BCrypt hash**（macOS）：

```bash
htpasswd -bnBC 10 "" <your-password> | tr -d ":\n" | sed 's/$2y/$2a/'
```

**新增使用者**：

```bash
sudo docker exec boomparty-postgres psql -U dbuser -d boomparty -c "INSERT INTO users (username, email, password, full_name, phone_number, role, enabled, created_at, updated_at) VALUES ('<username>', '<email>', '<bcrypt-hash>', '<full-name>', '<phone>', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
```

**更新 role**：

```bash
sudo docker exec boomparty-postgres psql -U dbuser -d boomparty -c "UPDATE users SET role = 'ADMIN' WHERE username = '<username>';"
```
