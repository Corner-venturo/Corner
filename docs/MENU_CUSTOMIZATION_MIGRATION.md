# 選單自訂功能 - Migration 執行指南

> **建立日期**：2025-11-17
> **目的**：新增 `hidden_menu_items` 欄位，讓員工可以自訂側邊欄顯示的功能

---

## 📋 功能說明

### 已完成的部分 ✅
- ✅ 權限已新增：`'accounting'`（會計模組）
- ✅ 路由已建立：`/accounting`
- ✅ 側邊欄已整合：底部個人工具區顯示「記帳管理」
- ✅ 選單設定頁面：`/settings/menu`（員工可自訂顯示）
- ✅ 前端邏輯完成：sidebar.tsx 已整合過濾機制

### 待執行的部分 ⏳
- ⏳ **資料庫欄位**：需要新增 `employees.hidden_menu_items`

---

## 🔧 手動執行 Migration（Supabase Dashboard）

### 步驟 1：打開 Supabase SQL Editor

1. 前往：https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn
2. 點選左側選單「SQL Editor」
3. 點選「New query」

### 步驟 2：複製以下 SQL 並執行

```sql
-- =====================================================
-- 新增員工自訂選單顯示功能
-- 建立日期：2025-11-17
-- 說明：允許員工自訂側邊欄顯示的功能選單
-- =====================================================

BEGIN;

-- 新增 hidden_menu_items 欄位到 employees 表格
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS hidden_menu_items TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.employees.hidden_menu_items IS '使用者隱藏的選單項目 ID（例如：["tours", "quotes", "accounting"]）';

-- 建立索引（方便查詢）
CREATE INDEX IF NOT EXISTS idx_employees_hidden_menu_items
ON public.employees USING GIN(hidden_menu_items);

COMMIT;
```

### 步驟 3：驗證結果

執行以下 SQL 確認欄位已建立：

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'employees'
  AND column_name = 'hidden_menu_items';
```

**預期結果**：
```
column_name         | data_type | column_default
--------------------+-----------+----------------
hidden_menu_items   | ARRAY     | '{}'::text[]
```

---

## 📊 功能使用方式

### 員工如何自訂選單

1. **登入系統**
2. **前往「設定」→「選單設定」**（路徑：`/settings/menu`）
3. **按分類切換開關**：
   - 業務管理（旅遊團、訂單、報價單等）
   - 財務管理（財務、會計、收款、支出）
   - 人力資源（人資、考勤）
4. **點選「儲存設定」**
5. **側邊欄立即更新**（隱藏不想看的功能）

### 可隱藏的選單項目

目前支援隱藏以下功能（核心功能如「首頁」「工作區」「設定」不可隱藏）：

**業務管理**：
- 旅遊團（tours）
- 報價單（quotes）
- 訂單（orders）
- 行程（itinerary）
- 客戶（customers）
- 待辦事項（todos）
- 行事曆（calendar）
- 供應商（suppliers）
- 簽證（visas）
- eSIM（esims）
- 景點（attractions）
- 資料庫（database）

**財務管理**：
- 財務（finance）
- 會計（accounting）⭐ 新增
- 收款（payments）
- 支出（disbursement）

**人力資源**：
- 人資（hr）
- 考勤（attendance）

---

## 🔍 技術細節

### 資料流程

```
員工到「選單設定」頁面
  ↓
切換開關（顯示/隱藏）
  ↓
點選「儲存設定」
  ↓
呼叫 useUserStore.update()
  ↓
更新 employees.hidden_menu_items = ["tours", "quotes"]
  ↓
Sidebar 重新渲染（過濾隱藏項目）
  ↓
側邊欄只顯示員工選擇的功能
```

### 核心程式碼

#### 1. 選單設定頁面
**檔案**：`src/app/settings/menu/page.tsx`

```typescript
// 儲存設定
const handleSave = async () => {
  await updateUser(user.id, {
    hidden_menu_items: hiddenMenuItems,
  })
  alert('選單設定已儲存')
}
```

#### 2. 側邊欄過濾邏輯
**檔案**：`src/components/layout/sidebar.tsx`（第 365-433 行）

```typescript
const visibleMenuItems = useMemo(() => {
  const hiddenMenuItems = user.hidden_menu_items || []

  return items
    .map(item => {
      // 檢查是否被使用者隱藏
      if (isMenuItemHidden(item.href, hiddenMenuItems)) {
        return null  // 隱藏此項目
      }
      // ... 權限檢查
    })
    .filter(item => item !== null)
}, [user])
```

#### 3. 隱藏判斷函數
**檔案**：`src/constants/menu-items.ts`

```typescript
export function isMenuItemHidden(href: string, hiddenMenuItems: string[]): boolean {
  const menuId = MENU_HREF_TO_ID_MAP[href]
  if (!menuId) return false
  return hiddenMenuItems.includes(menuId)
}
```

---

## ✅ 驗收測試

### 測試案例 1：隱藏功能

1. 登入系統（超級管理員）
2. 前往「設定」→「選單設定」
3. 關閉「旅遊團」「報價單」「會計」
4. 點選「儲存設定」
5. **預期結果**：側邊欄不再顯示這三個選單

### 測試案例 2：重設為預設

1. 在「選單設定」頁面
2. 點選「重設為預設」
3. 點選「儲存設定」
4. **預期結果**：所有選單都恢復顯示

### 測試案例 3：資料持久化

1. 隱藏部分選單並儲存
2. 登出系統
3. 重新登入
4. **預期結果**：隱藏設定保留（仍然不顯示）

---

## 📁 相關檔案

### Migration 檔案
- `supabase/migrations/20251117170000_add_hidden_menu_items.sql`

### 前端檔案
- `src/app/settings/menu/page.tsx` - 選單設定頁面
- `src/constants/menu-items.ts` - 選單項目定義
- `src/components/layout/sidebar.tsx` - 側邊欄（過濾邏輯）

### 型別定義
- `src/types/employee.types.ts` - Employee 型別（需包含 `hidden_menu_items?: string[]`）

---

## 🎯 後續待辦

### 選項 1：在設定頁面加入連結（推薦）

**目的**：讓使用者知道有這個功能

**位置**：`src/app/settings/page.tsx`

**新增區塊**：
```tsx
<Card>
  <CardHeader>
    <CardTitle>選單設定</CardTitle>
    <CardDescription>自訂側邊欄顯示的功能選單</CardDescription>
  </CardHeader>
  <CardContent>
    <Link href="/settings/menu">
      <Button variant="outline">管理選單顯示</Button>
    </Link>
  </CardContent>
</Card>
```

---

**執行完成後，選單自訂功能即可正常使用！**

---

**最後更新**：2025-11-17
**維護者**：William Chien
