# Venturo 專案代碼審計報告

## 執行時間
2025-10-25

## 專案規模
- 總 TypeScript/TSX 檔案數：480+
- Component 檔案數：182
- Service 檔案數：5
- Store 檔案數：40+
- Hook 檔案數：14
- Type 定義檔案數：20
- 遷移檔案數：42 (包含 28 個過時的)

---

## 1. 重複的程式碼

### 1.1 認證服務 (CRITICAL)
**發現：3 個相似的認證實現**

#### 文件位置
- `/src/services/auth-service-v5.ts` (147 行)
- `/src/services/local-auth-service.ts` (326 行)
- `/src/services/offline-auth.service.ts` (298 行)
- `/src/stores/auth-store-local.ts` (標記為過時)

#### 問題分析
- **auth-service-v5.ts**: Supabase 整合版本
- **local-auth-service.ts**: IndexedDB 本地版本
- **offline-auth.service.ts**: 有大量 TODO 註解，等待生產環境修改
- **auth-store-local.ts**: 明確標記為 "LEGACY CODE - DO NOT USE"

#### 重複邏輯
- 密碼驗證邏輯
- 帳號狀態檢查
- 登入嘗試限制
- 帳號鎖定機制

#### 影響程度
**高** - 維護 3 個相似實現會造成維護困難和 bug 不一致

---

### 1.2 日期輸入組件 (HIGH)
**發現：2 個相似的日期輸入組件**

#### 文件位置
- `/src/components/ui/date-input.tsx` (200 行)
- `/src/components/ui/smart-date-input.tsx` (218 行)

#### 區別
| 功能 | date-input | smart-date-input |
|-----|-----------|-----------------|
| 基礎日期選擇 | ✓ | ✓ |
| 日曆彈出窗口 | ✗ | ✓ |
| date-fns 依賴 | ✗ | ✓ |
| 代碼量 | 200 行 | 218 行 |

#### 使用情況
- date-input: 2 個檔案使用
- smart-date-input: 0 個檔案使用（可能已淘汰）

#### 影響程度
**中** - SmartDateInput 可能為過時實驗版本

---

### 1.3 Timebox Store 重複 (HIGH)
**發現：2 個相同的 Timebox Store 實現**

#### 文件位置
- `/src/stores/timebox-store.ts` (574 行)
- `/src/stores/timebox-store-supabase.ts` (478 行)

#### 重複內容
- 相同的 TypeScript 介面定義：
  - BaseBox
  - WorkoutData
  - ReminderData
  - ScheduledBox
  - WeekRecord
  - WeekStatistics
- 相同的色彩定義 (morandiColors)
- 相同的 Store 初始化方式

#### 使用情況
- timebox-store.ts: 11 個檔案使用（主要）
- timebox-store-supabase.ts: 0 個檔案使用（已淘汰）

#### 影響程度
**高** - supabase 版本完全未使用，應刪除

---

### 1.4 Types 定義重複 (MEDIUM)

#### 文件位置
- `/src/types/models.ts` - 267 行，從 Supabase 映射
- `/src/types/base.types.ts` - 143 行，基礎型別
- `/src/types/common.types.ts` - 375 行，通用型別
- `/src/types/index.ts` - 95 行，統一匯出

#### 重複定義
1. **Attachment 介面定義在 2 個檔案**
   - `/src/types/models.ts` 第 101-107 行
   - `/src/types/common.types.ts` 第 182-190 行

2. **SearchParams 介面定義在 2 個檔案**
   - `/src/types/models.ts` 第 261-266 行
   - `/src/types/common.types.ts` 第 250-257 行

#### 影響程度
**中低** - 功能無重大問題，但違反 DRY 原則

---

### 1.5 Hook 重複 (MEDIUM)

#### 文件位置
- `/src/hooks/useCustomers.ts` - 69 行
- `/src/features/customers/hooks/useCustomers.ts` - 68 行
- `/src/hooks/useTours.ts` - 396 行（完整功能）
- `/src/features/tours/hooks/useTours.ts` - 53 行（簡化版本）
- `/src/hooks/useOrders.ts` - 類似情況

#### 重複情況

**useCustomers**
- `/src/hooks/useCustomers.ts`: 包含驗證、VIP 折扣計算、搜尋邏輯
- `/src/features/customers/hooks/useCustomers.ts`: 只提供基本 CRUD 和 Service 調用

**useTours**
- `/src/hooks/useTours.ts`: 完整實現，包含日期驗證、狀態管理、權限檢查
- `/src/features/tours/hooks/useTours.ts`: 簡化版，只調用 Service 方法

#### 影響程度
**中** - 功能不同但名稱相同，容易混淆

---

### 1.6 Auth Store 重複 (MEDIUM)

#### 文件位置
- `/src/stores/auth-store.ts` - 現代版本
- `/src/stores/auth-store-local.ts` - 過時版本（明確標記廢棄）

#### 影響程度
**低** - 已被清楚標記為廢棄，但仍未刪除

---

