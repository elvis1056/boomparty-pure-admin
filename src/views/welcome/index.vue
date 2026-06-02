<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

import {
  getDashboardStats,
  getUpcomingBookings,
  getActionItems,
  type DashboardStats,
  type UpcomingBooking,
  type ActionItems
} from "@/api/dashboard";
import { BOOKING_STATUS, BOOKING_TYPE } from "@/api/booking";
import { ORDER_STATUS } from "@/api/order";

defineOptions({
  name: "Welcome"
});

const router = useRouter();

// ── State ────────────────────────────────────────────────────────

const statsLoading = ref(false);
const bookingsLoading = ref(false);
const actionsLoading = ref(false);

const stats = ref<DashboardStats | null>(null);
const upcomingBookings = ref<UpcomingBooking[]>([]);
const actionItems = ref<ActionItems | null>(null);

const activeActionTab = ref("pendingQuotes");

// ── Computed ─────────────────────────────────────────────────────

const totalPipelineCount = computed(() => {
  if (!stats.value) {
    return 0;
  }
  const pipeline = stats.value.bookingPipeline;
  return (
    pipeline.inquiryCount +
    pipeline.quotedCount +
    pipeline.depositPaidCount +
    pipeline.confirmedCount
  );
});

const pendingQuotes = computed(() =>
  actionItems.value ? actionItems.value.pendingQuotes : []
);

const pendingDeposits = computed(() =>
  actionItems.value ? actionItems.value.pendingDeposits : []
);

const expiringSoon = computed(() =>
  actionItems.value ? actionItems.value.expiringSoon : []
);

const lowStockProducts = computed(() =>
  actionItems.value ? actionItems.value.lowStockProducts : []
);

const latestOrders = computed(() =>
  actionItems.value ? actionItems.value.latestOrders : []
);

// ── Data Fetching ────────────────────────────────────────────────

const fetchStats = async () => {
  statsLoading.value = true;
  try {
    stats.value = await getDashboardStats();
  } catch {
    ElMessage.error("載入統計資料失敗");
  } finally {
    statsLoading.value = false;
  }
};

const fetchUpcomingBookings = async () => {
  bookingsLoading.value = true;
  try {
    const data = await getUpcomingBookings();
    upcomingBookings.value = Array.isArray(data) ? data : [];
  } catch {
    ElMessage.error("載入行事曆失敗");
  } finally {
    bookingsLoading.value = false;
  }
};

const fetchActionItems = async () => {
  actionsLoading.value = true;
  try {
    actionItems.value = await getActionItems();
  } catch {
    ElMessage.error("載入待處理事項失敗");
  } finally {
    actionsLoading.value = false;
  }
};

onMounted(() => {
  fetchStats();
  fetchUpcomingBookings();
  fetchActionItems();
});

// ── Helpers ──────────────────────────────────────────────────────

const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return "NT$ 0";
  }
  return `NT$ ${amount.toLocaleString("zh-TW")}`;
};

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) {
    return "—";
  }
  const date = new Date(dateString);
  return date.toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
};

const formatTimeRange = (start: string, end: string | null): string => {
  const startDate = new Date(start);
  const startFormatted = startDate.toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  if (!end) {
    return startFormatted;
  }
  const endDate = new Date(end);
  const endFormatted = endDate.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return `${startFormatted} – ${endFormatted}`;
};

// ── Navigation ───────────────────────────────────────────────────

const goToBookingList = () => router.push("/booking/list");
const goToBookingCalendar = () => router.push("/booking/calendar");
const goToOrderList = () => router.push("/order");
const goToProductList = () => router.push("/product");

const callPhone = (phone: string) => {
  window.location.href = `tel:${phone}`;
};
</script>

