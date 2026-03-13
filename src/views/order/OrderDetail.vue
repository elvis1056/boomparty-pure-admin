<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  getOrderDetail,
  ORDER_STATUS,
  PAYMENT_METHOD,
  type Order
} from "@/api/order";

const props = defineProps<{ orderId: number }>();

const loading = ref(false);
const order = ref<Order | null>(null);

const fetchDetail = async () => {
  loading.value = true;
  try {
    const data = await getOrderDetail(props.orderId);
    order.value = data;
  } catch {
    ElMessage.error("載入訂單詳情失敗");
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

onMounted(fetchDetail);
</script>

<template>
  <div v-loading="loading">
    <template v-if="order">
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
        <el-descriptions-item label="建立時間">
          {{ formatDate(order.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="付款時間">
          {{ formatDate(order.paidAt) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="order.note" label="備註">
          {{ order.note }}
        </el-descriptions-item>
      </el-descriptions>

      <el-descriptions :column="1" border class="mt-4">
        <template #title>
          <span class="font-bold">收件資訊</span>
        </template>
        <el-descriptions-item label="收件人">
          {{ order.recipientName }}
        </el-descriptions-item>
        <el-descriptions-item label="電話">
          {{ order.recipientPhone }}
        </el-descriptions-item>
        <el-descriptions-item label="地址">
          {{ order.city }}{{ order.district }}{{ order.postalCode }}
          {{ order.addressLine }}
        </el-descriptions-item>
      </el-descriptions>

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
          <div class="mt-1 text-base font-bold">
            總計：NT$ {{ order.totalAmount.toLocaleString() }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
