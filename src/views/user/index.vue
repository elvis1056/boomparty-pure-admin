<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  type AdminUser
} from "@/api/userManagement";
import { useUserStoreHook } from "@/store/modules/user";

const loading = ref(false);
const users = ref<AdminUser[]>([]);
const currentUsername = useUserStoreHook().username;

const isSelf = (user: AdminUser): boolean => user.username === currentUsername;

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
    await updateUserRole(user.id, role);
    user.role = role;
    ElMessage.success("角色已更新");
  } catch {
    ElMessage.error("更新角色失敗");
    await fetchUsers();
  }
};

const changeStatus = async (user: AdminUser, enabled: boolean) => {
  try {
    await updateUserStatus(user.id, enabled);
    user.enabled = enabled;
    ElMessage.success(enabled ? "已啟用" : "已停用");
  } catch {
    ElMessage.error("更新狀態失敗");
    await fetchUsers();
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
    if (error === "cancel") return;
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
    </div>

    <el-table v-loading="loading" :data="users" border stripe>
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
      <el-table-column prop="createdAt" label="建立時間" width="180">
        <template #default="{ row }">
          {{
            row.createdAt ? row.createdAt.replace("T", " ").slice(0, 19) : "—"
          }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
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
