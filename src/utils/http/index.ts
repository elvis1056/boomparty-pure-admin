import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";

// 相關配置請參考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // 請求超時時間
  timeout: 10000,
  // 跨域請求帶上 cookie（refreshToken 存於 HttpOnly cookie）
  withCredentials: true,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 數組格式參數序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** `token`過期後，暫存待執行的請求 */
  private static requests: Array<{
    resolve: (token: string) => void;
    reject: (reason?: any) => void;
  }> = [];

  /** 防止重複刷新`token` */
  private static isRefreshing = false;

  /** State-changing HTTP methods that require CSRF token */
  private static readonly CSRF_METHODS = ["POST", "PUT", "DELETE", "PATCH"];

  /** Read CSRF token from XSRF-TOKEN cookie set by Spring Security */
  private static getCsrfTokenFromCookie(): string | null {
    const cookies = document.cookie.split(";");
    const csrfCookie = cookies.find(cookie =>
      cookie.trim().startsWith("XSRF-TOKEN=")
    );
    if (!csrfCookie) {
      return null;
    }
    return csrfCookie.split("=")[1];
  }

  /** 初始化配置對象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 儲存目前`Axios`實例對象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重連原始請求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise((resolve, reject) => {
      PureHttp.requests.push({
        resolve: (token: string) => {
          config.headers["Authorization"] = formatToken(token);
          resolve(config);
        },
        reject
      });
    });
  }

  /** 請求攔截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // Inject CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
        if (
          PureHttp.CSRF_METHODS.includes(config.method?.toUpperCase() ?? "")
        ) {
          const csrfToken = PureHttp.getCsrfTokenFromCookie();
          if (csrfToken) {
            config.headers["X-XSRF-TOKEN"] = csrfToken;
          }
        }

        // 優先判斷 post/get 等方法是否傳入回調，否則執行初始化設置等回調
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }

        // 白名單內的路徑不需要 token，直接放行
        const whiteList = ["/refresh-token", "/login", "/auth/refresh"];
        if (whiteList.some(url => config.url.endsWith(url))) {
          return config;
        }

        // 沒有 token，直接放行
        const tokenData = getToken();
        if (!tokenData) return config;

        // token 未過期，塞入 header 後放行
        const expired = parseInt(tokenData.expires) - new Date().getTime() <= 0;
        if (!expired) {
          config.headers["Authorization"] = formatToken(tokenData.accessToken);
          return config;
        }

        // token 過期，發起 refresh
        if (!PureHttp.isRefreshing) {
          PureHttp.isRefreshing = true;
          useUserStoreHook()
            .handRefreshToken()
            .then(res => {
              const token = res.data.accessToken;
              config.headers["Authorization"] = formatToken(token);
              PureHttp.requests.forEach(({ resolve }) => resolve(token));
              PureHttp.requests = [];
            })
            .catch(() => {
              // Refresh 失敗，清除所有等待中的請求並登出
              PureHttp.requests.forEach(({ reject }) =>
                reject(new Error("Token 過期，請重新登入"))
              );
              PureHttp.requests = [];
              useUserStoreHook().logOut();
            })
            .finally(() => {
              PureHttp.isRefreshing = false;
            });
        }

        // 排隊等待 refresh 完成後重試
        return PureHttp.retryOriginalRequest(config);
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 響應攔截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;
        // 優先判斷post/get等方法是否傳入回調，否則執行初始化設置等回調
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        return response.data;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        // 所有的響應異常 區分來源為取消請求/非取消請求
        return Promise.reject($error);
      }
    );
  }

  /** 通用請求工具函數 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 單獨處理自訂請求/響應回調
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 單獨抽離的`post`工具函數 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 單獨抽離的`get`工具函數 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
