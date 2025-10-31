# Venturo 專案 UI 設計風格總結

## 概述
Venturo 是一個旅遊團管理系統，採用現代化的莫蘭迪配色系統，融合專業的企業應用設計與優雅的視覺美學。

---

## 1. 主色調和色彩方案

### 🎨 莫蘭迪色系（Morandi Theme - 預設）

**主色調**：柔和、低飽和度的精緻配色
- **主色** (Primary): `#3a3633` - 深褐色（標題、主文字）
- **次要色** (Secondary): `#8b8680` - 灰褐色（次級文字）
- **金色** (Gold): `#c9aa7c` - 莫蘭迪金（強調、互動）
- **綠色** (Green): `#9fa68f` - 柔和綠（成功、正面）
- **紅色** (Red): `#c08374` - 柔和紅（警告、錯誤）
- **容器** (Container): `#e8e5e0` - 淡棕色（背景、對比）
- **淡化** (Muted): `#b8b2aa` - 灰色（禁用、淡化）

**背景色**：
- **頁面背景**: `#f6f4f1` - 米色（溫暖、舒適）
- **卡片背景**: `#ffffff` - 純白（層級感）
- **邊框色**: `#d4c4b0` - 棕色邊框（細膩）

### 🌙 深色主題（Modern Dark - Discord 風格）

**主色調**：Discord 風格的冷色系
- **主文字**: `#dcddde` - 柔和白
- **次要文字**: `#b9bbbe` - 灰白
- **強調色**: `#5865f2` - Discord 紫藍
- **背景**: `#36393f` - 深灰帶藍
- **卡片**: `#2f3136` - 更深灰

---

## 2. 排版風格

### 字體
```css
--font-sans: var(--font-geist-sans)
--font-mono: var(--font-geist-mono)
```

### 字重和大小規範

| 用途 | 大小 | 字重 | 用例 |
|-----|------|------|------|
| 頁面標題 | 18-20px | **Bold (700)** | 頁面主標題（H1） |
| 區塊標題 | 14-16px | **Semi-bold (600)** | 表格標題、section 標題 |
| 正文 | 14px | Normal (400) | 表格內容、列表項 |
| 小文本 | 12-13px | Normal (400) | 輔助資訊、表單標籤 |
| 超小 | 11-12px | Normal (400) | badge、tooltip |

### 行高
- **標題**: `1.3`
- **正文**: `1.5`
- **表格內容**: `1.8`

---

## 3. 組件設計模式

### 3.1 按鈕系列

**主要按鈕** (Primary)
```
背景: 線性漸層 → 莫蘭迪金
顏色: 白色文字
效果: 
  - 正常: 漸層 #b5986a to #d4c4a8，陰影 0 2px 8px
  - Hover: 漸層 #a08968 to #c4b89a，mz4px 12px，scale 1.02
  - Active: scale 0.98，陰影減弱
```

**次要按鈕** (Secondary)
```
背景: 半透明白 rgba(255,255,255,0.8)
顏色: 莫蘭迪金 #c9aa7c
邊框: 1px rgba(228,221,212,0.5)
效果:
  - Hover: 背景加強，邊框變金，scale 1.02
  - Active: scale 0.98
```

**圖標按鈕** (Icon)
```
尺寸: 2.5rem × 2.5rem
背景: 漸層 rgba(212,197,169,0.1) to rgba(201,184,150,0.15)
顏色: 莫蘭迪金
邊框: none，圓角 0.5rem
效果:
  - Hover: 滿漸層背景，白色圖標，scale 1.05，陰影加強
```

### 3.2 卡片設計

**標準卡片** (morandi-card)
```
背景: 白色 #ffffff
邊框: 1px #d4c4b0
圓角: 8px
陰影: 
  - 正常: 0 1px 3px rgba(58,54,51,0.1), 0 1px 2px rgba(58,54,51,0.06)
  - Hover: 0 4px 6px -1px rgba(58,54,51,0.1), 邊框變金
過渡: all 0.2s ease-in-out
```

**精緻卡片** (card-morandi-elevated)
```
背景: 白色
邊框: 1px rgba(230,221,212,0.5)
圓角: 1rem
間距: 1.5rem 內距
陰影:
  - 正常: 0 2px 8px rgba(181,152,106,0.08)
  - Hover: 0 4px 16px rgba(181,152,106,0.12)，translateY(-2px)
```

### 3.3 表單元素

