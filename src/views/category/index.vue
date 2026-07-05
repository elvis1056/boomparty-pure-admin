<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getCategories, deleteCategory, type Category } from "@/api/category";

const loading = ref(false);
const categories = ref<Category[]>([]);
const searchQuery = ref("");

const topLevelCategories = computed(() =>
  categories.value.filter(category => category.parentId === null)
);

const filteredCategories = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return topLevelCategories.value;
  }
  return topLevelCategories.value.filter(parent => {
    const parentMatch = parent.name.toLowerCase().includes(query);
    const childMatch =
      parent.children &&
      parent.children.some(child => child.name.toLowerCase().includes(query));
    return parentMatch || childMatch;
  });
});

const fetchCategories = async () => {
  loading.value = true;
  try {
    categories.value = await getCategories();
  } catch {
    ElMessage.error("載入分類失敗");
  } finally {
    loading.value = false;
  }
};

const removeCategory = async (id: number, name: string) => {
  try {
    await ElMessageBox.confirm(`確定刪除「${name}」？`, "刪除確認", {
      type: "warning",
      confirmButtonText: "刪除",
      cancelButtonText: "取消"
    });
    await deleteCategory(id);
    ElMessage.success("刪除成功");
    fetchCategories();
  } catch (err: any) {
    if (err !== "cancel") {
      const msg = err?.response?.data?.detail || "刪除失敗";
      ElMessage.error(msg);
    }
  }
};

onMounted(fetchCategories);
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">分類列表</h2>
      <div class="flex items-center gap-3">
        <el-input
          v-model="searchQuery"
          placeholder="搜尋分類名稱"
          clearable
          style="width: 220px"
        />
        <el-button type="primary" @click="$router.push('/category/create')">
          新增分類
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredCategories"
      border
      row-key="id"
      default-expand-all
      :indent="24"
      :row-class-name="
        ({ row }) => (row.parentId === null ? 'row-parent' : 'row-child')
      "
    >
      <el-table-column prop="name" label="分類名稱" min-width="180">
        <template #default="{ row }">
          <span v-if="row.parentId !== null" class="child-indicator">└</span>
          {{ row.name }}
        </template>
      </el-table-column>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column
        prop="description"
        label="描述"
        min-width="200"
        show-overflow-tooltip
      />
      <el-table-column prop="productCount" label="商品數" width="90" />
      <el-table-column prop="active" label="啟用" width="80">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'info'">
            {{ row.active ? "啟用" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            type="primary"
            @click="$router.push(`/category/edit/${row.id}`)"
          >
            編輯
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="removeCategory(row.id, row.name)"
          >
            刪除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
/* Top-level: light grey background + bold */
:deep(.row-parent) {
  font-weight: 600;
  background-color: #f5f7fa;
}

/* Child rows: smaller font, muted color */
:deep(.row-child) {
  font-size: 13px;
  color: #555;
}

.child-indicator {
  margin-right: 4px;
  font-family: monospace;
  color: #c0c4cc;
}
</style>
