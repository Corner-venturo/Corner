# [id] Route Audit - 2025-02-12

## 規則
避免「每個 entity 都有詳細頁」的 [id] 路由。簡單的詳情顯示應改為 Dialog。
複雜的編輯器/多 tab 頁面可保留獨立路由。

## 審查結果

### 1. `confirmations/[id]/page.tsx` — ✅ 保留
**理由：** 完整的確認單編輯器，包含 EditorContainer + PreviewContainer 雙欄佈局、PNR 匯入、列印預覽。~190 行，但功能複雜（表單編輯 + 即時預覽），不適合塞進 Dialog。

### 2. `quotes/[id]/page.tsx` — ✅ 保留
**理由：** 極複雜的報價單編輯器，~450 行。包含成本計算表格、版本管理、砍次表、Local 報價、同步行程表、匯入餐飲/景點等。絕對需要獨立路由。

### 3. `quotes/quick/[id]/page.tsx` — ✅ 保留
**理由：** 薄包裝頁，載入 `QuickQuoteDetail` 元件。雖然頁面本身只有 ~40 行，但 QuickQuoteDetail 是完整的快速報價編輯器，需要獨立路由。

### 4. `finance/travel-invoice/[id]/page.tsx` — ✅ 保留
**理由：** 發票詳情頁，~250 行。包含基本資訊、買受人、商品明細、發票資訊、作廢功能等多個 Card。雖然是唯讀為主，但資訊量大且有作廢操作流程，Dialog 不適合。

### 5. `tours/[code]/page.tsx` — ✅ 保留
**理由：** 完整的旅遊團詳情頁，包含多 tab（members 等）、工作頻道連結。~120 行但使用 `TourTabContent` 共用元件渲染大量內容。這是核心業務頁面，必須保留。

## 結論
所有 5 個路由都是複雜的編輯器或多功能詳情頁，不適合改為 Dialog。無需修改。
