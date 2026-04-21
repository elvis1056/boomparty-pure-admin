<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getMediaList,
  uploadMedia,
  updateAltText,
  deleteMedia,
  addTagToMedia,
  removeTagFromMedia,
  type MediaAsset
} from "@/api/media";
import { getTags, type Tag, type TagType, TAG_TYPE } from "@/api/tag";

const loading = ref(false);
const mediaList = ref<MediaAsset[]>([]);
const tags = ref<Tag[]>([]);

// 篩選
const filterTagId = ref<number | null>(null);
const filterType = ref<TagType | null>(null);

// 詳情 Drawer
const drawerVisible = ref(false);
const selectedMedia = ref<MediaAsset | null>(null);
const editingAltText = ref("");
const altTextSaving = ref(false);
const addingTagId = ref<number | null>(null);

const TAG_TYPE_LABEL: Record<TagType, string> = {
  CONTENT: "內容",
  STYLE: "風格",
  OCCASION: "場合"
};

const filteredTags = computed(() => {
  if (!filterType.value) return tags.value;
  return tags.value.filter(t => t.type === filterType.value);
});

const availableTagsForMedia = computed(() => {
  if (!selectedMedia.value) return tags.value;
  const assignedIds = new Set(
    (selectedMedia.value as any).tags?.map((t: Tag) => t.id) ?? []
  );
  return tags.value.filter(t => !assignedIds.has(t.id));
});

const fetchAll = async () => {
  loading.value = true;
  try {
    const [mediaData, tagData] = await Promise.all([getMediaList(), getTags()]);
    mediaList.value = Array.isArray(mediaData) ? mediaData : [];
    tags.value = Array.isArray(tagData) ? tagData : [];
  } catch {
    ElMessage.error("載入失敗");
  } finally {
    loading.value = false;
  }
};

const openDrawer = (media: MediaAsset) => {
  selectedMedia.value = media;
  editingAltText.value = media.altText !== null ? media.altText : "";
  drawerVisible.value = true;
};

const saveAltText = async () => {
  if (!selectedMedia.value) return;
  altTextSaving.value = true;
  try {
    const updated = await updateAltText(
      selectedMedia.value.id,
      editingAltText.value
    );
    selectedMedia.value = updated;
    const idx = mediaList.value.findIndex(m => m.id === updated.id);
    if (idx !== -1) mediaList.value[idx] = updated;
    ElMessage.success("已更新 alt text");
  } catch {
    ElMessage.error("更新失敗");
  } finally {
    altTextSaving.value = false;
  }
};

const assignTag = async () => {
  if (!selectedMedia.value || addingTagId.value === null) return;
  try {
    const updated = await addTagToMedia(
      selectedMedia.value.id,
      addingTagId.value
    );
    selectedMedia.value = updated;
    const idx = mediaList.value.findIndex(m => m.id === updated.id);
    if (idx !== -1) mediaList.value[idx] = updated;
    addingTagId.value = null;
    ElMessage.success("已新增標籤");
  } catch {
    ElMessage.error("新增標籤失敗");
  }
};

const unassignTag = async (tagId: number) => {
  if (!selectedMedia.value) return;
  try {
    await removeTagFromMedia(selectedMedia.value.id, tagId);
    if ((selectedMedia.value as any).tags) {
      (selectedMedia.value as any).tags = (
        selectedMedia.value as any
      ).tags.filter((t: Tag) => t.id !== tagId);
    }
    const idx = mediaList.value.findIndex(
      m => m.id === selectedMedia.value!.id
    );
    if (idx !== -1) mediaList.value[idx] = { ...selectedMedia.value! };
    ElMessage.success("已移除標籤");
  } catch {
    ElMessage.error("移除標籤失敗");
  }
};

const removeMedia = async () => {
  if (!selectedMedia.value) return;
  try {
    await ElMessageBox.confirm(
      `確定刪除「${selectedMedia.value.originalName ?? selectedMedia.value.filename}」？此操作無法復原。`,
      "刪除確認",
      { type: "warning", confirmButtonText: "刪除", cancelButtonText: "取消" }
    );
    await deleteMedia(selectedMedia.value.id);
    mediaList.value = mediaList.value.filter(
      m => m.id !== selectedMedia.value!.id
    );
    drawerVisible.value = false;
    ElMessage.success("已刪除");
  } catch {
    // 取消刪除或後端拒絕（圖片仍被引用）
  }
};

// 上傳
const uploadRef = ref();
const beforeUpload = () => false; // 攔截自動上傳，改用手動處理

const onFileChange = async (file: { raw: File }) => {
  try {
    const result = await uploadMedia(file.raw);
    mediaList.value.unshift(result);
    ElMessage.success("上傳成功");
  } catch {
    ElMessage.error("上傳失敗");
  }
};

