<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  getCategory,
  updateCategory,
  type Category,
  type CategoryForm
} from "@/api/category";
import CategoryFormComponent from "./CategoryForm.vue";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const category = ref<Category | undefined>(undefined);

const id = Number(route.params.id);

const fetchCategory = async () => {
  loading.value = true;
  try {
    category.value = await getCategory(id);
  } catch {
    ElMessage.error("載入分類失敗");
    router.push("/category/list");
  } finally {
    loading.value = false;
  }
};

const submitEdit = async (data: CategoryForm) => {
  loading.value = true;
  try {
    await updateCategory(id, data);
    ElMessage.success("儲存成功");
    router.push("/category/list");
  } catch {
    ElMessage.error("儲存失敗");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchCategory);
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center gap-2">
      <el-button @click="$router.back()">返回</el-button>
      <h2 class="text-xl font-bold">編輯分類</h2>
    </div>

    <el-card v-loading="loading">
      <CategoryFormComponent
        mode="edit"
        :initial-data="category"
        @submit="submitEdit"
        @cancel="$router.back()"
      />
    </el-card>
  </div>
</template>
