<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { getCategories, type Category } from "@/api/category";
import type { Product, ProductForm } from "@/api/product";

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

onMounted(fetchCategories);
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    style="max-width: 640px"
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

    <el-form-item label="圖片網址">
      <el-input v-model="form.imageUrl" placeholder="https://..." />
      <img
        v-if="form.imageUrl"
        :src="form.imageUrl"
        style="
          max-width: 200px;
          max-height: 200px;
          margin-top: 8px;
          object-fit: cover;
        "
      />
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
</template>
