<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getTags,
  createTag,
  deleteTag,
  TAG_TYPE,
  type Tag,
  type TagType
} from "@/api/tag";

const loading = ref(false);
const tags = ref<Tag[]>([]);

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

// 新增表單
const form = ref({ name: "", type: TAG_TYPE.CONTENT as TagType });
const submitting = ref(false);

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

const removeTag = async (tag: Tag) => {
  try {
    await ElMessageBox.confirm(
      `確定刪除標籤「${tag.name}」？相關圖片的標籤連結也會一併移除。`,
      "刪除確認",
      { type: "warning", confirmButtonText: "刪除", cancelButtonText: "取消" }
    );
    await deleteTag(tag.id);
    tags.value = tags.value.filter(t => t.id !== tag.id);
    ElMessage.success("已刪除");
  } catch {
    // 取消刪除
  }
};

onMounted(fetchTags);
</script>

<template>
  <div class="p-4">
    <h2 class="mb-4 text-xl font-bold">標籤管理</h2>

    <!-- 新增表單 -->
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

    <!-- 標籤列表 -->
    <el-table v-loading="loading" :data="tags" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名稱" min-width="120" />
      <el-table-column prop="slug" label="Slug" min-width="160" />
      <el-table-column label="類型" width="100">
        <template #default="{ row }">
          <el-tag :type="TAG_TYPE_COLOR[row.type as TagType] as any">
            {{ TAG_TYPE_LABEL[row.type as TagType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="建立時間" width="160">
        <template #default="{ row }">
          {{ row.createdAt ? row.createdAt.slice(0, 10) : "—" }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="removeTag(row)">
            刪除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
