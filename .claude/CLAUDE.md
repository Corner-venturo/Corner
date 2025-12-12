# Claude Code 工作規範 (Venturo 專案)

> **最後更新**: 2025-12-11
> **專案狀態**: 核心功能完成，代碼品質強化中

---

## 🚨🚨🚨 絕對禁止規則 (Zero Tolerance) 🚨🚨🚨

### ❌ 四大禁令 - 違反立即停止

| 禁令 | 說明 | 後果 |
|------|------|------|
| **禁止 any** | 不准使用 `: any`、`as any`、`<any>` | 必須使用明確類型 |
| **禁止大型文件** | 組件 < 300 行、Hook < 200 行 | 必須拆分 |
| **禁止忽略資料庫** | 修改功能前必須檢查 Supabase 表格結構 | 必須確認欄位存在 |
| **禁止盲目修改** | 每次修改前必須先讀取並理解現有代碼 | 必須先 Read 再 Edit |

### ✅ 正確做法

```typescript
// ❌ 錯誤：使用 any
const data: any = response
const items = data as any[]

// ✅ 正確：明確類型
interface ApiResponse { items: Customer[] }
const data: ApiResponse = response
const items: Customer[] = data.items

// ❌ 錯誤：大型組件 (>300 行)
// CustomerPage.tsx - 2000 行

// ✅ 正確：拆分成多個小文件
// CustomerPage.tsx - 150 行 (主頁面)
// hooks/useCustomerSearch.ts - 130 行
// hooks/useImageEditor.ts - 200 行
// components/CustomerTable.tsx - 250 行
```

### 📋 新功能開發檢查清單

**寫代碼前必須確認：**
- [ ] 相關的 Supabase 表格結構是否正確？
- [ ] 需要的欄位是否存在？
- [ ] TypeScript 類型定義是否完整？
- [ ] 是否可以複用現有組件/Hook？

**寫代碼時必須遵守：**
- [ ] 單一文件不超過 300 行
- [ ] 不使用 any 類型
- [ ] 使用現有的可重用組件
- [ ] 錯誤要有適當處理

**寫完代碼後必須驗證：**
- [ ] `npm run type-check` 通過
- [ ] `npm run lint` 通過
- [ ] 功能正常運作

---

## 🚨 開發前必讀：架構規範

**重要**: 修改程式碼前，請先閱讀以下文件：

1. **`docs/ARCHITECTURE_STANDARDS.md`** ⭐️ 系統架構規範（最重要）
   - 五層架構定義
   - 資料隔離規範（workspaceScoped）
   - 權限控制規範
   - Store 開發規範
   - 新功能開發檢查清單

2. **`docs/CODE_REVIEW_CHECKLIST.md`** 程式碼審查清單

### 五個絕對不能做的事：
1. **不要用預設值掩蓋 null/undefined** - 例如 `value || 'TP'` 會讓台中同事看到錯誤資料
2. **不要假設資料已載入** - store.items 在某些時間點可能是空的
3. **不要用 `as any` 繞過型別** - 這會隱藏真正的問題
4. **不要寫空的 catch 區塊** - 至少要 `logger.error()`
5. **不要背景 .then() 不等待** - 後續代碼可能在資料載入前執行

### 開發時自問：
- 這個功能需要的資料，在使用時一定已經載入了嗎？
- 如果是不同 workspace 的使用者，這段代碼會正常運作嗎？
- 如果資料不存在，使用者會看到什麼？

---

## 🎯 核心原則

### 行為控制
- **問題 → 只回答**，不執行操作
- **等待指令**：「執行」「修正」「開始」才動作
- **簡潔回應**：問什麼答什麼

### 專案資訊
```
專案名稱: Venturo (旅遊團管理系統)
工作目錄: /Users/williamchien/Projects/venturo-erp
開發端口: 3000
技術棧:   Next.js 15.5.4 + React 19 + TypeScript 5 + Zustand 5 + Supabase
```

---

## 📁 專案架構

### 核心目錄結構
```
src/
├── app/          (51 頁面) - Next.js 路由
├── components/   (185 檔案) - UI 組件
├── features/     (88 檔案) - 功能模組
├── stores/       (36 檔案) - Zustand 狀態管理
├── hooks/        (18 檔案) - 自定義 Hooks
├── lib/          (29 檔案) - 工具函式
├── services/     (5 檔案) - 業務服務
└── types/        (20 檔案) - TypeScript 型別
```

### 架構模式
- **Hybrid Feature-Based + Layer-Based**
- 功能模組獨立 (features/)
- 共享基礎層 (components/, hooks/, stores/)

---

## 🔧 開發規範

