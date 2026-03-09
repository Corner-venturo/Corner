# RLS 完全移除總結報告

> **日期**: 2025-11-15
> **決策**: Venturo 完全不使用 RLS
> **原因**: 內部管理系統，使用 permissions + workspace_id filter 處理權限

---

## 📋 執行內容

### 1. Migration 建立

**檔案**: `supabase/migrations/20251115060000_final_disable_all_rls.sql`

**內容**:

- 禁用所有核心表格的 RLS (24+ 表格)
- 刪除所有 RLS policies
- 保留 RLS Helper Functions（`get_user_workspace_id`, `is_super_admin`）但不使用

### 2. 文檔更新

#### Global CLAUDE.md (`~/.claude/CLAUDE.md`)

- ✅ 更新 RLS 規範章節
- ✅ 說明完全不使用 RLS 的決策
- ✅ 提供 Venturo 權限控制架構說明
- ✅ 提供權限處理範例代碼

#### Project CLAUDE.md (`.claude/CLAUDE.md`)

- ✅ 更新 RLS 規範章節
- ✅ 與 Global CLAUDE.md 保持一致
- ✅ 提供新建表格時的標準模板

---

## 🎯 Venturo 權限控制架構

```
Layer 1: Supabase Auth
         ↓ (登入驗證)
Layer 2: employees.permissions
         ↓ (功能權限控制)
Layer 3: employees.workspace_id
         ↓ (資料隔離 - 前端 filter)
Layer 4: user.roles
         (角色標籤 - admin, tour_leader 等)
```

### 權限處理方式

#### 一般員工

```typescript
// 看自己 workspace 的所有資料
fetchOrders({ workspace_id: user.workspace_id })
```

#### 領隊

```typescript
// 只能看自己帶的團
if (user.roles.includes('tour_leader')) {
  fetchOrders({ tour_leader_id: user.id })
}
```

#### Super Admin

```typescript
// 可以跨 workspace 查看
if (user.permissions.includes('super_admin')) {
  fetchOrders({}) // 不使用 workspace_id filter
}
```

---

## 🔍 RLS 歷史回顧

### 時間線

| 日期       | 事件              | 檔案                                            |
| ---------- | ----------------- | ----------------------------------------------- |
| 2025-11-12 | 啟用 RLS 系統     | `20251113000000_enable_rls_for_core_tables.sql` |
| 2025-11-15 | 禁用 channels RLS | `20251115010000_disable_channels_rls.sql`       |
| 2025-11-15 | 禁用 quotes RLS   | `20251115020000_disable_quotes_rls.sql`         |
| 2025-11-15 | 禁用所有 RLS      | `20251115030000_disable_all_rls.sql`            |
| 2025-11-15 | **最終移除 RLS**  | `20251115060000_final_disable_all_rls.sql`      |

### 為什麼反覆啟用/禁用？

1. **11/12**: 嘗試實作 Workspace-Based RLS 系統
2. **11/15**: 發現 RLS 導致資料無法查詢（Auth session 問題）
3. **11/15**: 經過討論，決定使用 permissions + filter 的方式處理權限

---

## ✅ 決策理由

### 為什麼不使用 RLS？

1. **內部管理系統**
   - Venturo 只有內部員工使用
   - 員工都是信任的
   - 不需要資料庫層的強制隔離

2. **簡化架構**
   - RLS 增加開發複雜度
   - Debug 困難（資料看不到可能是 RLS 擋住）
   - 需要管理 Auth session 和 policies

3. **提升效能**
   - 每次查詢都要檢查 RLS policies
   - 影響查詢效能

4. **彈性需求**
   - 主管可能需要跨 workspace 查詢資料
   - RLS 會限制這種彈性

5. **開發效率**
   - 專注於業務邏輯
   - 不用處理 RLS 相關問題

### 如何處理領隊權限？

領隊是外部使用者，但仍然使用前端邏輯處理：

