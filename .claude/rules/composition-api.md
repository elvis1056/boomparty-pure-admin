---
description: Use when writing Vue 3 Composition API code
---

# Vue 3 Composition API 規範

## script setup

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

3. **❌ 禁止 `v-if` 和 `v-for` 同層使用，改用 `computed` 過濾**

   ```vue
   <!-- ❌ 錯誤 -->
   <div v-for="user in users" v-if="user.active" :key="user.id">

   <!-- ✅ 正確 -->
   <script setup lang="ts">
   const activeUsers = computed(() => users.value.filter(u => u.active));
   </script>
   <template>
     <div v-for="user in activeUsers" :key="user.id">
   </template>
   ```

4. **Props 定義**

   ```vue
   <script setup lang="ts">
   interface Props {
     title: string;
     count?: number;
     disabled?: boolean;
   }

   const props = withDefaults(defineProps<Props>(), {
     count: 0,
     disabled: false
   });
   </script>
   ```

5. **Emits 定義**

   ```vue
   <script setup lang="ts">
   interface Emits {
     (e: "update", value: string): void;
     (e: "delete", id: number): void;
   }

   const emit = defineEmits<Emits>();
   </script>
   ```

6. **Composables 命名：以 `use` 開頭，放在 `src/hooks/`**

   ```typescript
   // src/hooks/useTable.ts
   export function useTable() { ... }
   ```

## 命名規範

**❌ 禁止使用 handle 前綴**

```typescript
// ❌ 錯誤
const handleSubmit = () => {};
const handleDelete = id => {};

// ✅ 正確
const submitForm = () => {};
const deleteProduct = id => {};
const fetchProducts = async () => {};
```

## TypeScript

**Interface 命名慣例**

```typescript
interface UserListProps {} // Props 加後綴
interface User {} // 資料模型，不加後綴
interface UserState {} // Store 狀態加後綴
```

**未使用參數加底線前綴**

```typescript
function Component({ used, _unused }: Props) {}
```

**不使用 nullish coalescing（??），用三元運算子**

```typescript
// ❌ 錯誤
const value = data ?? defaultValue;

// ✅ 正確
const value = data !== null && data !== undefined ? data : defaultValue;
```

## 樣式

- 使用 `<style scoped>`，避免污染全域
- 優先使用 Element Plus 元件與屬性，減少自訂樣式
- 禁止 inline style（非必要情況）

## 字串常數化

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
