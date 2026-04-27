import { http } from "@/utils/http";

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  role: "USER" | "ADMIN";
  enabled: boolean;
  createdAt: string;
};

/** 取得所有使用者（ADMIN only） */
export const getAllUsers = () => http.request<AdminUser[]>("get", "/api/users");

/** 切換使用者角色（不能改自己，後端有保護） */
export const updateUserRole = (id: number, role: "USER" | "ADMIN") =>
  http.request<AdminUser>("patch", `/api/users/${id}/role`, {
    params: { role }
  });

/** 切換使用者啟用狀態 */
export const updateUserStatus = (id: number, enabled: boolean) =>
  http.request<AdminUser>("patch", `/api/users/${id}/status`, {
    params: { enabled }
  });

/** 刪除使用者（有訂單時後端會回傳錯誤） */
export const deleteUser = (id: number) =>
  http.request<void>("delete", `/api/users/${id}`);
