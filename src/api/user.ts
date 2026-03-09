import { http } from "@/utils/http";

/** 後端 /api/auth/login 實際回傳的格式 */
type BackendLoginResponse = {
  token: string;
  username: string;
  email: string;
  role: string;
  expiresAt: number;
};

export type UserResult = {
  success: boolean;
  data: {
    /** 頭像 */
    avatar: string;
    /** 用戶名 */
    username: string;
    /** 暱稱 */
    nickname: string;
    /** 當前登入用戶的角色 */
    roles: Array<string>;
    /** 按鈕級別權限 */
    permissions: Array<string>;
    /** access token */
    accessToken: string;
    /** refresh token（存於 HttpOnly cookie，此處固定為空字串） */
    refreshToken: string;
    /** accessToken 到期時間（Unix timestamp，毫秒） */
    expires: number;
  };
};

export type RefreshTokenResult = {
  success: boolean;
  data: {
    /** access token */
    accessToken: string;
    /** refresh token（存於 HttpOnly cookie，此處固定為空字串） */
    refreshToken: string;
    /** accessToken 到期時間（Unix timestamp，毫秒） */
    expires: number;
  };
};

/** 登入 */
export const getLogin = async (data?: object): Promise<UserResult> => {
  const res = await http.request<BackendLoginResponse>(
    "post",
    "/api/auth/login",
    { data }
  );
  return {
    success: true,
    data: {
      accessToken: res.token,
      refreshToken: "", // 存於 HttpOnly cookie，瀏覽器自動帶入，前端無法取得
      expires: res.expiresAt,
      username: res.username,
      nickname: res.username,
      avatar: "",
      roles: [res.role],
      permissions: []
    }
  };
};

/** 刷新 token（refresh token 由瀏覽器自動帶入 HttpOnly cookie，不需從 body 傳） */
export const refreshTokenApi = async (
  _data?: object
): Promise<RefreshTokenResult> => {
  const res = await http.request<BackendLoginResponse>(
    "post",
    "/api/auth/refresh"
  );
  return {
    success: true,
    data: {
      accessToken: res.token,
      refreshToken: "",
      expires: res.expiresAt
    }
  };
};