onMounted(fetchAll);
</script>

<template>
  <div class="p-4">
    <!-- 標題列 -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">媒體庫</h2>
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :show-file-list="false"
        accept="image/*"
        multiple
        :before-upload="beforeUpload"
        :on-change="onFileChange"
      >
        <el-button type="primary">上傳圖片</el-button>
      </el-upload>
    </div>

    <!-- 篩選列 -->
    <div class="mb-4 flex gap-3">
      <el-select
        v-model="filterType"
        placeholder="篩選標籤類型"
        clearable
        style="width: 140px"
      >
        <el-option
          v-for="(label, type) in TAG_TYPE_LABEL"
          :key="type"
          :label="label"
          :value="type"
        />
      </el-select>
      <el-select
        v-model="filterTagId"
        placeholder="篩選標籤"
        clearable
        style="width: 180px"
      >
        <el-option
          v-for="tag in filteredTags"
          :key="tag.id"
          :label="tag.name"
          :value="tag.id"
        />
      </el-select>
    </div>

    <!-- 圖片 Grid -->
    <div v-loading="loading">
      <el-empty
        v-if="!loading && mediaList.length === 0"
        description="圖庫空空如也"
      />
      <div
        v-else
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        <div
          v-for="media in mediaList"
          :key="media.id"
          class="cursor-pointer overflow-hidden rounded border border-gray-200 hover:border-blue-400"
          @click="openDrawer(media)"
        >
          <div class="relative aspect-square bg-gray-50">
            <img
              :src="media.url"
              :alt="media.altText !== null ? media.altText : media.filename"
              class="size-full object-cover"
              loading="lazy"
            />
          </div>
          <div class="truncate px-2 py-1 text-xs text-gray-500">
            {{
              media.originalName !== null ? media.originalName : media.filename
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- 詳情 Drawer -->
    <el-drawer
      v-model="drawerVisible"
      title="圖片詳情"
      size="420px"
      :destroy-on-close="true"
    >
      <template v-if="selectedMedia">
        <!-- 預覽 -->
        <div class="mb-4 flex justify-center">
          <img
            :src="selectedMedia.url"
            :alt="selectedMedia.altText !== null ? selectedMedia.altText : ''"
            class="max-h-64 max-w-full rounded object-contain"
          />
        </div>

        <!-- 基本資訊 -->
        <el-descriptions :column="1" border size="small" class="mb-4">
          <el-descriptions-item label="檔名">
            {{ selectedMedia.filename }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="selectedMedia.originalName"
            label="原始名稱"
          >
            {{ selectedMedia.originalName }}
          </el-descriptions-item>
          <el-descriptions-item label="URL">
            <a
              :href="selectedMedia.url"
              target="_blank"
              class="text-blue-500 underline break-all"
            >
              {{ selectedMedia.url }}
            </a>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedMedia.fileSize" label="大小">
            {{ (selectedMedia.fileSize / 1024).toFixed(1) }} KB
          </el-descriptions-item>
        </el-descriptions>

        <!-- Alt text 編輯 -->
        <div class="mb-4">
          <div class="mb-1 text-sm font-medium">Alt Text（SEO）</div>
          <div class="flex gap-2">
            <el-input
              v-model="editingAltText"
              placeholder="圖片描述文字"
              clearable
            />
            <el-button
              type="primary"
              :loading="altTextSaving"
              @click="saveAltText"
            >
              儲存
            </el-button>
          </div>
        </div>

        <!-- 標籤管理 -->
        <div class="mb-4">
          <div class="mb-2 text-sm font-medium">標籤</div>
          <div class="mb-2 flex flex-wrap gap-1">
            <el-tag
              v-for="tag in (selectedMedia as any).tags ?? []"
              :key="tag.id"
              closable
              size="small"
              @close="unassignTag(tag.id)"
            >
              {{ tag.name }}
            </el-tag>
            <span
              v-if="!(selectedMedia as any).tags?.length"
              class="text-xs text-gray-400"
            >
              尚無標籤
            </span>
          </div>
          <div class="flex gap-2">
            <el-select
              v-model="addingTagId"
              placeholder="新增標籤"
              clearable
              size="small"
              style="width: 160px"
            >
              <el-option
                v-for="tag in availableTagsForMedia"
                :key="tag.id"
                :label="`${tag.name} (${TAG_TYPE_LABEL[tag.type]})`"
                :value="tag.id"
              />
            </el-select>
            <el-button size="small" @click="assignTag">新增</el-button>
          </div>
        </div>

        <!-- 刪除 -->
        <el-divider />
        <el-button type="danger" plain @click="removeMedia"
          >刪除此圖片</el-button
        >
      </template>
    </el-drawer>
  </div>
</template>