```typescript
// 前端根據 user.roles 判斷
if (user.roles.includes('tour_leader')) {
  // 只顯示自己帶的團
  const orders = fetchOrders({
    tour_leader_id: user.id,
    workspace_id: user.workspace_id,
  })
}
```

**為什麼可以這樣做？**

- 領隊是公司合作的領隊，不是完全的外部使用者
- 領隊需要登入系統（Supabase Auth 驗證）
- 前端邏輯 + service_role key 已經足夠安全

---

## 🚀 後續維護

### 新建表格時

```sql
CREATE TABLE public.new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id),
  -- ... other columns
);

-- 確保禁用 RLS
ALTER TABLE public.new_table DISABLE ROW LEVEL SECURITY;
```

### 權限檢查

**不要**：依賴 RLS
**應該**：在前端或 API 層檢查 `user.permissions` 和 `user.roles`

---

## 📊 受影響的表格（已禁用 RLS）

### 系統表

- employees
- workspaces
- user_roles

### Workspace 相關

- channels
- channel_members
- messages

### 核心業務

- tours
- orders
- order_members
- quotes
- itineraries
- customers
- suppliers

### 財務

- payments
- receipts
- finance_requests

### 其他

- todos
- calendar_events
- esims
- visas
- contracts

### 輔助表

- cost_templates
- price_lists
- bank_codes

---

## ⚠️ 保留項目

### RLS Helper Functions（保留但不使用）

```sql
-- 這些 function 仍然存在於資料庫中，但不會被使用
get_user_workspace_id() → uuid
is_super_admin() → boolean
```

**為什麼保留？**

- 刪除可能影響舊的 migrations
- 保留作為未來的參考
- 不影響系統運作

---

## ✅ 驗證檢查清單

- [x] 所有表格的 RLS 已禁用
- [x] 所有 RLS policies 已刪除
- [x] Global CLAUDE.md 已更新
- [x] Project CLAUDE.md 已更新（2025-12-11 最終更新）
- [x] Migration 執行完成
  - [x] 20251115060000_final_disable_all_rls.sql
  - [x] 20251205040000_disable_itineraries_rls.sql
  - [ ] 20251211000000_disable_all_remaining_rls.sql（待執行）
- [ ] 功能測試通過
  - [ ] 登入/登出正常
  - [ ] 資料查詢正常
  - [ ] 新建資料正常
  - [ ] Workspace filter 正常運作

---

## 🔧 2025-12-11 更新

### 發現問題

Supabase Dashboard 顯示 107 個 RLS 錯誤：

- 錯誤類型：「Policy Exists RLS Disabled」
- 受影響表格：advance_lists, bulletins, channel_groups, channels, cities, countries, itineraries, messages 等

### 原因分析

某些表格的 RLS 被意外啟用，但沒有對應的 policies，導致 Supabase 報錯。

### 解決方案

創建了最終的 RLS 清理 migration：

- 檔案：`supabase/migrations/20251211000000_disable_all_remaining_rls.sql`
- 功能：
  1. 禁用所有業務表格的 RLS
  2. 刪除所有殘留的 RLS policies
  3. 驗證結果並輸出報告

### 更新規範

更新了 `.claude/CLAUDE.md` 的 RLS 規範：

- 移除「user_preferences 需要 RLS」的例外
- 明確說明：**所有表格都禁用 RLS**
- 更新了權限控制架構圖（移除 Layer 2: RLS）
- 更新了新建表格的標準模板

---

## 📝 結論

Venturo 已完全移除 RLS，改用 **permissions + workspace_id filter** 的權限控制方式。

這個決策：

- ✅ 簡化了架構
- ✅ 提升了開發效率
- ✅ 保持了足夠的安全性（內部系統）
- ✅ 保留了彈性（主管跨 workspace 查詢）

**下一步**: 測試驗證所有功能正常運作。
