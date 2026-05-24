<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { type Booking, getBookingDetail } from "@/api/booking";
import BookingInfoTab from "./tabs/BookingInfoTab.vue";
import BookingQuoteTab from "./tabs/BookingQuoteTab.vue";
import BookingNotesTab from "./tabs/BookingNotesTab.vue";
import BookingMaterialsTab from "./tabs/BookingMaterialsTab.vue";
import BookingPhotosTab from "./tabs/BookingPhotosTab.vue";

interface Props {
  bookingId: number;
}

interface Emits {
  (e: "updated"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);
const booking = ref<Booking | null>(null);
const activeTab = ref("info");

const fetchBooking = async () => {
  loading.value = true;
  try {
    booking.value = await getBookingDetail(props.bookingId);
  } catch {
    ElMessage.error("載入預約詳情失敗");
  } finally {
    loading.value = false;
  }
};

// Called by child tabs after mutations that affect the booking data
const refreshBooking = async () => {
  await fetchBooking();
  emit("updated");
};

onMounted(fetchBooking);
</script>

<template>
  <div v-loading="loading" class="booking-detail">
    <template v-if="booking">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本資訊" name="info">
          <BookingInfoTab :booking="booking" />
        </el-tab-pane>

        <el-tab-pane label="報價 & 收款" name="quote">
          <BookingQuoteTab :booking="booking" @updated="refreshBooking" />
        </el-tab-pane>

        <el-tab-pane label="溝通紀錄" name="notes" lazy>
          <BookingNotesTab :booking-id="booking.id" />
        </el-tab-pane>

        <el-tab-pane label="材料清單" name="materials" lazy>
          <BookingMaterialsTab :booking="booking" @updated="refreshBooking" />
        </el-tab-pane>

        <el-tab-pane label="完工照片" name="photos" lazy>
          <BookingPhotosTab
            :booking-id="booking.id"
            :booking-status="booking.status"
          />
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<style scoped>
.booking-detail {
  min-height: 300px;
}
</style>
