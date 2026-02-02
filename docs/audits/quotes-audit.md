# 報價單模組審計報告
日期：2025-02-02

---

## 🔴 嚴重問題
（阻塞流程的問題）

### 無嚴重問題發現
報價單模組的基本 CRUD 流程完整，核心功能正常運作。

---

## 🟡 中等問題
（影響體驗的問題）

### 1. DocumentVersionPicker 複製報價單欄位不完整
**位置**: `src/components/documents/DocumentVersionPicker.tsx` 第 213-225 行

**問題**: 複製報價單時只複製了部分欄位，遺漏重要資料
```typescript
// 目前只複製
const newQuote = await createQuote({
  code,
  name: quote.name,
  customer_name: `${originalName} (副本)`,
  quote_type: 'standard',
  status: 'draft',
  tour_id: tour.id,
  categories: quote.categories,
  group_size: quote.group_size,
})

// 缺少：participant_counts, selling_prices, accommodation_days, tier_pricings
```

**影響**: 複製的報價單會遺失人數分布、售價設定、住宿天數等重要資訊

**建議修復**:
```typescript
const newQuote = await createQuote({
  ...existingFields,
  participant_counts: quote.participant_counts,
  selling_prices: quote.selling_prices,
  accommodation_days: quote.accommodation_days,
  tier_pricings: quote.tier_pricings,
})
```

---

### 2. useQuickQuoteDetail 載入版本時項目狀態未重置
**位置**: `src/features/quotes/hooks/useQuickQuoteDetail.ts` 第 240-261 行

**問題**: `handleLoadVersion` 函數中，當 `versionData.quick_quote_items` 為空時不會重置 `items` 狀態

```typescript
// 目前：只有有資料才更新
if (versionData.quick_quote_items) {
  setItems(versionData.quick_quote_items)
}

// 應該：無論有無資料都要更新
setItems(versionData.quick_quote_items || [])
```

**影響**: 切換到空版本時會顯示前一版本的項目

---

### 3. useQuoteSave 保存失敗無用戶提示
**位置**: `src/features/quotes/hooks/useQuoteSave.ts` 第 174-175 行

**問題**: 保存失敗時只有 `logger.error`，沒有向用戶顯示錯誤訊息

```typescript
} catch (error) {
  logger.error('儲存失敗:', error)
  // 缺少：toast.error('儲存失敗，請稍後再試')
}
```

**影響**: 用戶不知道保存是否成功

---

### 4. useQuoteState useEffect 依賴陣列問題
**位置**: `src/features/quotes/hooks/useQuoteState.ts` 第 23-36 行

**問題**: 兩個 useEffect 的依賴陣列為空 `[]`，但內部調用了 state setter

```typescript
useEffect(() => {
  if (workspaces.length === 0) {
    loadWorkspaces()  // 會觸發 re-render
  }
}, [])  // 空依賴，但 workspaces 和 loadWorkspaces 應該在依賴中
```

**影響**: 可能導致 ESLint 警告，且在某些情況下可能造成無限 re-render 或過度請求

**建議**: 
- 添加正確的依賴，或
- 使用 `useRef` 追蹤是否已載入過

---

### 5. QuotesPage 缺少載入狀態顯示
**位置**: `src/features/quotes/components/QuotesPage.tsx`

**問題**: 雖然有 `loading` 狀態，但在表格載入時沒有顯示 loading indicator

**影響**: 用戶在資料載入期間看到空表格，可能誤以為沒有資料

---

## 🟢 輕微問題
（可優化的項目）

### 1. QuoteDetailPage 檔案過長
**位置**: `src/app/(main)/quotes/[id]/page.tsx`

**問題**: 約 500+ 行程式碼，包含多個 Dialog 狀態和 callback

**建議**: 拆分為多個子組件或自定義 hooks

---

### 2. CostItem 類型有重複欄位
**位置**: `src/features/quotes/types/index.ts`

**問題**: 同時有 `note` 和 `notes` 兩個相似欄位

```typescript
export interface CostItem {
  note?: string
  notes?: string // 備註（與 note 相容）
}
```

**建議**: 統一使用一個欄位，另一個作為 alias

---

### 3. 錯誤處理方式不一致
**問題**: 不同地方使用不同的錯誤顯示方式
- `toast.error()` - 用於即時通知
- `await alert()` - 用於阻塞式對話框
- `logger.error()` - 只記錄不顯示

**建議**: 制定統一的錯誤處理策略：
- 用戶可復原的錯誤 → `toast.error()`
- 需要用戶確認的錯誤 → `alert()`
- 所有錯誤都要 `logger.error()`

---

### 4. 刪除版本無確認對話框
**位置**: `src/features/quotes/hooks/useQuoteVersion.ts` 第 100-120 行

**問題**: `handleDeleteVersion` 直接刪除版本，沒有確認步驟

**建議**: 添加 `confirm()` 對話框

---

### 5. 缺少空狀態處理優化
**位置**: 多處

**問題**: 部分列表的空狀態只顯示「尚無資料」，可以提供更多指引

**建議**: 添加 CTA 按鈕引導用戶創建

---

## ✅ 通過的檢查
（確認正常的功能）

### 按鈕功能
- ✅ **新增報價單** - `QuoteDialog` + `createQuote` 正常運作
- ✅ **編輯報價單** - `QuoteDetailPage` 可正常編輯和保存
- ✅ **複製報價單** - `DocumentVersionPicker.handleCopy` 功能存在（但有欄位遺漏問題）
- ✅ **刪除報價單** - `DocumentVersionPicker.handleDelete` 有確認對話框
- ✅ **預覽功能** - `PrintableQuotation` 可正常產生可列印的報價單

### 頁面流程
- ✅ `/quotes` 報價單列表 - 正常顯示依團分類和獨立報價單
- ✅ `/quotes/[id]` 標準報價單詳情 - 完整的成本計算和版本管理
- ✅ `/quotes/quick/[id]` 快速報價單 - 簡易報價流程正常

### 資料流
- ✅ **與 tour 的關聯** - 雙向關聯正確（quote.tour_id ↔ tour.quote_id）
- ✅ **金額計算邏輯** - `useQuoteCalculations` 正確處理各身份成本
- ✅ **版本管理** - `useQuoteSave.handleSaveAsNewVersion` 正確追蹤版本歷史

### 邊界情況處理
- ✅ **空資料** - 使用 `length > 0` 檢查，有空狀態顯示
- ✅ **404 狀態** - `NotFoundState` 組件正確處理找不到報價單的情況
- ✅ **載入狀態** - `hasLoaded` + `notFound` 組合避免閃爍
- ✅ **唯讀模式** - 特殊團報價單正確設為唯讀

### 其他
- ✅ **型別安全** - TypeScript 類型定義完整
- ✅ **日誌記錄** - 使用 `logger` 統一記錄
- ✅ **飯店同步** - 自動同步飯店到行程表

---

## 建議優先修復順序

1. **高優先**: DocumentVersionPicker 複製欄位不完整（影響用戶操作）
2. **高優先**: useQuoteSave 保存失敗無提示（影響用戶體驗）
3. **中優先**: useQuickQuoteDetail 版本切換問題
4. **中優先**: 載入狀態顯示優化
5. **低優先**: 程式碼重構和一致性優化
