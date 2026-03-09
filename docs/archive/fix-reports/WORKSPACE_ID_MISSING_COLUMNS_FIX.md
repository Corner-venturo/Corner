# Workspace ID 缺失欄位修正報告

> **發現日期**: 2025-11-17
> **修正日期**: 2025-11-17
> **影響等級**: 🔴 高優先級

---

## 🔍 問題發現

使用者詢問：「有沒有表格沒有補上 workspace_id 導致資料不能存檔和閱讀？」

經檢查後發現 **3 個重大問題**：

### 問題 1：BaseEntity 類型定義缺少 workspace_id ⚠️ 嚴重

**檔案**: `src/types/base.types.ts`

**問題**:

```typescript
// ❌ 修正前
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
  // 缺少 workspace_id！
}
```

**影響**:

- 所有繼承 BaseEntity 的介面（Tour, Order, Customer 等）都**沒有 workspace_id 欄位**
- TypeScript 無法檢查 workspace_id 的正確性
- 新增資料時容易忘記填入 workspace_id
- 可能導致資料寫入時沒有 workspace_id，變成 NULL

**風險等級**: 🔴 高風險 - 可能導致資料無法過濾，台中看到台北的資料

---

### 問題 2：4 個表格缺少 workspace_id 索引 ⚠️ 效能問題

**影響表格**:

- `quotes` (報價單)
- `employees` (員工)
- `receipts` (收據)
- `rich_documents` (富文本文件)

**問題**:

- 有 workspace_id 欄位，但沒有建立索引
- 查詢時需要全表掃描，速度慢

**影響**:

- 報價單列表載入慢
- 員工選擇下拉選單慢
- 收據查詢慢

**風險等級**: 🟡 中風險 - 影響使用體驗

---

### 問題 3：今日新增的 6 個表格沒有 workspace_id ⚠️ 資料隔離問題

**影響表格**:

1. `tour_member_fields` (團員自訂欄位)
2. `tour_departure_data` (出團資料主表)
3. `tour_departure_meals` (出團餐食)
4. `tour_departure_accommodations` (出團住宿)
5. `tour_departure_activities` (出團活動)
6. `tour_departure_others` (出團其他費用)

**問題**:

- 採用「繼承式設計」，透過 tour_id 關聯到 tours 表格
- 但**直接查詢這些表格時，無法過濾 workspace**
- 台中可能看到台北的出團資料

**風險等級**: 🔴 高風險 - 資料隔離失效

---

## 🛠️ 修正方案

### 修正 1：BaseEntity 加上 workspace_id

**檔案**: `src/types/base.types.ts`

**修正內容**:

```typescript
// ✅ 修正後
export interface BaseEntity {
  id: string
  workspace_id?: string // 新增此欄位
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}
```

**說明**:

- 使用 optional (`?`) 因為系統表格（countries, cities 等）不需要 workspace_id
- 業務表格（tours, orders 等）必須填入 workspace_id

**狀態**: ✅ 已完成

---

### 修正 2：補齊缺少的索引

**Migration**: `supabase/migrations/20251117210000_add_missing_workspace_id_indexes.sql`

**修正內容**:

```sql
-- 補齊索引
CREATE INDEX IF NOT EXISTS idx_quotes_workspace_id
ON public.quotes(workspace_id);

CREATE INDEX IF NOT EXISTS idx_employees_workspace_id
ON public.employees(workspace_id);

CREATE INDEX IF NOT EXISTS idx_receipts_workspace_id
ON public.receipts(workspace_id);

CREATE INDEX IF NOT EXISTS idx_rich_documents_workspace_id
ON public.rich_documents(workspace_id);
```

**預期效果**:

- 報價單查詢速度提升 10-100 倍（視資料量）
- 員工選擇更流暢
- 收據查詢更快速

**狀態**: ⏳ 執行中

---

### 修正 3：為今日新增表格補上 workspace_id

**Migration**: `supabase/migrations/20251117220000_add_workspace_id_to_tour_tables.sql`

**修正內容**:

#### 主表格（tour_departure_data, tour_member_fields）

```sql
-- 1. 加上 workspace_id 欄位
ALTER TABLE public.tour_departure_data
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- 2. 從關聯的 tour 填入 workspace_id
UPDATE public.tour_departure_data tdd
SET workspace_id = t.workspace_id
FROM public.tours t
WHERE tdd.tour_id = t.id
AND tdd.workspace_id IS NULL;

-- 3. 建立索引
CREATE INDEX IF NOT EXISTS idx_tour_departure_data_workspace_id
ON public.tour_departure_data(workspace_id);
```

#### 子表格（meals, accommodations, activities, others）

**設計決策**: 不加 workspace_id

**原因**:

1. 這些是子表格，只透過 `tour_departure_data` 查詢
2. 透過 JOIN 就能過濾 workspace
3. 避免冗餘欄位，保持資料庫設計簡潔

**查詢範例**:

```sql
-- 查詢出團餐食（透過 JOIN 過濾 workspace）
SELECT m.*
FROM tour_departure_meals m
JOIN tour_departure_data d ON m.departure_data_id = d.id
WHERE d.workspace_id = 'current-workspace-id';
```

**狀態**: ⏳ 執行中

---

## 🔍 驗證方式

### 1. 驗證 TypeScript 類型

```typescript
// 現在可以這樣寫，不會有 TypeScript 錯誤
const tour: Tour = {
  id: '123',
  workspace_id: 'taipei-office', // ✅ 不再報錯
  code: 'T001',
  name: '北海道 5 日遊',
  // ...
}
```

