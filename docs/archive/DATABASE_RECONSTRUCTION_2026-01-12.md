# Venturo ERP 資料庫重建報告

> **執行日期**：2026-01-12
> **執行者**：Claude + William
> **目的**：一次性完整統整所有資料庫命名規範與 Workspace 隔離問題

---

## 一、背景與動機

### 1.1 發現的問題

在開發過程中，由於多次迭代和不同時期的開發，資料庫出現以下問題：

1. **命名不一致**：部分欄位使用 `camelCase`（如 `createdAt`）、部分使用連寫小寫（如 `createdat`）、部分使用正確的 `snake_case`（如 `created_at`）
2. **表格命名錯誤**：有 2 個表格使用 Pascal_Case（如 `Itinerary_Permissions`）
3. **Workspace 隔離缺失**：3 個表格缺少 `workspace_id`，導致多租戶資料隔離失敗
4. **TypeScript 類型過時**：`src/lib/supabase/types.ts` 與實際資料庫結構不同步

### 1.2 觸發事件

- **時間軸行程表無法載入**：`proposal_packages` 沒有 `workspace_id`，導致 `createCloudHook` 過濾時找不到資料
- 用戶要求進行「完整重構」而非修修補補

---

## 二、決策記錄

### 2.1 命名規範決策

**決定：全部使用 snake_case，不使用 humps 自動轉換**

| 選項 | 說明 | 決定 |
|------|------|------|
| 方案 A：全部 snake_case | DB 和 JS 都用 `created_at` | ✅ 採用 |
| 方案 B：humps 自動轉換 | DB 用 `created_at`，JS 用 `createdAt` | ❌ 不採用 |

**理由**：
- 減少複雜度，不需要額外的轉換層
- TypeScript 類型直接從資料庫生成，保持一致
- 避免 humps 轉換可能帶來的邊界問題

### 2.2 Workspace 隔離策略

**決定：所有業務資料表格必須有 workspace_id**

- 業務資料表格：必須有 `workspace_id` 欄位
- 共用資料表格（國家、城市、供應商等）：不需要 `workspace_id`
- 子表格：可以透過父表格的 RLS 做隔離，但如果獨立查詢則需要自己的 `workspace_id`

---

## 三、執行的 Migration

### 3.1 已執行的 Migration 清單

| 順序 | Migration 檔案 | 內容 |
|------|---------------|------|
| 1 | `20260112100000_consolidate_naming_convention.sql` | 43 個欄位重命名為 snake_case |
| 2 | `20260112200000_workspace_isolation_complete.sql` | proposal_packages 添加 workspace_id |
| 3 | `20260112210000_naming_convention_complete_fix.sql` | tour_addons、request_response_items 添加 workspace_id + 2 個表格重命名 |

### 3.2 Migration 詳細內容

#### Migration 1: 欄位命名統一 (43 個欄位)

```sql
-- 檔案：20260112100000_consolidate_naming_convention.sql
-- 已於之前執行

-- Section 1: 統一 creator/author 欄位
ALTER TABLE "public"."todos" RENAME COLUMN "creator" TO "created_by_legacy";
ALTER TABLE "public"."messages" RENAME COLUMN "author_id" TO "created_by_legacy_author";
ALTER TABLE "public"."advance_lists" RENAME COLUMN "author_id" TO "created_by_legacy_author";
ALTER TABLE "public"."bulletins" RENAME COLUMN "author_id" TO "created_by";
ALTER TABLE "public"."itineraries" RENAME COLUMN "creator_user_id" TO "created_by_legacy_user_id";
ALTER TABLE "public"."quote_versions" RENAME COLUMN "createdby" TO "created_by";

-- Section 2: 修正 lowercase/camelCase 欄位
-- payments (8 個)
-- price_list_items (9 個)
-- quote_categories (3 個)
-- quote_versions (3 個)
-- receipt_payment_items (3 個)
-- tour_refunds (10 個)
-- payment_request_items (1 個)
```

#### Migration 2: proposal_packages workspace_id

