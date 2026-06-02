---
description: Use when naming components, functions, variables, CSS classes, or files
---

# 命名規範

## 禁止縮寫

**原則：所有變數、函式、CSS class name 必須使用完整英文單字，不得縮寫。**

### JavaScript / TypeScript 變數與 callback 參數

```typescript
// ❌ 單字母 callback 參數
bookings.filter((b) => ...)          // b 是什麼？
products.find((p) => ...)            // p 是什麼？
items.reduce((sum, i) => ...)        // i 是什麼？

// ✅ 完整名稱
bookings.filter((booking) => ...)
products.find((product) => ...)
items.reduce((accumulator, item) => ...)
```

### CSS class name（scoped styles）

```css
/* ❌ 縮寫 class name */
.btn-copy {
}
.btn-ig {
}
.qty {
}
.img-wrapper {
}
.desc {
}

/* ✅ 完整 class name */
.button-copy {
}
.button-instagram {
}
.quantity {
}
.image-wrapper {
}
.description {
}
```

### 常見縮寫對照表

| 縮寫                   | 完整寫法                                     |
| ---------------------- | -------------------------------------------- |
| `btn`                  | `button`                                     |
| `qty`                  | `quantity`                                   |
| `img`                  | `image`                                      |
| `desc`                 | `description`                                |
| `idx` / `i`            | 用語意名稱，如 `index`、`itemIndex`          |
| 單字母 `s` / `d` / `o` | 用型別名稱，如 `shape`、`option`、`delivery` |
| `e`                    | `event`                                      |

> **例外**：約定俗成的專有縮寫可保留 — `id`、`url`、`api`、`seo`、`ref`（Vue 響應式 API）、`props`（元件屬性）。品牌名也要用完整名稱，如 `instagram` 而非 `ig`。

## 禁止 handle 前綴

**原則：根據函數實際做什麼來命名，不使用模糊的 handle 前綴。**

> **Why：** `handle` 不表達函數的實際行為 — `handleSubmit` 可能是驗證、存檔、導航，看名字猜不出來。動詞優先命名（`submitForm`、`deleteProduct`）讓讀者一眼看出功能，減少跳進函數才能理解的次數。這是團隊有意選擇的風格，與 Airbnb React 慣例不同。

```typescript
// ❌ 錯誤：使用 handle 前綴（看不出在做什麼）
const handleAddToCart = () => {};
const handleSubmit = () => {};
const handleError = () => {};

// ✅ 正確：直接用動作命名（一眼看出功能）
const addToCart = () => {};
const submitForm = () => {};
const showError = () => {};
const fetchProducts = async () => {};
```

**命名思路：看函數內容在做什麼**

- 驗證並登入 → `authenticateWithGoogle` 或 `loginWithGoogle`
- 顯示錯誤 → `showError` 或 `displayError`
- 儲存資料 → `saveData` 或 `storeUserInfo`
