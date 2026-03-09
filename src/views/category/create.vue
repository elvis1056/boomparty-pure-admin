<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { createCategory, type CategoryForm } from "@/api/category";
import CategoryFormComp from "./CategoryForm.vue";

const router = useRouter();
const loading = ref(false);

const submitCreate = async (data: CategoryForm) => {
  loading.value = true;
  try {
    await createCategory(data);
    ElMessage.success("新增成功");
    router.push("/category/list");
  } catch {
    ElMessage.error("新增失敗");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center gap-2">
      <el-button @click="$router.back()">返回</el-button>
      <h2 class="text-xl font-bold">新增分類</h2>
    </div>

    <el-card v-loading="loading">
      <CategoryFormComp
        mode="create"
        @submit="submitCreate"
        @cancel="$router.back()"
      />
    </el-card>
  </div>
</template>
