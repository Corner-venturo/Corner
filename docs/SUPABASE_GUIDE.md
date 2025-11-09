# Supabase 操作完整指南

> **最後更新**: 2025-11-09
> **適用專案**: Venturo 旅遊團管理系統

---

## 🎯 核心原則

### ⚠️ 絕對規則：永遠使用 Supabase CLI

**禁止以下做法**：
- ❌ 創建 HTML 工具讓用戶手動執行
- ❌ 創建 Node.js 腳本嘗試直接連 PostgreSQL
- ❌ 使用 REST API 執行 DDL
- ❌ 要求用戶到 Supabase Dashboard 手動操作

**唯一正確做法**：
- ✅ 使用 Supabase CLI + Personal Access Token
- ✅ 執行 `SUPABASE_ACCESS_TOKEN=xxx npx supabase db push`

---

## 🔑 連接資訊

### Supabase 專案資訊
```bash
Personal Access Token: sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0
Project Ref: pfqvdacxowpgfamuvnsn
Project URL: https://pfqvdacxowpgfamuvnsn.supabase.co
```

### 相關連結
- [Supabase Dashboard](https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn)
- [SQL Editor](https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql)
- [Table Editor](https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/editor)
- [Personal Access Tokens](https://supabase.com/dashboard/account/tokens)

---

## 📋 一次性設定（已完成）

### 1. 安裝 Supabase CLI
```bash
npm install -D supabase
```

### 2. 連結到專案
```bash
export SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0
npx supabase link --project-ref pfqvdacxowpgfamuvnsn
```

### 3. 生成 TypeScript 類型
```bash
npm run db:types
```

---

## 🔄 標準 Migration 流程

### Step 1: 創建 Migration 檔案

**檔案命名規範**: `YYYYMMDDHHMMSS_description.sql`

```bash
# 檔案位置: supabase/migrations/20251027000000_add_channel_order.sql

# ✅ 正確命名範例
supabase/migrations/20251027143022_add_manifestation.sql
supabase/migrations/20251109120000_create_notifications_table.sql

# ❌ 錯誤命名（會被跳過）
supabase/migrations/add_manifestation.sql
supabase/migrations/new_table.sql
```

### Step 2: 撰寫 SQL（包含 BEGIN/COMMIT）

```sql
-- 範例: 新增欄位
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

```sql
-- 範例: 建立新表（內部系統，禁用 RLS）
BEGIN;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 內部系統，禁用 RLS（重要！）
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

COMMIT;
```

### Step 3: 執行 Migration

```bash
# 方法 1: 使用 npm script（推薦）
echo "Y" | npm run db:push

# 方法 2: 直接使用 CLI
echo "Y" | SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db push
```

**說明**:
- `echo "Y"` 自動確認執行
- 使用環境變數傳遞 token

### Step 4: 更新 TypeScript 類型

```bash
npm run db:types
```

### Step 5: 驗證結果（可選）

```bash
# 查看資料庫類型定義
SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 \
  npx supabase gen types typescript --project-id pfqvdacxowpgfamuvnsn | grep -A 20 "notifications:"
```

---

## 🛠️ NPM Scripts 說明

在 `package.json` 中已設定：

```json
{
  "scripts": {
    "db:types": "SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase gen types typescript --project-id pfqvdacxowpgfamuvnsn > src/lib/types/supabase-generated.ts",
    "db:push": "SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db push",
    "db:pull": "SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db pull",
    "db:diff": "SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db diff -f",
    "db:reset": "SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 npx supabase db reset"
  }
}
```

### 常用指令

| 指令 | 說明 | 使用時機 |
|------|------|----------|
| `npm run db:types` | 生成 TypeScript 類型 | 每次 migration 後 |
| `npm run db:push` | 推送 migration 到雲端 | 建立或修改表格後 |
| `npm run db:pull` | 下載目前資料庫結構 | 查看目前 schema |
| `npm run db:diff` | 比較本地與遠端差異 | 檢查未同步的變更 |
| `npm run db:reset` | ⚠️ 重置資料庫 | 危險！會清空資料 |

---

## ⚠️ RLS (Row Level Security) 規範

### 核心原則

**Venturo 是內部管理系統，所有表格都應該禁用 RLS。**

### 標準模板

```sql
-- 創建新表時的標準模板
CREATE TABLE public.new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 其他欄位...
);