**統一樣式**：
- **高度**: 2.5rem
- **邊框**: 1px rgba(212,196,176,...) → 聚焦時莫蘭迪金
- **圓角**: 0.375rem
- **Placeholder**: rgba(139,134,128,0.4)
- **Focus**: 邊框金色 + 0 0 0 3px rgba(196,165,114,0.1) 陰影

**表格內嵌 Input**：
- 背景: 透明（預設）
- Hover: 白色背景，邊框出現
- 邊框寬度: 減少 (0.25rem)

### 3.4 狀態徽章 (Badge)

```
尺寸: 0.25rem × 0.75rem（高×寬）
圓角: 9999px（完全圓形）
字號: 0.75rem (12px)
字重: 500
背景: rgba(181,152,106,0.1)
文字: 莫蘭迪金 #c9aa7c
邊框: 1px rgba(181,152,106,0.2)
過渡: all 0.2s
```

### 3.5 選單項目 (Menu Item)

```
按鈕樣式:
  - 高度: 2.5rem (40px)
  - 圓角: 0.75rem
  - 間距: gap 0.75rem，padding 0.625rem 1rem
  - 顏色: 灰褐色 #8b8680

正常狀態:
  - 背景: 透明
  - Hover: rgba(181,152,106,0.05)

Active 狀態:
  - 背景: rgba(181,152,106,0.1)
  - 文字: 莫蘭迪金
  - 右邊框: 3px 金色漸層
  - Scale: 1.05
```

---

## 4. 現有的列印和報表組件

### 4.1 ContractPrintDialog

**位置**: `src/components/contracts/ContractPrintDialog.tsx`

**功能**：
- 旅遊合約列印界面
- 自動填入團體、訂單、團員資料
- 可編輯的合約欄位（審閱日期、旅客資訊、集合時地、費用等）
- 自動填入保險金額：`2,500,000`（死亡）、`100,000`（醫療）
- 使用範本替換 + 新視窗列印

**設計特點**：
- 頂部資訊區：淡棕色背景 `bg-morandi-container/20`，圓角
- 各區塊以 section 分組（審閱日期、旅客資訊、集合時地、費用、乙方資訊）
- 標籤樣式：灰褐色小字 `text-morandi-secondary`
- Grid 佈局：日期用 grid-cols-3/5 分列

### 4.2 TemplatePDFPreview

**位置**: `src/components/templates/template-pdf-preview.tsx`

**功能**：
- PDF 範本實時預覽（A4 紙張尺寸）
- 區塊檢測：標題、客戶資訊、表格、備註、總計、行程、Logo
- 智能單元格樣式：標籤判斷、價格判斷、動態變數判斷
- 出血線提示（藍色虛線），安全線提示（紅色虛線）

**設計特點**：
- 紙張尺寸: 21cm × 29.7cm（A4）+ 3mm 出血區域
- 背景：深灰色 `#36393f`，白色 A4 紙張中心
- 各區塊的色彩設計：
  - **標題**: 漸層背景 `from-morandi-primary to-morandi-primary/80`，白色文字
  - **客戶資訊**: 淡棕色背景，左邊 4px 金色邊框
  - **表格標題**: 深褐色背景 `bg-morandi-primary/90`，白色文字，圓角頂
  - **表格行**: 白色背景，hover 淡棕色 `hover:bg-morandi-container/10`
  - **備註**: 淡棕色背景 10%，邊框 30%
  - **總計**: 金色背景 20%，金色邊框（2px）
  - **動態變數**: 金色背景 10%，金色邊框，金色文字

---

## 5. Layout 組件架構

### 5.1 MainLayout

**結構**：
```
<div class="min-h-screen bg-background">
  <Sidebar />  /* 左側邊欄 */
  <main class="fixed bottom-0 right-0">  /* 內容區 */
    {children}
  </main>
</div>
```

**尺寸規範**：
- Header 高度: 72px
- Sidebar 展開: 190px
- Sidebar 折疊: 64px（4rem）
- 主內容區內距: 1.5rem (p-6)

### 5.2 ListPageLayout

**結構**：
```
<div class="h-full flex flex-col">
  <ResponsiveHeader />  /* 標題、搜尋、Tab、新增按鈕 */
  {beforeTable}
  <EnhancedTable />  /* 表格區域 */
  {afterTable}
</div>
```

**特點**：
- 提供統一的列表頁面結構
- 搜尋、過濾、Tab 切換功能
- 支援展開行、排序、行點擊事件
- 邊框預設開啟

### 5.3 ResponsiveHeader

**結構**（Fixed 定位）：
```
左側: [返回按鈕] [標題]
右側: [搜尋框] [Tab] [新增按鈕] [其他操作]
```