### 組件創建規則
```tsx
// ✅ 正確：使用 Phase 1/2 的可重用組件
import { ListPageLayout } from '@/components/layout/list-page-layout';
import { DateCell, StatusCell, ActionCell } from '@/components/table-cells';

// ❌ 錯誤：不要重複寫 ResponsiveHeader + EnhancedTable
```

### 命名規範
- **組件**: PascalCase (`ChannelChat.tsx`)
- **Hooks**: camelCase (`useUserStore.ts`)
- **工具**: kebab-case (`format-date.ts`)
- **型別**: kebab-case + `.types.ts`

### 型別安全
- **禁止**: `as any`、`: any`、`<any>`
- **盡量避免**: `as unknown`
- **使用**: 正確的 TypeScript 型別定義

### 📏 文件大小限制 (嚴格執行)

| 文件類型 | 最大行數 | 說明 |
|---------|---------|------|
| 組件 (.tsx) | 300 行 | 超過必須拆分 |
| Hook (.ts) | 200 行 | 超過必須拆分 |
| 工具函數 | 150 行 | 超過必須拆分 |
| 類型定義 | 500 行 | 超過必須拆分成多個文件 |

**拆分策略：**
```
大型組件 → 提取 Hooks + 子組件
CustomerPage.tsx (2000行)
  ↓ 拆分成
├── page.tsx (150行) - 主頁面，組合所有模組
├── hooks/
│   ├── useCustomerSearch.ts (130行)
│   ├── useImageEditor.ts (200行)
│   └── usePassportUpload.ts (200行)
└── components/
    ├── CustomerTable.tsx (250行)
    └── CustomerDialog.tsx (200行)
```

### 🔧 自動化檢查工具

```bash
# 檢查代碼品質 (建議每次提交前執行)
npm run audit:code-quality

# 單獨檢查
npm run audit:file-size    # 檢查文件大小
npm run audit:any-usage    # 檢查 any 使用
npm run type-check         # TypeScript 檢查
npm run lint               # ESLint 檢查
```

**Pre-commit Hook 已啟用：**
- 提交時自動執行所有檢查
- 任何違規都會阻止提交

---

## 🚨 已知問題與限制

### 緊急問題 (需優先處理)
1. **23 個超大檔案** (>500 行) - 需拆分
2. **重複的 Store Factory** - `create-store.ts` 應刪除
3. **188 個型別繞過** - `as any`/`as unknown` 過多
4. **Workspace Store Facade** - 耦合 5 個 stores

### 架構改善需求
- Service Layer 太薄 (只有 5 個，需 12-15 個)
- API Layer 不完整 (只有 4 個 routes)
- 測試覆蓋率 ~0%

---

## 📋 常用指令

### 開發
```bash
cd /Users/williamchien/Projects/venturo-erp
npm run dev          # 啟動開發伺服器 (port 3000)
npm run build        # 建置專案
npm run lint         # 執行 ESLint
```

### 檢查架構
```bash
ls -la src/components/     # 查看組件
ls -la src/features/       # 查看功能模組
find . -name "*-store.ts"  # 查找所有 stores
```

---

## ✅ 最近完成的優化

### Phase 1-2: 可重用組件系統
- ✅ ListPageLayout 組件
- ✅ Table Cell 組件庫 (8 個組件)
- ✅ useListPageState Hook
- ✅ 應用到 Quotes/Contracts/Itinerary 頁面

### Phase 3: RLS 完整系統
- ✅ 完整的 RLS 策略（業務資料隔離）
- ✅ Helper functions（get_current_user_workspace、is_super_admin）
- ✅ workspace 級別資料隔離
- ✅ Super admin 跨 workspace 存取

---

## 🎯 工作檢查清單

### 開始任何工作前
- [ ] 確認當前工作目錄正確
- [ ] 檢查 port 3000 是否已佔用
- [ ] 了解要修改的功能範圍

### 修改代碼前
- [ ] 是否使用了可重用組件？
- [ ] 型別定義是否完整？
- [ ] 是否避免 `as any`？
- [ ] 是否符合命名規範？

### 提交前檢查
- [ ] `npm run build` 通過
- [ ] 沒有新增 console.log
- [ ] 沒有未使用的 imports
- [ ] 型別檢查通過

---

## 🔍 快速參考

### 主要文檔位置
```
README.md                            - 專案總覽
docs/ARCHITECTURE_STANDARDS.md       - 系統架構規範
docs/CODE_REVIEW_CHECKLIST.md        - 程式碼審查清單
```

### 關鍵檔案
```
# 狀態管理
src/stores/types.ts                        - 所有型別定義

# 組件系統
src/components/table-cells/index.tsx       - 表格單元格組件
src/components/layout/list-page-layout.tsx - 列表頁佈局
src/hooks/useListPageState.ts              - 列表頁狀態管理
src/lib/status-config.ts                   - 狀態配置

# 類型定義
src/lib/supabase/types.ts                  - Supabase 自動生成類型
src/types/                                 - 業務類型定義
```

