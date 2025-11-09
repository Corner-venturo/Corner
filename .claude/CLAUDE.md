# Claude Code 工作規範 (Venturo 專案)

> **最後更新**: 2025-10-30
> **專案狀態**: 核心功能完成，Realtime 同步系統上線

---

## 🎯 核心原則

### 行為控制
- **問題 → 只回答**，不執行操作
- **等待指令**：「執行」「修正」「開始」才動作
- **簡潔回應**：問什麼答什麼

### 專案資訊
```
專案名稱: Venturo (旅遊團管理系統)
工作目錄: /Users/william/Projects/venturo-new
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
- **禁止**: `as any`
- **盡量避免**: `as unknown`
- **使用**: 正確的 TypeScript 型別定義

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
cd /Users/william/Projects/venturo-new
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
- **總計減少**: 215 行代碼 (-24%)

### Phase 3-4: Realtime 即時同步系統
- ✅ Realtime Manager 核心架構
- ✅ Channels 和 Messages 即時同步
- ✅ 修正所有 stores 的 setTimeout 問題
- ✅ 改為「按需訂閱」模式（進入頁面才訂閱）
- ✅ 支援 50 個資料表的 Realtime
- ✅ 離線優先策略 + 衝突解決
- ✅ 權限即時更新系統

**關鍵改進**:
- 🔄 多裝置同步：公司刪除的資料，家裡立即消失
- ⚡ 即時更新：團隊成員的變更 < 100ms 同步
- 📱 離線支援：斷網時可操作，網路恢復自動同步
- 🔒 權限更新：管理員變更權限，使用者立即生效

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
README.md                                  - 專案總覽
VENTURO_ARCHITECTURE_HEALTH_CHECK.md      - 架構健檢
COMPLETE_REALTIME_OFFLINE_LOGIC.md        - Realtime 完整邏輯（最新）
ALL_TABLES_REALTIME_STATUS.md             - 所有 50 個表格狀態
PHASE2_COMPONENT_APPLICATION_COMPLETE.md  - 組件重構報告
```

### 關鍵檔案
```
# 狀態管理
src/stores/core/create-store-new.ts        - Store 工廠函數
src/stores/types.ts                        - 所有型別定義

# Realtime 系統
src/lib/realtime/realtime-manager.ts       - Realtime 訂閱管理
src/lib/realtime/createRealtimeHook.ts     - Hook 工廠函數
src/hooks/use-realtime-hooks.ts            - 所有表格的 Realtime Hooks

# 組件系統
src/components/table-cells/index.tsx       - 表格單元格組件
src/components/layout/list-page-layout.tsx - 列表頁佈局
src/hooks/useListPageState.ts              - 列表頁狀態管理
src/lib/status-config.ts                   - 狀態配置
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

#### 3. 執行 Migration
```bash
# 使用環境變數傳遞 token（自動確認）
echo "Y" | SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db push
```

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
- **RLS 錯誤 → 禁用 RLS（見下方 RLS 規範）**

### ⚠️ RLS (Row Level Security) 規範

**Venturo 是內部管理系統，所有表格都應該禁用 RLS。**

```sql
-- 創建新表時的標準模板
CREATE TABLE public.new_table (...);

-- 立即禁用 RLS（必須！）
ALTER TABLE public.new_table DISABLE ROW LEVEL SECURITY;
```

**原因**：
- ✅ 內部系統，所有已認證用戶都應該能訪問所有數據
- ✅ 使用 Supabase Auth 控制登入即可
- ❌ 不需要 RLS 的複雜策略

**詳細說明**: `docs/SUPABASE_RLS_POLICY.md`

### Migration 記錄（自動更新）
| 日期 | Migration 檔案 | 目的 | 狀態 |
|------|---------------|------|------|
| 2025-10-27 | `20251027000000_add_channel_order.sql` | 新增 channels.order 欄位用於拖曳排序 | ✅ 已執行 |

### 詳細文檔
完整的 Supabase 工作流程請參考：
`docs/reports/SUPABASE_WORKFLOW.md`

---

## 🔄 Realtime 同步規範

### 核心原則：按需訂閱 (On-Demand Subscription)

**✅ 正確行為**：
```typescript
// 情境：同事新增了行事曆
1. 你還沒去看行事曆頁面 → 沒訂閱 → 什麼都不會發生 ✅
2. 你打開行事曆頁面 → 觸發訂閱 → 立即下載同事新增的資料 ✅
3. 你離開行事曆頁面 → 取消訂閱 ✅
```

**❌ 錯誤行為**（已修正）：
```typescript
1. 你登入系統 → 所有 50 個表格立即訂閱 ❌
2. 同事新增行事曆 → 你收到推送（即使你沒在看） ❌
3. 浪費連線數（2000+ 連線 vs 200 上限） ❌
```

### 使用方式

#### 1. 在頁面中加入 Realtime Hook

```typescript
// src/app/calendar/page.tsx
import { useRealtimeForCalendarEvents } from '@/hooks/use-realtime-hooks';

export default function CalendarPage() {
  // ✅ 進入頁面時訂閱，離開時自動取消
  useRealtimeForCalendarEvents();

  const events = useCalendarEventStore(state => state.items);

  return <div>...</div>;
}
```

#### 2. 永久訂閱（系統表格）

```typescript
// 僅限以下表格需要永久訂閱：
- user_roles      (權限變更需立即生效)
- workspaces      (工作空間設定)
- employees       (員工資料)

// 在 auth-store 或 app layout 中訂閱
useEffect(() => {
  realtimeManager.subscribe({
    table: 'user_roles',
    filter: `user_id=eq.${user.id}`,
    subscriptionId: 'user-role-permanent',
    handlers: {
      onUpdate: (newRole) => {
        updatePermissions(newRole);
        toast.success('你的權限已更新！');
      }
    }
  });
}, [user.id]);
```

### 連線數估算

```
單一使用者：2-4 個連線（當前頁面 + 永久訂閱）
20 員工 × 2 裝置 × 2.5 頁面：平均 100 個連線
免費上限：200 個連線
占用率：50% ✅ 安全範圍
```

### 離線優先策略

```typescript
// fetchAll 流程
Step 1: 立即載入 IndexedDB（0.1 秒）→ 顯示畫面
Step 2: 背景同步 Supabase（只下載變更）→ 靜默更新
Step 3: 訂閱 Realtime（進入頁面時）→ 持續即時

// 離線新增
1. 資料存入 IndexedDB
2. 標記 _needs_sync: true
3. 網路恢復時自動上傳
```

### 衝突解決

```typescript
// LastWrite 策略：最後寫入者獲勝
if (remoteItem.updated_at > localItem.updated_at) {
  // 使用遠端版本
  await indexedDB.put(remoteItem);
} else {
  // 保留本地版本，上傳到 Supabase
  await supabase.update(localItem);
}
```

### 詳細文檔

完整的 Realtime 邏輯請參考：
- `COMPLETE_REALTIME_OFFLINE_LOGIC.md` - 完整流程圖和實作細節
- `ALL_TABLES_REALTIME_STATUS.md` - 50 個表格的支援狀態

---

**注意**: 這是精簡版規範。專案接近完工，不需要冗長的歷史指令。
