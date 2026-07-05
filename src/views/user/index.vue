<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  resetUserPassword,
  type AdminUser
} from "@/api/userManagement";
import { useUserStoreHook } from "@/store/modules/user";

const loading = ref(false);
const users = ref<AdminUser[]>([]);
const searchQuery = ref("");
const currentUsername = useUserStoreHook().username;

const isSelf = (user: AdminUser): boolean => user.username === currentUsername;

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return users.value;
  }
  return users.value.filter(user => {
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.fullName && user.fullName.toLowerCase().includes(query))
    );
  });
});

const formatDate = (dateString: string | null): string => {
  if (!dateString) {
    return "—";
  }
  return dayjs(dateString).format("YYYY-MM-DD HH:mm");
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const data = await getAllUsers();
    users.value = Array.isArray(data) ? data : [];
  } catch {
    ElMessage.error("載入使用者失敗");
  } finally {
    loading.value = false;
  }
};

const changeRole = async (user: AdminUser, role: "USER" | "ADMIN") => {
  try {
    await ElMessageBox.confirm(
      `確定將「${user.username}」的角色改為 ${role}？`,
      "角色變更確認",
      { type: "warning", confirmButtonText: "確定", cancelButtonText: "取消" }
    );
    await updateUserRole(user.id, role);
    user.role = role;
    ElMessage.success("角色已更新");
  } catch (error: unknown) {
    if (error === "cancel") {
      return;
    }
    ElMessage.error("更新角色失敗");
    await fetchUsers();
  }
};

const changeStatus = async (user: AdminUser, enabled: boolean) => {
  try {
    await ElMessageBox.confirm(
      `確定${enabled ? "啟用" : "停用"}「${user.username}」？`,
      "狀態變更確認",
      { type: "warning", confirmButtonText: "確定", cancelButtonText: "取消" }
    );
    await updateUserStatus(user.id, enabled);
    user.enabled = enabled;
    ElMessage.success(enabled ? "已啟用" : "已停用");
  } catch (error: unknown) {
    if (error === "cancel") {
      // Revert the switch visual state
      user.enabled = !enabled;
      return;
    }
    ElMessage.error("更新狀態失敗");
    await fetchUsers();
  }
};

const resetPassword = async (user: AdminUser) => {
  try {
    await ElMessageBox.confirm(
      `確定重設「${user.username}」的密碼？將產生一組臨時密碼。`,
      "重設密碼確認",
      { type: "warning", confirmButtonText: "確定", cancelButtonText: "取消" }
    );
    const result = await resetUserPassword(user.id);
    await ElMessageBox.alert(
      `臨時密碼：${result.temporaryPassword}\n\n請立即複製並通知該使用者。`,
      "密碼已重設",
      { confirmButtonText: "已複製", type: "success" }
    );
  } catch (error: unknown) {
    if (error === "cancel") {
      return;
    }
    ElMessage.error("重設密碼失敗");
  }
};

const removeUser = async (user: AdminUser) => {
  try {
    await ElMessageBox.confirm(
      `確定刪除使用者「${user.username}」？此操作無法復原。`,
      "刪除確認",
      {
        type: "warning",
        confirmButtonText: "刪除",
        cancelButtonText: "取消"
      }
    );
    await deleteUser(user.id);
    ElMessage.success("刪除成功");
    fetchUsers();
  } catch (error: unknown) {
    if (error === "cancel") {
      return;
    }
    const detail =
      error !== null &&
      typeof error === "object" &&
      "response" in error &&
      error.response !== null &&
      typeof error.response === "object" &&
      "data" in error.response &&
      error.response.data !== null &&
      typeof error.response.data === "object" &&
      "detail" in error.response.data
        ? String(error.response.data.detail)
        : "刪除失敗";
    ElMessage.error(detail);
  }
};

onMounted(fetchUsers);
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">使用者管理</h2>
      <el-input
        v-model="searchQuery"
        placeholder="搜尋用戶名 / Email / 姓名"
        clearable
        style="width: 280px"
      />
    </div>

    <el-table v-loading="loading" :data="filteredUsers" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用戶名" width="140" />
      <el-table-column prop="email" label="Email" min-width="180" />
      <el-table-column prop="fullName" label="姓名" width="120">
        <template #default="{ row }">
          {{ row.fullName || "—" }}
        </template>
      </el-table-column>
      <el-table-column label="角色" width="130">
        <template #default="{ row }">
          <el-select
            :model-value="row.role"
            :disabled="isSelf(row)"
            size="small"
            @change="(role: 'USER' | 'ADMIN') => changeRole(row, role)"
          >
            <el-option value="USER" label="USER" />
            <el-option value="ADMIN" label="ADMIN" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="啟用" width="80">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled"
            :disabled="isSelf(row)"
            @change="(enabled: boolean) => changeStatus(row, enabled)"
          />
        </template>
      </el-table-column>
      <el-table-column label="建立時間" width="160" sortable>
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            type="warning"
            :disabled="isSelf(row)"
            @click="resetPassword(row)"
          >
            重設密碼
          </el-button>
          <el-button
            size="small"
            type="danger"
            :disabled="isSelf(row)"
            @click="removeUser(row)"
          >
            刪除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
