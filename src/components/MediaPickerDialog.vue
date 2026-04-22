<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage, type UploadFile } from "element-plus";
import { getMediaList, uploadMedia, type MediaAsset } from "@/api/media";

interface Props {
  modelValue: MediaAsset | MediaAsset[] | null;
  visible?: boolean;
  multiple?: boolean;
}

interface Emits {
  (e: "update:modelValue", value: MediaAsset | MediaAsset[] | null): void;
  (e: "update:visible", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  multiple: false
});

const emit = defineEmits<Emits>();

const internalVisible = ref(false);

// 同步外部 visible → 內部，並在開啟時初始化
watch(
  () => props.visible,
  val => {
    if (val) {
      initSelection();
      internalVisible.value = true;
      if (mediaList.value.length === 0) fetchMedia();
    } else {
      internalVisible.value = false;
    }
  }
);

// 內部關閉時通知父層
watch(internalVisible, val => {
  if (!val) emit("update:visible", false);
});
const loading = ref(false);
const mediaList = ref<MediaAsset[]>([]);
const searchText = ref("");

// 已選中（多選模式用 Set，單選模式只保留最後一個）
const selectedIds = ref<Set<number>>(new Set());

const filteredList = computed(() => {
  const q = searchText.value.trim().toLowerCase();
  if (!q) return mediaList.value;
  return mediaList.value.filter(
    m =>
      (m.originalName !== null && m.originalName.toLowerCase().includes(q)) ||
      m.filename.toLowerCase().includes(q) ||
      (m.altText !== null && m.altText.toLowerCase().includes(q))
  );
});

const initSelection = () => {
  selectedIds.value = new Set();
  if (props.modelValue) {
    if (Array.isArray(props.modelValue)) {
      props.modelValue.forEach(m => selectedIds.value.add(m.id));
    } else {
      selectedIds.value.add(props.modelValue.id);
    }
  }
};

const fetchMedia = async () => {
  loading.value = true;
  try {
    const data = await getMediaList();
    mediaList.value = Array.isArray(data) ? data : [];
  } catch {
    ElMessage.error("載入圖庫失敗");
  } finally {
    loading.value = false;
  }
};

const toggleSelect = (media: MediaAsset) => {
  if (props.multiple) {
    if (selectedIds.value.has(media.id)) {
      selectedIds.value.delete(media.id);
    } else {
      selectedIds.value.add(media.id);
    }
    // 觸發響應式更新
    selectedIds.value = new Set(selectedIds.value);
  } else {
    selectedIds.value = new Set([media.id]);
  }
};

const confirmSelection = () => {
  if (props.multiple) {
    const selected = mediaList.value.filter(m => selectedIds.value.has(m.id));
    emit("update:modelValue", selected.length > 0 ? selected : null);
  } else {
    const selected = mediaList.value.find(m => selectedIds.value.has(m.id));
    emit("update:modelValue", selected !== undefined ? selected : null);
  }
  internalVisible.value = false;
};

// 上傳並加入選中
const onFileChange = async (file: UploadFile) => {
  if (!file.raw) return;
  try {
    const result = await uploadMedia(file.raw);
    mediaList.value.unshift(result);
    if (!props.multiple) {
      selectedIds.value = new Set([result.id]);
    } else {
      selectedIds.value = new Set([...selectedIds.value, result.id]);
    }
    ElMessage.success("上傳成功");
  } catch {
    ElMessage.error("上傳失敗");
  }
};
</script>

<template>
  <el-dialog
    v-model="internalVisible"
    title="選擇圖片"
    width="860px"
    :destroy-on-close="false"
    append-to-body
  >
    <!-- 搜尋列 + 上傳 -->
    <div class="mb-4 flex items-center gap-3">
      <el-input
        v-model="searchText"
        placeholder="搜尋圖片名稱或 alt text"
        clearable
        style="flex: 1"
      />
      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        accept="image/*"
        :on-change="onFileChange"
      >
        <el-button>上傳新圖</el-button>
      </el-upload>
    </div>

    <!-- 圖片 Grid -->
    <div v-loading="loading" class="h-96 overflow-y-auto">
      <el-empty
        v-if="!loading && filteredList.length === 0"
        description="找不到圖片"
      />
      <div v-else class="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
        <div
          v-for="media in filteredList"
          :key="media.id"
          class="relative cursor-pointer overflow-hidden rounded border-2 transition-colors"
          :class="
            selectedIds.has(media.id)
              ? 'border-blue-500'
              : 'border-transparent hover:border-gray-300'
          "
          @click="toggleSelect(media)"
        >
          <div class="aspect-square bg-gray-50">
            <img
              :src="media.url"
              :alt="media.altText !== null ? media.altText : ''"
              class="size-full object-cover"
              loading="lazy"
            />
          </div>
          <!-- 勾選標記 -->
          <div
            v-if="selectedIds.has(media.id)"
            class="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold"
          >
            ✓
          </div>
          <div class="truncate px-1 py-0.5 text-xs text-gray-500">
            {{
              media.originalName !== null ? media.originalName : media.filename
            }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500">
          {{
            multiple
              ? `已選 ${selectedIds.size} 張`
              : selectedIds.size === 1
                ? "已選 1 張"
                : "未選擇"
          }}
        </span>
        <div class="flex gap-2">
          <el-button @click="internalVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSelection">確定</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
