<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import {
  getCategories,
  setCategoryCoverImage,
  removeCategoryCoverImage,
  type Category,
  type CategoryForm
} from "@/api/category";
import type { MediaAsset } from "@/api/media";
import MediaPickerDialog from "@/components/MediaPickerDialog.vue";

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

// 封面圖狀態
const coverImageUrl = ref<string | null>(null);
const pickerVisible = ref(false);
const pickerValue = ref<MediaAsset | null>(null);

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
      coverImageUrl.value = data.coverImageUrl;
    }
  },
  { immediate: true }
);

// 選完圖片後呼叫 API 設定封面圖
watch(pickerValue, async media => {
  if (!media || !props.initialData) return;
  try {
    await setCategoryCoverImage(props.initialData.id, media.id);
    coverImageUrl.value = media.url;
    pickerValue.value = null;
    ElMessage.success("封面圖已更新");
  } catch {
    ElMessage.error("設定封面圖失敗");
    pickerValue.value = null;
  }
});

const removeCover = async () => {
  if (!props.initialData) return;
  try {
    await removeCategoryCoverImage(props.initialData.id);
    coverImageUrl.value = null;
    ElMessage.success("封面圖已移除");
  } catch {
    ElMessage.error("移除封面圖失敗");
  }
};

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

    <!-- 封面圖（僅編輯模式可用） -->
    <el-form-item label="封面圖">
      <div v-if="mode === 'edit'">
        <div v-if="coverImageUrl" class="mb-2">
          <img
            :src="coverImageUrl"
            alt="封面圖"
            class="mb-1 rounded border border-gray-200 object-cover"
            style="width: 120px; height: 120px"
          />
          <div>
            <el-button size="small" @click="pickerVisible = true">
              更換圖片
            </el-button>
            <el-button size="small" type="danger" plain @click="removeCover">
              移除
            </el-button>
          </div>
        </div>
        <el-button v-else size="small" @click="pickerVisible = true">
          選擇圖片
        </el-button>
      </div>
      <span v-else class="text-xs text-gray-400">儲存分類後可設定封面圖</span>
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

  <MediaPickerDialog v-model="pickerValue" v-model:visible="pickerVisible" />
</template>
