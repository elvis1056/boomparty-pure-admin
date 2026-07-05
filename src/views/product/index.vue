<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getProducts,
  deleteProduct,
  updateProduct,
  type Product,
  type ProductForm
} from "@/api/product";
import { getCategories, type Category } from "@/api/category";

// ── State ───────────────────────────────────────────────────────

const loading = ref(false);
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);

// Filters
const selectedCategoryId = ref<number | null>(null);
const searchText = ref("");

// Pagination
const currentPage = ref(1);
const pageSize = ref(15);

// Batch selection
const selectedProducts = ref<Product[]>([]);

// ── Data Fetching ───────────────────────────────────────────────

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

onMounted(() => {
  fetchProducts();
  fetchCategories();
});

// ── Computed ────────────────────────────────────────────────────

const getSubCategoryIds = (parentCategoryId: number): number[] => {
  return categories.value
    .filter(category => category.parentId === parentCategoryId)
    .map(category => category.id);
};

const topLevelCategories = computed(() =>
  categories.value.filter(category => category.parentId === null)
);

/** Apply all filters (category + search) */
const filteredProducts = computed(() => {
  return products.value.filter(product => {
    // Category filter
    if (selectedCategoryId.value !== null) {
      const selectedCategory = categories.value.find(
        category => category.id === selectedCategoryId.value
      );
      if (selectedCategory) {
        if (selectedCategory.parentId === null) {
          const subCategoryIds = getSubCategoryIds(selectedCategory.id);
          if (
            product.categoryId === null ||
            !subCategoryIds.includes(product.categoryId)
          ) {
            return false;
          }
        } else if (product.categoryId !== selectedCategoryId.value) {
          return false;
        }
      }
    }

    // Search filter (product name)
    if (searchText.value) {
      const keyword = searchText.value.toLowerCase();
      if (!product.name.toLowerCase().includes(keyword)) {
        return false;
      }
    }

    return true;
  });
});

// Sort (global, before pagination)
const sortState = ref<{ prop: string; order: string | null }>({
  prop: "createdAt",
  order: "descending"
});

const onSortChange = ({
  prop,
  order
}: {
  prop: string;
  order: string | null;
}) => {
  sortState.value = { prop, order };
  currentPage.value = 1;
};

const sortedProducts = computed(() => {
  const { prop, order } = sortState.value;
  if (!prop || !order) {
    return filteredProducts.value;
  }
  const list = [...filteredProducts.value];
  const direction = order === "ascending" ? 1 : -1;
  list.sort((productA, productB) => {
    const sortFieldA = (productA as Record<string, unknown>)[prop];
    const sortFieldB = (productB as Record<string, unknown>)[prop];
    if (sortFieldA === sortFieldB) {
      return 0;
    }
    if (sortFieldA === null || sortFieldA === undefined) {
      return 1;
    }
    if (sortFieldB === null || sortFieldB === undefined) {
      return -1;
    }
    return sortFieldA < sortFieldB ? -direction : direction;
  });
  return list;
});

/** Paginated subset of sorted products */
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedProducts.value.slice(start, start + pageSize.value);
});

// ── Constants ───────────────────────────────────────────────────

const OUT_OF_STOCK_THRESHOLD = 0;
const LOW_STOCK_THRESHOLD = 5;

// ── Actions ─────────────────────────────────────────────────────

const buildProductForm = (product: Product): ProductForm => {
  return {
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    active: product.active,
    featured: product.featured,
    categoryId: product.categoryId
  };
};

const toggleActive = async (product: Product) => {
  const newValue = !product.active;
  const label = newValue ? "上架" : "下架";
  try {
    await ElMessageBox.confirm(
      `確定將「${product.name}」${label}？`,
      `${label}確認`,
      {
        type: "warning",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
      }
    );
    const form = buildProductForm(product);
    form.active = newValue;
    await updateProduct(product.id, form);
    ElMessage.success(`已${label}`);
    fetchProducts();
  } catch {
    // User cancelled
  }
};

const toggleFeatured = async (product: Product) => {
  const newValue = !product.featured;
  const label = newValue ? "設為熱門" : "取消熱門";
  try {
    await ElMessageBox.confirm(
      `確定將「${product.name}」${label}？`,
      `${label}確認`,
      {
        type: "warning",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
      }
    );
    const form = buildProductForm(product);
    form.featured = newValue;
    await updateProduct(product.id, form);
    ElMessage.success(`已${label}`);
    fetchProducts();
  } catch {
    // User cancelled
  }
};

const batchUpdateActive = async (active: boolean) => {
  const label = active ? "上架" : "下架";
  const count = selectedProducts.value.length;
  try {
    await ElMessageBox.confirm(
      `確定將 ${count} 件商品批次${label}？`,
      `批次${label}`,
      {
        type: "warning",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
      }
    );
    const results = await Promise.allSettled(
      selectedProducts.value.map(product => {
        const form = buildProductForm(product);
        form.active = active;
        return updateProduct(product.id, form);
      })
    );
    const successCount = results.filter(
      result => result.status === "fulfilled"
    ).length;
    const failCount = results.filter(
      result => result.status === "rejected"
    ).length;
    if (failCount > 0) {
      ElMessage.warning(`${successCount} 件成功，${failCount} 件失敗`);
    } else {
      ElMessage.success(`已批次${label} ${successCount} 件商品`);
    }
    selectedProducts.value = [];
    fetchProducts();
  } catch {
    // User cancelled
  }
};

