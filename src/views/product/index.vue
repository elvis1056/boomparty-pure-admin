<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getProducts, deleteProduct, type Product } from "@/api/product";
import { getCategories, type Category } from "@/api/category";

const loading = ref(false);
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const selectedCategoryId = ref<number | null>(null);

const getSubCategoryIds = (parentCategoryId: number): number[] => {
  return categories.value
    .filter(category => category.parentId === parentCategoryId)
    .map(category => category.id);
};

const filteredProducts = computed(() => {
  if (selectedCategoryId.value === null) {
    return products.value;
  }
  const selectedCategory = categories.value.find(
    category => category.id === selectedCategoryId.value
  );
  if (!selectedCategory) {
    return products.value;
  }
  if (selectedCategory.parentId === null) {
    const subCategoryIds = getSubCategoryIds(selectedCategory.id);
    return products.value.filter(
      product =>
        product.categoryId !== null &&
        subCategoryIds.includes(product.categoryId)
    );
  }
  return products.value.filter(
    product => product.categoryId === selectedCategoryId.value
  );
});

const topLevelCategories = computed(() =>
  categories.value.filter(category => category.parentId === null)
);

const fetchProducts = async () => {
  loading.value = true;
  try {
    const data = await getProducts();
    products.value = Array.isArray(data) ? data : [];
  } catch {
    ElMessage.error("載入商品失敗");
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const data = await getCategories();
    categories.value = Array.isArray(data) ? data : [];
  } catch {
    ElMessage.error("載入分類失敗");
  }
};

const removeProduct = async (id: number, name: string) => {
  try {
    await ElMessageBox.confirm(`確定刪除「${name}」？`, "刪除確認", {
      type: "warning",
      confirmButtonText: "刪除",
      cancelButtonText: "取消"
    });
    await deleteProduct(id);
    ElMessage.success("刪除成功");
    fetchProducts();
  } catch {
    // 取消刪除，不做任何事
  }
};

onMounted(() => {
  fetchProducts();
  fetchCategories();
});
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">商品列表</h2>
      <el-button type="primary" @click="$router.push('/product/create')">
        新增商品
      </el-button>
    </div>

    <div class="mb-4">
      <el-select
        v-model="selectedCategoryId"
        placeholder="篩選分類"
        clearable
        style="width: 220px"
        @clear="selectedCategoryId = null"
      >
        <el-option :value="null" label="全部" />
        <template
          v-for="parentCategory in topLevelCategories"
          :key="parentCategory.id"
        >
          <el-option
            :value="parentCategory.id"
            :label="parentCategory.name"
            disabled
          />
          <el-option
            v-for="subCategory in categories.filter(
              category => category.parentId === parentCategory.id
            )"
            :key="subCategory.id"
            :value="subCategory.id"
            :label="`　${subCategory.name}`"
          />
        </template>
      </el-select>
    </div>

    <el-table v-loading="loading" :data="filteredProducts" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="商品名稱" min-width="160" />
      <el-table-column prop="price" label="價格" width="100">
        <template #default="{ row }">
          NT$ {{ row.price.toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="庫存" width="80" />
      <el-table-column prop="categoryName" label="分類" width="120">
        <template #default="{ row }">
          {{ row.categoryName || "—" }}
        </template>
      </el-table-column>
      <el-table-column prop="active" label="上架" width="80">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'info'">
            {{ row.active ? "上架" : "下架" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="featured" label="熱門" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.featured" type="warning">熱門</el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            type="primary"
            @click="$router.push(`/product/edit/${row.id}`)"
          >
            編輯
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="removeProduct(row.id, row.name)"
          >
            刪除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