## 2. 沒必要的程式碼

### 2.1 過時的 SQL 遷移檔案 (CRITICAL)

#### 文件位置
`/supabase/migrations/_archive/` - 28 個檔案

#### 內容清單
```
add_employees_roles_field.sql
add_regions_table.sql
add_workspace_tables.sql (4 個變體)
backup_all_data.sql (2 個變體)
backup_simple.sql
check_actual_schema.sql
check_all_employee_references.sql
check_all_old_ids.sql
check_current_schema.sql
check_text_employee_fields.sql
complete_schema_analysis.sql
diagnose_todos_schema.sql
final_complete_fix.sql
fix_author_id_type.sql
fix_employee_id_references.sql
fix_schema.sql
fix_text_employee_ids.sql
migrate_employees_to_uuid.sql (2 個變體)
restore_all_data.sql
step1_remove_defaults.sql
step2_convert_to_uuid.sql
update_workspace_tables.sql
create_workspace_schema.sql
```

#### 為什麼不必要
- 都在 `_archive` 資料夾中，表示已淘汰
- 新的遷移已存在：
  - `20251025133900_create_channel_members.sql`
  - `20251025134200_complete_workspace_schema.sql`
  - 等 8 個較新的遷移

#### 影響程度
**低但影響整潔** - 只占空間，無功能影響

---

### 2.2 備份檔案

#### 文件位置
- `/src/components/workspace/ChannelChat.tsx.backup` (41.6 KB)

#### 影響程度
**低** - 占用空間，應刪除

---

### 2.3 文件/報告檔案重複 (LOW)

#### 文件位置
根目錄的 11 個 Markdown 檔案：
```
CODE_ISSUES_REPORT.md
FIXES_APPLIED.md
LOGIC_ISSUES_SUMMARY.md
MANIFESTATION_SETUP.md
PHASE2_COMPLETED.md
PHASE2_PROGRESS.md
PHASE3_PLAN.md
REFACTORING_PLAN.md
SYSTEM_AUDIT.md
REFACTOR_SUMMARY.md
REFACTOR_COMPLETE.md
FINAL_REFACTOR_REPORT.md
REFACTORING_SUMMARY.md
REFACTOR_SUMMARY_FOR_TEAM.md
PAYMENT_STORE_FIX_REPORT.md
STORE_MIGRATION_COMPLETE.md
MANIFESTATION_WIDGET_UPDATE.md
SUPABASE_WORKFLOW.md
WORKSPACE_CLEANUP_GUIDE.md
```

#### 問題
- 多個相似名稱（4 個 "REFACTOR" 相關檔案）
- 可能包含重複內容
- 不清楚哪個是最新的

#### 影響程度
**低** - 只是文件混亂，建議整理

---

### 2.4 多個版本的 Store 創建工具

#### 文件位置
- `/src/stores/create-store.ts` - 舊版本
- `/src/stores/core/create-store-new.ts` - 新版本

#### 使用情況
- `create-store.ts`: 大部分 store 仍使用此版本
- `create-store-new.ts`: 可能為未完成的重構

#### 影響程度
**中** - 混亂的遷移過程

---

## 3. 可以合併的檔案

### 3.1 Tour Hooks 合併建議 (HIGH PRIORITY)

#### 候選檔案
- `/src/hooks/useTours.ts` (396 行)
- `/src/features/tours/hooks/useTours.ts` (53 行)
- `/src/features/tours/hooks/useTours-advanced.ts`
- `/src/features/tours/hooks/useTourPageState.ts`
- `/src/features/tours/hooks/useTourOperations.ts`
- `/src/features/tours/hooks/index.ts`

#### 合併建議
將所有 tour hooks 合併到單一目錄 `/src/features/tours/hooks/`，提供：
- 基礎 CRUD 操作
- 高級業務邏輯
- 頁面狀態管理
- 操作協調

#### 預期節省
30-40% 代碼重複

---

### 3.2 Customer Hooks 合併建議 (HIGH PRIORITY)

#### 候選檔案
- `/src/hooks/useCustomers.ts`
- `/src/features/customers/hooks/useCustomers.ts`

#### 問題
- 名稱完全相同，容易混淆
- 功能重疊但實現不同
- 應統一到 `/src/features/customers/hooks/`

---

### 3.3 Auth Service 統一建議 (CRITICAL)

#### 當前狀態
- 3 個不同的認證實現
- 1 個明確標記為廢棄
- 混亂的選擇過程

#### 建議方案
1. 決定主要認證方式：
   - 完全在線（Supabase 優先）
   - 混合模式（在線優先，離線備援）
   - 完全離線（IndexedDB）

2. 統一實現：
   - 保留 1 個主要版本
   - 刪除其他版本
   - 在單一位置管理所有認證邏輯

3. 刪除：
   - `/src/services/offline-auth.service.ts` (包含大量 TODO)
   - `/src/stores/auth-store-local.ts` (已標記廢棄)

---

### 3.4 Date Input 統一建議 (MEDIUM)

