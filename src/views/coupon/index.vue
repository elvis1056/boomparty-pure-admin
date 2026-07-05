<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  DISCOUNT_TYPE,
  type Coupon,
  type CreateCouponRequest,
  type DiscountType
} from "@/api/coupon";
import { getAllAffiliates, type Affiliate } from "@/api/affiliate";
import CopyDocumentIcon from "~icons/ep/copy-document";

// ── State ───────────────────────────────────────────────────────

const loading = ref(false);
const coupons = ref<Coupon[]>([]);
const affiliates = ref<Affiliate[]>([]);

// Filters
const searchText = ref("");

// Pagination
const currentPage = ref(1);
const pageSize = ref(5);

// ── Data Fetching ───────────────────────────────────────────────

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
    // Non-critical, don't block main flow
  }
};

onMounted(() => {
  fetchCoupons();
  fetchAffiliates();
});

// ── Computed ────────────────────────────────────────────────────

type CouponStatus = {
  label: string;
  type: "success" | "warning" | "danger" | "info";
};

const getCouponStatus = (coupon: Coupon): CouponStatus => {
  if (!coupon.isActive) {
    return { label: "已停用", type: "info" };
  }

  const now = new Date();

  if (coupon.validTo) {
    const validTo = new Date(coupon.validTo);
    if (validTo < now) {
      return { label: "已過期", type: "danger" };
    }
  }

  if (coupon.validFrom) {
    const validFrom = new Date(coupon.validFrom);
    if (validFrom > now) {
      return { label: "未開始", type: "warning" };
    }
  }

  return { label: "進行中", type: "success" };
};

/** Apply search filter (code + description) */
const filteredCoupons = computed(() => {
  if (!searchText.value) {
    return coupons.value;
  }
  const keyword = searchText.value.toLowerCase();
  return coupons.value.filter(coupon => {
    const matchCode = coupon.code.toLowerCase().includes(keyword);
    const matchDescription = coupon.description
      ? coupon.description.toLowerCase().includes(keyword)
      : false;
    return matchCode || matchDescription;
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

const sortedCoupons = computed(() => {
  const { prop, order } = sortState.value;
  if (!prop || !order) {
    return filteredCoupons.value;
  }
  const list = [...filteredCoupons.value];
  const direction = order === "ascending" ? 1 : -1;
  list.sort((couponA, couponB) => {
    const sortFieldA = (couponA as Record<string, unknown>)[prop];
    const sortFieldB = (couponB as Record<string, unknown>)[prop];
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

/** Paginated subset of sorted coupons */
const paginatedCoupons = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedCoupons.value.slice(start, start + pageSize.value);
});

// ── Dialog (Create / Edit) ──────────────────────────────────────

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

// ── Actions ─────────────────────────────────────────────────────

const buildCouponForm = (coupon: Coupon): CreateCouponRequest => {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minOrderAmount: coupon.minOrderAmount > 0 ? coupon.minOrderAmount : null,
    maxUses: coupon.maxUses,
    validFrom: coupon.validFrom,
    validTo: coupon.validTo,
    isActive: coupon.isActive,
    affiliateId: coupon.affiliateId,
    description: coupon.description
  };
};

const toggleActive = async (coupon: Coupon) => {
  const newValue = !coupon.isActive;
  const label = newValue ? "啟用" : "停用";
  try {
    await ElMessageBox.confirm(
      `確定將優惠碼「${coupon.code}」${label}？`,
      `${label}確認`,
      {
        type: "warning",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
      }
    );
    const couponForm = buildCouponForm(coupon);
    couponForm.isActive = newValue;
    await updateCoupon(coupon.id, couponForm);
    ElMessage.success(`已${label}`);
    fetchCoupons();
  } catch {
    // User cancelled
  }
};

const copyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code);
    ElMessage.success("已複製");
  } catch {
    ElMessage.error("複製失敗");
  }
};

const resetFilters = () => {
  searchText.value = "";
  currentPage.value = 1;
};

// ── Helpers ─────────────────────────────────────────────────────

const formatDate = (dateString: string | null): string => {
  if (!dateString) {
    return "—";
  }
  return new Date(dateString).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};

const discountLabel = (coupon: Coupon): string => {
  if (coupon.discountType === "PERCENTAGE") {
    return `${coupon.discountValue}%`;
  }
  return `NT$ ${coupon.discountValue.toLocaleString()}`;
};

const PERCENTAGE_MAX = 100;
const FIXED_AMOUNT_MAX = 99999;
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">優惠碼管理</h2>
      <el-button type="primary" @click="openCreate">新增優惠碼</el-button>
    </div>

    <!-- Search -->
    <div class="mb-4 flex flex-wrap gap-3">
      <el-input
        v-model="searchText"
        placeholder="搜尋優惠碼 / 說明"
        clearable
        style="width: 280px"
        @input="currentPage = 1"
      />
      <el-button v-if="searchText" text @click="resetFilters">
        清除篩選
      </el-button>
    </div>

    <!-- Table -->
    <el-table
      v-loading="loading"
      :data="paginatedCoupons"
      border
      stripe
      :default-sort="{ prop: 'createdAt', order: 'descending' }"
      @sort-change="onSortChange"
    >
      <el-table-column label="優惠碼" min-width="150">
        <template #default="{ row }">
          <span class="coupon-code">{{ row.code }}</span>
          <el-button
            size="small"
            text
            class="copy-button"
            @click="copyCode(row.code)"
          >
            <el-icon><CopyDocumentIcon /></el-icon>
          </el-button>
        </template>
      </el-table-column>
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
      <el-table-column label="有效期" min-width="180">
        <template #default="{ row }">
          {{ formatDate(row.validFrom) }} ～ {{ formatDate(row.validTo) }}
        </template>
      </el-table-column>
      <el-table-column label="綁定分享人" min-width="110">
        <template #default="{ row }">
          {{ row.affiliateName !== null ? row.affiliateName : "—" }}
        </template>
      </el-table-column>
      <el-table-column label="狀態" width="100">
        <template #default="{ row }">
          <el-tag :type="getCouponStatus(row).type" size="small">
            {{ getCouponStatus(row).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="啟用" width="80" align="center">
        <template #default="{ row }">
          <el-switch :model-value="row.isActive" @change="toggleActive(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="建立日期" width="120" sortable>
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">編輯</el-button>
          <el-button
            v-if="row.isActive"
            size="small"
            type="danger"
            @click="toggleActive(row)"
          >
            停用
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 15, 30, 50]"
        :total="filteredCoupons.length"
        layout="total, sizes, prev, pager, next"
        background
      />
    </div>

    <!-- Create / Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px">
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
              v-for="(label, value) in DISCOUNT_TYPE"
              :key="value"
              :label="label"
              :value="value"
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
            :max="
              form.discountType === 'PERCENTAGE'
                ? PERCENTAGE_MAX
                : FIXED_AMOUNT_MAX
            "
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
              v-for="affiliate in affiliates"
              :key="affiliate.id"
              :label="`${affiliate.name}（${affiliate.referralCode}）`"
              :value="affiliate.id"
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

<style scoped>
.coupon-code {
  font-family: monospace;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.copy-button {
  padding: 2px;
  margin-left: 4px;
}
</style>
