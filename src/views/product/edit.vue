<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  getProduct,
  updateProduct,
  type Product,
  type ProductForm
} from "@/api/product";
import ProductFormComp from "./ProductForm.vue";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const product = ref<Product | undefined>(undefined);

const id = Number(route.params.id);

const fetchProduct = async () => {
  loading.value = true;
  try {
    product.value = await getProduct(id);
  } catch {
    ElMessage.error("載入商品失敗");
    router.push("/product/list");
  } finally {
    loading.value = false;
  }
};

const submitEdit = async (data: ProductForm) => {
  loading.value = true;
  try {
    await updateProduct(id, data);
    ElMessage.success("儲存成功");
    router.push("/product/list");
  } catch {
    ElMessage.error("儲存失敗");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchProduct);
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center gap-2">
      <el-button @click="$router.back()">返回</el-button>
      <h2 class="text-xl font-bold">編輯商品</h2>
    </div>

    <el-card v-loading="loading">
      <ProductFormComp
        mode="edit"
        :initial-data="product"
        @submit="submitEdit"
        @cancel="$router.back()"
      />
    </el-card>
  </div>
</template>
