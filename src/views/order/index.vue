<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
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

const loading = ref(false);
const orders = ref<Order[]>([]);
const searchText = ref("");
const filterStatus = ref<OrderStatusValue | "">("");
const drawerVisible = ref(false);
const selectedOrderId = ref<number | null>(null);

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

const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    const matchStatus =
      filterStatus.value === "" || order.status === filterStatus.value;
    const matchSearch =
      searchText.value === "" ||
      order.orderNumber.toLowerCase().includes(searchText.value.toLowerCase());
    return matchStatus && matchSearch;
  });
});

watch([searchText, filterStatus], () => {
  drawerVisible.value = false;
});

const openDetail = (order: Order) => {
  selectedOrderId.value = order.id;
  drawerVisible.value = true;
};

const changeStatus = async (order: Order, newStatus: OrderStatusValue) => {
  if (newStatus === order.status) return;
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
    // 取消操作
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

onMounted(fetchOrders);
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">訂單列表</h2>
    </div>

    <div class="mb-4 flex gap-3">
      <el-select
        v-model="filterStatus"
        placeholder="全部狀態"
        clearable
        style="width: 140px"
      >
        <el-option
          v-for="(val, key) in ORDER_STATUS"
          :key="key"
          :label="val.label"
          :value="key"
        />
      </el-select>
      <el-input
        v-model="searchText"
        placeholder="搜尋訂單編號"
        clearable
        style="width: 220px"
      />
    </div>

    <el-table v-loading="loading" :data="filteredOrders" border stripe>
      <el-table-column prop="orderNumber" label="訂單編號" min-width="200" />
      <el-table-column label="狀態" width="120">
        <template #default="{ row }">
          <el-dropdown @command="changeStatus(row, $event)">
            <el-tag
              :type="ORDER_STATUS[row.status].type"
              class="cursor-pointer"
            >
              {{ ORDER_STATUS[row.status].label }}
            </el-tag>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(val, key) in ORDER_STATUS"
                  :key="key"
                  :command="key"
                  :disabled="key === row.status"
                >
                  {{ val.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
      <el-table-column prop="recipientName" label="收件人" width="100" />
      <el-table-column label="金額" width="110">
        <template #default="{ row }">
          NT$ {{ row.totalAmount.toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="付款方式" width="110">
        <template #default="{ row }">
          {{ PAYMENT_METHOD[row.paymentMethod] }}
        </template>
      </el-table-column>
      <el-table-column label="建立時間" min-width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openDetail(row)">
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer
      v-model="drawerVisible"
      title="訂單詳情"
      direction="rtl"
      size="480px"
      destroy-on-close
    >
      <OrderDetail v-if="selectedOrderId" :order-id="selectedOrderId" />
    </el-drawer>
  </div>
</template>
