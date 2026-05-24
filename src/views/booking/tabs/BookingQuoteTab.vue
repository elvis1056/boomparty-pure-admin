<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { type Booking, type QuoteForm, submitQuote } from "@/api/booking";

interface Props {
  booking: Booking;
}

interface Emits {
  (e: "updated"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isInquiry = computed(() => props.booking.status === "INQUIRY");
const hasQuote = computed(() => props.booking.quoteAmount !== null);

// Quote form (only used when status is INQUIRY)
const quoteForm = reactive<QuoteForm>({ quoteAmount: 0, depositAmount: 0 });
const submitting = ref(false);

const submitQuoteForm = async () => {
  if (quoteForm.quoteAmount <= 0) {
    ElMessage.error("報價金額必須大於 0");
    return;
  }
  if (quoteForm.depositAmount < 0) {
    ElMessage.error("訂金金額不能為負數");
    return;
  }
  if (quoteForm.depositAmount > quoteForm.quoteAmount) {
    ElMessage.error("訂金金額不能大於報價金額");
    return;
  }

  submitting.value = true;
  try {
    await submitQuote(props.booking.id, quoteForm);
    ElMessage.success("報價已送出");
    emit("updated");
  } catch {
    ElMessage.error("報價送出失敗");
  } finally {
    submitting.value = false;
  }
};

const formatCurrency = (amount: number | null): string => {
  if (amount === null || amount === undefined) {
    return "—";
  }
  return `NT$ ${amount.toLocaleString()}`;
};
</script>

<template>
  <div>
    <!-- INQUIRY: show quote form -->
    <template v-if="isInquiry">
      <el-descriptions :column="1" border class="mb-4">
        <template #title>
          <span class="font-bold">客戶預算</span>
        </template>
        <el-descriptions-item label="預算">
          {{ formatCurrency(props.booking.budget) }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="rounded border border-blue-200 bg-blue-50 p-4">
        <p class="mb-4 font-bold">建立報價</p>
        <el-form label-width="100px">
          <el-form-item label="報價金額">
            <el-input-number
              v-model="quoteForm.quoteAmount"
              :min="0"
              :step="500"
              :controls="true"
              style="width: 220px"
            />
          </el-form-item>
          <el-form-item label="訂金金額">
            <el-input-number
              v-model="quoteForm.depositAmount"
              :min="0"
              :max="quoteForm.quoteAmount"
              :step="500"
              :controls="true"
              style="width: 220px"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="submitting"
              :disabled="quoteForm.quoteAmount <= 0"
              @click="submitQuoteForm"
            >
              送出報價
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </template>

    <!-- QUOTED or later: show read-only quote info -->
    <template v-else-if="hasQuote">
      <el-descriptions :column="1" border>
        <template #title>
          <span class="font-bold">報價 & 收款</span>
        </template>
        <el-descriptions-item label="報價金額">
          {{ formatCurrency(props.booking.quoteAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="訂金金額">
          {{ formatCurrency(props.booking.depositAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="訂金狀態">
          <el-tag :type="props.booking.depositPaid ? 'success' : 'warning'">
            {{ props.booking.depositPaid ? "已付" : "未付" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="尾款金額">
          {{ formatCurrency(props.booking.balanceAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="尾款狀態">
          <el-tag :type="props.booking.balancePaid ? 'success' : 'warning'">
            {{ props.booking.balancePaid ? "已付" : "未付" }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-descriptions :column="1" border class="mt-4">
        <template #title>
          <span class="font-bold">成本 & 利潤</span>
        </template>
        <el-descriptions-item label="材料成本">
          {{
            props.booking.materialCost !== null
              ? formatCurrency(props.booking.materialCost)
              : "尚無材料"
          }}
        </el-descriptions-item>
        <el-descriptions-item label="毛利">
          {{
            props.booking.grossProfit !== null
              ? formatCurrency(props.booking.grossProfit)
              : "—"
          }}
        </el-descriptions-item>
      </el-descriptions>
    </template>

    <!-- No quote yet and not INQUIRY (shouldn't normally happen) -->
    <template v-else>
      <el-empty description="尚無報價資料" />
    </template>
  </div>
</template>