```sql
-- 檔案：20260112200000_workspace_isolation_complete.sql

BEGIN;

ALTER TABLE public.proposal_packages
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- 從 proposals 表回填資料
UPDATE public.proposal_packages pp
SET workspace_id = p.workspace_id
FROM public.proposals p
WHERE pp.proposal_id = p.id
  AND pp.workspace_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_proposal_packages_workspace
ON public.proposal_packages(workspace_id);

COMMIT;
```

#### Migration 3: 其他 workspace_id + 表格重命名

```sql
-- 檔案：20260112210000_naming_convention_complete_fix.sql

BEGIN;

-- 1. tour_addons 添加 workspace_id
ALTER TABLE public.tour_addons
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

UPDATE public.tour_addons ta
SET workspace_id = t.workspace_id
FROM public.tours t
WHERE ta.tour_id = t.id
  AND ta.workspace_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_tour_addons_workspace
ON public.tour_addons(workspace_id);

-- 2. request_response_items 添加 workspace_id
ALTER TABLE public.request_response_items
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

UPDATE public.request_response_items rri
SET workspace_id = tr.workspace_id
FROM public.request_responses rr
JOIN public.tour_requests tr ON rr.request_id = tr.id
WHERE rri.response_id = rr.id
  AND rri.workspace_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_request_response_items_workspace
ON public.request_response_items(workspace_id);

-- 3. 表格重命名
ALTER TABLE IF EXISTS public."Itinerary_Permissions"
  RENAME TO itinerary_permissions;

ALTER TABLE IF EXISTS public."Tour_Expenses"
  RENAME TO tour_expenses;

COMMIT;
```

---

## 四、程式碼變更

### 4.1 修改的檔案清單

| 檔案 | 變更內容 |
|------|---------|
| `src/lib/supabase/types.ts` | 重新從資料庫生成，所有欄位現在是 snake_case |
| `src/hooks/createCloudHook.ts` | 添加 `request_response_items` 到 WORKSPACE_SCOPED_TABLES |
| `src/hooks/useTodos.ts` | 修復 `created_by_legacy` 類型錯誤 |
| `src/types/proposal.types.ts` | 添加 `workspace_id` 到 ProposalPackage interface |

### 4.2 WORKSPACE_SCOPED_TABLES 最終狀態

```typescript
// src/hooks/createCloudHook.ts

const WORKSPACE_SCOPED_TABLES = [
  // === 核心業務 ===
  'tours',
  'orders',
  'customers',

  // === 提案系統 ===
  'proposals',
  'proposal_packages', // ✅ 2026-01-12: 已添加 workspace_id

  // === 行程與報價 ===
  'quotes',
  'itineraries',

  // === 財務管理 ===
  'payment_requests',
  'disbursement_orders',
  'receipt_orders',

  // === 其他業務 ===
  'visas',
  'todos',
  'calendar_events',
  'tour_addons', // ✅ 2026-01-12: 已添加 workspace_id

  // === PNR 系統 ===
  'pnr_records',
  'pnr_fare_history',
  'pnr_fare_alerts',
  'pnr_flight_status_history',
  'flight_status_subscriptions',
  'pnr_queue_items',
  'pnr_schedule_changes',
  'pnr_ai_queries',

  // === 其他 ===
  'airport_images',
  'customer_groups',
  'leader_availability',

  // === 跨公司系統 ===
  'request_responses',
  'request_response_items', // ✅ 2026-01-12: 已添加 workspace_id
]
```

---

## 五、修復總覽

### 5.1 欄位命名修復（43 個）

