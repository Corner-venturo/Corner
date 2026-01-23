# Supabase RLS (Row Level Security) 管理規範

> **專案類型**: Venturo ERP（多 Workspace 內部管理系統）
> **最後更新**: 2026-01-22
> **架構狀態**: 業務資料啟用 RLS，基礎資料禁用 RLS

---

## 🎯 核心原則

**Venturo 是多 Workspace 系統，需要透過 RLS 進行資料隔離。**

因此：

- ✅ **業務資料表格**：啟用 RLS + Workspace 隔離
- ✅ **基礎資料表格**：禁用 RLS（全公司共用）
- ✅ **Super Admin**：可跨 Workspace 存取

---

## 📋 RLS 架構

### 啟用 RLS 的表格（業務資料）

這些表格包含 `workspace_id` 欄位，透過 RLS 進行隔離：

```sql
-- 核心業務表
tours, orders, order_members, customers, quotes, proposals

-- 財務表
payments, receipts, payment_requests, disbursement_orders, receipt_orders

-- 工作流表
visas, todos, contracts, calendar_events, itineraries

-- 協作功能表
channels, messages, bulletins
```

### 禁用 RLS 的表格（基礎資料）

這些表格為全公司共用，無需隔離：

```sql
-- 組織架構
workspaces, employees, user_roles

-- 基礎資料
countries, cities, regions, attractions
suppliers, hotels, airlines

-- 系統設定
system_settings, templates
```

---

## 🔧 RLS Helper Functions

### 取得當前用戶的 Workspace

```sql
-- 函數：取得當前用戶的 workspace_id
CREATE OR REPLACE FUNCTION get_current_user_workspace()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT workspace_id
    FROM employees
    WHERE supabase_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 檢查是否為 Super Admin

```sql
-- 函數：檢查是否為超級管理員
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM employees
    WHERE supabase_user_id = auth.uid()
      AND 'super_admin' = ANY(roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔒 新增表格時的標準流程

### 業務資料表格（啟用 RLS）

```sql
-- Migration: 建立業務資料表格
BEGIN;

-- 1. 建立表格（必須包含 workspace_id）
CREATE TABLE public.new_business_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  -- 其他業務欄位...
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text,
  updated_by text
);

-- 2. 啟用 RLS
ALTER TABLE public.new_business_table ENABLE ROW LEVEL SECURITY;

-- 3. 建立 RLS 策略
CREATE POLICY "new_business_table_select" ON public.new_business_table
FOR SELECT USING (
  workspace_id = get_current_user_workspace()
  OR is_super_admin()
);

CREATE POLICY "new_business_table_insert" ON public.new_business_table
FOR INSERT WITH CHECK (
  workspace_id = get_current_user_workspace()
);

CREATE POLICY "new_business_table_update" ON public.new_business_table
FOR UPDATE USING (
  workspace_id = get_current_user_workspace()
  OR is_super_admin()
);

CREATE POLICY "new_business_table_delete" ON public.new_business_table
FOR DELETE USING (
  workspace_id = get_current_user_workspace()
  OR is_super_admin()
);

-- 4. 建立索引
CREATE INDEX idx_new_business_table_workspace ON public.new_business_table(workspace_id);

COMMIT;
```

### 基礎資料表格（禁用 RLS）

```sql
-- Migration: 建立基礎資料表格
BEGIN;

-- 1. 建立表格（無 workspace_id）
CREATE TABLE public.new_reference_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  -- 其他欄位...
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 禁用 RLS
ALTER TABLE public.new_reference_table DISABLE ROW LEVEL SECURITY;

COMMIT;
```

---

## 📊 RLS 狀態檢查 SQL

### 查看所有表格的 RLS 狀態

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 查看特定表格的 RLS 策略

```sql
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'your_table_name';
```

---

## ⚠️ 常見錯誤與解決方案

### 錯誤 1: `new row violates row-level security policy`

**原因**: 表格啟用了 RLS，但 INSERT 策略不允許

**解決方案**:
1. 確認已登入 Supabase Auth
2. 確認 `ensureAuthSync()` 已執行
3. 確認 `workspace_id` 正確

### 錯誤 2: 查詢返回空結果

**原因**: RLS 過濾掉了資料

**解決方案**:
1. 確認當前用戶的 `workspace_id` 正確
2. 使用 API Route（Service Role）繞過 RLS 進行偵錯

### 錯誤 3: Super Admin 無法存取其他 Workspace

**原因**: `is_super_admin()` 函數未正確設定

**解決方案**:
```sql
-- 檢查 super_admin 角色
SELECT * FROM employees
WHERE supabase_user_id = auth.uid();
```

---

## 🔐 權限層級

| 角色 | 權限範圍 |
|------|---------|
| **一般員工** | 只能存取自己 Workspace 的資料 |
| **Super Admin** | 可存取所有 Workspace 的資料 |
| **Service Role** | 繞過 RLS（僅限後端 API） |

### 前端存取

```typescript
// 一般員工：RLS 自動過濾到自己 Workspace
const { data } = await supabase.from('orders').select('*')
// 結果：只有自己 Workspace 的訂單

// Super Admin：RLS 允許看所有
// is_super_admin() 返回 true，可看所有 Workspace
```

### 後端存取（API Route）

```typescript
// 使用 Service Role 繞過 RLS（例如登入時取得員工資料）
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 可存取所有資料，不受 RLS 限制
const { data } = await supabaseAdmin.from('employees').select('*')
```

---

## 📝 檢查清單

### 建立新的業務資料表格時

- [ ] 是否包含 `workspace_id` 欄位？
- [ ] 是否啟用 RLS？
- [ ] 是否建立 SELECT/INSERT/UPDATE/DELETE 策略？
- [ ] 是否包含 Super Admin 例外？
- [ ] 是否建立 `workspace_id` 索引？

### 建立新的基礎資料表格時

- [ ] 是否禁用 RLS？
- [ ] 是否為全公司共用資料？

---

## 📚 相關文檔

- Supabase 工作流程: `docs/reports/SUPABASE_WORKFLOW.md`
- 資料庫操作規範: `.claude/CLAUDE.md`
- 系統架構: `docs/SYSTEM_STATUS.md`

---

**記住**:

- ✅ 業務資料表格：啟用 RLS + Workspace 隔離
- ✅ 基礎資料表格：禁用 RLS
- ✅ Super Admin 可跨 Workspace 存取
- ✅ API Route 使用 Service Role 可繞過 RLS
