<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deactivateCoupon,
  DISCOUNT_TYPE,
  type Coupon,
  type CreateCouponRequest,
  type DiscountType
} from "@/api/coupon";
import { getAllAffiliates, type Affiliate } from "@/api/affiliate";

// ─── 列表 ───
const loading = ref(false);
const coupons = ref<Coupon[]>([]);
const affiliates = ref<Affiliate[]>([]);

const fetchCoupons = async () => {
  loading.value = true;
  try {
    const data = await getAllCoupons();
    coupons.value = Array.isArray(data) ? data : [];
  } catch {
    ElMessage.error("載入優惠碼失敗");
  } finally {
    loading.value = false;
  }
};

const fetchAffiliates = async () => {
  try {
    const data = await getAllAffiliates();
    affiliates.value = Array.isArray(data) ? data : [];
  } catch {
    // 非必要，載入失敗不影響主流程
  }
};

// ─── 新增 / 編輯 Dialog ───
const dialogVisible = ref(false);
const dialogTitle = ref("新增優惠碼");
const editingId = ref<number | null>(null);
const dialogLoading = ref(false);

const emptyForm = (): CreateCouponRequest => ({
  code: "",
  discountType: "PERCENTAGE",
  discountValue: 10,
  minOrderAmount: null,
  maxUses: null,
  validFrom: null,
  validTo: null,
  isActive: true,
  affiliateId: null,
  description: null
});

const form = reactive<CreateCouponRequest>(emptyForm());

const resetForm = () => {
  const empty = emptyForm();
  Object.assign(form, empty);
  editingId.value = null;
};

const openCreate = () => {
  resetForm();
  dialogTitle.value = "新增優惠碼";
  dialogVisible.value = true;
};

const openEdit = (row: Coupon) => {
  resetForm();
  dialogTitle.value = "編輯優惠碼";
  editingId.value = row.id;
  form.code = row.code;
  form.discountType = row.discountType;
  form.discountValue = row.discountValue;
  form.minOrderAmount = row.minOrderAmount > 0 ? row.minOrderAmount : null;
  form.maxUses = row.maxUses;
  form.validFrom = row.validFrom;
  form.validTo = row.validTo;
  form.isActive = row.isActive;
  form.affiliateId = row.affiliateId;
  form.description = row.description;
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!form.code) {
    ElMessage.warning("優惠碼不能為空");
    return;
  }
  dialogLoading.value = true;
  try {
    if (editingId.value !== null) {
      await updateCoupon(editingId.value, { ...form });
      ElMessage.success("已更新");
    } else {
      await createCoupon({ ...form });
      ElMessage.success("已新增");
    }
    dialogVisible.value = false;
    fetchCoupons();
  } catch {
    ElMessage.error("操作失敗，請稍後再試");
  } finally {
    dialogLoading.value = false;
  }
};

const confirmDeactivate = async (row: Coupon) => {
  try {
    await ElMessageBox.confirm(
      `確定停用優惠碼「${row.code}」？停用後無法再使用，但不會刪除歷史紀錄。`,
      "停用確認",
      {
        type: "warning",
        confirmButtonText: "確定停用",
        cancelButtonText: "取消"
      }
    );
    await deactivateCoupon(row.id);
    ElMessage.success("已停用");
    fetchCoupons();
  } catch {
    // 取消操作
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};

const discountLabel = (coupon: Coupon) => {
  if (coupon.discountType === "PERCENTAGE") {
    return `${coupon.discountValue}%`;
  }
  return `NT$ ${coupon.discountValue.toLocaleString()}`;
};

onMounted(() => {
  fetchCoupons();
  fetchAffiliates();
});
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">優惠碼管理</h2>
      <el-button type="primary" @click="openCreate">新增優惠碼</el-button>
    </div>

    <el-table v-loading="loading" :data="coupons" border stripe>
      <el-table-column prop="code" label="優惠碼" min-width="120" />
      <el-table-column label="類型" width="130">
        <template #default="{ row }">
          {{ DISCOUNT_TYPE[row.discountType as DiscountType] }}
        </template>
      </el-table-column>
      <el-table-column label="折扣" width="110">
        <template #default="{ row }">
          {{ discountLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column label="使用次數" width="100">
        <template #default="{ row }">
          {{ row.usedCount }}
          <span class="text-gray-400"
            >/{{ row.maxUses !== null ? row.maxUses : "∞" }}</span
          >
        </template>
      </el-table-column>
      <el-table-column label="有效期" min-width="160">
        <template #default="{ row }">
          {{ formatDate(row.validFrom) }} ～ {{ formatDate(row.validTo) }}
        </template>
      </el-table-column>
      <el-table-column label="綁定分享人" min-width="110">
        <template #default="{ row }">
          {{ row.affiliateName !== null ? row.affiliateName : "—" }}
        </template>
      </el-table-column>
      <el-table-column label="狀態" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'">
            {{ row.isActive ? "啟用" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">編輯</el-button>
          <el-button
            v-if="row.isActive"
            size="small"
            type="danger"
            @click="confirmDeactivate(row)"
          >
            停用
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增 / 編輯 Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form label-width="100px">
        <el-form-item label="優惠碼" required>
          <el-input
            v-model="form.code"
            placeholder="SAVE10（英數字大寫）"
            style="text-transform: uppercase"
          />
        </el-form-item>
        <el-form-item label="折扣類型">
          <el-select v-model="form.discountType" style="width: 200px">
            <el-option
              v-for="(label, val) in DISCOUNT_TYPE"
              :key="val"
              :label="label"
              :value="val"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          :label="
            form.discountType === 'PERCENTAGE'
              ? '折扣百分比 (%)'
              : '折抵金額 (NT$)'
          "
        >
          <el-input-number
            v-model="form.discountValue"
            :min="0"
            :max="form.discountType === 'PERCENTAGE' ? 100 : 99999"
            :precision="form.discountType === 'PERCENTAGE' ? 2 : 0"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="最低訂單金額">
          <el-input-number
            v-model="form.minOrderAmount"
            :min="0"
            placeholder="0 = 無門檻"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="使用上限">
          <el-input-number
            v-model="form.maxUses"
            :min="1"
            placeholder="留空 = 無限制"
            style="width: 160px"
          />
          <span class="ml-2 text-sm text-gray-400">留空代表無限制</span>
        </el-form-item>
        <el-form-item label="開始時間">
          <el-date-picker
            v-model="form.validFrom"
            type="datetime"
            placeholder="選擇開始時間（選填）"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="結束時間">
          <el-date-picker
            v-model="form.validTo"
            type="datetime"
            placeholder="選擇結束時間（選填）"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="綁定分享人">
          <el-select
            v-model="form.affiliateId"
            placeholder="不綁定（選填）"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="a in affiliates"
              :key="a.id"
              :label="`${a.name}（${a.referralCode}）`"
              :value="a.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="啟用">
          <el-switch v-model="form.isActive" />
        </el-form-item>
        <el-form-item label="說明">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="優惠碼說明（選填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="submitForm">
          確定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
