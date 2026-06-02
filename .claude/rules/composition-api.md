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
   const activeUsers = computed(() => users.value.filter(user => user.active));
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

## 樣式

- 使用 `<style scoped>`，避免污染全域
- 優先使用 Element Plus 元件與屬性，減少自訂樣式
- 禁止 inline style（非必要情況）
