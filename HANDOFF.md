# Agent 交接文件

> 更新日期：2026-04-23
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

### ✅ 媒體庫系統（Commit 2-A 到 2-I）—— 全部完成

計畫文件：[`../boomparty/docs/sessions/2026-04-17-media-library.md`](../boomparty/docs/sessions/2026-04-17-media-library.md)

**已完成（已 commit）：**

- [x] 2-A：安裝 vuedraggable@next (v4.1.0)
- [x] 2-B：新增 `src/api/media.ts`
- [x] 2-C：新增 `src/api/tag.ts`
- [x] 2-D：新增 `src/views/media/index.vue`
- [x] 2-E：新增 `src/router/modules/media.ts`
- [x] 2-F：新增 `src/views/tag/index.vue` + router
- [x] 2-G：新增 `src/components/MediaPickerDialog.vue`
- [x] 2-H：`ProductForm.vue` 多圖管理 + `src/api/product.ts` 多圖端點
- [x] 2-I：`CategoryForm.vue` 封面圖 picker + `src/api/category.ts` 封面圖 API
- [x] fix：`vite.config.ts` + `nginx.conf` 加 `/media` proxy（解決開發與正式環境圖片破圖）

---

## 待執行

### 🟡 商品管理頁面（原有）

- 商品列表（含分類篩選）

### 🟡 使用者管理頁面

- 使用者列表
- 角色切換（一般用戶 ↔ ADMIN）

---

## 已完成（摘要）

| 功能              | 說明                                                            |
| ----------------- | --------------------------------------------------------------- |
| 登入 / JWT 認證   | token 存 localStorage，axios interceptor 自動帶 header          |
| 訂單管理          | 訂單列表 + 詳情 drawer，API 路徑 `/api/admin/orders`            |
| 優惠券管理        | coupon 列表、新增、停用                                         |
| 聯盟行銷管理      | affiliate 列表管理                                              |
| Docker 部署修復   | macOS `._*` 檔案問題、nginx 403 permission 問題（見 CLAUDE.md） |
| 媒體庫頁面        | 圖片 Grid + 上傳 + Drawer 詳情（alt text、tag 管理、刪除）      |
| 標籤管理頁面      | 標籤列表 + 新增表單 + 刪除                                      |
| MediaPickerDialog | 共用圖片選擇 Dialog，支援單選/多選、搜尋、上傳                  |

---

## 技術重點提醒

| 項目              | 說明                                                         |
| ----------------- | ------------------------------------------------------------ |
| 路由模組          | `src/router/modules/` 自動掃描，不需手動 import              |
| API 模組          | `src/api/` 按業務拆分，用 `http.request()` 呼叫              |
| 環境設定          | 開發用空字串 + Vite proxy，生產用 `https://api.boomparty.tw` |
| Lint              | `pnpm lint`，commit 前必跑                                   |
| NAS 部署問題      | 見 CLAUDE.md 的 Troubleshooting section                      |
| MediaPickerDialog | 用 `v-model:visible` 控制開關，不用 ref + defineExpose       |
| el-input icon     | 不能用 `prefix-icon="ep/xxx"` 字串，要用 component 或省略    |
