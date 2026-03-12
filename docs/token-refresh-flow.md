# Token Refresh 機制說明

檔案：`src/utils/http/index.ts`

---

## 兩個關鍵靜態屬性

| 屬性           | 型別                         | 說明                                    |
| -------------- | ---------------------------- | --------------------------------------- |
| `isRefreshing` | `boolean`                    | 開關，防止同時發多個 refresh 請求       |
| `requests`     | `Array<{ resolve, reject }>` | 排隊中的請求，等 refresh 完成後統一發出 |

---

## 流程

場景：打開商品列表頁，token 已過期超過 1 小時。

```
fetchProducts() → getProducts() → http.request("get", "/api/products")
    ↓
進入 axios 請求攔截器
    ↓
getToken() 取出 cookie 裡的 token 資訊
parseInt(data.expires) - now <= 0  →  token 過期
    ↓
isRefreshing = false？
  ├─ YES（第一個進來的請求）
  │    isRefreshing = true
  │    呼叫 handRefreshToken() → POST /api/auth/refresh（非同步，不等結果）
  │
  └─ NO（後續請求，已經有人在 refresh 了）
       直接往下走
    ↓
resolve(retryOriginalRequest(config))
→ 建立一個永遠等待的 Promise
→ 把 { resolve, reject } 推進 requests 陣列
→ 這個請求卡在這裡，等 refresh 結束
```

---

## refresh 結束後

```
成功 .then()
  → 拿到新 accessToken
  → requests.forEach(({ resolve }) => resolve(token))
  → 所有排隊的請求拿到新 token，繼續送出
  → requests = []

失敗 .catch()
  → requests.forEach(({ reject }) => reject(...))
  → 所有排隊的請求主動結束（不再 pending）
  → logOut() → 跳回登入頁

最後 .finally()
  → isRefreshing = false
```

---

## 修復前為什麼卡 loading

修復前沒有 `.catch()`。

refresh 失敗時 `.then()` 不跑，`requests` 陣列裡的 callback 沒人呼叫，`retryOriginalRequest` 回傳的 Promise 永遠不 resolve 也不 reject，頁面的 `fetchProducts()` 一直在等，loading 永遠轉圈。

---

## 白名單

```typescript
const whiteList = ["/refresh-token", "/login", "/auth/refresh"];
```

這三個路徑不做 token 檢查，直接放行。`/auth/refresh` 是 refresh endpoint，不加白名單會造成無限遞迴（refresh 自己也需要 refresh）。
