# 手冊設計模組審計報告

**審計日期**: 2025-02-02  
**審計範圍**: `src/app/(main)/brochure/` 及相關模組  
**審計者**: Claude (AI Assistant)

---

## 概述

手冊設計模組是一個功能豐富的設計工具，使用 Fabric.js 作為 Canvas 編輯引擎。主要檔案 `page.tsx` 包含約 3,129 行程式碼（120KB），負責整個編輯器的邏輯。

---

## 1. 按鈕功能檢查

### 1.1 選擇團 ✅ 正常

- **位置**: `DesignTypeSelector` 組件
- **實現**: `handleBrochureStart` 回調
- **資料流**:
  - 從 Supabase `tours` 表讀取團資料
  - 支援 `locked_itinerary_id` 關聯行程表
- **問題**: 無明顯問題

### 1.2 選擇範本 ✅ 正常

- **位置**: `TemplateSelector` 組件（已整合到 DesignTypeSelector）
- **實現**: 風格系列選擇 (`styleSeries`)
- **資料流**:
  - 目前有 2 種風格：「日系風格」和「Corner Travel 官方」
  - 每種風格定義完整的頁面模板（封面、目錄、每日行程等）
- **問題**: 無明顯問題

### 1.3 頁面編輯 ✅ 正常

- **位置**: `useBrochureEditorV2` hook
- **實現**: Fabric.js Canvas 操作
- **功能**:
  - 文字編輯（雙向綁定到 templateData）
  - 形狀繪製（矩形、圓形、橢圓、三角形、線條）
  - 圖片插入與遮罩
  - 貼紙和圖標
  - 時間軸元素
  - Undo/Redo（每頁獨立歷史）
- **問題**: 無明顯問題

### 1.4 預覽功能 ✅ 正常

- **位置**: `DualPagePreview` 組件
- **實現**: 雙頁跨頁預覽模式
- **問題**: 無明顯問題

### 1.5 下載 PDF ⚠️ 部分問題

- **位置**: `lib/pdf/brochure-pdf-generator.ts`
- **實現**: jsPDF 向量 PDF 生成
- **發現的問題**:

#### 問題 1: 圖標渲染不完整

```typescript
// brochure-pdf-generator.ts:228-238
function renderIcon(doc: jsPDF, el: IconElement): void {
  // ...
  // 嘗試繪製簡單的佔位符（實際需要解析 path）
  doc.rect(x, y, size, size, 'F') // ❌ 只繪製矩形，圖標內容遺失
}
```

**影響**: PDF 中的圖標會顯示為純色矩形  
**建議**: 實作 SVG Path 解析，或將圖標光柵化後嵌入

#### 問題 2: 貼紙渲染不完整

```typescript
// brochure-pdf-generator.ts:268-277
function renderSticker(doc: jsPDF, el: StickerElement): void {
  // 簡化處理：繪製矩形佔位符
  doc.rect(x, y, width, height, 'F') // ❌ 只繪製矩形
}
```

**影響**: PDF 中的貼紙會顯示為純色矩形  
**建議**: 同上

#### 問題 3: 漸層形狀未處理

```typescript
// brochure-pdf-generator.ts:173-176
if (el.gradient) {
  logger.warn('[PDF] Gradient shapes will be rasterized for now')
  // TODO: 漸層形狀需要光柵化處理
}
```

**影響**: 有漸層的形狀不會正確顯示  
**建議**: 將漸層形狀光柵化為圖片後嵌入 PDF

---

## 2. 頁面流程檢查

### 2.1 `/brochure` 手冊設計主頁 ✅ 正常

- **載入流程**:
  1. 檢查 URL 參數 (`tour_id`, `package_id`, `itinerary_id`)
  2. 如有 entityId，嘗試載入現有存檔
  3. 無存檔則顯示設計類型選擇器
- **問題**: 無明顯問題

### 2.2 範本選擇邏輯 ✅ 正常

- **流程**:
  1. 選擇設計類型（A5/A4 手冊、IG 圖文等）
  2. 手冊類型需選擇團/行程/風格
  3. 生成封面頁進入編輯器
- **問題**: 無明顯問題

### 2.3 頁面編輯器 ⚠️ 程式碼結構問題

- **問題**: `page.tsx` 檔案過大（3,129 行）
- **建議**: 拆分為多個模組：
  - `hooks/useBrochureEditor.ts` - 編輯器核心邏輯
  - `hooks/usePageManagement.ts` - 頁面管理邏輯
  - `hooks/useTemplateData.ts` - 範本資料同步邏輯
  - `components/BrochureEditorToolbar.tsx` - 工具列
  - `components/BrochureEditorSidebar.tsx` - 側邊欄

---

## 3. 資料流檢查

### 3.1 行程資料讀取 ✅ 正常

- **來源**: Supabase `itineraries` 表
- **轉換**: `itineraryToTemplateData()` 函數
- **支援欄位**:
  - 基本資訊（標題、副標題、團號）
  - 日期資訊（出發日、回程日、天數）
  - 航班資訊（去程、回程）
  - 領隊/集合資訊
  - 每日行程（活動、餐食、住宿）

### 3.2 範本渲染 ✅ 正常

