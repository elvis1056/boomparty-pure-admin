<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getMediaList,
  uploadMedia,
  updateAltText,
  deleteMedia,
  getMediaUsage,
  addTagToMedia,
  removeTagFromMedia,
  type MediaAsset,
  type MediaUsage
} from "@/api/media";
import { getTags, type Tag, type TagType } from "@/api/tag";
import UploadFilledIcon from "~icons/ep/upload-filled";

// ── State ───────────────────────────────────────────────────────

const loading = ref(false);
const mediaList = ref<MediaAsset[]>([]);
const tags = ref<Tag[]>([]);

// Filters
const searchText = ref("");
const filterTagId = ref<number | null>(null);
const filterType = ref<TagType | null>(null);

// Upload
const uploadingCount = ref(0);

// Selection (batch mode)
const selectedIds = ref<Set<number>>(new Set());

// Detail drawer
const drawerVisible = ref(false);
const selectedMedia = ref<MediaAsset | null>(null);
const editingAltText = ref("");
const altTextSaving = ref(false);
const addingTagId = ref<number | null>(null);
const mediaUsage = ref<MediaUsage | null>(null);
const usageLoading = ref(false);

// Batch tag
const batchTagId = ref<number | null>(null);

// ── Constants ───────────────────────────────────────────────────

const BYTES_PER_KB = 1024;

const TAG_TYPE_LABEL: Record<TagType, string> = {
  CONTENT: "內容",
  STYLE: "風格",
  OCCASION: "場合"
};

// ── Data Fetching ───────────────────────────────────────────────

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

onMounted(fetchAll);

// ── Computed ────────────────────────────────────────────────────

const tagsByType = computed(() => {
  if (!filterType.value) {
    return tags.value;
  }
  return tags.value.filter(tag => tag.type === filterType.value);
});

const filteredMedia = computed(() => {
  return mediaList.value.filter(media => {
    // Search filter (filename / originalName / altText)
    if (searchText.value) {
      const keyword = searchText.value.toLowerCase();
      const matchFilename = media.filename.toLowerCase().includes(keyword);
      const matchOriginal = media.originalName
        ? media.originalName.toLowerCase().includes(keyword)
        : false;
      const matchAlt = media.altText
        ? media.altText.toLowerCase().includes(keyword)
        : false;
      if (!matchFilename && !matchOriginal && !matchAlt) {
        return false;
      }
    }

    // Tag filter
    if (filterTagId.value !== null) {
      const hasTag = media.tags.some(tag => tag.id === filterTagId.value);
      if (!hasTag) {
        return false;
      }
    }

    return true;
  });
});

const availableTagsForMedia = computed(() => {
  if (!selectedMedia.value) {
    return tags.value;
  }
  const assignedIds = new Set(selectedMedia.value.tags.map(tag => tag.id));
  return tags.value.filter(tag => !assignedIds.has(tag.id));
});

const isAllSelected = computed(() => {
  if (filteredMedia.value.length === 0) {
    return false;
  }
  return filteredMedia.value.every(media => selectedIds.value.has(media.id));
});

// ── Selection ───────────────────────────────────────────────────

const toggleSelect = (mediaId: number) => {
  const newSet = new Set(selectedIds.value);
  if (newSet.has(mediaId)) {
    newSet.delete(mediaId);
  } else {
    newSet.add(mediaId);
  }
  selectedIds.value = newSet;
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(filteredMedia.value.map(media => media.id));
  }
};

const clearSelection = () => {
  selectedIds.value = new Set();
};

// ── Drawer Actions ──────────────────────────────────────────────

const openDrawer = async (media: MediaAsset) => {
  selectedMedia.value = media;
  editingAltText.value = media.altText ? media.altText : "";
  mediaUsage.value = null;
  drawerVisible.value = true;

  // Fetch usage in background
  usageLoading.value = true;
  try {
    mediaUsage.value = await getMediaUsage(media.id);
  } catch {
    // Non-critical
  } finally {
    usageLoading.value = false;
  }
};

const saveAltText = async () => {
  if (!selectedMedia.value) {
    return;
  }
  altTextSaving.value = true;
  try {
    const updated = await updateAltText(
      selectedMedia.value.id,
      editingAltText.value
    );
    selectedMedia.value = updated;
    const index = mediaList.value.findIndex(media => media.id === updated.id);
    if (index !== -1) {
      mediaList.value[index] = updated;
    }
    ElMessage.success("已更新 alt text");
  } catch {
    ElMessage.error("更新失敗");
  } finally {
    altTextSaving.value = false;
  }
};

