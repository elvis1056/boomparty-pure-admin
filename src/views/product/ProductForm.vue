<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { getCategories, type Category } from "@/api/category";
import {
  addProductImage,
  removeProductImage,
  setProductPrimaryImage,
  reorderProductImages,
  type Product,
  type ProductForm,
  type ProductImage
} from "@/api/product";
import type { MediaAsset } from "@/api/media";
import draggable from "vuedraggable";
import MediaPickerDialog from "@/components/MediaPickerDialog.vue";
import DCaretIcon from "~icons/ep/d-caret";
import DeleteIcon from "~icons/ep/delete";

const props = defineProps<{
  mode: "create" | "edit";
  initialData?: Product;
}>();

const emit = defineEmits<{
  submit: [data: ProductForm];
  cancel: [];
}>();

const formRef = ref<FormInstance>();
const categories = ref<Category[]>([]);

const form = reactive<ProductForm>({
  name: "",
  description: "",
  price: 0,
  stock: 0,
  imageUrl: "",
  active: true,
  featured: false,
  categoryId: null
});

const rules: FormRules = {
  name: [{ required: true, message: "請輸入商品名稱", trigger: "blur" }],
  price: [{ required: true, message: "請輸入價格", trigger: "blur" }],
  stock: [{ required: true, message: "請輸入庫存", trigger: "blur" }]
};

// 多圖狀態
const images = ref<ProductImage[]>([]);
const pickerVisible = ref(false);
const pickerValue = ref<MediaAsset | null>(null);

const openPicker = () => {
  pickerVisible.value = true;
};

// 監聽 picker 選完後新增圖片
watch(pickerValue, async media => {
  if (!media || !props.initialData) return;
  try {
    const added = await addProductImage(props.initialData.id, media.id);
    images.value.push(added);
    pickerValue.value = null;
    ElMessage.success("已新增圖片");
  } catch {
    ElMessage.error("新增圖片失敗");
    pickerValue.value = null;
  }
});

// 編輯模式時將初始資料填入表單
watch(
  () => props.initialData,
  data => {
    if (data) {
      form.name = data.name;
      form.description = data.description;
      form.price = data.price;
      form.stock = data.stock;
      form.imageUrl = data.imageUrl;
      form.active = data.active;
      form.featured = data.featured;
      form.categoryId = data.categoryId;
      images.value = data.images ? [...data.images] : [];
    }
  },
  { immediate: true }
);

const fetchCategories = async () => {
  try {
    categories.value = await getCategories();
  } catch {
    // 分類載入失敗時下拉選單留空，不影響表單其他欄位
  }
};

const submitForm = async () => {
  await formRef.value?.validate(valid => {
    if (valid) emit("submit", { ...form });
  });
};

const setPrimary = async (image: ProductImage) => {
  if (!props.initialData) return;
  try {
    await setProductPrimaryImage(props.initialData.id, image.id);
    images.value = images.value.map(img => ({
      ...img,
      isPrimary: img.id === image.id
    }));
    ElMessage.success("已設為主圖");
  } catch {
    ElMessage.error("設定失敗");
  }
};

const removeImage = async (image: ProductImage) => {
  if (!props.initialData) return;
  try {
    await removeProductImage(props.initialData.id, image.id);
    images.value = images.value.filter(img => img.id !== image.id);
    ElMessage.success("已移除");
  } catch {
    ElMessage.error("移除失敗");
  }
};

const onDragEnd = async () => {
  if (!props.initialData) return;
  const orders = images.value.map((img, idx) => ({
    imageId: img.id,
    sortOrder: idx
  }));
  try {
    await reorderProductImages(props.initialData.id, orders);
  } catch {
    ElMessage.error("排序儲存失敗");
  }
};

onMounted(fetchCategories);
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    style="max-width: 680px"
  >
    <el-form-item label="商品名稱" prop="name">
      <el-input v-model="form.name" placeholder="請輸入商品名稱" />
    </el-form-item>

    <el-form-item label="描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="4"
        placeholder="請輸入商品描述"
      />
    </el-form-item>

    <el-form-item label="價格" prop="price">
      <el-input-number v-model="form.price" :min="0" :precision="0" />
    </el-form-item>

    <el-form-item label="庫存" prop="stock">
      <el-input-number v-model="form.stock" :min="0" :precision="0" />
    </el-form-item>

    <!-- 商品圖片（多圖管理） -->
    <el-form-item label="商品圖片">
      <div class="w-full">
        <!-- 拖曳排序圖片列表 -->
        <draggable
          v-model="images"
          item-key="id"
          class="mb-2 flex flex-wrap gap-2"
          handle=".drag-handle"
          @end="onDragEnd"
        >
          <template #item="{ element: img }">
            <div
              class="relative overflow-hidden rounded border"
              :class="img.isPrimary ? 'border-blue-500' : 'border-gray-200'"
              style="width: 100px"
            >
              <!-- 拖曳把手 -->
              <div
                class="drag-handle absolute left-0 top-0 flex h-6 w-full cursor-grab items-center justify-center bg-black/20 text-white"
              >
                <el-icon size="12"><DCaretIcon /></el-icon>
              </div>
              <img
                :src="img.url"
                :alt="img.altText !== null ? img.altText : ''"
                class="aspect-square w-full object-cover"
              />
              <!-- 主圖標 -->
              <div
                v-if="img.isPrimary"
                class="absolute bottom-0 left-0 w-full bg-blue-500 py-0.5 text-center text-xs text-white"
              >
                主圖
              </div>
              <!-- 操作按鈕 -->
              <div class="flex gap-1 p-1">
                <el-button
                  v-if="!img.isPrimary"
                  size="small"
                  type="primary"
                  plain
                  class="flex-1 !px-0 text-xs"
                  @click="setPrimary(img)"
                >
                  設主圖
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  class="!px-1"
                  @click="removeImage(img)"
                >
                  <el-icon><DeleteIcon /></el-icon>
                </el-button>
              </div>
            </div>
          </template>
        </draggable>

        <!-- 新增圖片按鈕（僅編輯模式可用） -->
        <div v-if="mode === 'edit'">
          <el-button size="small" @click="openPicker">+ 新增圖片</el-button>
          <span class="ml-2 text-xs text-gray-400">拖曳圖片可調整排序</span>
        </div>
        <div v-else class="text-xs text-gray-400">儲存商品後可新增圖片</div>
      </div>
    </el-form-item>

    <el-form-item label="分類">
      <el-select
        v-model="form.categoryId"
        placeholder="請選擇分類"
        clearable
        style="width: 100%"
      >
        <el-option-group
          v-for="parent in categories"
          :key="parent.id"
          :label="parent.name"
        >
          <el-option
            v-for="child in parent.children"
            :key="child.id"
            :label="child.name"
            :value="child.id"
          />
        </el-option-group>
      </el-select>
    </el-form-item>

    <el-form-item label="上架">
      <el-switch v-model="form.active" />
    </el-form-item>

    <el-form-item label="熱門商品">
      <el-switch v-model="form.featured" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">
        {{ mode === "create" ? "新增" : "儲存" }}
      </el-button>
      <el-button @click="emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>

  <!-- 圖片選擇 Dialog -->
  <MediaPickerDialog v-model="pickerValue" v-model:visible="pickerVisible" />
</template>