- **引擎**: `templates/engine/index.ts`
- **流程**:
  1. 根據 templateId 取得範本定義
  2. 執行 `generateElements()` 生成設計尺寸元素
  3. 縮放到輸出尺寸（300 DPI + 出血）
- **問題**: 無明顯問題

### 3.3 PDF 生成 ⚠️ 見上方 1.5

---

## 4. 邊界情況檢查

### 4.1 空行程處理 ⚠️ 部分處理

```typescript
// templates/engine/index.ts:369-383
const totalDays = calculateTotalDays()
if (totalDays > 0) {
  dailyItineraries = Array.from({ length: totalDays }, (_, index) => { ... })
} else if (dailyItineraryData && dailyItineraryData.length > 0) {
  // 使用現有資料
}
// ❌ 如果都沒有，dailyItineraries 會是空陣列
```

**影響**: 完全沒有行程資料的情況下，手冊會缺少每日行程頁  
**建議**: 加入預設值或提示用戶

### 4.2 長文字處理 ✅ 正常

```typescript
// renderer.ts:239
splitByGrapheme: true, // 中文字元分割
```

- Fabric.js Textbox 有設定 `splitByGrapheme` 支援中文換行
- 但未設定 `maxHeight` 或文字溢出處理

### 4.3 大型行程渲染 ⚠️ 效能風險

- **問題**: 每次 `templateData` 變更都會觸發大量條件檢查
- **位置**: `handleTemplateDataChange` 函數（約 400 行）
- **建議**: 使用 `useMemo` 或 `React.memo` 優化，或改用狀態管理庫

---

## 5. 效能問題

### 5.1 歷史記錄效能 ⚠️

```typescript
// useBrochureEditorV2.ts:166
const json = JSON.stringify(canvas.toJSON())
```

- 每次操作都會序列化整個 Canvas
- 大型設計可能導致記憶體壓力
- **建議**: 考慮增量歷史或使用 Web Worker

### 5.2 頁面切換效能 ⚠️

```typescript
// page.tsx:685-720
const handleSelectPage = useCallback(async (index: number) => {
  // 先保存當前頁面的畫布資料
  const currentCanvasData = exportCanvasData() as Record<string, unknown>
  // ...
})
```

- 每次切換頁面都會完整序列化當前頁面
- **建議**: 只在真正需要時保存（如有變更）

### 5.3 圖片載入 ✅ 正常

- 使用 Promise 預載圖片
- 有 crossOrigin 處理
- 有錯誤處理繪製灰色佔位符

---

## 6. 錯誤處理

### 6.1 PDF 生成錯誤 ⚠️ 用戶體驗不佳

```typescript
// page.tsx:1591-1592
} catch (error) {
  alert('PDF 匯出失敗，請稍後再試')  // ❌ 使用 alert
}
```

**建議**: 使用 Toast 通知或對話框，並顯示具體錯誤

### 6.2 文件載入錯誤 ✅ 正常

```typescript
// page.tsx:2502-2511
if (error) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-morandi-red mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>重新載入</Button>
      </div>
    </div>
  )
}
```

---

## 7. 安全性

### 7.1 XSS 風險 ⚠️ 低風險

- Fabric.js 本身會對文字內容進行轉義
- 但 SVG Path 解析可能存在風險
- **建議**: 確保所有用戶輸入經過清理

### 7.2 CORS 處理 ✅ 正常

```typescript
// renderer.ts:286-289
if (!el.src.startsWith('data:') && !el.src.startsWith('blob:')) {
  htmlImg.crossOrigin = 'anonymous'
}
```

---

## 8. 建議優先級

### 🔴 高優先級

1. **修復 PDF 圖標/貼紙渲染** - 影響用戶直接輸出品質
2. **實作漸層形狀的 PDF 輸出** - 同上

### 🟡 中優先級

3. **拆分 page.tsx** - 提高可維護性
4. **優化 handleTemplateDataChange** - 效能改進
5. **改善 PDF 匯出錯誤提示** - 用戶體驗

### 🟢 低優先級

6. **歷史記錄效能優化** - 長期改進
7. **空行程邊界處理** - 邊緣情況
8. **文字溢出處理** - 邊緣情況

---

## 附錄：檔案結構

```
src/app/(main)/brochure/
├── page.tsx                    # 主頁面（3,129 行）
└── components/                 # 空目錄

src/features/designer/
├── components/
│   ├── core/
│   │   ├── renderer.ts         # Canvas 渲染引擎
│   │   ├── icon-paths.ts       # 圖標 SVG Path
│   │   └── sticker-paths.ts    # 貼紙 SVG Path
│   ├── TemplateSelector.tsx    # 範本選擇器
│   ├── PageListSidebar.tsx     # 頁面列表
│   ├── PropertiesPanel.tsx     # 屬性面板
│   └── ...
├── hooks/
│   ├── useBrochureEditorV2.ts  # 編輯器 Hook
│   └── useMaskEditMode.ts      # 遮罩編輯模式
├── templates/
│   ├── engine/
│   │   └── index.ts            # 範本引擎
│   └── definitions/            # 範本定義
└── utils/
    ├── scaling.ts              # 尺寸縮放工具
    └── page-number.ts          # 頁碼計算

src/lib/pdf/
└── brochure-pdf-generator.ts   # PDF 生成器
```

---

_報告結束_