const assignTag = async () => {
  if (!selectedMedia.value || addingTagId.value === null) {
    return;
  }
  try {
    const updated = await addTagToMedia(
      selectedMedia.value.id,
      addingTagId.value
    );
    selectedMedia.value = updated;
    const index = mediaList.value.findIndex(media => media.id === updated.id);
    if (index !== -1) {
      mediaList.value[index] = updated;
    }
    addingTagId.value = null;
    ElMessage.success("已新增標籤");
  } catch {
    ElMessage.error("新增標籤失敗");
  }
};

const unassignTag = async (tagId: number) => {
  if (!selectedMedia.value) {
    return;
  }
  try {
    await removeTagFromMedia(selectedMedia.value.id, tagId);
    selectedMedia.value = {
      ...selectedMedia.value,
      tags: selectedMedia.value.tags.filter(tag => tag.id !== tagId)
    };
    const index = mediaList.value.findIndex(
      media => media.id === selectedMedia.value!.id
    );
    if (index !== -1) {
      mediaList.value[index] = { ...selectedMedia.value };
    }
    ElMessage.success("已移除標籤");
  } catch {
    ElMessage.error("移除標籤失敗");
  }
};

const removeMedia = async () => {
  if (!selectedMedia.value) {
    return;
  }
  const displayName = selectedMedia.value.originalName
    ? selectedMedia.value.originalName
    : selectedMedia.value.filename;
  try {
    await ElMessageBox.confirm(
      `確定刪除「${displayName}」？此操作無法復原。`,
      "刪除確認",
      { type: "warning", confirmButtonText: "刪除", cancelButtonText: "取消" }
    );
    await deleteMedia(selectedMedia.value.id);
    mediaList.value = mediaList.value.filter(
      media => media.id !== selectedMedia.value!.id
    );
    drawerVisible.value = false;
    ElMessage.success("已刪除");
  } catch (error: unknown) {
    if (error === "cancel") {
      return;
    }
    const detail =
      error !== null &&
      typeof error === "object" &&
      "response" in error &&
      error.response !== null &&
      typeof error.response === "object" &&
      "data" in error.response &&
      error.response.data !== null &&
      typeof error.response.data === "object" &&
      "detail" in error.response.data
        ? String(error.response.data.detail)
        : "刪除失敗";
    ElMessage.error(detail);
  }
};

// ── Batch Actions ───────────────────────────────────────────────

const batchDelete = async () => {
  const count = selectedIds.value.size;
  try {
    await ElMessageBox.confirm(
      `確定刪除 ${count} 張圖片？此操作無法復原。`,
      "批次刪除",
      { type: "error", confirmButtonText: "刪除", cancelButtonText: "取消" }
    );
    const results = await Promise.allSettled(
      Array.from(selectedIds.value).map(id => deleteMedia(id))
    );
    const successCount = results.filter(
      result => result.status === "fulfilled"
    ).length;
    const failCount = results.filter(
      result => result.status === "rejected"
    ).length;
    if (failCount > 0) {
      const firstReason = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected"
        )
        .map(result => {
          const reason = result.reason;
          if (
            reason !== null &&
            typeof reason === "object" &&
            "response" in reason &&
            reason.response !== null &&
            typeof reason.response === "object" &&
            "data" in reason.response &&
            reason.response.data !== null &&
            typeof reason.response.data === "object" &&
            "detail" in reason.response.data
          ) {
            return String(reason.response.data.detail);
          }
          return null;
        })
        .find(Boolean);
      ElMessage.warning(
        `${successCount} 張已刪除，${failCount} 張失敗` +
          (firstReason ? `：${firstReason}` : "")
      );
    } else {
      ElMessage.success(`已刪除 ${successCount} 張圖片`);
    }
    clearSelection();
    fetchAll();
  } catch {
    // User cancelled
  }
};

const batchAddTag = async () => {
  if (batchTagId.value === null) {
    return;
  }
  const count = selectedIds.value.size;
  const tagName = tags.value.find(tag => tag.id === batchTagId.value)?.name;
  try {
    await ElMessageBox.confirm(
      `確定為 ${count} 張圖片加上標籤「${tagName}」？`,
      "批次加標籤",
      {
        type: "warning",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
      }
    );
    const results = await Promise.allSettled(
      Array.from(selectedIds.value).map(id =>
        addTagToMedia(id, batchTagId.value!)
      )
    );
    const successCount = results.filter(
      result => result.status === "fulfilled"
    ).length;
    const failCount = results.filter(
      result => result.status === "rejected"
    ).length;
    if (failCount > 0) {
      ElMessage.warning(`${successCount} 張成功，${failCount} 張失敗`);
    } else {
      ElMessage.success(`已為 ${successCount} 張圖片加上標籤`);
    }
    batchTagId.value = null;
    clearSelection();
    fetchAll();
  } catch {
    // User cancelled
  }
};

