<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  type BookingPhoto,
  type BookingStatusValue,
  getBookingPhotos,
  addBookingPhoto,
  deleteBookingPhoto
} from "@/api/booking";
import { type MediaAsset } from "@/api/media";
import MediaPickerDialog from "@/components/MediaPickerDialog.vue";

interface Props {
  bookingId: number;
  bookingStatus: BookingStatusValue;
}

const props = defineProps<Props>();

const loading = ref(false);
const error = ref(false);
const photos = ref<BookingPhoto[]>([]);

const pickerVisible = ref(false);
const pickerValue = ref<MediaAsset | null>(null);

const canAddPhotos = computed(() => props.bookingStatus === "COMPLETED");

const fetchPhotos = async () => {
  loading.value = true;
  error.value = false;
  try {
    const data = await getBookingPhotos(props.bookingId);
    photos.value = Array.isArray(data) ? data : [];
  } catch {
    error.value = true;
    ElMessage.error("載入完工照片失敗");
  } finally {
    loading.value = false;
  }
};

const openPicker = () => {
  pickerVisible.value = true;
};

// Watch picker selection
watch(pickerValue, async selected => {
  if (!selected) {
    return;
  }
  try {
    const photo = await addBookingPhoto(props.bookingId, selected.id);
    photos.value.push(photo);
    ElMessage.success("照片已新增");
  } catch {
    ElMessage.error("新增照片失敗");
  }
  pickerValue.value = null;
});

const removePhoto = async (photo: BookingPhoto) => {
  const name =
    photo.originalName !== null ? photo.originalName : `照片 #${photo.id}`;
  try {
    await ElMessageBox.confirm(`確定要移除「${name}」嗎？`, "移除照片", {
      type: "warning"
    });
  } catch {
    return; // User cancelled
  }

  try {
    await deleteBookingPhoto(props.bookingId, photo.id);
    photos.value = photos.value.filter(item => item.id !== photo.id);
    ElMessage.success("照片已移除");
  } catch {
    ElMessage.error("移除照片失敗");
  }
};

onMounted(fetchPhotos);
</script>

<template>
  <div>
    <!-- Add photo button -->
    <div v-if="canAddPhotos" class="mb-4">
      <el-button type="primary" @click="openPicker">新增照片</el-button>
    </div>
    <div v-else class="mb-4">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        description="預約狀態為「已完成」時才能新增完工照片"
      />
    </div>

    <!-- Photos grid -->
    <div v-loading="loading">
      <div v-if="error && !loading" class="py-8 text-center text-gray-400">
        載入失敗，
        <el-button type="primary" link @click="fetchPhotos">重試</el-button>
      </div>

      <el-empty
        v-if="!loading && !error && photos.length === 0"
        description="尚無完工照片"
      />

      <div v-if="photos.length > 0" class="grid grid-cols-3 gap-3">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="group relative overflow-hidden rounded border"
        >
          <div class="aspect-square bg-gray-50">
            <img
              :src="photo.url"
              :alt="photo.altText !== null ? photo.altText : ''"
              class="size-full object-cover"
              loading="lazy"
            />
          </div>
          <!-- Overlay with delete button -->
          <div
            class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <el-button
              type="danger"
              size="small"
              circle
              @click="removePhoto(photo)"
            >
              <template #icon>
                <span class="text-xs">✕</span>
              </template>
            </el-button>
          </div>
          <!-- File name -->
          <div class="truncate px-1 py-0.5 text-xs text-gray-500">
            {{
              photo.originalName !== null
                ? photo.originalName
                : `照片 #${photo.id}`
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- Media Picker Dialog -->
    <MediaPickerDialog v-model="pickerValue" v-model:visible="pickerVisible" />
  </div>
</template>
