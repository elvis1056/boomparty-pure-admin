<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  TAG_TYPE,
  type Tag,
  type TagType
} from "@/api/tag";

const loading = ref(false);
const tags = ref<Tag[]>([]);
const searchQuery = ref("");

const TAG_TYPE_LABEL: Record<TagType, string> = {
  CONTENT: "內容",
  STYLE: "風格",
  OCCASION: "場合"
};

const TAG_TYPE_COLOR: Record<TagType, string> = {
  CONTENT: "",
  STYLE: "success",
  OCCASION: "warning"
};

const filteredTags = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return tags.value;
  }
  return tags.value.filter(tag => {
    return (
      tag.name.toLowerCase().includes(query) ||
      tag.slug.toLowerCase().includes(query)
    );
  });
});

// Create form
const form = ref({ name: "", type: TAG_TYPE.CONTENT as TagType });
const submitting = ref(false);

// Inline edit state
const editingTagId = ref<number | null>(null);
const editForm = ref({ name: "", slug: "", type: TAG_TYPE.CONTENT as TagType });

const fetchTags = async () => {
  loading.value = true;
  try {
    const data = await getTags();
    tags.value = Array.isArray(data) ? data : [];
  } catch {
    ElMessage.error("載入標籤失敗");
  } finally {
    loading.value = false;
  }
};

const addTag = async () => {
  if (!form.value.name.trim()) {
    ElMessage.warning("請輸入標籤名稱");
    return;
  }
  submitting.value = true;
  try {
    const newTag = await createTag({
      name: form.value.name.trim(),
      type: form.value.type
    });
    tags.value.push(newTag);
    form.value.name = "";
    ElMessage.success("已新增標籤");
  } catch {
    ElMessage.error("新增失敗");
  } finally {
    submitting.value = false;
  }
};

const startEdit = (tag: Tag) => {
  editingTagId.value = tag.id;
  editForm.value = { name: tag.name, slug: tag.slug, type: tag.type };
};

const cancelEdit = () => {
  editingTagId.value = null;
};

const saveEdit = async (tag: Tag) => {
  if (!editForm.value.name.trim()) {
    ElMessage.warning("名稱不可為空");
    return;
  }
  try {
    const updated = await updateTag(tag.id, {
      name: editForm.value.name.trim(),
      type: editForm.value.type,
      slug: editForm.value.slug
    });
    const index = tags.value.findIndex(
      existingTag => existingTag.id === tag.id
    );
    if (index !== -1) {
      tags.value[index] = updated;
    }
    editingTagId.value = null;
    ElMessage.success("已更新");
  } catch {
    ElMessage.error("更新失敗");
  }
};

const removeTag = async (tag: Tag) => {
  try {
    await ElMessageBox.confirm(
      `確定刪除標籤「${tag.name}」？相關圖片的標籤連結也會一併移除。`,
      "刪除確認",
      { type: "warning", confirmButtonText: "刪除", cancelButtonText: "取消" }
    );
    await deleteTag(tag.id);
    tags.value = tags.value.filter(existingTag => existingTag.id !== tag.id);
    ElMessage.success("已刪除");
  } catch {
    // User cancelled
  }
};

onMounted(fetchTags);
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">標籤管理</h2>
      <el-input
        v-model="searchQuery"
        placeholder="搜尋名稱 / Slug"
        clearable
        style="width: 220px"
      />
    </div>

    <!-- Create form -->
    <div class="mb-6 flex items-center gap-3">
      <el-input
        v-model="form.name"
        placeholder="標籤名稱"
        style="width: 200px"
        @keyup.enter="addTag"
      />
      <el-select v-model="form.type" style="width: 120px">
        <el-option
          v-for="(label, type) in TAG_TYPE_LABEL"
          :key="type"
          :label="label"
          :value="type"
        />
      </el-select>
      <el-button type="primary" :loading="submitting" @click="addTag">
        新增標籤
      </el-button>
    </div>

    <!-- Tag list -->
    <el-table v-loading="loading" :data="filteredTags" border stripe>
      <el-table-column prop="id" label="ID" width="70" />

      <el-table-column label="名稱" min-width="120">
        <template #default="{ row }">
          <template v-if="editingTagId === row.id">
            <el-input v-model="editForm.name" size="small" />
          </template>
          <template v-else>
            <span class="editable-cell" @dblclick="startEdit(row)">
              {{ row.name }}
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column prop="slug" label="Slug" min-width="160" />

      <el-table-column label="類型" width="120">
        <template #default="{ row }">
          <template v-if="editingTagId === row.id">
            <el-select v-model="editForm.type" size="small">
              <el-option
                v-for="(label, type) in TAG_TYPE_LABEL"
                :key="type"
                :label="label"
                :value="type"
              />
            </el-select>
          </template>
          <template v-else>
            <el-tag :type="TAG_TYPE_COLOR[row.type as TagType] as any">
              {{ TAG_TYPE_LABEL[row.type as TagType] }}
            </el-tag>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="使用中" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.usageCount > 0 ? 'success' : 'info'" size="small">
            {{ row.usageCount }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createdAt" label="建立時間" width="120">
        <template #default="{ row }">
          {{ row.createdAt ? row.createdAt.slice(0, 10) : "—" }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <template v-if="editingTagId === row.id">
            <el-button size="small" type="success" @click="saveEdit(row)">
              儲存
            </el-button>
            <el-button size="small" @click="cancelEdit">取消</el-button>
          </template>
          <template v-else>
            <el-button size="small" type="primary" @click="startEdit(row)">
              編輯
            </el-button>
            <el-button size="small" type="danger" @click="removeTag(row)">
              刪除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.editable-cell {
  padding: 2px 4px;
  cursor: pointer;
  border-radius: 4px;
}

.editable-cell:hover {
  background-color: #f0f2f5;
}
</style>
