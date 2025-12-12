# RLS 規範更新與修復總結

> **日期**: 2025-12-11
> **目的**: 解決 Supabase Dashboard 顯示的 107 個 RLS 錯誤
> **狀態**: 規範已更新，待執行 SQL 修復

---

## 📊 問題現狀

### Supabase Dashboard 錯誤
- **錯誤數量**: 107 個
- **錯誤類型**: Policy Exists RLS Disabled
- **受影響表格**:
  - advance_lists
  - bulletins
  - channel_groups
  - channels
  - cities
  - countries
  - itineraries
  - messages
  - 以及其他多個表格

### 問題根源
某些表格的 RLS 被意外啟用，但沒有對應的 policies，導致 Supabase 報告錯誤。

---

## ✅ 已完成的工作

### 1. 安裝並配置 Supabase CLI
```bash
# 安裝位置
~/.local/bin/supabase

# 版本
2.65.5

# 環境變數
已加入到 ~/.zshrc
export SUPABASE_ACCESS_TOKEN="sbp_ae479b3d5d81d4992b6cebb91d93a16bfa499e02"

# 專案連結
Project: Venturo (pfqvdacxowpgfamuvnsn)
Region: Singapore
```

### 2. 更新規範文件

#### `.claude/CLAUDE.md`
**變更內容**:
- ❌ 移除：「user_preferences 需要啟用 RLS」的例外規則
- ✅ 更新：明確說明「**所有表格都禁用 RLS**」
- ✅ 簡化：權限控制架構（4 層，移除 RLS 層）
- ✅ 更新：新建表格的標準模板

**更新前的架構**（5 層）:
```
Layer 1: Supabase Auth
Layer 2: RLS (敏感個人資料表)  ← 已移除
Layer 3: employees.permissions
Layer 4: employees.workspace_id
Layer 5: user.roles
```

**更新後的架構**（4 層）:
```
Layer 1: Supabase Auth
Layer 2: employees.permissions
Layer 3: employees.workspace_id
Layer 4: user.roles
```

#### `RLS_REMOVAL_SUMMARY.md`
**新增內容**:
- 2025-12-11 更新記錄
- 問題發現與原因分析
- 解決方案說明
- 驗證檢查清單更新

### 3. 創建修復 Migration

**檔案**: `supabase/migrations/20251211000000_disable_all_remaining_rls.sql`

**功能**:
1. 禁用所有表格的 RLS（60+ 表格）
2. 刪除所有殘留的 RLS policies
3. 執行驗證並輸出結果報告

**預期結果**:
```sql
✅ RLS Cleanup Complete!
📊 Results:
  • Tables with RLS enabled: 0
  • Remaining RLS policies: 0
✅ All RLS has been successfully disabled!
```

---

## 🎯 下一步：執行修復

### 方法 1: Supabase Dashboard（推薦）

1. 前往 SQL Editor:
   https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql/new

2. 複製並執行以下檔案內容:
   `supabase/migrations/20251211000000_disable_all_remaining_rls.sql`

3. 檢查執行結果，應該顯示:
   - Tables with RLS enabled: 0
   - Remaining RLS policies: 0

### 方法 2: 使用 CLI（自動化）

```bash
cd /Users/williamchien/Projects/venturo-new

# 執行 migration
SUPABASE_ACCESS_TOKEN="sbp_ae479b3d5d81d4992b6cebb91d93a16bfa499e02" \
  ~/.local/bin/supabase db push
```

---

## 📋 規範要點總結

### 新建表格時的完整流程

```sql
-- 1. 創建表格
CREATE TABLE public.new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 必須明確禁用 RLS
ALTER TABLE public.new_table DISABLE ROW LEVEL SECURITY;

-- 3. 建立索引
CREATE INDEX IF NOT EXISTS idx_new_table_workspace_id
ON public.new_table(workspace_id);

-- 4. 清理任何意外創建的 policies
DROP POLICY IF EXISTS "any_policy_name" ON public.new_table;
```

### 權限控制方式

```typescript
// ❌ 錯誤：不要依賴 RLS
// RLS 完全不使用

// ✅ 正確：使用前端 filter + permissions
// 一般員工
fetchOrders({ workspace_id: user.workspace_id })

// 領隊
if (user.roles.includes('tour_leader')) {
  fetchOrders({ tour_leader_id: user.id })
}

// Super Admin
if (user.permissions.includes('super_admin')) {
  fetchOrders({}) // 不使用 workspace_id filter
}
```

---

## 🔍 驗證清單

執行 SQL 修復後，請驗證：

- [ ] Supabase Dashboard 不再顯示 107 個 RLS 錯誤
- [ ] 所有表格的 RLS 都已禁用
- [ ] 沒有殘留的 RLS policies
- [ ] 應用程式功能正常
  - [ ] 登入/登出正常
  - [ ] 資料查詢正常
  - [ ] 新建資料正常
  - [ ] Workspace filter 正常運作

---

## 📚 相關文檔

1. **RLS_REMOVAL_SUMMARY.md** - RLS 移除的完整歷史和原因
2. **.claude/CLAUDE.md** - 專案開發規範（已更新）
3. **FINAL_RLS_PLAN.md** - 原始 RLS 計劃（已廢棄）
4. **RLS_COMPLETE_SETUP.sql** - 原始 RLS 設定（已廢棄）

---

## 🎉 結論

規範衝突已解決！現在：
- ✅ 規範明確：所有表格禁用 RLS
- ✅ 修復腳本已準備
- ✅ CLI 工具已安裝
- ⏳ 待執行：執行 SQL 修復 107 個錯誤

執行修復後，Venturo 將擁有清晰一致的權限架構，所有開發者都能遵循相同的規範。
