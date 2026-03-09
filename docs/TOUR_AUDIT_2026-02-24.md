# Venturo ERP 旅遊團功能審查報告

**審查日期:** 2026-02-24  
**審查範圍:** `src/features/tours/`, `src/features/orders/`, `src/app/(main)/tours/`, `src/features/finance/`

## 🔴 Critical Issues (嚴重問題)

### C001 - Dialog 遮罩層級缺失

**檔案路徑:** `src/features/tours/components/tour-itinerary-tab.tsx`  
**行號:** 118  
**問題描述:** Dialog 未設置 level 屬性，可能導致遮罩層級錯誤  
**程式碼:** `<DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">`  
**建議修復:** 添加 `level={2}` 屬性  
**修復方式:** `<DialogContent level={2} className="max-w-lg max-h-[80vh] overflow-y-auto">`

### C002 - Dialog 遮罩層級缺失

**檔案路徑:** `src/features/tours/components/tour-requirements-tab.tsx`  
**行號:** 63  
**問題描述:** Dialog 未設置 level 屬性，可能導致遮罩層級錯誤  
**程式碼:** `<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">`  
**建議修復:** 添加 `level={2}` 屬性  
**修復方式:** `<DialogContent level={2} className="max-w-6xl max-h-[90vh] overflow-y-auto">`

### C003 - 狀態轉換邏輯不一致

**檔案路徑:** `src/features/tours/hooks/useTours-advanced.ts`  
**行號:** 233  
**問題描述:** 狀態轉換定義混合中英文，與 TypeScript 類型定義不一致  
**程式碼:** `'開團': ['draft', 'cancelled']` - 中文狀態轉換到英文狀態  
**建議修復:** 統一使用中文狀態名稱  
**修復方式:**

```typescript
const VALID_TOUR_TRANSITIONS: Record<string, string[]> = {
  開團: ['待出發', '取消'],
  待出發: ['已出發', '取消'],
  已出發: ['待結團'],
  待結團: ['已結團'],
  已結團: [],
  取消: ['開團'],
}
```

## 🟡 Warning Issues (警告問題)

### W001 - 殘留 Proposal 相關功能

**檔案路徑:** `src/features/tours/components/ProposalDialogsWrapper.tsx`  
**行號:** 全文件  
**問題描述:** 完整的 Proposal Dialog 包裝器組件仍然存在，但無其他文件引用  
**建議修復:** 如果 proposal 功能已完全移除，應刪除此文件

### W002 - Proposal 相關 import 殘留

**檔案路徎:** `src/features/tours/components/tour-itinerary-tab.tsx`  
**行號:** 51  
**問題描述:** 仍然引用 proposals 功能的組件  
**程式碼:** `} from '@/features/proposals/components/package-itinerary/format-itinerary'`  
**建議修復:** 如果 proposals 功能已移除，應移除相關引用或替換為新的實作

### W003 - Proposal 欄位仍在使用

**檔案路徑:** `src/types/tour.types.ts`  
**行號:** 361  
**問題描述:** Tour 介面中仍包含 proposal_package_id 欄位  
**程式碼:** `proposal_package_id?: string | null // 關聯的提案套件 ID（來源追蹤）`  
**建議修復:** 如果不再需要提案功能，考慮標記為已棄用或移除

### W004 - 提案轉開團功能殘留

**檔案路徑:** `src/features/tours/services/tour_dependency.service.ts`  
**行號:** 155  
**問題描述:** 仍有「提案轉開團」相關註解和功能  
**建議修復:** 確認是否需要保留此功能，或完全移除相關代碼

### W005 - 多處 Proposal 相關殘留

**影響文件:**

- `src/features/tours/components/tour-designs-tab.tsx` (7 處)
- `src/features/tours/components/LinkItineraryToTourDialog.tsx` (5 處)
- `src/features/tours/components/TourActionButtons.tsx` (10 處)
- `src/features/tours/hooks/useProposalOperations.ts` (41 處)
  **問題描述:** 多個文件仍包含大量 proposal 相關代碼  
  **建議修復:** 需要逐一檢查每個文件，決定是否移除或保留