---

## 💡 給 AI 助手的提示

1. **優先使用現有組件** - Phase 1/2 已建立可重用組件系統
2. **保持一致性** - 遵循既有的架構模式
3. **型別安全優先** - 避免型別斷言
4. **簡潔回應** - 不要過度解釋，除非被問到
5. **等待確認** - 重大修改前先說明計劃
6. **主動修復** - 發現資料庫表格錯誤或缺失時，直接透過 CLI 修復，不要要求用戶手動操作

---

## 🗄️ 資料庫操作規範 (Supabase)

### ⚠️ 絕對規則：永遠使用 Supabase CLI
**禁止以下做法**：
- ❌ 創建 HTML 工具讓用戶手動執行
- ❌ 創建 Node.js 腳本嘗試直接連 PostgreSQL
- ❌ 使用 REST API 執行 DDL
- ❌ 要求用戶到 Supabase Dashboard 手動操作

**唯一正確做法**：
- ✅ 使用 Supabase CLI + Personal Access Token
- ✅ 執行 `SUPABASE_ACCESS_TOKEN=xxx npx supabase db push`

### Supabase 連接資訊
```bash
Personal Access Token: sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0
Project Ref: pfqvdacxowpgfamuvnsn
Project URL: https://pfqvdacxowpgfamuvnsn.supabase.co
```

### 標準 Migration 流程

#### 1. 創建 Migration 檔案
```bash
# 檔案命名必須符合: YYYYMMDDHHMMSS_description.sql
# 例如: supabase/migrations/20251027000000_add_channel_order.sql
```

#### 2. 撰寫 SQL（包含 BEGIN/COMMIT）
```sql
-- 範例
BEGIN;

ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

COMMENT ON COLUMN public.channels."order" IS 'Display order for channels';

UPDATE public.channels
SET "order" = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at) - 1 AS row_num
  FROM public.channels
) AS subquery
WHERE channels.id = subquery.id;

COMMIT;
```

#### 3. 執行 Migration（推薦方式）
```bash
# 使用自動化工具（推薦！每台電腦都能自動執行）
npm run db:migrate

# 或使用 Supabase CLI（可能遇到 SSL 問題）
echo "Y" | SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db push
```

**自動化工具優勢**：
- ✅ 使用 Supabase Management API，避免 SSL 連線問題
- ✅ 自動追蹤已執行的 migrations
- ✅ 支援斷點續傳（失敗後可重新執行）
- ✅ 在任何電腦上都能可靠執行

#### 4. 驗證結果（可選）
```bash
# 查看資料庫類型定義
SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 \
  npx supabase gen types typescript --project-id pfqvdacxowpgfamuvnsn | grep -A 20 "table_name:"
```

### 自動修復原則
當發現以下問題時，**直接執行修復**，不要要求用戶操作：
- 表格缺失 → 建立 migration → 執行 db push
- 欄位錯誤 → 建立 migration → 執行 db push
- 資料類型不符 → 建立 migration → 執行 db push
- 索引缺失 → 建立 migration → 執行 db push
- **RLS 問題 → 依照 RLS 規範修正（見下方）**

### 🔐 RLS (Row Level Security) 規範

**Venturo 使用 RLS 進行資料隔離（2025-12-11 更新）**

#### 基本原則

**業務資料表格啟用 RLS，共用資料表格禁用 RLS**

#### RLS 架構

```
啟用 RLS 的表格（業務資料）：
- orders, tours, customers, payments, quotes, contracts
- itineraries, visas, tasks, todos
- channels, messages, calendar_events
- 等業務相關表格

禁用 RLS 的表格（全公司共用）：
- workspaces, employees, user_roles
- destinations, airlines, hotels, suppliers
- cities, countries, attractions
- 等基礎資料表格
```

#### Helper Functions

```sql
-- 取得當前用戶的 workspace_id
get_current_user_workspace()

-- 檢查是否為超級管理員
is_super_admin()

-- 取得當前員工 ID
get_current_employee_id()

-- 設定當前 workspace（前端登入時呼叫）
set_current_workspace(p_workspace_id text)
```

#### 創建新表時的標準模板

```sql
-- 業務資料表格（啟用 RLS）
CREATE TABLE public.new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 啟用 RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- 建立 policies
CREATE POLICY "new_table_select" ON public.new_table FOR SELECT
USING (workspace_id = get_current_user_workspace() OR is_super_admin());

CREATE POLICY "new_table_insert" ON public.new_table FOR INSERT
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "new_table_update" ON public.new_table FOR UPDATE
USING (workspace_id = get_current_user_workspace() OR is_super_admin());

CREATE POLICY "new_table_delete" ON public.new_table FOR DELETE
USING (workspace_id = get_current_user_workspace() OR is_super_admin());
```

