<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getAllOrders,
  updateOrderStatus,
  ORDER_STATUS,
  PAYMENT_METHOD,
  type Order,
  type OrderStatusValue
} from "@/api/order";
import OrderDetail from "./OrderDetail.vue";
import ArrowDownIcon from "~icons/ep/arrow-down";

// ── State ───────────────────────────────────────────────────────

const loading = ref(false);
const orders = ref<Order[]>([]);

// Filters
const activeTab = ref<OrderStatusValue | "ALL">("ALL");
const searchText = ref("");
const dateRange = ref<[string, string] | null>(null);

// Pagination
const currentPage = ref(1);
const pageSize = ref(15);

// Batch selection
const selectedOrders = ref<Order[]>([]);

// Drawer
const drawerVisible = ref(false);
const selectedOrderId = ref<number | null>(null);

// ── Data Fetching ───────────────────────────────────────────────

const fetchOrders = async () => {
  loading.value = true;
  try {
    const data = await getAllOrders();
    orders.value = Array.isArray(data) ? data : [];
  } catch {
    ElMessage.error("載入訂單失敗");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchOrders);

// ── Computed ────────────────────────────────────────────────────

/** Count orders per status (for tab badges) */
const statusCounts = computed(() => {
  const counts: Record<string, number> = { ALL: orders.value.length };
  for (const key of Object.keys(ORDER_STATUS)) {
    counts[key] = orders.value.filter(order => order.status === key).length;
  }
  return counts;
});

/** Apply all filters (tab + search + date range) */
const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    // Status tab filter
    if (activeTab.value !== "ALL" && order.status !== activeTab.value) {
      return false;
    }

    // Search filter (order number / recipient name / phone)
    if (searchText.value) {
      const keyword = searchText.value.toLowerCase();
      const matchOrderNumber = order.orderNumber
        .toLowerCase()
        .includes(keyword);
      const matchName = order.recipientName.toLowerCase().includes(keyword);
      const matchPhone = order.recipientPhone.toLowerCase().includes(keyword);
      if (!matchOrderNumber && !matchName && !matchPhone) {
        return false;
      }
    }

    // Date range filter (by createdAt)
    if (dateRange.value) {
      const createdDay = order.createdAt.slice(0, 10);
      if (createdDay < dateRange.value[0] || createdDay > dateRange.value[1]) {
        return false;
      }
    }

    return true;
  });
});

// Sort (global, before pagination)
const sortState = ref<{ prop: string; order: string | null }>({
  prop: "createdAt",
  order: "descending"
});

const onSortChange = ({
  prop,
  order
}: {
  prop: string;
  order: string | null;
}) => {
  sortState.value = { prop, order };
  currentPage.value = 1;
};

const sortedOrders = computed(() => {
  const { prop, order } = sortState.value;
  if (!prop || !order) {
    return filteredOrders.value;
  }
  const list = [...filteredOrders.value];
  const direction = order === "ascending" ? 1 : -1;
  list.sort((orderA, orderB) => {
    const sortFieldA = (orderA as Record<string, unknown>)[prop];
    const sortFieldB = (orderB as Record<string, unknown>)[prop];
    if (sortFieldA === sortFieldB) {
      return 0;
    }
    if (sortFieldA === null || sortFieldA === undefined) {
      return 1;
    }
    if (sortFieldB === null || sortFieldB === undefined) {
      return -1;
    }
    return sortFieldA < sortFieldB ? -direction : direction;
  });
  return list;
});

/** Paginated subset of sorted orders */
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedOrders.value.slice(start, start + pageSize.value);
});

// ── Actions ─────────────────────────────────────────────────────

const openDetail = (order: Order) => {
  selectedOrderId.value = order.id;
  drawerVisible.value = true;
};

const refreshAfterUpdate = async () => {
  await fetchOrders();
};

const changeStatus = async (order: Order, newStatus: OrderStatusValue) => {
  if (newStatus === order.status) {
    return;
  }
  const newLabel = ORDER_STATUS[newStatus].label;
  try {
    await ElMessageBox.confirm(
      `確定將訂單 ${order.orderNumber} 狀態改為「${newLabel}」？`,
      "更新訂單狀態",
      {
        type: "warning",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
      }
    );
    await updateOrderStatus(order.id, newStatus);
    ElMessage.success("狀態已更新");
    fetchOrders();
  } catch {
    // User cancelled
  }
};

const batchUpdateStatus = async (newStatus: OrderStatusValue) => {
  const count = selectedOrders.value.length;
  const newLabel = ORDER_STATUS[newStatus].label;
  try {
    await ElMessageBox.confirm(
      `確定將 ${count} 筆訂單批次改為「${newLabel}」？`,
      "批次更新狀態",
      {
        type: "warning",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
      }
    );
    const results = await Promise.allSettled(
      selectedOrders.value.map(order => updateOrderStatus(order.id, newStatus))
    );
    const successCount = results.filter(
      result => result.status === "fulfilled"
    ).length;
    const failCount = results.filter(
      result => result.status === "rejected"
    ).length;
    if (failCount > 0) {
      ElMessage.warning(`${successCount} 筆成功，${failCount} 筆失敗`);
    } else {
      ElMessage.success(`已批次更新 ${successCount} 筆訂單`);
    }
    selectedOrders.value = [];
    fetchOrders();
  } catch {
    // User cancelled
  }
};

