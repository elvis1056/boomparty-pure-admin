# Agent 交接文件

> 更新日期：2026-04-20
> 專案：boomparty-pure-admin（Vue 3 + Element Plus 後台管理介面）
> 路徑：`/Users/elvis1056/Desktop/nasweb/boomparty-pure-admin`

---

## 工作流程（新 agent 請先看這裡）

```
（確認此文件現況）
（做事）
（完成後更新此文件的日期與狀態）
```

---

## 進行中計畫

目前無進行中計畫。

---

## 待執行

### 🟡 商品管理頁面

- 商品列表（含分類篩選）
- 新增 / 編輯商品表單
- 圖片上傳

### 🟡 使用者管理頁面

- 使用者列表
- 角色切換（一般用戶 ↔ ADMIN）

### 🟡 儀表板 / 數據分析

- 銷售趨勢圖表
- 訂單統計卡片
- 後端需對應 `GET /api/admin/dashboard/stats` 端點

---

## 已完成（摘要）

| 功能            | 說明                                                            |
| --------------- | --------------------------------------------------------------- |
| 登入 / JWT 認證 | token 存 localStorage，axios interceptor 自動帶 header          |
| 訂單管理        | 訂單列表 + 詳情 drawer，API 路徑 `/api/admin/orders`            |
| 優惠券管理      | coupon 列表、新增、停用                                         |
| 聯盟行銷管理    | affiliate 列表管理                                              |
| Docker 部署修復 | macOS `._*` 檔案問題、nginx 403 permission 問題（見 CLAUDE.md） |

---

## 技術重點提醒

| 項目         | 說明                                                         |
| ------------ | ------------------------------------------------------------ |
| 路由模組     | `src/router/modules/` 自動掃描，不需手動 import              |
| API 模組     | `src/api/` 按業務拆分，用 `http.request()` 呼叫              |
| 環境設定     | 開發用空字串 + Vite proxy，生產用 `https://api.boomparty.tw` |
| Lint         | `pnpm lint`，commit 前必跑                                   |
| NAS 部署問題 | 見 CLAUDE.md 的 Troubleshooting section                      |