**尺寸**：
- 高度: 72px
- 位置: top: 0, right: 0, left: 16px（預留邊欄）
- 底部邊框: 1px #d4c4b0

---

## 6. 表格 (EnhancedTable) 組件

### 6.1 表格單元格組件庫

**位置**: `src/components/table-cells/index.tsx`

提供 8 個可重用的表格單元格組件：

| 組件 | 用途 | 特點 |
|-----|------|------|
| `DateCell` | 日期顯示 | 日曆圖標，支援多種格式（short/long/time） |
| `StatusCell` | 狀態徽章 | 支援 badge/text 變體，動態圖標 |
| `CurrencyCell` | 金額顯示 | 支援 TWD/USD/CNY，income/expense 變體 |
| `DateRangeCell` | 日期區間 | 顯示起迄日期，可計算天數 |
| `ActionCell` | 操作按鈕 | 動作按鈕組，支援 default/danger/success |
| `TextCell` | 文字顯示 | 基礎文字（高度可選） |
| `PercentageCell` | 百分比 | 進度條效果 |
| `ExpandableCell` | 可展開 | 超長文字省略號 + 展開 |

### 6.2 表格欄位設定

```typescript
interface TableColumn {
  key: string
  label: string
  width?: number
  sortable?: boolean
  render?: (value, row) => ReactNode
}
```

---

## 7. 狀態配置系統

### 7.1 統一的狀態管理

**位置**: `src/lib/status-config.ts`

支援 6 種狀態類型：
- `payment` (付款): pending / confirmed / completed / cancelled
- `disbursement` (撥款): pending / processing / completed / rejected
- `todo` (待辦): pending / in_progress / completed / cancelled
- `invoice` (發票): draft / pending / approved / paid / rejected
- `tour` (團體): planning / confirmed / in_progress / completed / cancelled
- `order` (訂單): draft / pending / confirmed / processing / completed / cancelled
- `visa` (簽證): pending / submitted / issued / collected / rejected

**狀態配置結構**：
```typescript
{
  color: string,           // 文字顏色 (CSS class)
  label: string,          // 顯示標籤
  icon?: LucideIcon,      // 圖標
  bgColor?: string,       // 背景色 (CSS class)
  borderColor?: string    // 邊框色 (CSS class)
}
```

**顏色對應**：
- **pending/待處理**: 莫蘭迪金 `text-morandi-gold`
- **confirmed/已確認**: 莫蘭迪綠 `text-morandi-green`
- **completed/已完成**: 深褐色 `text-morandi-primary`
- **cancelled/已取消**: 莫蘭迪紅 `text-morandi-red`
- **draft**: 灰褐色 `text-morandi-secondary`

---

## 8. 色彩應用案例

### 8.1 Quotes 列表頁

```tsx
// 報價單編號：金色
<span className="text-morandi-gold">SG001-V1</span>

// 狀態徽章：動態配色
<span className="text-sm font-medium text-morandi-gold">進行中</span>

// 金額：灰褐色
<span className="text-sm text-morandi-secondary">NT$ 150,000</span>

// 操作按鈕：金色漸層
className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
```

### 8.2 Calendar 頁面

```tsx
// 今天背景：金色 10% 透明
className={isToday ? 'bg-morandi-gold/10' : ''}

// 時間網格背景：淡棕色 20%
className="border-r border-border bg-morandi-container/10"

// 新增事件按鈕：金色漸層
className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
```

### 8.3 Settings 頁面

```tsx
// 容器背景：淡棕色 20%
<div className="bg-morandi-container/20 rounded-lg">

// 刪除按鈕：紅色邊框 + 文字，hover 背景
className="text-morandi-red border-morandi-red hover:bg-morandi-red hover:text-white"

// 金色徽章：右上角
<div className="bg-morandi-gold text-white rounded-full p-1">
```

---

## 9. 視覺特效和互動

### 9.1 過渡動畫

```css
/* 全站過渡 */
transition: all 0.2s ease-in-out;

/* 主題切換 */
transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;

/* 滾動條（僅在需要時顯示） */
scrollbar-width: thin;
-webkit-scrollbar: 6px wide
```

### 9.2 陰影設計

**卡片陰影**：
- 正常: `0 1px 3px 0 rgba(58,54,51,0.1), 0 1px 2px 0 rgba(58,54,51,0.06)`
- Hover: `0 4px 6px -1px rgba(58,54,51,0.1), 0 2px 4px -1px rgba(58,54,51,0.06)`