-- 立即禁用 RLS（必須！）
ALTER TABLE public.new_table DISABLE ROW LEVEL SECURITY;
```

### 原因
- ✅ 內部系統，所有已認證用戶都應該能訪問所有數據
- ✅ 使用 Supabase Auth 控制登入即可
- ❌ 不需要 RLS 的複雜策略

詳細說明請參考: `docs/SUPABASE_RLS_POLICY.md`

---

## 🔧 自動修復原則

當發現以下問題時，**直接執行修復**，不要要求用戶操作：

| 問題類型 | 解決方式 |
|---------|---------|
| 表格缺失 | 建立 migration → 執行 db push |
| 欄位錯誤 | 建立 migration → 執行 db push |
| 資料類型不符 | 建立 migration → 執行 db push |
| 索引缺失 | 建立 migration → 執行 db push |
| RLS 錯誤 | 禁用 RLS（見上方規範） |

---

## 🔄 日常工作流程

### 情境 1：新增功能（需要新表格）

**步驟：**

1. **修改 TypeScript 類型**（在 `src/types/` 中）
2. **建立 Migration 檔案**

```bash
# 例如：你想新增一個 notifications 表格
# 建立檔案: supabase/migrations/20251109120000_create_notifications.sql
```

3. **撰寫 SQL** (參考上方範例)
4. **執行 Migration**

```bash
echo "Y" | npm run db:push
```

5. **更新 TypeScript 類型**

```bash
npm run db:types
```

6. **完成！** 前後端都同步了

### 情境 2：修改現有表格

**範例：為 channels 表格新增 order 欄位**

1. **建立 Migration**

```sql
-- supabase/migrations/20251027000000_add_channel_order.sql
BEGIN;

ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

COMMENT ON COLUMN public.channels."order" IS 'Display order for channels';

COMMIT;
```

2. **執行並更新類型**

```bash
echo "Y" | npm run db:push && npm run db:types
```

### 情境 3：查看目前資料庫結構

```bash
npm run db:pull
```

這會把目前 Supabase 的 schema 下載到本地，方便查看。

---

## 📂 目錄結構

```
venturo-new/
├── supabase/
│   ├── config.toml                      # Supabase 設定
│   └── migrations/                      # 所有 migration 檔案
│       ├── 20251025000000_complete_workspace_schema.sql
│       ├── 20251025000001_create_channel_members.sql
│       └── 20251027000000_add_channel_order.sql
├── src/
│   ├── lib/
│   │   └── types/
│   │       └── supabase-generated.ts    # 自動生成的類型
│   └── types/                           # 手動定義的類型
└── package.json
```

---

## 📚 Migration 執行記錄

| 日期 | Migration 檔案 | 目的 | 狀態 |
|------|---------------|------|------|
| 2025-10-27 | `20251027000000_add_channel_order.sql` | 新增 channels.order 欄位用於拖曳排序 | ✅ 已執行 |

---

## 🚨 重要提醒

### Migration 管理原則

1. **Migration 是單向的** - 一旦推送就不要刪除
2. **本地檔案 = 真實來源** - 所有 migration 都要在 Git 中版本控管
3. **測試後再推送** - 可以先在本地 Supabase 測試（`npx supabase start`）
4. **永遠使用 BEGIN/COMMIT** - 確保交易完整性
5. **立即禁用 RLS** - 內部系統不需要 RLS

### 常見錯誤

| 錯誤 | 原因 | 解決方式 |
|------|------|----------|
| Migration 被跳過 | 檔名不符合格式 | 重新命名為 `YYYYMMDDHHMMSS_description.sql` |
| 權限錯誤 | 沒有提供 token | 確認 `SUPABASE_ACCESS_TOKEN` 環境變數 |
| RLS 錯誤 | 未禁用 RLS | 加入 `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` |
| 類型不同步 | 忘記執行 db:types | 執行 `npm run db:types` |

---

## 🤖 與 AI 助手協作

### 建立新功能時：

1. **描述你要的功能**

```
"我想新增一個通知功能，需要一個表格儲存用戶的通知記錄"
```

2. **AI 助手會：**
   - ✅ 生成 migration SQL 檔案
   - ✅ 更新前端 TypeScript 類型
   - ✅ 建立相關的 React 組件
   - ✅ 更新 Supabase client 程式碼

3. **你只需要：**
```bash
echo "Y" | npm run db:push    # 推送到資料庫
npm run db:types              # 更新類型
```

---

## ✅ 目前狀態

- [x] Supabase CLI 已安裝
- [x] 專案已連結
- [x] TypeScript 類型已生成
- [x] 完整的 workspace schema migration 已建立
- [x] Migration 已成功執行到雲端資料庫
- [x] 資料表已建立並可正常使用

### 已建立的主要表格
- workspaces
- channels (✅ 2025-10-27: 新增 order 欄位用於拖曳排序)
- channel_groups
- channel_members
- messages
- bulletins
- advance_lists
- shared_order_lists

---

## 📖 相關文檔

- **開發指南**: `docs/DEVELOPMENT_GUIDE.md`
- **Realtime 同步**: `docs/REALTIME_GUIDE.md`
- **RLS 政策**: `docs/SUPABASE_RLS_POLICY.md`
- **資料庫設計**: `docs/DATABASE.md`
- **工作流程**: `docs/reports/SUPABASE_WORKFLOW.md`

---

**提示**: 這是 Supabase 操作的完整指南。遇到問題時請先查看「常見錯誤」章節。
