<script setup lang="ts">
import { ref, computed } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import zhTwLocale from "@fullcalendar/core/locales/zh-tw";
import type {
  CalendarOptions,
  EventClickArg,
  EventSourceFuncArg
} from "@fullcalendar/core";
import { ElMessage } from "element-plus";

import { getBookingsByDateRange, BOOKING_STATUS } from "@/api/booking";
import BookingDetail from "./BookingDetail.vue";
import { transformBookingToEvent, STATUS_COLORS } from "./utils";

// ── Drawer State ────────────────────────────────────────────────

const drawerVisible = ref(false);
const selectedBookingId = ref<number | null>(null);

const openDetail = (bookingId: number) => {
  selectedBookingId.value = bookingId;
  drawerVisible.value = true;
};

const refreshCalendar = () => {
  calendarRef.value?.getApi().refetchEvents();
};

// ── Calendar ────────────────────────────────────────────────────

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const showCancelled = ref(false);

const fetchEvents = async (
  fetchInfo: EventSourceFuncArg,
  successCallback: (events: any[]) => void,
  failureCallback: (error: any) => void
) => {
  try {
    const bookings = await getBookingsByDateRange(
      fetchInfo.start.toISOString(),
      fetchInfo.end.toISOString()
    );

    const events = bookings
      .filter(booking => showCancelled.value || booking.status !== "CANCELLED")
      .map(booking => transformBookingToEvent(booking))
      .filter(Boolean);

    successCallback(events);
  } catch (error) {
    ElMessage.error("載入行事曆資料失敗");
    failureCallback(error);
  }
};

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  locale: zhTwLocale,
  initialView: "dayGridMonth",
  headerToolbar: {
    left: "prev,today,next",
    center: "title",
    right: "dayGridMonth,timeGridWeek"
  },
  events: fetchEvents,
  lazyFetching: true,
  eventClick: (info: EventClickArg) => {
    const bookingId = Number(info.event.id);
    if (bookingId) openDetail(bookingId);
  },
  eventDisplay: "block",
  dayMaxEvents: 4,
  height: "auto"
}));

// ── Legend ───────────────────────────────────────────────────────

const legendItems = computed(() =>
  Object.entries(BOOKING_STATUS)
    .filter(([key]) => showCancelled.value || key !== "CANCELLED")
    .map(([key, config]) => ({
      key,
      label: config.label,
      color: STATUS_COLORS[key]
    }))
);

const toggleCancelled = () => {
  showCancelled.value = !showCancelled.value;
  calendarRef.value?.getApi().refetchEvents();
};
</script>

<template>
  <div class="booking-calendar">
    <!-- Toolbar -->
    <div class="calendar-toolbar">
      <div class="legend">
        <span v-for="item in legendItems" :key="item.key" class="legend-item">
          <span class="legend-dot" :style="{ backgroundColor: item.color }" />
          {{ item.label }}
        </span>
      </div>
      <el-checkbox :model-value="showCancelled" @change="toggleCancelled">
        顯示已取消
      </el-checkbox>
    </div>

    <!-- Calendar -->
    <FullCalendar ref="calendarRef" :options="calendarOptions" />

    <!-- Detail Drawer -->
    <el-drawer
      v-model="drawerVisible"
      title="預約詳情"
      direction="rtl"
      size="680px"
      destroy-on-close
    >
      <BookingDetail
        v-if="selectedBookingId"
        :booking-id="selectedBookingId"
        @updated="refreshCalendar"
      />
    </el-drawer>
  </div>
</template>

<style scoped>
.booking-calendar {
  padding: 20px;
}

.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.legend-item {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: #606266;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

/* Reset Tailwind Preflight interference with FullCalendar borders */
:deep(.fc) {
  --fc-border-color: #e4e7ed;
  --fc-today-bg-color: #ecf5ff;
}

:deep(.fc td),
:deep(.fc th) {
  border: 1px solid var(--fc-border-color);
}

:deep(.fc .fc-daygrid-day-events) {
  padding: 2px 4px;
}

:deep(.fc .fc-event) {
  padding: 2px 6px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
}

:deep(.fc .fc-event-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.fc .fc-toolbar-title) {
  font-size: 18px;
  font-weight: 600;
}
</style>