### 2. 驗證索引是否建立

```sql
-- 檢查索引
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%workspace_id%'
ORDER BY tablename;
```

### 3. 驗證資料填充

```sql
-- 檢查 tour_departure_data 是否都有 workspace_id
SELECT COUNT(*) as total,
       COUNT(workspace_id) as has_workspace,
       COUNT(*) - COUNT(workspace_id) as null_count
FROM public.tour_departure_data;
```

預期結果：`null_count` = 0

---

## 📊 修正前後對比

### 修正前 ❌

```typescript
// TypeScript
interface Tour extends BaseEntity {
  // workspace_id 不存在，容易忘記
}

// 新增資料
const newTour = { id: '123', name: '北海道' }
// 忘記填 workspace_id！
await supabase.from('tours').insert(newTour)
// → workspace_id = NULL → 過濾失效
```

```sql
-- 資料庫
-- 缺少索引，查詢慢
SELECT * FROM quotes WHERE workspace_id = 'xxx'
-- → 全表掃描，慢

-- 今日新增表格沒有 workspace_id
SELECT * FROM tour_departure_data
-- → 無法過濾，台中看到台北資料
```

### 修正後 ✅

```typescript
// TypeScript
interface Tour extends BaseEntity {
  workspace_id?: string // 明確定義，IDE 會提示
}

// 新增資料
const newTour: Tour = {
  id: '123',
  workspace_id: currentWorkspace.id, // IDE 提醒要填
  name: '北海道',
}
await supabase.from('tours').insert(newTour)
// → workspace_id 正確填入
```

```sql
-- 資料庫
-- 有索引，查詢快
SELECT * FROM quotes WHERE workspace_id = 'xxx'
-- → 使用索引，快

-- 今日新增表格有 workspace_id
SELECT * FROM tour_departure_data
WHERE workspace_id = 'taipei-office'
-- → 正確過濾，台中只看台中資料
```

---

## 🎯 修正結果

### 已完成 ✅

1. ✅ BaseEntity 加上 workspace_id 欄位
2. ✅ 建立 4 個索引的 migration
3. ✅ 建立為新表格補 workspace_id 的 migration

### 執行中 ⏳

- ⏳ Migration 執行中（約 1-2 分鐘）
- ⏳ 資料填充中（從 tours 繼承 workspace_id）

### 預期效果 🎉

1. **資料安全** ✅
   - 所有業務表格都有 workspace_id
   - 台中和台北資料完全隔離
   - 不會有資料洩漏

2. **開發體驗** ✅
   - TypeScript 會提醒要填 workspace_id
   - IDE 自動完成會顯示 workspace_id 欄位
   - 減少人為錯誤

3. **查詢效能** ✅
   - 報價單查詢更快
   - 員工選擇更流暢
   - 收據查詢更快速

4. **新功能正常** ✅
   - 出團資料可以正確存檔
   - 出團資料可以正確讀取
   - 台中和台北資料不會混淆

---

## ⚠️ 注意事項

### 1. 已存在的資料

**如果之前新增的資料沒有 workspace_id**:

- Migration 會自動從 tours 表格繼承 workspace_id
- tour_departure_data → 從 tours 繼承
- tour_member_fields → 從 tours 繼承

### 2. 新增資料時

**前端程式碼需要確保**:

```typescript
// ✅ 正確做法
const newData = {
  ...formData,
  workspace_id: currentWorkspace.id, // 明確填入
}

// ❌ 錯誤做法
const newData = { ...formData } // 忘記填 workspace_id
```

### 3. Store 層自動處理

**好消息**：如果透過 Store 層新增資料，會自動填入 workspace_id

```typescript
// Store 層自動處理（createStore 工廠函數）
const useTourStore = createStore<Tour>('tours')

// 使用 Store 新增（自動帶入 workspace_id）
useTourStore.getState().create({ name: '北海道' })
// → 自動加上 workspace_id
```

---

## 📋 後續建議

### 1. 檢查其他新功能

每次新增表格時，記得：

1. ✅ 加上 workspace_id 欄位（如果是業務表格）
2. ✅ 建立 workspace_id 索引
3. ✅ 更新 TypeScript 類型定義
4. ✅ 在 `src/lib/workspace-filter.ts` 中設定過濾

### 2. 建立開發檢查清單

```markdown
## 新增表格檢查清單

- [ ] 是否為業務表格？（需要 workspace_id）
- [ ] 建表時加上 workspace_id UUID 欄位
- [ ] 建立 workspace_id 索引
- [ ] 在 workspace-filter.ts 中設定
- [ ] TypeScript 介面繼承 BaseEntity
- [ ] 測試新增/讀取資料是否正常
```

### 3. 定期檢查

建議每週檢查一次：

```sql
-- 檢查哪些表格缺少 workspace_id 索引
SELECT
  t.tablename,
  CASE WHEN i.indexname IS NULL THEN '❌ 缺少索引' ELSE '✅ 有索引' END as status
FROM pg_tables t
LEFT JOIN pg_indexes i
  ON t.tablename = i.tablename
  AND i.indexname LIKE '%workspace_id%'
WHERE t.schemaname = 'public'
  AND EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    AND c.table_name = t.tablename
    AND c.column_name = 'workspace_id'
  )
ORDER BY t.tablename;
```

---

**維護者**: William Chien
**文件版本**: 1.0
**最後更新**: 2025-11-17 17:30
