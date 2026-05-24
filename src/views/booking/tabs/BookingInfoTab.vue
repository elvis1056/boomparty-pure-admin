<script setup lang="ts">
import {
  type Booking,
  BOOKING_STATUS,
  BOOKING_TYPE,
  BOOKING_PAYMENT_METHOD
} from "@/api/booking";

interface Props {
  booking: Booking;
}

const props = defineProps<Props>();

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) {
    return "—";
  }
  return new Date(dateStr).toLocaleString("zh-TW", {
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

const getEventDate = (booking: Booking): string => {
  if (booking.bookingType === "COMPLETION") {
    return formatDate(booking.completionTime);
  }
  const start = formatDate(booking.performanceStart);
  const end = booking.performanceEnd
    ? new Date(booking.performanceEnd).toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";
  return end ? `${start} ~ ${end}` : start;
};
</script>

<template>
  <div>
    <el-descriptions :column="1" border>
      <template #title>
        <span class="font-bold">預約資訊</span>
      </template>
      <el-descriptions-item label="預約編號">
        {{ props.booking.bookingReference }}
      </el-descriptions-item>
      <el-descriptions-item label="狀態">
        <el-tag :type="BOOKING_STATUS[props.booking.status].type">
          {{ BOOKING_STATUS[props.booking.status].label }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="服務類型">
        <el-tag>{{ BOOKING_TYPE[props.booking.bookingType] }}</el-tag>
        {{ props.booking.serviceName }}
      </el-descriptions-item>
      <el-descriptions-item label="活動日期">
        {{ getEventDate(props.booking) }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="props.booking.selectedDuration"
        label="服務時數"
      >
        {{ props.booking.selectedDuration }} 小時
      </el-descriptions-item>
      <el-descriptions-item v-if="props.booking.performerName" label="表演者">
        {{ props.booking.performerName }}
      </el-descriptions-item>
    </el-descriptions>

    <el-descriptions :column="1" border class="mt-4">
      <template #title>
        <span class="font-bold">客戶資訊</span>
      </template>
      <el-descriptions-item label="姓名">
        {{ props.booking.customerName }}
      </el-descriptions-item>
      <el-descriptions-item label="電話">
        <a :href="`tel:${props.booking.customerPhone}`" class="phone-link">
          {{ props.booking.customerPhone }}
        </a>
      </el-descriptions-item>
      <el-descriptions-item v-if="props.booking.customerEmail" label="Email">
        {{ props.booking.customerEmail }}
      </el-descriptions-item>
      <el-descriptions-item label="預算">
        {{ formatCurrency(props.booking.budget) }}
      </el-descriptions-item>
      <el-descriptions-item v-if="props.booking.paymentMethod" label="付款方式">
        {{ BOOKING_PAYMENT_METHOD[props.booking.paymentMethod] }}
      </el-descriptions-item>
      <el-descriptions-item v-if="props.booking.customerNotes" label="備註">
        {{ props.booking.customerNotes }}
      </el-descriptions-item>
    </el-descriptions>

    <el-descriptions :column="1" border class="mt-4">
      <template #title>
        <span class="font-bold">時間記錄</span>
      </template>
      <el-descriptions-item label="建立時間">
        {{ formatDate(props.booking.createdAt) }}
      </el-descriptions-item>
      <el-descriptions-item label="最後更新">
        {{ formatDate(props.booking.updatedAt) }}
      </el-descriptions-item>
    </el-descriptions>
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
</style>