| 表格 | 修復的欄位 |
|------|-----------|
| `payments` | createdat→created_at, updatedat→updated_at, orderid→order_id, tourid→tour_id, paymentdate→payment_date, paymentnumber→payment_number, paymenttype→payment_type, receivedby→received_by |
| `price_list_items` | createdat→created_at, updatedat→updated_at, itemcode→item_code, itemname→item_name, minimumorder→minimum_order, supplierid→supplier_id, unitprice→unit_price, validfrom→valid_from, validuntil→valid_until |
| `quote_categories` | createdat→created_at, updatedat→updated_at, quoteid→quote_id |
| `quote_versions` | createdat→created_at, quoteid→quote_id, changenote→change_note, createdby→created_by |
| `receipt_payment_items` | createdat→created_at, itemname→item_name, receiptid→receipt_id |
| `tour_refunds` | createdat→created_at, updatedat→updated_at, memberid→member_id, orderid→order_id, processedby→processed_by, processingstatus→processing_status, refundamount→refund_amount, refunddate→refund_date, refundreason→refund_reason, tourid→tour_id |
| `payment_request_items` | unitprice→unit_price |
| `todos` | creator→created_by_legacy |
| `messages` | author_id→created_by_legacy_author |
| `advance_lists` | author_id→created_by_legacy_author |
| `bulletins` | author_id→created_by |
| `itineraries` | creator_user_id→created_by_legacy_user_id |

### 5.2 表格命名修復（2 個）

| 舊名稱 | 新名稱 |
|--------|--------|
| `Itinerary_Permissions` | `itinerary_permissions` |
| `Tour_Expenses` | `tour_expenses` |

### 5.3 Workspace 隔離修復（3 個）

| 表格 | 回填資料來源 |
|------|-------------|
| `proposal_packages` | 從 `proposals.workspace_id` |
| `tour_addons` | 從 `tours.workspace_id` |
| `request_response_items` | 從 `tour_requests.workspace_id`（透過 request_responses） |

---

## 六、驗證結果

### 6.1 Type Check

```bash
$ npm run type-check
> tsc --noEmit
# 無錯誤 ✅
```

### 6.2 資料庫狀態

```bash
# 已執行的 migration 數量
已執行的 migrations: 324 個 ✅
```

---

## 七、相關文件

| 文件 | 說明 |
|------|------|
| `docs/DATABASE_DESIGN_STANDARDS.md` | 資料庫設計規範（已更新） |
| `docs/DATABASE_AUDIT_REPORT.md` | 資料庫審計報告（已更新） |
| `docs/DATABASE_RECONSTRUCTION_2026-01-12.md` | 本文件 |

---

## 八、後續注意事項

### 8.1 新增表格時必須遵守

1. **表格名稱**：snake_case，複數形式（如 `tour_requests`）
2. **欄位名稱**：snake_case（如 `created_at`）
3. **業務表格**：必須包含 `workspace_id UUID REFERENCES workspaces(id)`
4. **標準欄位**：`id`, `created_at`, `updated_at`, `created_by`, `updated_by`
5. **加入 WORKSPACE_SCOPED_TABLES**：如果表格有 workspace_id 且需要前端過濾

### 8.2 不使用 humps 的原因

本次重構決定**不採用 humps 自動轉換**，原因如下：

1. 減少系統複雜度
2. TypeScript 類型可直接從資料庫生成
3. 避免轉換邊界問題
4. 程式碼中統一使用 snake_case，與資料庫保持一致

### 8.3 Legacy 欄位處理

以下欄位被重命名為 `_legacy` 後綴，保留舊資料但標記為過時：

| 表格 | 欄位 | 說明 |
|------|------|------|
| `todos` | `created_by_legacy` | 原 `creator`，與 `created_by` 並存 |
| `messages` | `created_by_legacy_author` | 原 `author_id`，與 `created_by` 並存 |
| `advance_lists` | `created_by_legacy_author` | 原 `author_id`，與 `created_by` 並存 |
| `itineraries` | `created_by_legacy_user_id` | 原 `creator_user_id`，與 `created_by` 並存 |

這些 legacy 欄位可在未來的資料遷移中統一處理。

---

## 九、總結

本次重建完成了以下目標：

- ✅ **命名規範統一**：43 個欄位 + 2 個表格改為 snake_case
- ✅ **Workspace 隔離完整**：3 個表格添加 workspace_id
- ✅ **TypeScript 類型同步**：重新生成 types.ts
- ✅ **程式碼修正**：修復所有類型錯誤
- ✅ **文件更新**：更新設計規範和審計報告

**這是一次系統性的完整重構，而非修修補補。**

---

*報告生成日期：2026-01-12*
*報告版本：1.0*
