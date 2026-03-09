# Workspace Isolation Audit Report

**日期：** 2026-02-18
**審計範圍：** `src/stores/`, `src/app/api/`, `src/data/`

## 摘要

| 分類                                     | 數量     | 風險      |
| ---------------------------------------- | -------- | --------- |
| Store 層缺少 workspace_id 過濾（已修復） | 3        | 🔴 高     |
| Store 層查詢 by ID（RLS 保護）           | ~20      | 🟡 中     |
| API Route 使用 admin client（無 RLS）    | ~15 路由 | 🟡 中     |
| 表缺少 workspace_id 欄位                 | 6        | 🟠 需評估 |
| createEntityHook workspaceScoped 正常    | ✅       | 🟢 低     |

## 已修復

### 1. `src/stores/file-system-store.ts`

- **fetchFolders()** — `folders` 表列表查詢，加入 `workspace_id` 過濾
- **fetchFiles()** — `files` 表列表查詢，加入 `workspace_id` 過濾

### 2. `src/stores/document-store.ts`

- **fetchTemplates()** — `design_templates` 表列表查詢，加入 `workspace_id` 過濾

## 安全但需注意的查詢

### Store 層 — 單筆操作（by ID，RLS 保護）

以下查詢透過 `.eq('id', ...)` 操作單筆資料，RLS policy 應能阻止跨 workspace 存取：

| 檔案                 | 表                              | 操作                                               |
| -------------------- | ------------------------------- | -------------------------------------------------- |
| file-system-store.ts | folders                         | rename, delete (by id)                             |
| file-system-store.ts | files                           | delete, move, rename, star, updateCategory (by id) |
| document-store.ts    | design_templates                | load by id                                         |
| document-store.ts    | 動態表 (tableName/versionTable) | CRUD by id                                         |
| widgets-store.ts     | orders                          | select by ids (`.in('id', orderIds)`)              |
| widgets-store.ts     | advance_items                   | insert (新建)                                      |

### Store 層 — 已有隔離機制

| 檔案          | 表         | 原因                                                  |
| ------------- | ---------- | ----------------------------------------------------- |
| chat-store.ts | messages   | 透過 `channel_id` 查詢，channel 已是 workspace-scoped |
| auth-store.ts | workspaces | 查詢 workspaces 表本身，不需 workspace_id             |
| auth-store.ts | employees  | 登入查詢，by user_id                                  |

### API Route — 使用 Admin Client (service_role)

所有 API routes 使用 `getSupabaseAdminClient()` + `getServerAuth()` 模式。
service_role 繞過 RLS，依賴 `getServerAuth()` 做授權檢查。

**建議：** 高風險 API（如 proposals/convert-to-tour, travel-invoice/\*）應在查詢中明確加入 workspace_id 條件作為 defense-in-depth。

涉及的路由：

- `/api/linkpay/*` — receipts, linkpay_logs
- `/api/quotes/confirmation/*` — quotes, quote_confirmation_logs
- `/api/ocr/passport/*` — customers, order_members
- `/api/bot-notification` — channels, messages
- `/api/itineraries/*` — itineraries, cities, countries, attractions
- `/api/traveler-chat/*` — traveler_messages, traveler_conversations
- `/api/travel-invoice/*` — travel_invoices, invoice_orders, orders
- `/api/proposals/convert-to-tour` — proposals, tours, quotes, orders
- `/api/cron/*` — 系統排程，使用 admin client，低風險

### `src/data/` — createEntityHook

`createEntityHook` 自動處理 workspace 隔離：

- `WORKSPACE_SCOPED_TABLES` 列出 30+ 張表
- 預設 `workspaceScoped = true`（除非明確設 false）
- 明確設 `workspaceScoped: false` 的：employees, michelin_restaurants, premium_experiences, proposal_packages, customer_group_members
- ✅ 機制完善，無需修改

## 缺少 workspace_id 欄位的表（需要評估）

以下表在程式碼中被查詢，但資料庫中**沒有** `workspace_id` 欄位：

| 表名                              | 使用位置                 | 建議                                             |
| --------------------------------- | ------------------------ | ------------------------------------------------ |
| `accounting_accounts`             | accounting-store.ts      | 🟠 如果多公司需要獨立會計科目，應加 workspace_id |
| `accounting_categories`           | accounting-store.ts      | 🟠 同上                                          |
| `accounting_transactions`         | accounting-store.ts      | 🟠 同上                                          |
| `advance_lists` / `advance_items` | widgets-store.ts         | 🟡 評估是否需要隔離                              |
| `api_usage`                       | settings/env, ocr routes | 🟢 系統層級，不需隔離                            |
| `cron_execution_logs`             | cron routes              | 🟢 系統層級，不需隔離                            |
| `traveler_messages`               | traveler-chat route      | 🟡 透過 conversation_id 關聯，間接隔離           |
| `restaurants`                     | cron sync route          | 🟢 參考資料，共用                                |

## 建議後續行動

1. **P0 — 已完成：** Store 層列表查詢加入 workspace_id 過濾
2. **P1 — 會計模組：** 評估 `accounting_accounts/categories/transactions` 是否需要 workspace_id 欄位（多公司上線前必須決定）
3. **P2 — API 防禦加深：** 高風險 API routes 加入明確 workspace_id 過濾
4. **P3 — RLS Policy 強化：** 將 50 張表的 `authenticated` policy 改為 `workspace_id = auth.jwt()->>'workspace_id'`