const exportCsv = () => {
  const headers = [
    "訂單編號",
    "狀態",
    "收件人",
    "電話",
    "地址",
    "金額",
    "付款方式",
    "建立時間"
  ];
  const rows = filteredOrders.value.map(order => [
    order.orderNumber,
    ORDER_STATUS[order.status].label,
    order.recipientName,
    order.recipientPhone,
    `${order.postalCode} ${order.city}${order.district} ${order.addressLine}`,
    order.totalAmount,
    PAYMENT_METHOD[order.paymentMethod],
    order.createdAt
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(","))
    .join("\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const resetFilters = () => {
  searchText.value = "";
  dateRange.value = null;
  activeTab.value = "ALL";
  currentPage.value = 1;
};

// ── Helpers ─────────────────────────────────────────────────────

const formatDate = (dateString: string | null): string => {
  if (!dateString) {
    return "—";
  }
  return new Date(dateString).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatCurrency = (amount: number | null): string => {
  if (amount === null || amount === undefined) {
    return "—";
  }
  return `NT$ ${amount.toLocaleString()}`;
};
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">訂單列表</h2>
      <el-button size="small" @click="exportCsv"> 匯出 CSV </el-button>
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
      <el-tab-pane v-for="(config, key) in ORDER_STATUS" :key="key" :name="key">
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
        placeholder="搜尋訂單編號、收件人、電話"
        clearable
        style="width: 280px"
        @input="currentPage = 1"
      />
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        start-placeholder="開始日期"
        end-placeholder="結束日期"
        format="YYYY/MM/DD"
        value-format="YYYY-MM-DD"
        style="width: 260px"
        @change="currentPage = 1"
      />
      <el-button v-if="searchText || dateRange" text @click="resetFilters">
        清除篩選
      </el-button>
    </div>

    <!-- Batch Action Bar -->
    <div v-if="selectedOrders.length > 0" class="mb-4 flex items-center gap-3">
      <span class="text-sm"> 已選 {{ selectedOrders.length }} 筆 </span>
      <el-button size="small" @click="batchUpdateStatus('ORDER_SHIPPED')">
        批次標為已出貨
      </el-button>
      <el-button size="small" @click="batchUpdateStatus('ORDER_COMPLETED')">
        批次標為已完成
      </el-button>
    </div>

    <!-- Table -->
    <el-table
      v-loading="loading"
      :data="paginatedOrders"
      border
      stripe
      :default-sort="{ prop: 'createdAt', order: 'descending' }"
      @sort-change="onSortChange"
      @selection-change="selectedOrders = $event"
    >
      <el-table-column type="selection" width="40" />
      <el-table-column
        prop="orderNumber"
        label="訂單編號"
        min-width="200"
        show-overflow-tooltip
      />
      <el-table-column label="狀態" width="120">
        <template #default="{ row }">
          <el-dropdown @command="changeStatus(row, $event)">
            <el-tag
              :type="ORDER_STATUS[row.status].type"
              class="cursor-pointer"
            >
              {{ ORDER_STATUS[row.status].label }}
              <el-icon class="el-icon--right"><ArrowDownIcon /></el-icon>
            </el-tag>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(statusConfig, statusKey) in ORDER_STATUS"
                  :key="statusKey"
                  :command="statusKey"
                  :disabled="statusKey === row.status"
                >
                  {{ statusConfig.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
      <el-table-column prop="recipientName" label="收件人" width="100" />
      <el-table-column prop="totalAmount" label="金額" width="120" sortable>
        <template #default="{ row }">
          {{ formatCurrency(row.totalAmount) }}
        </template>
      </el-table-column>
      <el-table-column label="付款方式" width="110">
        <template #default="{ row }">
          {{ PAYMENT_METHOD[row.paymentMethod] }}
        </template>
      </el-table-column>
      <el-table-column
        prop="createdAt"
        label="建立時間"
        min-width="160"
        sortable
      >
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openDetail(row)">
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[15, 30, 50]"
        :total="filteredOrders.length"
        layout="total, sizes, prev, pager, next"
        background
      />
    </div>

    <!-- Detail Drawer -->
    <el-drawer
      v-model="drawerVisible"
      title="訂單詳情"
      direction="rtl"
      size="640px"
      destroy-on-close
    >
      <OrderDetail
        v-if="selectedOrderId"
        :order-id="selectedOrderId"
        @updated="refreshAfterUpdate"
      />
    </el-drawer>
  </div>
</template>

<style scoped>
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
