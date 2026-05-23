<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getAllBookings,
  updateBookingStatus,
  BOOKING_STATUS,
  BOOKING_STATUS_TRANSITIONS,
  BOOKING_TYPE,
  type Booking,
  type BookingStatusValue
} from "@/api/booking";

// ── State ───────────────────────────────────────────────────────

const loading = ref(false);
const bookings = ref<Booking[]>([]);

// Filters
const activeTab = ref<BookingStatusValue | "ALL">("ALL");
const searchText = ref("");
const dateRange = ref<[string, string] | null>(null);

// Pagination
const currentPage = ref(1);
const pageSize = ref(15);

// ── Data Fetching ───────────────────────────────────────────────

const fetchBookings = async () => {
  loading.value = true;
  try {
    const data = await getAllBookings();
    bookings.value = Array.isArray(data) ? data : [];
  } catch {
    ElMessage.error("載入預約失敗");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchBookings);

// ── Computed ────────────────────────────────────────────────────

/** Count bookings per status (for tab badges) */
const statusCounts = computed(() => {
  const counts: Record<string, number> = { ALL: bookings.value.length };
  for (const key of Object.keys(BOOKING_STATUS)) {
    counts[key] = bookings.value.filter(
      booking => booking.status === key
    ).length;
  }
  return counts;
});

/** Get event date based on booking type */
const getEventDate = (booking: Booking): string | null => {
  if (booking.bookingType === "COMPLETION") {
    return booking.completionTime;
  }
  return booking.performanceStart;
};

/** Apply all filters (tab + search + date range) */
const filteredBookings = computed(() => {
  return bookings.value.filter(booking => {
    // Status tab filter
    if (activeTab.value !== "ALL" && booking.status !== activeTab.value) {
      return false;
    }

    // Search filter (customer name / phone / booking reference)
    if (searchText.value) {
      const keyword = searchText.value.toLowerCase();
      const matchName = booking.customerName.toLowerCase().includes(keyword);
      const matchPhone = booking.customerPhone.toLowerCase().includes(keyword);
      const matchRef = booking.bookingReference.toLowerCase().includes(keyword);
      if (!matchName && !matchPhone && !matchRef) {
        return false;
      }
    }

    // Date range filter (by event date)
    if (dateRange.value) {
      const eventDate = getEventDate(booking);
      if (!eventDate) return false;
      const eventDay = eventDate.slice(0, 10);
      if (eventDay < dateRange.value[0] || eventDay > dateRange.value[1]) {
        return false;
      }
    }

    return true;
  });
});

/** Paginated subset of filtered bookings */
const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredBookings.value.slice(start, start + pageSize.value);
});

// ── Actions ─────────────────────────────────────────────────────

const changeStatus = async (
  booking: Booking,
  newStatus: BookingStatusValue
) => {
  if (newStatus === booking.status) return;

  const newLabel = BOOKING_STATUS[newStatus].label;
  try {
    await ElMessageBox.confirm(
      `確定將預約 ${booking.bookingReference} 狀態改為「${newLabel}」？`,
      "更新預約狀態",
      {
        type: "warning",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
      }
    );
    await updateBookingStatus(booking.id, newStatus);
    ElMessage.success("狀態已更新");
    fetchBookings();
  } catch {
    // User cancelled
  }
};

const resetFilters = () => {
  searchText.value = "";
  dateRange.value = null;
  activeTab.value = "ALL";
  currentPage.value = 1;
};

// ── Helpers ─────────────────────────────────────────────────────

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatDateShort = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};

const formatCurrency = (amount: number | null): string => {
  if (amount === null || amount === undefined) return "—";
  return `NT$ ${amount.toLocaleString()}`;
};

/** Sort comparator for event date column */
const sortByEventDate = (a: Booking, b: Booking): number => {
  const dateA = getEventDate(a);
  const dateB = getEventDate(b);
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateA.localeCompare(dateB);
};