// ── Upload ──────────────────────────────────────────────────────

const uploadRef = ref();
const beforeUpload = () => false;

const onFileChange = async (file: { raw: File }) => {
  uploadingCount.value++;
  try {
    const result = await uploadMedia(file.raw);
    mediaList.value.unshift(result);
    ElMessage.success(`已上傳 ${file.raw.name}`);
  } catch {
    ElMessage.error(`上傳失敗：${file.raw.name}`);
  } finally {
    uploadingCount.value--;
  }
};

// ── Helpers ─────────────────────────────────────────────────────

const formatFileSize = (bytes: number | null): string => {
  if (bytes === null) {
    return "—";
  }
  if (bytes < BYTES_PER_KB) {
    return `${bytes} B`;
  }
  return `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;
};

const resetFilters = () => {
  searchText.value = "";
  filterTagId.value = null;
  filterType.value = null;
};

const totalUsageCount = computed(() => {
  if (!mediaUsage.value) {
    return 0;
  }
  return mediaUsage.value.products.length + mediaUsage.value.categories.length;
});
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="mb-4">
      <h2 class="text-xl font-bold">媒體庫</h2>
    </div>

    <!-- Drag & Drop Upload -->
    <el-upload
      ref="uploadRef"
      v-loading="uploadingCount > 0"
      :element-loading-text="`正在上傳（${uploadingCount} 張）...`"
      :auto-upload="false"
      :show-file-list="false"
      accept="image/*"
      multiple
      drag
      :before-upload="beforeUpload"
      :on-change="onFileChange"
      class="mb-4 upload-area"
    >
      <el-icon class="el-icon--upload"><UploadFilledIcon /></el-icon>
      <div class="el-upload__text">
        拖拉圖片到這裡，或 <em>點擊選擇檔案</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          支援 JPG / PNG / GIF / WebP，可一次選多張
        </div>
      </template>
    </el-upload>

    <!-- Search & Filter -->
    <div class="mb-4 flex flex-wrap gap-3">
      <el-input
        v-model="searchText"
        placeholder="搜尋檔名 / alt text"
        clearable
        style="width: 260px"
      />
      <el-select
        v-model="filterType"
        placeholder="標籤類型"
        clearable
        style="width: 140px"
        @change="filterTagId = null"
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
          v-for="tag in tagsByType"
          :key="tag.id"
          :label="tag.name"
          :value="tag.id"
        />
      </el-select>
      <el-button
        v-if="searchText || filterTagId !== null || filterType !== null"
        text
        @click="resetFilters"
      >
        清除篩選
      </el-button>
    </div>

    <!-- Batch Action Bar -->
    <div
      v-if="selectedIds.size > 0"
      class="mb-4 flex flex-wrap items-center gap-3"
    >
      <span class="text-sm">已選 {{ selectedIds.size }} 張</span>
      <el-select
        v-model="batchTagId"
        placeholder="選擇標籤"
        clearable
        size="small"
        style="width: 160px"
      >
        <el-option
          v-for="tag in tags"
          :key="tag.id"
          :label="`${tag.name} (${TAG_TYPE_LABEL[tag.type]})`"
          :value="tag.id"
        />
      </el-select>
      <el-button
        size="small"
        :disabled="batchTagId === null"
        @click="batchAddTag"
      >
        批次加標籤
      </el-button>
      <el-button size="small" type="danger" @click="batchDelete">
        批次刪除
      </el-button>
      <el-button size="small" text @click="clearSelection">取消選取</el-button>
    </div>

    <!-- Select All Toggle -->
    <div class="mb-3 flex items-center gap-2">
      <el-checkbox
        :model-value="isAllSelected"
        :indeterminate="selectedIds.size > 0 && !isAllSelected"
        @change="toggleSelectAll"
      >
        全選（{{ filteredMedia.length }} 張）
      </el-checkbox>
    </div>

    <!-- Image Grid -->
    <div v-loading="loading">
      <el-empty
        v-if="!loading && filteredMedia.length === 0"
        :description="
          searchText || filterTagId !== null
            ? '沒有符合篩選的圖片'
            : '圖庫空空如也'
        "
      />
      <div
        v-else
        class="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        <div
          v-for="media in filteredMedia"
          :key="media.id"
          class="media-card"
          :class="{ 'media-card-selected': selectedIds.has(media.id) }"
        >
          <!-- Selection checkbox -->
          <div class="card-checkbox" @click.stop="toggleSelect(media.id)">
            <el-checkbox
              :model-value="selectedIds.has(media.id)"
              @change="toggleSelect(media.id)"
              @click.stop
            />
          </div>

          <!-- Image -->
          <div class="card-image-wrapper" @click="openDrawer(media)">
            <img
              :src="media.url"
              :alt="media.altText ? media.altText : media.filename"
              class="card-image"
              loading="lazy"
            />
            <!-- Hover overlay with action buttons -->
            <div class="card-overlay">
              <el-button
                size="small"
                type="primary"
                @click.stop="openDrawer(media)"
              >
                詳情
              </el-button>
            </div>
          </div>

          <!-- Card info -->
          <div class="card-info">
            <div
              class="card-filename"
              :title="media.originalName ? media.originalName : media.filename"
            >
              {{ media.originalName ? media.originalName : media.filename }}
            </div>
            <div class="card-meta">
              <span v-if="media.width && media.height"
                >{{ media.width }}x{{ media.height }}</span
              >
              <span v-if="media.fileSize">{{
                formatFileSize(media.fileSize)
              }}</span>
            </div>
            <div v-if="media.altText" class="card-alt" :title="media.altText">
              {{ media.altText }}
            </div>
            <div v-if="media.tags.length > 0" class="card-tags">
              <el-tag
                v-for="tag in media.tags"
                :key="tag.id"
                size="small"
                class="card-tag"
              >
                {{ tag.name }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Drawer -->
    <el-drawer
      v-model="drawerVisible"
      title="圖片詳情"
      size="480px"
      :destroy-on-close="true"
    >
      <template v-if="selectedMedia">
        <!-- Preview -->
        <div class="mb-4 flex justify-center">
          <img
            :src="selectedMedia.url"
            :alt="selectedMedia.altText ? selectedMedia.altText : ''"
            class="max-h-64 max-w-full rounded object-contain"
          />
        </div>

        <!-- Basic Info -->
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
            {{ formatFileSize(selectedMedia.fileSize) }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="selectedMedia.width && selectedMedia.height"
            label="尺寸"
          >
            {{ selectedMedia.width }} x {{ selectedMedia.height }} px
          </el-descriptions-item>
        </el-descriptions>

        <!-- Alt text editor -->
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

        <!-- Tag management -->
        <div class="mb-4">
          <div class="mb-2 text-sm font-medium">標籤</div>
          <div class="mb-2 flex flex-wrap gap-1">
            <el-tag
              v-for="tag in selectedMedia.tags"
              :key="tag.id"
              closable
              size="small"
              @close="unassignTag(tag.id)"
            >
              {{ tag.name }}
            </el-tag>
            <span
              v-if="selectedMedia.tags.length === 0"
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

        <!-- Usage indicator -->
        <div class="mb-4">
          <div class="mb-2 text-sm font-medium">使用狀態</div>
          <div v-loading="usageLoading">
            <template v-if="mediaUsage">
              <template v-if="totalUsageCount > 0">
                <div v-if="mediaUsage.products.length > 0" class="mb-2">
                  <div class="mb-1 text-xs text-gray-500">商品引用</div>
                  <div
                    v-for="product in mediaUsage.products"
                    :key="product.id"
                    class="usage-item"
                  >
                    {{ product.name }}
                  </div>
                </div>
                <div v-if="mediaUsage.categories.length > 0">
                  <div class="mb-1 text-xs text-gray-500">分類封面</div>
                  <div
                    v-for="category in mediaUsage.categories"
                    :key="category.id"
                    class="usage-item"
                  >
                    {{ category.name }}
                  </div>
                </div>
              </template>
              <span v-else class="text-xs text-gray-400">
                未被任何商品或分類引用
              </span>
            </template>
          </div>
        </div>

        <!-- Delete -->
        <el-divider />
        <el-button type="danger" plain @click="removeMedia">
          刪除此圖片
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.media-card {
  position: relative;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 2px solid var(--el-border-color-light);
  border-radius: 8px;
  transition: border-color 0.2s;
}

.media-card:hover {
  border-color: var(--el-color-primary-light-3);
}

.media-card-selected {
  border-color: var(--el-color-primary);
}

.card-checkbox {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
}

.card-image-wrapper {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  background: var(--el-fill-color-light);
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 40%);
  opacity: 0;
  transition: opacity 0.2s;
}

.card-image-wrapper:hover .card-overlay {
  opacity: 1;
}

.card-info {
  padding: 8px 10px;
}

.card-filename {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  gap: 8px;
  margin-top: 2px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.card-alt {
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.card-tag {
  font-size: 10px;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  padding: 20px;
}

.usage-item {
  padding: 4px 8px;
  margin-bottom: 4px;
  font-size: 13px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
</style>
