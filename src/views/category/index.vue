<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getCategories, deleteCategory, type Category } from "@/api/category";

const loading = ref(false);
const categories = ref<Category[]>([]);

// el-table 只顯示頂層分類，子分類已在各自的 children 陣列裡
const topLevelCategories = computed(() =>
  categories.value.filter(category => category.parentId === null)
);

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
      <el-button type="primary" @click="$router.push('/category/create')">
        新增分類
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="topLevelCategories"
      border
      row-key="id"
      default-expand-all
      :indent="24"
      :row-class-name="
        ({ row }) => (row.parentId === null ? 'row-parent' : 'row-child')
      "
    >
      <el-table-column prop="name" label="分類名稱" min-width="180" />
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
/* 頂層分類：淺灰底色 + 粗體 */
:deep(.row-parent) {
  font-weight: 600;
  background-color: #f5f7fa;
}

/* 子分類：字體略小、顏色稍淡 */
:deep(.row-child) {
  font-size: 13px;
  color: #555;
}
</style>
