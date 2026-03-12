/**
 * Token Refresh 流程模擬
 * 直接貼進 Chrome DevTools Console 執行
 *
 * 想測試失敗情況：把第 7 行 REFRESH_SHOULD_SUCCEED 改成 false
 */

const REFRESH_SHOULD_SUCCEED = true;

// ─────────────────────────────────────────────
// 靜態屬性（對應 PureHttp 的 static 屬性）
// ─────────────────────────────────────────────
let requests = [];
let isRefreshing = false;

// ─────────────────────────────────────────────
// 工具函式
// ─────────────────────────────────────────────
function formatToken(token) {
  return "Bearer " + token;
}

function logOut() {
  console.log("    [logOut] 清除 cookie，跳回登入頁");
}

// ─────────────────────────────────────────────
// retryOriginalRequest（對應 http/index.ts 第 56-66 行）
// ─────────────────────────────────────────────
function retryOriginalRequest(config) {
  console.log(
    `    [retryOriginalRequest] 建立 Promise B，把 { resolve, reject } 推進 requests 陣列（目前長度：${requests.length + 1}）`
  );

  return new Promise((resolve, reject) => {
    // ← Promise B
    requests.push({
      resolve: token => {
        console.log(
          `    [requests callback] ${config.requestName}：拿到新 token，更新 header 並 resolve Promise B`
        );
        config.headers["Authorization"] = formatToken(token);
        resolve(config); // Promise B resolve → Promise A 跟著 resolve
      },
      reject
    });
  });
}

// ─────────────────────────────────────────────
// 模擬 handRefreshToken（對應 store/modules/user.ts）
// 用 setTimeout 模擬網路延遲 800ms
// ─────────────────────────────────────────────
function handRefreshToken() {
  return new Promise((resolve, reject) => {
    console.log("    [handRefreshToken] 開始呼叫 /api/auth/refresh...");
    setTimeout(() => {
      if (REFRESH_SHOULD_SUCCEED) {
        console.log("    [handRefreshToken] 後端回應成功，回傳新 accessToken");
        resolve({ data: { accessToken: "new-token-xyz789" } });
      } else {
        console.log(
          "    [handRefreshToken] 後端回應失敗（refresh token 過期）"
        );
        reject(new Error("Refresh token 過期"));
      }
    }, 800);
  });
}

// ─────────────────────────────────────────────
// 模擬攔截器（對應 http/index.ts 第 79-116 行）
// ─────────────────────────────────────────────
function interceptRequest(config) {
  console.log(`\n  [攔截器] ${config.requestName} 進入`);

  return new Promise(resolve => {
    // ← Promise A
    const expired = true; // 假設 token 一定過期

    if (expired) {
      console.log(`  [攔截器] ${config.requestName}：token 已過期`);

      if (!isRefreshing) {
        console.log(
          `  [攔截器] ${config.requestName}：isRefreshing = false，我來發 refresh`
        );
        isRefreshing = true;

        // 非同步發出 refresh，不等結果，繼續往下跑
        handRefreshToken()
          .then(res => {
            const token = res.data.accessToken;
            console.log(`\n  [.then] refresh 成功，新 token：${token}`);
            console.log(
              `  [.then] 呼叫 requests 陣列裡所有 callback（共 ${requests.length} 個）`
            );
            requests.forEach(({ resolve }) => resolve(token));
            requests = [];
          })
          .catch(() => {
            console.log(`\n  [.catch] refresh 失敗`);
            console.log(
              `  [.catch] reject 所有排隊的請求（共 ${requests.length} 個）`
            );
            requests.forEach(({ reject }) =>
              reject(new Error("Token 過期，請重新登入"))
            );
            requests = [];
            logOut();
          })
          .finally(() => {
            isRefreshing = false;
            console.log("  [.finally] isRefreshing = false");
          });
      } else {
        console.log(
          `  [攔截器] ${config.requestName}：isRefreshing = true，直接排隊`
        );
      }

      // 第 116 行：立刻執行，不等 handRefreshToken 完成
      console.log(
        `  [攔截器] ${config.requestName}：執行第 116 行 → resolve(retryOriginalRequest(config))`
      );
      resolve(retryOriginalRequest(config));
      // Promise A 跟著等 Promise B
    }
  });
}

// ─────────────────────────────────────────────
// 主程式：三個請求同時發出
// ─────────────────────────────────────────────
async function main() {
  console.log("=== token 過期，三個請求同時進入攔截器 ===");

  const configA = { headers: {}, requestName: "商品列表 GET /api/products" };
  const configB = { headers: {}, requestName: "分類列表 GET /api/categories" };
  const configC = { headers: {}, requestName: "使用者資訊 GET /api/users/me" };

  const promiseA = interceptRequest(configA);
  const promiseB = interceptRequest(configB);
  const promiseC = interceptRequest(configC);

  console.log("\n=== 三個請求都進了攔截器，現在等 refresh 結果 ===");

  try {
    const results = await Promise.all([promiseA, promiseB, promiseC]);
    console.log("\n=== 所有請求完成，各自拿到新 token ===");
    results.forEach(config => {
      console.log(
        `  ${config.requestName} → ${config.headers["Authorization"]}`
      );
    });
  } catch (error) {
    console.log(`\n=== 請求失敗：${error.message} ===`);
  }
}

main();