#### 候選檔案
- `/src/components/ui/date-input.tsx`
- `/src/components/ui/smart-date-input.tsx`

#### 建議
- 確認 SmartDateInput 是否在使用
- 如未使用，刪除
- 如正在使用，決定標準實現

---

## 4. 代碼品質問題

### 4.1 不安全的型別斷言 (MEDIUM)

#### 發現
- 187 個 `as unknown` 或 `as any` 的型別斷言

#### 常見位置
- `/src/stores/create-store.ts` - Store 創建邏輯
- `/src/features/` - Feature modules
- API 響應處理

#### 建議
逐步改進型別安全性，至少改進高風險區域

---

### 4.2 TODO/FIXME 註解 (MEDIUM)

#### 發現
- 6 個檔案包含 TODO/FIXME 註解
- 特別是 `offline-auth.service.ts` 包含多個 "上線修改" TODO

#### 文件位置
- `/src/services/offline-auth.service.ts` - 關鍵待修改
- `/src/features/tours/components/TourForm.tsx`
- 其他零散位置

---

### 4.3 已註解掉的代碼 (LOW)

#### 發現
- `/src/hooks/index.ts` 第 10 行：`// usePayments deprecated`
- `/src/stores/index.ts` 多個已註解的 store 定義
- 各 feature modules 中零散的註解代碼

---

## 5. 架構問題

### 5.1 雙重 Hook 結構 (MEDIUM)

#### 問題
專案同時維護 2 個 hooks 位置：
- `/src/hooks/` - 通用 hooks
- `/src/features/*/hooks/` - 功能特定 hooks

#### 混亂之處
- 不清楚什麼時候用哪個
- 容易創建重複的 hooks
- 引入時需思考正確位置

#### 建議
統一到 `/src/features/*/hooks/` 結構

---

### 5.2 Store 遷移混亂 (MEDIUM)

#### 問題
- 存在 `create-store.ts` 和 `create-store-new.ts`
- 沒有清晰的遷移路徑
- 新 store 應該用哪個不清楚

---

### 5.3 類型定義分散 (MEDIUM)

#### 問題
- 20+ 個 `.types.ts` 和 `.types` 檔案
- 重複定義（Attachment, SearchParams）
- 多個索引檔案（types/index.ts, types/models.ts）

#### 建議
統一類型定義結構，避免重複

---

## 6. 清理建議優先級

### 立即執行 (CRITICAL)
1. 刪除 `/supabase/migrations/_archive/` 所有檔案
   - 影響：0 個引用
   - 收益：清理 28 個過時檔案

2. 刪除 `/src/stores/auth-store-local.ts`
   - 已明確標記為廢棄
   - 影響：0 個引用
   - 代碼量：152 行

3. 刪除 `/src/stores/timebox-store-supabase.ts`
   - 完全未使用
   - 影響：0 個引用
   - 代碼量：478 行

4. 刪除 `/src/components/workspace/ChannelChat.tsx.backup`
   - 單純備份檔案
   - 影響：0 個引用
   - 空間：41.6 KB

### 進行中 (HIGH)
1. 決定認證實現策略
2. 統一 Tour hooks 實現
3. 統一 Customer hooks 實現
4. 移除 SmartDateInput 或統一日期輸入
5. 統一 Store 創建方式

### 計畫中 (MEDIUM)
1. 清理 Markdown 文件（保留最新版本）
2. 減少型別斷言使用
3. 解決所有 TODO/FIXME 註解
4. 統一 types 定義位置

---

## 7. 代碼統計

| 分類 | 數量 | 狀態 |
|-----|-----|------|
| 過時遷移檔案 | 28 | 待刪除 |
| 重複認證實現 | 3 + 1 舊 | 待合併 |
| 重複 Store | 2 | 1 待刪除 |
| 重複 Hooks | 3+ 對 | 待合併 |
| 重複 Types 定義 | 2 對 | 待統一 |
| Type 斷言 | 187 | 待改進 |
| 備份檔案 | 1 | 待刪除 |
| 文件報告 | 11 | 待整理 |

---

## 8. 影響評估

### 預期收益（清理後）
- 代碼行數減少：15-20%
- 檔案數減少：20-25%
- 維護複雜性降低：30-40%
- 構建時間改善：5-10%

### 風險評估
- **低風險**: 刪除過時文件、備份、廢棄代碼
- **中風險**: 合併重複 hooks、types 統一
- **高風險**: 認證實現統一（需要詳細測試）

---

## 9. 建議行動計畫

### 第 1 週：快速清理
- 刪除過時遷移檔案
- 刪除備份檔案
- 刪除廢棄 store
- 整理 Markdown 文件

### 第 2-3 週：Hook 統一
- 統一 Tour hooks
- 統一 Customer hooks
- 統一 Order hooks

### 第 4 週：認證統一
- 決定最終認證策略
- 實現統一版本
- 完整測試

### 進行中：代碼品質
- 逐步減少型別斷言
- 解決 TODO/FIXME
- 統一類型定義

---