**按鈕陰影**：
- 正常: `0 2px 8px rgba(181,152,106,0.15)`
- Hover: `0 4px 12px rgba(181,152,106,0.25)`

**工具提示**：
- `0 4px 12px rgba(0,0,0,0.2)`

### 9.3 邊框設計

**分隔線**（梯度）：
```css
background: linear-gradient(
  to right,
  transparent,
  rgba(212,197,169,0.4) 20%,
  rgba(201,184,150,0.5) 50%,
  rgba(212,197,169,0.4) 80%,
  transparent
);
```

**左邊框（Active 菜單）**：
```css
width: 3px;
background: linear-gradient(to bottom, #b5986a, #d4c4a8);
border-radius: 2px 0 0 2px;
```

---

## 10. 深色主題應用

### 10.1 深色主題顏色對應

| 元素 | 莫蘭迪 | 深色主題 |
|-----|--------|---------|
| 主背景 | `#f6f4f1` | `#36393f` |
| 卡片 | `#ffffff` | `#2f3136` |
| 主文字 | `#3a3633` | `#dcddde` |
| 次文字 | `#8b8680` | `#b9bbbe` |
| 強調 | `#c9aa7c` | `#5865f2` |
| 成功 | `#9fa68f` | `#3ba55d` |
| 錯誤 | `#c08374` | `#ed4245` |

### 10.2 深色主題按鈕

**主要按鈕**：
```css
background: linear-gradient(to right, #5865f2, #4752c4);
box-shadow: 0 2px 8px rgba(88,101,242,0.2);

&:hover {
  background: linear-gradient(to right, #4752c4, #3c45a5);
  box-shadow: 0 4px 12px rgba(88,101,242,0.3);
}
```

**次要按鈕**：
```css
background: rgba(47,49,54,0.8);
color: #5865f2;
border-color: rgba(88,101,242,0.3);

&:hover {
  background: rgba(47,49,54,1);
  border-color: #5865f2;
}
```

---

## 11. 設計系統總結

### 11.1 核心價值觀
- **優雅**: 莫蘭迪色系 = 低飽和度 + 高級感
- **可用性**: 充足對比度 + 清晰層級
- **一致性**: 全站統一的元件庫和配色
- **專業**: 企業級管理系統風格
- **人性化**: 柔和過渡 + 細節動效

### 11.2 應用原則

1. **主色調優先**：優先使用莫蘭迪色系
2. **功能色示意**：
   - 金色 = 重點、待處理、輸入態
   - 綠色 = 成功、完成
   - 紅色 = 警告、錯誤、刪除
   - 褐色 = 中立、禁用
3. **層級分明**：
   - 標題 > 副標題 > 正文 > 輔助
   - 色階：primary > secondary > muted
4. **空間感**：
   - 卡片陰影表達升度
   - 邊框和背景色表達分層
5. **互動反饋**：
   - Hover: 色彩加深 + 陰影加強 + scale 1.02
   - Active: scale 0.98 + 陰影減弱
   - Focus: 環形陰影 (ring)

### 11.3 特色組件

| 名稱 | 文件 | 用途 |
|-----|------|------|
| ListPageLayout | `layout/list-page-layout.tsx` | 列表頁統一佈局 |
| ResponsiveHeader | `layout/responsive-header.tsx` | 頁面頭部 |
| EnhancedTable | `ui/enhanced-table.tsx` | 增強表格 |
| StatusCell 系列 | `table-cells/index.tsx` | 表格單元格庫 |
| TemplatePDFPreview | `templates/template-pdf-preview.tsx` | PDF 預覽 |
| ContractPrintDialog | `contracts/ContractPrintDialog.tsx` | 合約列印 |

---

## 12. 建議用於報表和列印設計

基於現有設計系統，報表應遵循：

1. **頁面結構**：
   - 使用 TemplatePDFPreview 作為預覽參考
   - A4 紙張 + 3mm 出血區
   - 頂部公司資訊，底部備註

2. **配色**：
   - 標題：深褐色 + 莫蘭迪金線
   - 表格頭：深褐色背景，白色文字
   - 行背景：白色 + hover 淡棕色
   - 強調內容：莫蘭迪金或綠色

3. **字體**：
   - 標題：16-18px Bold
   - 表格：12-14px Normal
   - 備註：11-12px Normal

4. **元素**：
   - 使用 StatusCell、CurrencyCell 等現有組件
   - 維持統一的徽章樣式
   - 採用梯度分隔線

---

**最後更新**: 2025-10-31
