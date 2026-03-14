<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getAllAffiliates,
  createAffiliate,
  updateAffiliate,
  getAllCommissions,
  updateCommissionStatus,
  COMMISSION_STATUS,
  type Affiliate,
  type Commission,
  type CreateAffiliateRequest,
  type CommissionStatus
} from "@/api/affiliate";

// ─── 列表 ───
const loading = ref(false);
const affiliates = ref<Affiliate[]>([]);

const fetchAffiliates = async () => {
  loading.value = true;
  try {
    const data = await getAllAffiliates();
    affiliates.value = Array.isArray(data) ? data : [];
  } catch {
    ElMessage.error("載入分享人列表失敗");
  } finally {
    loading.value = false;
  }
};

// ─── 新增 / 編輯 Dialog ───
const dialogVisible = ref(false);
const dialogTitle = ref("新增分享人");
const editingId = ref<number | null>(null);
const dialogLoading = ref(false);

const form = reactive<CreateAffiliateRequest>({
  name: "",
  email: null,
  referralCode: "",
  commissionRate: 10,
  isActive: true,
  note: null
});

const resetForm = () => {
  form.name = "";
  form.email = null;
  form.referralCode = "";
  form.commissionRate = 10;
  form.isActive = true;
  form.note = null;
  editingId.value = null;
};

const openCreate = () => {
  resetForm();
  dialogTitle.value = "新增分享人";
  dialogVisible.value = true;
};

const openEdit = (row: Affiliate) => {
  resetForm();
  dialogTitle.value = "編輯分享人";
  editingId.value = row.id;
  form.name = row.name;
  form.email = row.email;
  form.referralCode = row.referralCode;
  form.commissionRate = row.commissionRate;
  form.isActive = row.isActive;
  form.note = row.note;
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!form.name || !form.referralCode) {
    ElMessage.warning("名稱與推薦碼為必填");
    return;
  }
  dialogLoading.value = true;
  try {
    if (editingId.value !== null) {
      await updateAffiliate(editingId.value, { ...form });
      ElMessage.success("已更新");
    } else {
      await createAffiliate({ ...form });
      ElMessage.success("已新增");
    }
    dialogVisible.value = false;
    fetchAffiliates();
  } catch {
    ElMessage.error("操作失敗，請稍後再試");
  } finally {
    dialogLoading.value = false;
  }
};

// ─── 佣金 Drawer ───
const commissionDrawerVisible = ref(false);
const commissionLoading = ref(false);
const commissions = ref<Commission[]>([]);
const selectedAffiliate = ref<Affiliate | null>(null);

const openCommissions = async (row: Affiliate) => {
  selectedAffiliate.value = row;
  commissionDrawerVisible.value = true;
  commissionLoading.value = true;
  try {
    const all = await getAllCommissions();
    commissions.value = (Array.isArray(all) ? all : []).filter(
      c => c.affiliateId === row.id
    );
  } catch {
    ElMessage.error("載入佣金紀錄失敗");
  } finally {
    commissionLoading.value = false;
  }
};

const markAsPaid = async (commission: Commission) => {
  if (commission.status === "PAID") return;
  try {
    await ElMessageBox.confirm(
      `確定將訂單 ${commission.orderNumber} 的佣金標記為已付款？`,
      "確認付款",
      {
        type: "warning",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
      }
    );
    await updateCommissionStatus(commission.id, "PAID" as CommissionStatus);
    ElMessage.success("已標記為已付款");
    if (selectedAffiliate.value) {
      openCommissions(selectedAffiliate.value);
    }
  } catch {
    // 取消操作
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

onMounted(fetchAffiliates);
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">分享人管理</h2>
      <el-button type="primary" @click="openCreate">新增分享人</el-button>
    </div>

    <el-table v-loading="loading" :data="affiliates" border stripe>
      <el-table-column prop="name" label="名稱" min-width="120" />
      <el-table-column prop="referralCode" label="推薦碼" min-width="120" />
      <el-table-column label="佣金率" width="90">
        <template #default="{ row }"> {{ row.commissionRate }}% </template>
      </el-table-column>
      <el-table-column prop="email" label="Email" min-width="160" />
      <el-table-column label="狀態" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'">
            {{ row.isActive ? "啟用" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">編輯</el-button>
          <el-button size="small" type="primary" @click="openCommissions(row)">
            佣金
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增 / 編輯 Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px">
      <el-form label-width="90px">
        <el-form-item label="名稱" required>
          <el-input v-model="form.name" placeholder="分享人姓名或暱稱" />
        </el-form-item>
        <el-form-item label="推薦碼" required>
          <el-input v-model="form.referralCode" placeholder="JOLIN10" />
        </el-form-item>
        <el-form-item label="佣金率 (%)">
          <el-input-number
            v-model="form.commissionRate"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="Email">
          <el-input
            v-model="form.email"
            placeholder="email@example.com（選填）"
          />
        </el-form-item>
        <el-form-item label="啟用">
          <el-switch v-model="form.isActive" />
        </el-form-item>
        <el-form-item label="備註">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="3"
            placeholder="備註（選填）"
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

    <!-- 佣金紀錄 Drawer -->
    <el-drawer
      v-model="commissionDrawerVisible"
      :title="`佣金紀錄 — ${selectedAffiliate ? selectedAffiliate.name : ''}`"
      direction="rtl"
      size="560px"
    >
      <el-table
        v-loading="commissionLoading"
        :data="commissions"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="orderNumber" label="訂單編號" min-width="160" />
        <el-table-column label="佣金金額" width="110">
          <template #default="{ row }">
            NT$ {{ row.commissionAmount.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="90">
          <template #default="{ row }">
            <el-tag :type="COMMISSION_STATUS[row.status].type">
              {{ COMMISSION_STATUS[row.status].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="建立時間" min-width="150">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'PAID'"
              size="small"
              type="success"
              @click="markAsPaid(row)"
            >
              標記付款
            </el-button>
            <span v-else class="text-gray-400 text-sm">已完成</span>
          </template>
        </el-table-column>
      </el-table>
      <div
        v-if="!commissionLoading && commissions.length === 0"
        class="mt-6 text-center text-gray-400"
      >
        尚無佣金紀錄
      </div>
    </el-drawer>
  </div>
</template>
