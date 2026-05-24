<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  type BookingNote,
  getBookingNotes,
  addBookingNote
} from "@/api/booking";

interface Props {
  bookingId: number;
}

const props = defineProps<Props>();

const loading = ref(false);
const error = ref(false);
const notes = ref<BookingNote[]>([]);
const newContent = ref("");
const submitting = ref(false);

const fetchNotes = async () => {
  loading.value = true;
  error.value = false;
  try {
    const data = await getBookingNotes(props.bookingId);
    notes.value = Array.isArray(data) ? data : [];
  } catch {
    error.value = true;
    ElMessage.error("載入溝通紀錄失敗");
  } finally {
    loading.value = false;
  }
};

const submitNote = async () => {
  const content = newContent.value.trim();
  if (!content) {
    ElMessage.error("備註內容不能為空");
    return;
  }

  submitting.value = true;
  try {
    const note = await addBookingNote(props.bookingId, content);
    notes.value.unshift(note);
    newContent.value = "";
    ElMessage.success("備註已新增");
  } catch {
    ElMessage.error("新增備註失敗");
  } finally {
    submitting.value = false;
  }
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

onMounted(fetchNotes);
</script>

<template>
  <div>
    <!-- Add note form -->
    <div class="mb-4 flex gap-2">
      <el-input
        v-model="newContent"
        type="textarea"
        :rows="2"
        placeholder="新增備註..."
        :disabled="submitting"
      />
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!newContent.trim()"
        style="align-self: flex-end"
        @click="submitNote"
      >
        新增
      </el-button>
    </div>

    <!-- Notes timeline -->
    <div v-loading="loading">
      <el-empty
        v-if="!loading && !error && notes.length === 0"
        description="尚無溝通紀錄"
      />

      <div v-if="error && !loading" class="py-8 text-center text-gray-400">
        載入失敗，
        <el-button type="primary" link @click="fetchNotes">重試</el-button>
      </div>

      <el-timeline v-if="notes.length > 0">
        <el-timeline-item
          v-for="note in notes"
          :key="note.id"
          :timestamp="`${formatDate(note.createdAt)} — ${note.createdBy}`"
          placement="top"
        >
          <p class="whitespace-pre-wrap">{{ note.content }}</p>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>
