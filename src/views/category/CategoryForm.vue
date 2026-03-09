<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import {
  getCategories,
  type Category,
  type CategoryForm
} from "@/api/category";

const props = defineProps<{
  mode: "create" | "edit";
  initialData?: Category;
}>();

const emit = defineEmits<{
  submit: [data: CategoryForm];
  cancel: [];
}>();

const formRef = ref<FormInstance>();
const topLevelCategories = ref<Category[]>([]);

const form = reactive<CategoryForm>({
  name: "",
  description: "",
  parentId: null,
  active: true
});

const rules: FormRules = {
  name: [{ required: true, message: "請輸入分類名稱", trigger: "blur" }]
};

watch(
  () => props.initialData,
  data => {
    if (data) {
      form.name = data.name;
      form.description = data.description;
      form.parentId = data.parentId;
      form.active = data.active;
    }
  },
  { immediate: true }
);

// 只取頂層分類供父分類下拉選單使用
const fetchTopLevel = async () => {
  try {
    const all = await getCategories();
    topLevelCategories.value = all.filter(c => c.parentId === null);
  } catch {
    // 載入失敗不影響表單其他欄位
  }
};

const submitForm = async () => {
  await formRef.value?.validate(valid => {
    if (valid) emit("submit", { ...form });
  });
};

onMounted(fetchTopLevel);
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    style="max-width: 560px"
  >
    <el-form-item label="分類名稱" prop="name">
      <el-input v-model="form.name" placeholder="請輸入分類名稱" />
    </el-form-item>

    <el-form-item label="描述">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        placeholder="請輸入分類描述"
      />
    </el-form-item>

    <el-form-item label="父分類">
      <el-select
        v-model="form.parentId"
        placeholder="不選則為頂層分類"
        clearable
        style="width: 100%"
      >
        <el-option
          v-for="cat in topLevelCategories"
          :key="cat.id"
          :label="cat.name"
          :value="cat.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="啟用">
      <el-switch v-model="form.active" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">
        {{ mode === "create" ? "新增" : "儲存" }}
      </el-button>
      <el-button @click="emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>
