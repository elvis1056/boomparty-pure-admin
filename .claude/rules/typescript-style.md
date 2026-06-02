---
description: Use when writing TypeScript code
---

# TypeScript 風格規範

## 1. Interface 命名

```typescript
interface UserListProps {} // Props 加後綴
interface User {} // 資料模型，不加後綴
interface UserState {} // Store 狀態加後綴
```

## 2. 未使用參數加底線前綴

```typescript
function Component({ used, _unused }: Props) {}
```

## 3. 不使用 nullish coalescing（??）

**原則：統一用三元運算子處理 null/undefined。**

> **Why：** `??` 只處理 `null | undefined`，不處理 `""` 和 `0`，行為跟 `||` 不同。本專案統一用顯式三元，讓 null 處理邏輯在 code review 時一目了然，避免需要記憶 `??` vs `||` 的差異。這是團隊有意選擇的風格，業界（TypeScript 官方、ESLint）傾向鼓勵使用 `??`。

```typescript
// ❌ 錯誤
const value = data ?? defaultValue;

// ✅ 正確：用三元運算子
const value = data !== null && data !== undefined ? data : defaultValue;
// 或簡化版（如果 falsy 值都要用預設）
const value = data ? data : defaultValue;
```

## 4. 保留原檔格式慣例

修改或重寫任何檔案時，必須保留原檔的所有格式慣例，不得引入新的排版風格。

> **Why：** PR 裡不該出現跟功能無關的格式變更，增加 review 負擔（minimal diff 原則）。

## 5. 所有條件塊必須使用 `{}` 括號

```typescript
// ❌ 錯誤：單行 if，沒有括號
if (x) return y;

// ✅ 正確：一律用 {} 包住 body
if (x) {
  return y;
}
```

> **Why：** 省略 `{}` 是 Apple 2014 年 goto fail SSL bug 的成因。Google、Airbnb style guide 均強制要求（ESLint `curly: "all"`）。

## 6. 複雜條件驗證抽成獨立函數，用 early return 處理

條件分支跨越多個情境時，抽成獨立函數，讓主流程只留一行呼叫：

```typescript
// ❌ 錯誤：巢狀 if-else 塞在主流程裡
if (isDateOnlyType) {
  if (completionTime === null) {
    return;
  }
} else if (isTimeSlotType) {
  if (selectedDuration === null) {
    return;
  }
}

// ✅ 正確：抽成函數，主流程一行
if (!validateTimeSelection()) {
  return;
}

const validateTimeSelection = (): boolean => {
  if (isDateOnlyType && completionTime === null) {
    return false;
  }
  if (isTimeSlotType && selectedDuration === null) {
    return false;
  }
  return true;
};
```

## 7. 禁止 magic number

數字常數必須命名，不得直接寫在邏輯裡。

```typescript
// ❌ 錯誤：magic number
if (stock <= 5) { ... }
setTimeout(callback, 300);

// ✅ 正確：命名常數
const LOW_STOCK_THRESHOLD = 5;
const DEBOUNCE_DELAY_MS = 300;

if (stock <= LOW_STOCK_THRESHOLD) { ... }
setTimeout(callback, DEBOUNCE_DELAY_MS);
```

> **例外：** `0`、`1`、`-1` 等在明確上下文中使用的值（如 `index + 1`、`array.length - 1`），以及 HTTP status code（`200`、`404`）。

## 8. 字串常數化

避免 magic string，使用物件分組常數。

```typescript
// ❌ 錯誤：magic string
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
