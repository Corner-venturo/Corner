# API 安全審查報告 2026-02-18

## 摘要

審查了 44 個 API 路由文件，涵蓋認證、輸入驗證、錯誤處理三大面向。

**結果：** 發現 2 個 bug（已修復），整體安全狀態良好。

---

## 修復的 Bug

### 1. `cron/ticket-status` → `bot/ticket-status` Header 不匹配 🔴
- **問題：** `cron/ticket-status` 發送 `authorization` header，但 `bot/ticket-status` 檢查的是 `x-bot-secret`
- **影響：** Cron 呼叫 bot API 時認證永遠失敗
- **修復：** 改為發送 `x-bot-secret` header

### 2. `auth/get-employee-data` 缺少 try-catch 🟡
- **問題：** 整個 POST handler 沒有 try-catch，且引入了未使用的 `withAuth`
- **修復：** 加上 try-catch + 移除未使用的 import

---

## 所有路由認證狀態

### ✅ 需要認證（getServerAuth / withAuth）的路由

| 路由 | 方法 | 認證方式 | Rate Limit | Zod 驗證 |
|------|------|----------|------------|----------|
| `/api/ai/edit-image` | POST | getServerAuth | API usage limit | ✅ |
| `/api/ai/suggest-attraction` | POST | getServerAuth | API usage limit | ✅ |
| `/api/auth/admin-reset-password` | POST | getServerAuth + admin check | ✅ 5/min | ✅ |
| `/api/auth/create-employee-auth` | POST | getServerAuth | ❌ | ✅ |
| `/api/auth/reset-employee-password` | POST | getServerAuth | ❌ | ✅ |
| `/api/fetch-image` | POST | getServerAuth | ❌ | ✅ |
| `/api/gemini/generate-image` | POST | getServerAuth | ❌ | ✅ |
| `/api/health/detailed` | GET | session check | ❌ | N/A |
| `/api/itineraries/generate` | POST | getServerAuth | ❌ | ✅ |
| `/api/linkpay` | POST | getServerAuth | ✅ | ✅ |
| `/api/log-error` | POST | getServerAuth | ❌ | ✅ |
| `/api/logan/chat` | POST | getServerAuth | ❌ | ✅ |
| `/api/ocr/passport` | POST | getServerAuth | ❌ | N/A (FormData) |
| `/api/ocr/passport/batch-reprocess` | GET/POST | getServerAuth | ❌ | ✅ (POST) |
| `/api/proposals/convert-to-tour` | POST | getServerAuth | ❌ | ✅ |
| `/api/quotes/confirmation/logs` | GET | getServerAuth | ❌ | N/A |
| `/api/quotes/confirmation/revoke` | POST | getServerAuth | ❌ | ✅ |
| `/api/quotes/confirmation/send` | POST | getServerAuth | ❌ | ✅ |
| `/api/quotes/confirmation/staff` | POST | getServerAuth | ❌ | ✅ |
| `/api/settings/env` | GET | getServerAuth | ❌ | N/A |
| `/api/storage/upload` | POST/DELETE | getServerAuth | ❌ | N/A (FormData) |
| `/api/travel-invoice/allowance` | POST | getServerAuth | ❌ | ✅ |
| `/api/travel-invoice/batch-issue` | POST | getServerAuth | ❌ | ✅ |
| `/api/travel-invoice/issue` | POST | getServerAuth | ❌ | ✅ |
| `/api/travel-invoice/orders` | GET | getServerAuth | ❌ | N/A |
| `/api/travel-invoice/query` | GET | getServerAuth | ❌ | N/A |
| `/api/travel-invoice/void` | POST | getServerAuth | ❌ | ✅ |
| `/api/traveler-chat` | GET/POST | getServerAuth | ❌ | ✅ (POST) |
| `/api/traveler-chat/[id]` | GET | getServerAuth | ❌ | N/A |
| `/api/workspaces/.../members` | GET/POST/DELETE | getServerAuth + workspace check | ❌ | ✅ (POST/DELETE) |

### 🔑 特殊認證（Secret / Token）

| 路由 | 方法 | 認證方式 | 備註 |
|------|------|----------|------|
| `/api/auth/sync-employee` | POST | access_token 或 session | 驗證 user ID 匹配 |
| `/api/bot-notification` | POST | BOT_API_SECRET (x-bot-secret) | dev 環境可跳過 |
| `/api/bot/ticket-status` | GET/POST/PATCH | BOT_API_SECRET (x-bot-secret) | dev 環境可跳過 |
| `/api/cron/process-tasks` | GET/POST | CRON_SECRET (Bearer) | 未設定時可跳過 |
| `/api/cron/sync-logan-knowledge` | GET | CRON_SECRET (Bearer) | 未設定時可跳過 |
| `/api/cron/ticket-status` | GET | CRON_SECRET (Bearer) | 未設定時可跳過 |
| `/api/linkpay/webhook` | POST | MAC 簽名驗證 | 台新銀行 webhook |

### 🌐 公開端點（不需認證）

| 路由 | 方法 | 理由 | Rate Limit |
|------|------|------|------------|
| `/api/health` | GET | 公開健康檢查，僅回傳 healthy/unhealthy | ❌ |
| `/api/auth/validate-login` | POST | 登入驗證 | ✅ 10/min |
| `/api/auth/change-password` | POST | 需當前密碼驗證 | ✅ 5/min |
| `/api/auth/get-employee-data` | POST | 登入後取資料（需 username+code） | ❌ |
| `/api/quotes/confirmation/customer` | GET/POST | 客戶確認報價（需 token） | ❌ |
| `/api/itineraries/[id]` | GET | 公開行程分享頁 | ❌ |
| `/api/logan/chat` | GET | 僅回傳 AI 可用狀態 | ❌ |

---

## 風險評估

### 🟡 低風險 — 建議改善

1. **`auth/get-employee-data` 缺少 rate limiting**
   - 雖然需要正確的 username + workspace code，但可被用於暴力枚舉員工編號
   - **建議：** 加入 rate limiting

2. **`quotes/confirmation/customer` 缺少 rate limiting**
   - 公開端點，僅靠 token 驗證
   - **建議：** 加入 rate limiting 防止 token 暴力猜測

3. **Cron 路由在未設定 CRON_SECRET 時可被任何人呼叫**
   - 設計如此（方便開發），但 production 必須確保 CRON_SECRET 已設定
   - **建議：** 加入 production 檢查（如 bot-notification 的模式）

4. **部分認證路由缺少 rate limiting**
   - `create-employee-auth`, `reset-employee-password` 等已有 auth 保護，但敏感操作建議加 rate limit
   - **風險極低**（需先通過認證）

### ✅ 安全設計良好

- **所有 POST/PUT/PATCH 路由都有 Zod 驗證**（之前審計已確認）
- **所有路由都有 try-catch 錯誤處理**（get-employee-data 已修復）
- **LinkPay webhook 有完整的 MAC 簽名驗證**
- **Bot API 有 secret 驗證**
- **管理員操作有角色檢查**（admin-reset-password）
- **Workspace 隔離**（channel members 有 workspace 交叉檢查）
- **敏感資料不外洩**（settings/env 只回傳 isConfigured，不回傳值）

---

## 結論

整體安全架構健全。發現的 2 個 bug 已修復（cron header 不匹配 + 缺少 try-catch）。低風險建議項可排入後續迭代。
