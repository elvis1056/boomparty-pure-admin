import { defineStore } from "pinia";
import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import { getLogin, refreshTokenApi } from "@/api/user";
import { useMultiTagsStoreHook } from "./multiTags";
import { type DataInfo, setToken, removeToken, userKey } from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => ({
    // 頭像
    avatar: storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "",
    // 使用者名
    username: storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "",
    // 暱稱
    nickname: storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "",
    // 頁面級別權限
    roles: storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [],
    // 按鈕級別權限
    permissions:
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [],
    // 是否勾選了登入頁的免登入
    isRemembered: false,
    // 登入頁的免登入存儲幾天，預設7天
    loginDay: 7
  }),
  actions: {
    /** 存儲頭像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    /** 存儲使用者名 */
    SET_USERNAME(username: string) {
      this.username = username;
    },
    /** 存儲暱稱 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    /** 存儲角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存儲按鈕級別權限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存儲是否勾選了登入頁的免登入 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 設置登入頁的免登入存儲幾天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 登入 */
    async loginByUsername(requestPayload) {
      const loginResult = await getLogin(requestPayload);
      if (loginResult?.success) {
        setToken(loginResult.data);
      }
      return loginResult;
    },
    /** 前端登出（不調用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      this.permissions = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
    /** 刷新`token` */
    async handRefreshToken(requestPayload) {
      const apiResponse = await refreshTokenApi(requestPayload);
      if (apiResponse) {
        setToken(apiResponse.data);
      }
      return apiResponse;
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
