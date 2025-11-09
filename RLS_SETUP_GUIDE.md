# RLS 設定指南

## 📋 執行順序（重要！）

請按照以下順序在 Supabase Dashboard 執行 SQL：

### Step 1: 為員工加上 workspace_id
```bash
檔案：supabase/migrations/20251109125500_add_workspace_id_to_employees.sql
目的：讓員工資料有歸屬分公司
```

### Step 2: 啟用 RLS 資料隔離
```bash
檔案：supabase/migrations/20251109130000_complete_workspace_rls.sql
目的：啟用 28 個業務表格的 RLS
```

---

## 🚀 執行方式

### 方法 1: Supabase Dashboard（推薦）

1. 打開 Supabase Dashboard
   ```
   https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn
   ```

2. 點擊左側 "SQL Editor"

3. **第一次執行**：複製 `20251109125500_add_workspace_id_to_employees.sql` 的內容
   - 點擊 "Run" 執行
   - 確認看到：
     ```
     ✅ 總員工數：X
     ✅ 已設定 workspace 的員工：X
     ```

4. **第二次執行**：複製 `20251109130000_complete_workspace_rls.sql` 的內容
   - 點擊 "Run" 執行
   - 確認看到：
     ```
     ✅ RLS 啟用表格數：28
     ⚪ RLS 停用表格數：6
     ```

---

### 方法 2: CLI（如果可以連線）

```bash
# 確認連線
SUPABASE_ACCESS_TOKEN=sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0 \
  npx supabase db push

# 如果看到 "Applied X migrations"，代表成功
```

---

## ✅ 驗證 RLS 是否生效

執行完畢後，在 SQL Editor 執行以下查詢：

```sql
-- 檢查 RLS 狀態
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tours', 'orders', 'customers', 'employees')
ORDER BY tablename;
```

**預期結果**：
```
tours       | true  (啟用 RLS)
orders      | true  (啟用 RLS)
customers   | true  (啟用 RLS)
employees   | false (禁用 RLS，全域共享)
```

---

## 📊 RLS 表格清單

### 啟用 RLS（28 個業務表格）
- tours, orders, itineraries, itinerary_items
- tour_participants, customers, contacts
- payments, refunds, receipts, finance_requests, ledgers
- contracts, quotes, confirmations
- suppliers, disbursements
- calendar_events, tasks, todos
- channels, channel_groups, channel_members, messages
- bulletins, esims, personal_canvases, linkpay_logs

### 禁用 RLS（6 個全域表格）
- workspaces（工作空間主表）
- employees（員工可跨公司查看）
- user_roles（權限管理）
- destinations（目的地主檔）
- airlines（航空公司主檔）
- hotels（飯店主檔）

---

## 🔧 前端使用方式

### 1. Workspace 切換器

在 Header 或側邊欄加入：

```tsx
import { WorkspaceSwitcher } from '@/components/workspace-switcher'

export function Header() {
  return (
    <header>
      <WorkspaceSwitcher />
    </header>
  )
}
```

### 2. Workspace 管理頁面

訪問：`/settings/workspaces`

功能：
- 新增 Workspace（台北、台中、台南等）
- 啟用/停用 Workspace
- 查看員工數統計

---

## 🎯 測試 RLS

### 建立測試 Workspace

```sql
-- 1. 建立台北 Workspace
INSERT INTO workspaces (id, code, name, is_active)
VALUES ('taipei', 'taipei', '台北總公司', true);

-- 2. 建立台中 Workspace
INSERT INTO workspaces (id, code, name, is_active)
VALUES ('taichung', 'taichung', '台中分公司', true);

-- 3. 設定當前為台北
SELECT set_current_workspace('taipei');

-- 4. 新增台北的旅遊團
INSERT INTO tours (name, workspace_id, departure_date, return_date)
VALUES ('台北五日遊', 'taipei', '2025-12-01', '2025-12-05');

-- 5. 切換到台中
SELECT set_current_workspace('taichung');

-- 6. 查詢旅遊團（應該看不到台北的團）
SELECT * FROM tours;  -- 結果應該是空的

-- 7. 切換回台北
SELECT set_current_workspace('taipei');

-- 8. 查詢旅遊團（應該看到台北的團）
SELECT * FROM tours;  -- 結果應該有 1 筆
```

---

## ⚠️ 注意事項

1. **員工資料不隔離**
   - 所有分公司可以看到所有員工
   - 但員工有 `workspace_id` 標記主要歸屬
   - 登入後自動設定為該員工的預設 workspace

2. **主檔資料不隔離**
   - 航空公司、飯店、目的地等主檔全公司共享
   - 避免重複建立相同資料

3. **RLS 只在前端生效**
   - 必須呼叫 `set_current_workspace(workspace_id)`
   - 前端已自動處理（登入後自動設定）

4. **切換 Workspace 會重新載入頁面**
   - 確保資料完全刷新
   - 避免快取問題

---

## 🐛 故障排除

### 問題 1: 查詢不到任何資料

**原因**：沒有設定 `current_workspace_id`

**解決**：
```sql
-- 手動設定 workspace
SELECT set_current_workspace('taipei');
```

### 問題 2: Migration 執行失敗

**原因**：表格已存在或欄位衝突

**解決**：
```sql
-- 檢查 employees 是否已有 workspace_id
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'employees' AND column_name = 'workspace_id';

-- 如果已存在，跳過 Step 1，直接執行 Step 2
```

### 問題 3: 員工登入後看不到資料

**原因**：員工沒有 `workspace_id`

**解決**：
```sql
-- 為所有員工設定預設 workspace
UPDATE employees
SET workspace_id = 'taipei'
WHERE workspace_id IS NULL;
```

---

## 📞 需要協助？

如果遇到問題，請提供：
1. 錯誤訊息截圖
2. 執行的 SQL 語句
3. 資料庫 RLS 狀態（上方驗證查詢結果）