const sortByCreatedAt = (a: Booking, b: Booking): number => {
  return b.createdAt.localeCompare(a.createdAt);
};
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="mb-4">
      <h2 class="text-xl font-bold">預約列表</h2>
    </div>

    <!-- Status Tabs -->
    <el-tabs v-model="activeTab" class="mb-4" @tab-change="currentPage = 1">
      <el-tab-pane name="ALL">
        <template #label>
          全部
          <el-badge
            :value="statusCounts.ALL"
            :max="999"
            class="tab-badge"
            type="info"
          />
        </template>
      </el-tab-pane>
      <el-tab-pane
        v-for="(config, key) in BOOKING_STATUS"
        :key="key"
        :name="key"
      >
        <template #label>
          {{ config.label }}
          <el-badge
            v-if="statusCounts[key] > 0"
            :value="statusCounts[key]"
            :max="999"
            class="tab-badge"
            :type="config.type"
          />
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- Search & Date Filter -->
    <div class="mb-4 flex flex-wrap gap-3">
      <el-input
        v-model="searchText"
        placeholder="搜尋客戶姓名、電話、預約編號"
        clearable
        style="width: 280px"
        @input="currentPage = 1"
      />
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        start-placeholder="活動開始日"
        end-placeholder="活動結束日"
        format="YYYY/MM/DD"
        value-format="YYYY-MM-DD"
        style="width: 260px"
        @change="currentPage = 1"
      />
      <el-button v-if="searchText || dateRange" text @click="resetFilters">
        清除篩選
      </el-button>
    </div>

    <!-- Table -->
    <el-table
      v-loading="loading"
      :data="paginatedBookings"
      border
      stripe
      :default-sort="{ prop: 'createdAt', order: 'descending' }"
    >
      <el-table-column
        prop="bookingReference"
        label="預約編號"
        width="170"
        show-overflow-tooltip
      />
      <el-table-column label="服務" width="100">
        <template #default="{ row }">
          <el-tag
            size="small"
            :type="row.bookingType === 'COMPLETION' ? 'primary' : 'warning'"
          >
            {{ BOOKING_TYPE[row.bookingType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="活動日期"
        width="130"
        sortable
        :sort-method="sortByEventDate"
      >
        <template #default="{ row }">
          {{ formatDateShort(getEventDate(row)) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="customerName"
        label="客戶姓名"
        width="110"
        show-overflow-tooltip
      />
      <el-table-column label="電話" width="140">
        <template #default="{ row }">
          <a :href="`tel:${row.customerPhone}`" class="phone-link">
            {{ row.customerPhone }}
          </a>
        </template>
      </el-table-column>
      <el-table-column label="報價" width="120" sortable sort-by="quoteAmount">
        <template #default="{ row }">
          {{ formatCurrency(row.quoteAmount) }}
        </template>
      </el-table-column>
      <el-table-column label="訂金" width="90">
        <template #default="{ row }">
          <template v-if="row.quoteAmount">
            <el-tag
              size="small"
              :type="row.depositPaid ? 'success' : 'warning'"
            >
              {{ row.depositPaid ? "已付" : "未付" }}
            </el-tag>
          </template>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="狀態" width="130">
        <template #default="{ row }">
          <template v-if="BOOKING_STATUS_TRANSITIONS[row.status].length > 0">
            <el-dropdown @command="changeStatus(row, $event)">
              <el-tag
                :type="BOOKING_STATUS[row.status].type"
                class="cursor-pointer"
              >
                {{ BOOKING_STATUS[row.status].label }}
                <el-icon class="el-icon--right"><i-ep-arrow-down /></el-icon>
              </el-tag>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="nextStatus in BOOKING_STATUS_TRANSITIONS[row.status]"
                    :key="nextStatus"
                    :command="nextStatus"
                  >
                    → {{ BOOKING_STATUS[nextStatus].label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <el-tag v-else :type="BOOKING_STATUS[row.status].type">
            {{ BOOKING_STATUS[row.status].label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="建立時間"
        min-width="160"
        sortable
        :sort-method="sortByCreatedAt"
      >
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default>
          <el-button size="small" type="primary"> 查看 </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[15, 30, 50]"
        :total="filteredBookings.length"
        layout="total, sizes, prev, pager, next"
        background
      />
    </div>
  </div>
</template>

<style scoped>
.phone-link {
  color: var(--el-color-primary);
  text-decoration: none;
}

.phone-link:hover {
  text-decoration: underline;
}

.cursor-pointer {
  cursor: pointer;
}

.tab-badge {
  margin-left: 4px;
}

:deep(.el-tabs__item .el-badge__content) {
  top: -2px;
}
</style>
