<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  getOrderDetail,
  updateOrderNote,
  ORDER_STATUS,
  PAYMENT_METHOD,
  type Order
} from "@/api/order";

const props = defineProps<{ orderId: number }>();
const emit = defineEmits<{
  (event: "updated"): void;
}>();

const loading = ref(false);
const order = ref<Order | null>(null);
const adminNoteText = ref("");
const savingNote = ref(false);

const fetchDetail = async () => {
  loading.value = true;
  try {
    const data = await getOrderDetail(props.orderId);
    order.value = data;
    adminNoteText.value = data.adminNote ? data.adminNote : "";
  } catch {
    ElMessage.error("載入訂單詳情失敗");
  } finally {
    loading.value = false;
  }
};

const saveAdminNote = async () => {
  if (!order.value) {
    return;
  }
  savingNote.value = true;
  try {
    await updateOrderNote(order.value.id, adminNoteText.value);
    ElMessage.success("備註已儲存");
    emit("updated");
  } catch {
    ElMessage.error("儲存備註失敗");
  } finally {
    savingNote.value = false;
  }
};

const printOrder = () => {
  window.print();
};

const noteHasChanged = computed(() => {
  if (!order.value) {
    return false;
  }
  const original = order.value.adminNote ? order.value.adminNote : "";
  return adminNoteText.value !== original;
});

// ── Timeline ────────────────────────────────────────────────────

type TimelineEvent = {
  label: string;
  timestamp: string;
  type: "primary" | "success" | "warning" | "danger" | "info";
};

const timelineEvents = computed((): TimelineEvent[] => {
  if (!order.value) {
    return [];
  }
  const events: TimelineEvent[] = [];

  events.push({
    label: "訂單建立",
    timestamp: order.value.createdAt,
    type: "info"
  });

  if (order.value.paidAt) {
    events.push({
      label: "已付款",
      timestamp: order.value.paidAt,
      type: "success"
    });
  }

  if (order.value.shippedAt) {
    events.push({
      label: "已出貨",
      timestamp: order.value.shippedAt,
      type: "primary"
    });
  }

  if (order.value.completedAt) {
    events.push({
      label: "已完成",
      timestamp: order.value.completedAt,
      type: "success"
    });
  }

  return events;
});

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

const formatAddress = (orderData: Order): string => {
  return `${orderData.postalCode} ${orderData.city}${orderData.district}\n${orderData.addressLine}`;
};

onMounted(fetchDetail);
</script>

<template>
  <div v-loading="loading">
    <template v-if="order">
      <!-- Print Button -->
      <div class="mb-4 flex justify-end print-hidden">
        <el-button size="small" @click="printOrder"> 列印訂單 </el-button>
      </div>

      <!-- Order Info -->
      <el-descriptions :column="1" border>
        <template #title>
          <span class="font-bold">訂單資訊</span>
        </template>
        <el-descriptions-item label="訂單編號">
          {{ order.orderNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="狀態">
          <el-tag :type="ORDER_STATUS[order.status].type">
            {{ ORDER_STATUS[order.status].label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="付款方式">
          {{ PAYMENT_METHOD[order.paymentMethod] }}
        </el-descriptions-item>
        <el-descriptions-item v-if="order.couponCode" label="優惠碼">
          {{ order.couponCode }}（折 NT$
          {{ order.discountAmount.toLocaleString() }}）
        </el-descriptions-item>
        <el-descriptions-item v-if="order.note" label="客戶備註">
          {{ order.note }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- Timeline -->
      <div v-if="timelineEvents.length > 0" class="mt-4">
        <p class="mb-2 font-bold">訂單時間軸</p>
        <el-timeline>
          <el-timeline-item
            v-for="(event, index) in timelineEvents"
            :key="index"
            :type="event.type"
            :timestamp="formatDate(event.timestamp)"
            placement="top"
          >
            {{ event.label }}
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- Recipient Info -->
      <el-descriptions :column="1" border class="mt-4">
        <template #title>
          <span class="font-bold">收件資訊</span>
        </template>
        <el-descriptions-item label="收件人">
          {{ order.recipientName }}
        </el-descriptions-item>
        <el-descriptions-item label="電話">
          <a :href="`tel:${order.recipientPhone}`" class="phone-link">
            {{ order.recipientPhone }}
          </a>
        </el-descriptions-item>
        <el-descriptions-item label="地址">
          <span class="address-text">{{ formatAddress(order) }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- Order Items -->
      <div class="mt-4">
        <p class="mb-2 font-bold">商品明細</p>
        <el-table :data="order.items" border size="small">
          <el-table-column
            prop="productName"
            label="商品名稱"
            min-width="140"
          />
          <el-table-column label="單價" width="90">
            <template #default="{ row }">
              NT$ {{ row.unitPrice.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="數量" width="60" />
          <el-table-column label="小計" width="90">
            <template #default="{ row }">
              NT$ {{ row.subtotal.toLocaleString() }}
            </template>
          </el-table-column>
        </el-table>

        <div class="mt-2 text-right text-sm">
          <div>運費：NT$ {{ order.shippingFee.toLocaleString() }}</div>
          <div v-if="order.discountAmount > 0">
            折扣：-NT$ {{ order.discountAmount.toLocaleString() }}
          </div>
          <div class="mt-1 text-base font-bold">
            總計：NT$ {{ order.totalAmount.toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- Admin Note -->
      <div class="mt-4">
        <p class="mb-2 font-bold">管理員備註</p>
        <el-input
          v-model="adminNoteText"
          type="textarea"
          :rows="3"
          placeholder="輸入內部備註（僅管理員可見）"
        />
        <div class="mt-2 flex justify-end">
          <el-button
            type="primary"
            size="small"
            :disabled="!noteHasChanged"
            :loading="savingNote"
            @click="saveAdminNote"
          >
            儲存備註
          </el-button>
        </div>
      </div>
    </template>
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

.address-text {
  white-space: pre-line;
}

@media print {
  .print-hidden {
    display: none !important;
  }
}
</style>
