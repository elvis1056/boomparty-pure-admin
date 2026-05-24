<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  type Booking,
  type BookingMaterial,
  type MaterialForm,
  getBookingMaterials,
  addBookingMaterial,
  updateBookingMaterial,
  deleteBookingMaterial
} from "@/api/booking";

interface Props {
  booking: Booking;
}

interface Emits {
  (e: "updated"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);
const error = ref(false);
const materials = ref<BookingMaterial[]>([]);
const submitting = ref(false);
const editingId = ref<number | null>(null);

const emptyForm = (): MaterialForm => ({
  itemName: "",
  quantity: 1,
  unitCost: 0,
  note: ""
});

const form = reactive<MaterialForm>(emptyForm());

// Computed from local state for instant feedback
const totalMaterialCost = computed(() =>
  materials.value.reduce(
    (sum, material) => sum + material.quantity * material.unitCost,
    0
  )
);

const calculatedProfit = computed(() => {
  if (props.booking.quoteAmount === null) {
    return null;
  }
  return props.booking.quoteAmount - totalMaterialCost.value;
});

const fetchMaterials = async () => {
  loading.value = true;
  error.value = false;
  try {
    const data = await getBookingMaterials(props.booking.id);
    materials.value = Array.isArray(data) ? data : [];
  } catch {
    error.value = true;
    ElMessage.error("載入材料清單失敗");
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  Object.assign(form, emptyForm());
  editingId.value = null;
};

const startEdit = (material: BookingMaterial) => {
  editingId.value = material.id;
  form.itemName = material.itemName;
  form.quantity = material.quantity;
  form.unitCost = material.unitCost;
  form.note = material.note !== null ? material.note : "";
};

const submitForm = async () => {
  if (!form.itemName.trim()) {
    ElMessage.error("品名不能為空");
    return;
  }
  if (form.quantity <= 0) {
    ElMessage.error("數量必須大於 0");
    return;
  }
  if (form.unitCost < 0) {
    ElMessage.error("單價不能為負數");
    return;
  }

  submitting.value = true;
  try {
    if (editingId.value !== null) {
      // Update existing
      const updated = await updateBookingMaterial(
        props.booking.id,
        editingId.value,
        form
      );
      const index = materials.value.findIndex(
        material => material.id === editingId.value
      );
      if (index !== -1) {
        materials.value[index] = updated;
      }
      ElMessage.success("材料已更新");
    } else {
      // Add new
      const added = await addBookingMaterial(props.booking.id, form);
      materials.value.push(added);
      ElMessage.success("材料已新增");
    }
    resetForm();
    emit("updated");
  } catch {
    ElMessage.error(editingId.value !== null ? "更新材料失敗" : "新增材料失敗");
  } finally {
    submitting.value = false;
  }
};

const removeMaterial = async (material: BookingMaterial) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除「${material.itemName}」嗎？`,
      "刪除材料",
      { type: "warning" }
    );
  } catch {
    return; // User cancelled
  }

  try {
    await deleteBookingMaterial(props.booking.id, material.id);
    materials.value = materials.value.filter(item => item.id !== material.id);
    // If we were editing this item, reset form
    if (editingId.value === material.id) {
      resetForm();
    }
    ElMessage.success("材料已刪除");
    emit("updated");
  } catch {
    ElMessage.error("刪除材料失敗");
  }
};

const formatCurrency = (amount: number): string => {
  return `NT$ ${amount.toLocaleString()}`;
};

onMounted(fetchMaterials);
</script>

<template>
  <div>
    <div v-loading="loading">
      <div v-if="error && !loading" class="py-8 text-center text-gray-400">
        載入失敗，
        <el-button type="primary" link @click="fetchMaterials">重試</el-button>
      </div>

      <template v-if="!error">
        <!-- Materials table -->
        <el-table
          v-if="materials.length > 0"
          :data="materials"
          border
          size="small"
          class="mb-4"
        >
          <el-table-column prop="itemName" label="品名" min-width="140" />
          <el-table-column
            prop="quantity"
            label="數量"
            width="80"
            align="center"
          />
          <el-table-column label="單價" width="110" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.unitCost) }}
            </template>
          </el-table-column>
          <el-table-column label="小計" width="110" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.quantity * row.unitCost) }}
            </template>
          </el-table-column>
          <el-table-column prop="note" label="備註" min-width="100">
            <template #default="{ row }">
              {{ row.note !== null ? row.note : "" }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button
                size="small"
                link
                type="primary"
                @click="startEdit(row)"
              >
                編輯
              </el-button>
              <el-button
                size="small"
                link
                type="danger"
                @click="removeMaterial(row)"
              >
                刪除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-if="!loading && materials.length === 0"
          description="尚無材料"
        />

        <!-- Summary -->
        <div v-if="materials.length > 0" class="mb-4 rounded bg-gray-50 p-3">
          <div class="flex justify-between">
            <span class="font-bold">材料總成本</span>
            <span class="font-bold">{{
              formatCurrency(totalMaterialCost)
            }}</span>
          </div>
          <div
            v-if="calculatedProfit !== null"
            class="mt-1 flex justify-between"
          >
            <span>毛利（報價 - 材料）</span>
            <span
              :class="calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ formatCurrency(calculatedProfit) }}
            </span>
          </div>
        </div>

        <!-- Add / Edit form -->
        <div class="rounded border border-dashed border-gray-300 p-3">
          <p class="mb-3 text-sm font-bold">
            {{ editingId !== null ? "編輯材料" : "新增材料" }}
          </p>
          <div class="flex flex-wrap items-end gap-2">
            <div>
              <label class="mb-1 block text-xs text-gray-500">品名</label>
              <el-input
                v-model="form.itemName"
                placeholder="品名"
                style="width: 140px"
                size="small"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-500">數量</label>
              <el-input-number
                v-model="form.quantity"
                :min="1"
                size="small"
                style="width: 100px"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-500">單價</label>
              <el-input-number
                v-model="form.unitCost"
                :min="0"
                :step="10"
                size="small"
                style="width: 120px"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-500">備註</label>
              <el-input
                v-model="form.note"
                placeholder="備註（選填）"
                size="small"
                style="width: 120px"
              />
            </div>
            <div class="flex gap-1">
              <el-button
                type="primary"
                size="small"
                :loading="submitting"
                @click="submitForm"
              >
                {{ editingId !== null ? "更新" : "新增" }}
              </el-button>
              <el-button
                v-if="editingId !== null"
                size="small"
                @click="resetForm"
              >
                取消
              </el-button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