## 🔵 Info Issues (資訊問題)

### I001 - 金額格式使用統一

**現況:** 已正確使用 `CurrencyCell` 組件和 `formatCurrency` 函數  
**涵蓋文件:**

- `src/features/tours/components/tour-overview.tsx`
- `src/features/tours/components/TourClosingDialog.tsx`
- `src/features/tours/components/tour-costs.tsx`

### I002 - 日期格式使用統一

**現況:** 已正確使用 `formatDateShort` 函數和 `DateCell` 組件  
**涵蓋文件:** 多個 tour sections 組件

### I003 - Dialog Level 設定良好

**現況:** 大部分 Dialog 都正確設置了 level 屬性  
**已檢查的良好範例:**

- `AddMemberDialog.tsx` - `level={2}`
- `MemberEditDialog.tsx` - `level={2}`
- `ArchiveReasonDialog.tsx` - `level={1}`
- `TourPrintDialog.tsx` - `level={2}`
- `TourClosingDialog.tsx` - `level={2}`

### I004 - 團員管理功能完整

**現況:** OrderMembersExpandable 組件功能完整，包含：

- 拖曳排序功能
- 護照上傳與 OCR 識別
- 分房分車管理
- 欄位顯示控制
- 批次操作功能

### I005 - Tab 結構完整

**現況:** 旅遊團詳細頁面包含完整的 10 個 Tab：

- 總覽 (overview)
- 訂單 (orders)
- 團員 (members)
- 行程 (itinerary)
- 報價 (quote)
- 需求 (requirements)
- 追蹤 (tracking)
- 報到 (checkin)
- 檔案 (files)
- 結案 (closing)

### I006 - 狀態生命週期定義清楚

**現況:** 在 `src/types/tour.types.ts` 中清楚定義了團的狀態流程：

```
開團 → 待出發 → 已出發 → 待結團 → 已結團
                                  ↓
                                取消
```

### I007 - 空狀態處理需關注

**現況:** 檢查到的組件都有 loading 狀態處理，但空狀態處理依賴子組件實作  
**建議:** 確保所有 Tab 的子組件都有適當的空狀態顯示

## 📊 統計摘要

| 問題類別    | 數量   | 說明                 |
| ----------- | ------ | -------------------- |
| 🔴 Critical | 3      | 需立即修復的嚴重問題 |
| 🟡 Warning  | 5      | 需要關注的警告問題   |
| 🔵 Info     | 7      | 資訊性觀察和良好實踐 |
| **總計**    | **15** |                      |

## 🎯 優先修復建議

### 立即修復 (本週內)

1. **C001, C002** - 補充缺失的 Dialog level 屬性
2. **C003** - 修正狀態轉換邏輯中的中英文混用問題

### 短期修復 (2週內)

1. **W001** - 清理未使用的 ProposalDialogsWrapper 文件
2. **W002** - 處理 proposal 相關的 import 殘留

### 中期規劃 (1個月內)

1. **W003, W004, W005** - 決定 proposal 功能的去留，進行徹底清理
2. **I007** - 檢查並優化各 Tab 的空狀態處理

## 💡 架構觀察

1. **程式碼組織良好**: features 資料夾結構清晰，職責分離明確
2. **型別安全**: TypeScript 使用充分，型別定義完整
3. **UI 一致性**: 使用統一的 UI 組件庫和格式化函數
4. **功能完整性**: 旅遊團管理的核心功能齊全，包含完整的生命週期管理

## 🚨 風險評估

- **高風險**: Dialog 遮罩層級問題可能影響用戶體驗
- **中風險**: 狀態轉換邏輯不一致可能導致數據異常
- **低風險**: Proposal 功能殘留主要影響程式碼維護性

---

**審查完成:** ✅ 已全面檢視指定範圍內的旅遊團功能  
**下次審查建議:** 3個月後進行增量審查
