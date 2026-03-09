<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { createProduct, type ProductForm } from "@/api/product";
import ProductFormComp from "./ProductForm.vue";

const router = useRouter();
const loading = ref(false);

const submitCreate = async (data: ProductForm) => {
  loading.value = true;
  try {
    await createProduct(data);
    ElMessage.success("新增成功");
    router.push("/product/list");
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
      <h2 class="text-xl font-bold">新增商品</h2>
    </div>

    <el-card v-loading="loading">
      <ProductFormComp
        mode="create"
        @submit="submitCreate"
        @cancel="$router.back()"
      />
    </el-card>
  </div>
</template>