#### 權限層級

```typescript
// 一般員工：RLS 自動過濾到自己 workspace
fetchOrders() // RLS 會自動套用 workspace_id filter

// Super Admin：RLS 允許看所有
// is_super_admin() 會返回 true，繞過 workspace 限制
```

### Migration 記錄（自動更新）
| 日期 | Migration 檔案 | 目的 | 狀態 |
|------|---------------|------|------|
| 2025-12-11 | `20251211120000_enable_complete_rls_system.sql` | 啟用完整 RLS 系統 | ⏳ 待執行 |
| 2025-12-10 | `20251210_add_workspace_to_itineraries.sql` | 為 itineraries 添加 workspace 支援 | ⏳ 待執行 |

### 詳細文檔
完整的 Supabase 工作流程請參考：
`docs/reports/SUPABASE_WORKFLOW.md`

---

## 🔧 TypeScript 類型修復流程

### 問題：types.ts 缺少表格定義

當 `npm run type-check` 報錯說某個表格不存在於 `Database['public']['Tables']` 時，表示 `src/lib/supabase/types.ts` 缺少該表格的類型定義。

### 原因

`types.ts` 是由 Supabase CLI 自動生成的，但有時：
1. 遷移已創建但未推送到遠端資料庫
2. 遠端資料庫有表格但未重新生成類型
3. 手動添加的表格未同步

### 解決方案

#### 方案 A：重新生成類型（推薦）

```bash
# 1. 確保遷移已推送
npm run db:migrate

# 2. 重新生成類型
SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 \
  npx supabase gen types typescript --project-id pfqvdacxowpgfamuvnsn > src/lib/supabase/types.ts

# 3. 驗證
npm run type-check
```

#### 方案 B：手動添加類型（當遷移無法執行時）

在 `src/lib/supabase/types.ts` 的 `Tables` 區塊結尾處（`workspaces` 表格之後、`Views` 之前）添加缺少的表格定義：

```typescript
// 在 workspaces 的 Relationships 結束 } 之後添加
// === 手動添加的缺少表格類型 (日期) ===
new_table_name: {
  Row: {
    id: string
    // ... 所有欄位
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    // ... 可選欄位用 ?
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    // ... 所有欄位都是可選的
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}
```

### 查找表格結構的方法

1. **從遷移檔案**：查看 `supabase/migrations/` 中對應的 SQL 檔案
2. **從 Supabase Dashboard**：直接查看資料庫結構
3. **從代碼使用處**：搜尋 `.from('table_name')` 看使用了哪些欄位

### 已手動添加的表格/欄位（2025-12-11）

| 表格/欄位 | 位置 | 說明 |
|---------|------|------|
| `api_usage` | types.ts | API 使用量追蹤 |
| `image_library` | types.ts | 圖庫資料表 |
| `system_settings` | types.ts | 系統設定 |
| `travel_invoices` | types.ts | 代轉發票 |
| `vendor_costs` | types.ts | 代辦商成本 |
| `timebox_scheduled_boxes` | types.ts | Timebox 排程項目 |
| `customers.passport_image_url` | types.ts | 客戶護照圖片 URL |
| `order_members.passport_image_url` | types.ts | 訂單成員護照圖片 URL |
| `User.name`, `User.email` | stores/types.ts | 便捷屬性 |
| `User.roles` 添加 `super_admin` | stores/types.ts | 角色類型 |
| `itineraries.quote_id` | types.ts | 行程表關聯報價單 ID |
| `FlightInfo.departureDate` 改為可選 | tour-form/types.ts | 與 stores/types.ts 一致 |

### 注意事項

- 手動添加的類型只是**暫時解決方案**
- 最終應該推送遷移並重新生成類型
- 手動添加時要確保欄位類型與遷移 SQL 一致

---

## 🔄 Realtime 同步規範

### 核心原則：直接從 Supabase 取資料

**目前架構**：無離線優先、無 IndexedDB，直接從 Supabase 即時取資料

```typescript
// 標準資料取得方式
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('workspace_id', workspaceId)
```

### Realtime 訂閱（可選）

如需即時更新，可使用 Supabase Realtime：

```typescript
// 訂閱表格變更
const subscription = supabase
  .channel('orders-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders'
  }, (payload) => {
    // 處理變更
  })
  .subscribe()
```

---

**注意**: 這是精簡版規範。專案接近完工，不需要冗長的歷史指令。