<template>
  <div class="dashboard">
    <!-- ── KPI Cards ──────────────────────────────────────────── -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="12" :sm="12" :md="6">
        <el-card
          v-loading="statsLoading"
          shadow="hover"
          class="kpi-card kpi-primary"
        >
          <div class="kpi-value">{{ totalPipelineCount }}</div>
          <div class="kpi-label">進行中預約</div>
          <div v-if="stats" class="kpi-detail">
            詢問 {{ stats.bookingPipeline.inquiryCount }} · 報價
            {{ stats.bookingPipeline.quotedCount }} · 訂金
            {{ stats.bookingPipeline.depositPaidCount }} · 確認
            {{ stats.bookingPipeline.confirmedCount }}
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card
          v-loading="statsLoading"
          shadow="hover"
          class="kpi-card kpi-success"
        >
          <div class="kpi-value">
            {{ formatCurrency(stats ? stats.monthlyServiceRevenue : 0) }}
          </div>
          <div class="kpi-label">本月服務營收</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card
          v-loading="statsLoading"
          shadow="hover"
          class="kpi-card kpi-warning"
        >
          <div class="kpi-value">
            {{ stats ? stats.pendingOrderCount : 0 }}
          </div>
          <div class="kpi-label">待處理訂單</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card
          v-loading="statsLoading"
          shadow="hover"
          class="kpi-card kpi-info"
        >
          <div class="kpi-value">
            {{ formatCurrency(stats ? stats.monthlyProductRevenue : 0) }}
          </div>
          <div class="kpi-label">本月商品營收</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ── Middle Row: Calendar + Action Items ───────────────── -->
    <el-row :gutter="16" class="mb-4">
      <!-- Upcoming bookings (7 days) -->
      <el-col :xs="24" :md="14">
        <el-card v-loading="bookingsLoading" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">本週行事曆</span>
              <el-button link type="primary" @click="goToBookingCalendar">
                查看日曆
              </el-button>
            </div>
          </template>
          <el-table
            v-if="upcomingBookings.length > 0"
            :data="upcomingBookings"
            stripe
            size="small"
          >
            <el-table-column label="時間" min-width="150">
              <template #default="{ row }">
                {{ formatTimeRange(row.eventTime, row.eventEnd) }}
              </template>
            </el-table-column>
            <el-table-column prop="customerName" label="客戶" min-width="80" />
            <el-table-column prop="serviceName" label="服務" min-width="100" />
            <el-table-column label="類型" width="70" align="center">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="
                    row.bookingType === 'TIME_SLOT' ? 'primary' : 'success'
                  "
                >
                  {{ BOOKING_TYPE[row.bookingType] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="狀態" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="BOOKING_STATUS[row.status].type">
                  {{ BOOKING_STATUS[row.status].label }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="本週無排程" :image-size="60" />
        </el-card>
      </el-col>

      <!-- Action Items (3 tabs) -->
      <el-col :xs="24" :md="10">
        <el-card v-loading="actionsLoading" shadow="never" class="action-card">
          <template #header>
            <span class="card-title">待處理事項</span>
          </template>
          <el-tabs v-model="activeActionTab">
            <!-- Pending Quotes -->
            <el-tab-pane name="pendingQuotes">
              <template #label> 待報價 ({{ pendingQuotes.length }}) </template>
              <div v-if="pendingQuotes.length > 0">
                <div
                  v-for="booking in pendingQuotes"
                  :key="booking.id"
                  class="action-item"
                >
                  <div class="action-item-header">
                    <span
                      class="action-item-reference"
                      @click="goToBookingList"
                    >
                      {{ booking.bookingReference }}
                    </span>
                    <span class="action-item-customer">
                      {{ booking.customerName }}
                    </span>
                  </div>
                  <div class="action-item-detail">
                    <span>{{ booking.serviceName }}</span>
                    <el-button
                      link
                      size="small"
                      @click="callPhone(booking.customerPhone)"
                    >
                      {{ booking.customerPhone }}
                    </el-button>
                  </div>
                </div>
              </div>
              <el-empty v-else description="無待報價" :image-size="40" />
            </el-tab-pane>

            <!-- Pending Deposits -->
            <el-tab-pane name="pendingDeposits">
              <template #label>
                待收訂金 ({{ pendingDeposits.length }})
              </template>
              <div v-if="pendingDeposits.length > 0">
                <div
                  v-for="booking in pendingDeposits"
                  :key="booking.id"
                  class="action-item"
                >
                  <div class="action-item-header">
                    <span
                      class="action-item-reference"
                      @click="goToBookingList"
                    >
                      {{ booking.bookingReference }}
                    </span>
                    <span class="action-item-customer">
                      {{ booking.customerName }}
                    </span>
                  </div>
                  <div class="action-item-detail">
                    <span>{{ booking.serviceName }}</span>
                    <span v-if="booking.quoteAmount" class="action-item-amount">
                      {{ formatCurrency(booking.quoteAmount) }}
                    </span>
                  </div>
                </div>
              </div>
              <el-empty v-else description="無待收訂金" :image-size="40" />
            </el-tab-pane>

            <!-- Expiring Soon -->
            <el-tab-pane name="expiringSoon">
              <template #label> 即將到期 ({{ expiringSoon.length }}) </template>
              <div v-if="expiringSoon.length > 0">
                <div
                  v-for="booking in expiringSoon"
                  :key="booking.id"
                  class="action-item"
                >
                  <div class="action-item-header">
                    <span
                      class="action-item-reference"
                      @click="goToBookingList"
                    >
                      {{ booking.bookingReference }}
                    </span>
                    <el-tag
                      size="small"
                      :type="BOOKING_STATUS[booking.status].type"
                    >
                      {{ BOOKING_STATUS[booking.status].label }}
                    </el-tag>
                  </div>
                  <div class="action-item-detail">
                    <span>{{ booking.serviceName }}</span>
                    <span class="action-item-time">
                      {{ formatDateTime(booking.eventTime) }}
                    </span>
                  </div>
                </div>
              </div>
              <el-empty v-else description="無即將到期" :image-size="40" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <!-- ── Bottom Row: Low Stock + Latest Orders ────────────── -->
    <el-row :gutter="16">
      <el-col :xs="24" :md="8">
        <el-card v-loading="actionsLoading" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">低庫存商品</span>
              <el-button link type="primary" @click="goToProductList">
                管理商品
              </el-button>
            </div>
          </template>
          <el-table
            v-if="lowStockProducts.length > 0"
            :data="lowStockProducts"
            size="small"
          >
            <el-table-column prop="name" label="商品" min-width="120" />
            <el-table-column label="庫存" width="70" align="center">
              <template #default="{ row }">
                <span :class="row.stock <= 2 ? 'stock-critical' : 'stock-low'">
                  {{ row.stock }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="售價" width="100" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.price) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="庫存充足" :image-size="40" />
        </el-card>
      </el-col>

      <el-col :xs="24" :md="16">
        <el-card v-loading="actionsLoading" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">最新訂單</span>
              <el-button link type="primary" @click="goToOrderList">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table
            v-if="latestOrders.length > 0"
            :data="latestOrders"
            size="small"
          >
            <el-table-column
              prop="orderNumber"
              label="訂單編號"
              min-width="130"
            />
            <el-table-column
              prop="recipientName"
              label="收件人"
              min-width="80"
            />
            <el-table-column label="金額" width="110" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.totalAmount) }}
              </template>
            </el-table-column>
            <el-table-column label="狀態" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="ORDER_STATUS[row.status].type">
                  {{ ORDER_STATUS[row.status].label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="日期" width="110" align="center">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="尚無訂單" :image-size="40" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}

/* ── KPI Cards ────────────────────────────────────────────────── */

.kpi-card {
  margin-bottom: 8px;
  text-align: center;
  border-top: 3px solid;
}

.kpi-card.kpi-primary {
  border-top-color: var(--el-color-primary);
}

.kpi-card.kpi-success {
  border-top-color: var(--el-color-success);
}

.kpi-card.kpi-warning {
  border-top-color: var(--el-color-warning);
}

.kpi-card.kpi-info {
  border-top-color: var(--el-color-info);
}

.kpi-value {
  margin-bottom: 4px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.kpi-label {
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.kpi-detail {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-placeholder);
}

/* ── Card Headers ─────────────────────────────────────────────── */

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

/* ── Action Items ─────────────────────────────────────────────── */

.action-card :deep(.el-card__body) {
  padding-top: 0;
}

.action-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.action-item:last-child {
  border-bottom: none;
}

.action-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.action-item-reference {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  cursor: pointer;
}

.action-item-reference:hover {
  text-decoration: underline;
}

.action-item-customer {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.action-item-detail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.action-item-amount {
  font-weight: 600;
  color: var(--el-color-success);
}

.action-item-time {
  font-weight: 500;
  color: var(--el-color-danger);
}

/* ── Stock Colors ─────────────────────────────────────────────── */

.stock-critical {
  font-weight: 700;
  color: var(--el-color-danger);
}

.stock-low {
  font-weight: 600;
  color: var(--el-color-warning);
}
</style>