const batchDelete = async () => {
  const count = selectedProducts.value.length;
  try {
    await ElMessageBox.confirm(
      `確定刪除 ${count} 件商品？此操作無法復原。`,
      "批次刪除",
      {
        type: "error",
        confirmButtonText: "刪除",
        cancelButtonText: "取消"
      }
    );
    const results = await Promise.allSettled(
      selectedProducts.value.map(product => deleteProduct(product.id))
    );
    const successCount = results.filter(
      result => result.status === "fulfilled"
    ).length;
    const failCount = results.filter(
      result => result.status === "rejected"
    ).length;
    if (failCount > 0) {
      ElMessage.warning(`${successCount} 件已刪除，${failCount} 件失敗`);
    } else {
      ElMessage.success(`已刪除 ${successCount} 件商品`);
    }
    selectedProducts.value = [];
    fetchProducts();
  } catch {
    // User cancelled
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
    // User cancelled
  }
};

const resetFilters = () => {
  searchText.value = "";
  selectedCategoryId.value = null;
  currentPage.value = 1;
};

// ── Helpers ─────────────────────────────────────────────────────

const getPrimaryImageUrl = (product: Product): string | null => {
  const primaryImage = product.images.find(image => image.isPrimary);
  if (primaryImage) {
    return primaryImage.url;
  }
  if (product.images.length > 0) {
    return product.images[0].url;
  }
  return null;
};

const formatCurrency = (amount: number | null): string => {
  if (amount === null || amount === undefined) {
    return "—";
  }
  return `NT$ ${amount.toLocaleString()}`;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) {
    return "—";
  }
  return new Date(dateString).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">商品列表</h2>
      <el-button type="primary" @click="$router.push('/product/create')">
        新增商品
      </el-button>
    </div>

    <!-- Search & Category Filter -->
    <div class="mb-4 flex flex-wrap gap-3">
      <el-input
        v-model="searchText"
        placeholder="搜尋商品名稱"
        clearable
        style="width: 240px"
        @input="currentPage = 1"
      />
      <el-select
        v-model="selectedCategoryId"
        placeholder="篩選分類"
        clearable
        style="width: 220px"
        @change="currentPage = 1"
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
      <el-button
        v-if="searchText || selectedCategoryId !== null"
        text
        @click="resetFilters"
      >
        清除篩選
      </el-button>
    </div>

    <!-- Batch Action Bar -->
    <div
      v-if="selectedProducts.length > 0"
      class="mb-4 flex items-center gap-3"
    >
      <span class="text-sm"> 已選 {{ selectedProducts.length }} 件 </span>
      <el-button size="small" @click="batchUpdateActive(true)">
        批次上架
      </el-button>
      <el-button size="small" @click="batchUpdateActive(false)">
        批次下架
      </el-button>
      <el-button size="small" type="danger" @click="batchDelete">
        批次刪除
      </el-button>
    </div>

    <!-- Table -->
    <el-table
      v-loading="loading"
      :data="paginatedProducts"
      border
      stripe
      :default-sort="{ prop: 'createdAt', order: 'descending' }"
      @sort-change="onSortChange"
      @selection-change="selectedProducts = $event"
    >
      <el-table-column type="selection" width="40" />
      <el-table-column label="" width="64">
        <template #default="{ row }">
          <img
            v-if="getPrimaryImageUrl(row)"
            :src="getPrimaryImageUrl(row)"
            class="product-thumbnail"
          />
          <div v-else class="product-thumbnail-placeholder" />
        </template>
      </el-table-column>
      <el-table-column
        prop="name"
        label="商品名稱"
        min-width="160"
        show-overflow-tooltip
      />
      <el-table-column prop="price" label="價格" width="120" sortable>
        <template #default="{ row }">
          {{ formatCurrency(row.price) }}
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="庫存" width="80" sortable>
        <template #default="{ row }">
          <span
            :class="{
              'stock-out': row.stock <= OUT_OF_STOCK_THRESHOLD,
              'stock-low':
                row.stock > OUT_OF_STOCK_THRESHOLD &&
                row.stock <= LOW_STOCK_THRESHOLD
            }"
          >
            {{ row.stock }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="categoryName" label="分類" width="120">
        <template #default="{ row }">
          {{ row.categoryName || "—" }}
        </template>
      </el-table-column>
      <el-table-column label="上架" width="80" align="center">
        <template #default="{ row }">
          <el-switch :model-value="row.active" @change="toggleActive(row)" />
        </template>
      </el-table-column>
      <el-table-column label="熱門" width="80" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.featured"
            @change="toggleFeatured(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="建立日期" width="120" sortable>
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
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

    <!-- Pagination -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[15, 30, 50]"
        :total="filteredProducts.length"
        layout="total, sizes, prev, pager, next"
        background
      />
    </div>
  </div>
</template>

<style scoped>
.product-thumbnail {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
}

.product-thumbnail-placeholder {
  width: 48px;
  height: 48px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.stock-out {
  font-weight: 600;
  color: var(--el-color-danger);
}

.stock-low {
  font-weight: 600;
  color: var(--el-color-warning);
}
</style>
