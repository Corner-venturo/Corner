# 手冊元件規格文件

> 參考設計：0209東京手冊\_v2_A5

## 📐 頁面基礎設定

### A5 尺寸規格

| 項目       | 數值         | 說明       |
| ---------- | ------------ | ---------- |
| 頁面尺寸   | 148 × 210 mm | A5 標準    |
| 出血區     | +3mm 四邊    | 印刷裁切   |
| 含出血尺寸 | 154 × 216 mm | 實際畫布   |
| 安全區邊距 | 10mm         | 內容不超出 |
| 內容區尺寸 | 128 × 190 mm | 元件放置區 |

### 96 DPI 轉換（Canvas 用）

| 項目     | mm  | px (96 DPI) |
| -------- | --- | ----------- |
| 頁面寬   | 148 | 559         |
| 頁面高   | 210 | 794         |
| 含出血寬 | 154 | 582         |
| 含出血高 | 216 | 816         |
| 內容區寬 | 128 | 484         |
| 內容區高 | 190 | 718         |
| 邊距     | 10  | 38          |

---

## 🎨 設計規範

### 色彩

**不硬編碼** — 使用者可自訂：

- 主色（分隔線、強調）
- 文字色
- 背景色
- 標籤色

元件提供 `color` 屬性，使用者自行設定。

### 字體

```typescript
const FONTS = {
  // 主要字體（中文）
  primary: 'Noto Sans TC',

  // 英文字體
  english: 'Montserrat',

  // 字重
  weight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
}
```

### 字級規範

| 用途            | 字級 | 字重    | 顏色     |
| --------------- | ---- | ------- | -------- |
| 大標題（TOKYO） | 48px | Bold    | black    |
| DAY 標題        | 24px | Bold    | black    |
| 景點標題        | 16px | Bold    | black    |
| 景點英文名      | 12px | Medium  | gray     |
| 正文            | 11px | Regular | gray     |
| 標籤文字        | 10px | Medium  | darkGray |
| 頁碼            | 10px | Regular | gray     |

---

## 🧩 元件定義

### 1. 封面標題元件 `CoverTitle`

**用途**：封面頁的標題區塊

**結構**：

```
TRAVEL GUIDE FOR VISITING JAPAN    ← 小字
TOKYO                              ← 大標題（目的地）
                     日本東京行程手冊    ← 中文副標
                     FEB 09 ▸ FEB 13    ← 日期範圍
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| destination | string | 目的地英文（TOKYO） |
| country | string | 國家英文（JAPAN） |
| titleZh | string | 中文標題 |
| dateStart | string | 開始日期 |
| dateEnd | string | 結束日期 |

**高度**：固定 80px

---

### 2. DAY 標題元件 `DayHeader`

**用途**：每日行程開頭

**結構**：

```
DAY 1 | 桃園國際機場 / 成田國際機場 / 飯店休憩
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| dayNumber | number | 第幾天 |
| attractions | string[] | 景點列表 |
| note | string? | 備註（推薦：xxx） |

**高度**：固定 32px

---

### 3. 餐食住宿元件 `MealAccommodation`

**用途**：顯示三餐和住宿

**結構**：

```
[早餐] 飯店用餐    [午餐] 山麓園 爐端燒    [晚餐] 人形町今半 壽喜燒
[住宿] 海茵娜飯店尊貴東京淺草田原町
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| breakfast | string | 早餐內容 |
| lunch | string | 午餐內容 |
| dinner | string | 晚餐內容 |
| hotel | string | 住宿飯店 |

**高度**：固定 56px（兩行）

**樣式**：

- 標籤：灰色方框（#f5f5f5），圓角 2px
- 標籤文字：10px Medium
- 內容文字：11px Regular

---

### 4. 金色分隔線 `GoldDivider`

**用途**：區隔區塊

**結構**：

```
────────────────────────────────
```

**參數**：無

**高度**：固定 16px（含上下間距）

**樣式**：

- 線條顏色：#c9aa7c
- 線條粗細：1px
- 寬度：100%

---

### 5. 景點介紹元件 `AttractionBlock`

**用途**：景點標題 + 描述 + 圖片

**結構**：

```
東京 TOKYO                         ← 標題（中英）
作為日本的政治、經濟與文化中心...   ← 描述文字
[────────── 全寬圖片 ──────────]    ← 圖片
更多描述文字...                     ← 可選續文
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| nameZh | string | 中文名稱 |
| nameEn | string | 英文名稱 |
| description | string | 描述文字 |
| image | string? | 圖片 URL |
| imagePosition | 'after-title' \| 'after-desc' | 圖片位置 |
| continuedText | string? | 圖片後續文字 |

**高度**：動態（根據內容）

**計算**：

- 標題：24px
- 描述：行數 × 18px（行高 1.6）
- 圖片：寬高比保持，寬度 100%
- 續文：行數 × 18px

---

### 6. 文繞圖元件 `TextWithImage`

**用途**：文字在左，圖片在右

**結構**：

```
┌─────────────────┬────────┐
│ [1] 世界市集     │        │
│                 │ [圖片] │
│ 在電燈取代煤氣燈 │        │
│ ...描述文字...   │        │
└─────────────────┴────────┘
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| number | number? | 編號（可選） |
| title | string | 標題 |
| description | string | 描述文字 |
| image | string | 圖片 URL |
| imageWidth | number | 圖片寬度比例（預設 40%） |

**高度**：動態（取文字和圖片較高者）

---

### 7. 全寬圖片元件 `FullWidthImage`

**用途**：單獨的全寬圖片

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| src | string | 圖片 URL |
| aspectRatio | number | 寬高比（預設 16:9） |
| caption | string? | 圖片說明 |

**高度**：根據寬高比計算

---

### 8. 航班資訊元件 `FlightInfo`

**用途**：顯示航班資訊

**結構**：

```
航班資訊 FLIGHT
酷航 TR-874 | 桃園國際機場T1 14:00 / 成田國際機場T1 18:00
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| title | string | 標題（航班資訊：長榮航空） |
| flights | Flight[] | 航班列表 |

```typescript
interface Flight {
  airline: string // 航空公司
  flightNo: string // 航班號
  departure: string // 出發機場
  departureTime: string
  arrival: string // 抵達機場
  arrivalTime: string
}
```

**高度**：32px + (航班數 × 20px)

---

### 9. 行李規定表格 `LuggageTable`

**用途**：行李限制說明

**結構**：

```
┌─────────┬─────────┬─────────────────────┐
│ 航空公司 │         │ 長榮航空 / 酷航      │
├─────────┼─────────┼─────────────────────┤
│ 手提行李 │ 重量限制 │ 不得超過7公斤        │
│         │ 尺寸限制 │ 54×38×23（公分）     │
├─────────┼─────────┼─────────────────────┤
│ 託運行李 │ 重量限制 │ 20公斤×1件          │
│         │ 尺寸限制 │ 長寬高總和不得超過158 │
└─────────┴─────────┴─────────────────────┘
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| airlines | string | 航空公司名稱 |
| carryOn | { weight: string, size: string } | 手提行李 |
| checked | { weight: string, size: string } | 託運行李 |

**高度**：固定 120px

---

### 10. 聯絡資訊元件 `ContactInfo`

**用途**：領隊/送機人員資訊

**結構**：

```
聯絡資訊 CONTACTS
隨團人員 | 簡瑋廷 +886 925 929 203
送機人員 | 張文嘉 +886 970 822 056
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| contacts | Contact[] | 聯絡人列表 |

```typescript
interface Contact {
  role: string // 角色
  name: string // 姓名
  phone: string // 電話
}
```

**高度**：32px + (聯絡人數 × 20px)

---

### 11. QR Code 元件 `QRCodeBlock`

**用途**：App 下載或 LINE 等

**結構**：

```
下載東京迪士尼度假區官方 App！
官方 App 僅提供英文版、日文版。
[QR Code 圖片] [Logo]
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| title | string | 標題說明 |
| subtitle | string? | 副標題 |
| qrCodeUrl | string | QR Code 圖片 |
| logoUrl | string? | Logo 圖片 |

**高度**：固定 80px

---

### 12. 行程索引元件 `ItineraryIndex`

**用途**：目錄頁的行程列表

**結構**：

```
第一天行程 DAY 1  [P03]
桃園國際機場 / 成田國際機場 / 飯店休憩
[早餐] 敬請自理  [午餐] 敬請自理  [晚餐] 敬請自理
[住宿] 海茵娜飯店尊貴東京淺草田原町
◎ 酷航集合時間：12:00 桃園機場第一航廈酷航櫃台集合
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| dayNumber | number | 第幾天 |
| pageNumber | number | 頁碼 |
| attractions | string[] | 景點列表 |
| meals | { breakfast, lunch, dinner } | 餐食 |
| hotel | string | 住宿 |
| notes | string[] | 備註（集合時間等） |

**高度**：動態（約 100-140px）

---

### 13. 頁碼元件 `PageNumber`

**用途**：頁面編號

**結構**：

```
03
```

**參數**：
| 參數 | 類型 | 說明 |
|------|------|------|
| number | number | 頁碼數字 |
| position | 'left' \| 'right' | 位置（左下/右下） |

**位置**：固定在安全區底部
**高度**：20px

---

## 📋 元件使用範例

### 封面頁

```
1. FullWidthImage（大封面圖，佔 70% 高度）
2. CoverTitle（標題區塊）
```

### 目錄頁（左）

```
1. CoverTitle（簡化版，只有標題）
2. GoldDivider
3. ItineraryIndex × N（每天一個）
4. GoldDivider
5. ContactInfo
6. PageNumber
```

### 目錄頁（右）

```
1. 頁面標題（TOKYO × JAPAN）
2. GoldDivider
3. ItineraryIndex × N（剩餘天數）
4. LuggageTable
5. FlightInfo
6. PageNumber
```

### 行程頁

```
1. DayHeader
2. MealAccommodation
3. GoldDivider
4. AttractionBlock × N
5. PageNumber
```

---

## 🔄 排版引擎邏輯

### 1. 頁面初始化

```typescript
const page = {
  width: 484, // 內容區寬度
  height: 718, // 內容區高度
  currentY: 0, // 當前 Y 位置
  elements: [], // 元件列表
}
```

### 2. 新增元件

```typescript
function addComponent(component) {
  const height = component.calculateHeight()

  // 檢查是否超出
  if (page.currentY + height > page.height) {
    // 需要換頁
    return { needNewPage: true, component }
  }

  // 放置元件
  component.y = page.currentY
  page.elements.push(component)
  page.currentY += height + component.marginBottom

  return { needNewPage: false }
}
```

### 3. 自動分頁

```typescript
function autoPageBreak(components) {
  const pages = []
  let currentPage = createNewPage()

  for (const comp of components) {
    const result = currentPage.addComponent(comp)

    if (result.needNewPage) {
      pages.push(currentPage)
      currentPage = createNewPage()
      currentPage.addComponent(comp)
    }
  }

  pages.push(currentPage)
  return pages
}
```

---

## 📁 檔案結構

```
src/features/designer/
├── components/
│   ├── brochure/
│   │   ├── BrochurePage.tsx        # 頁面容器
│   │   ├── ComponentLibrary.tsx    # 元件庫面板
│   │   └── components/             # 元件實作
│   │       ├── CoverTitle.tsx
│   │       ├── DayHeader.tsx
│   │       ├── MealAccommodation.tsx
│   │       ├── GoldDivider.tsx
│   │       ├── AttractionBlock.tsx
│   │       ├── TextWithImage.tsx
│   │       ├── FullWidthImage.tsx
│   │       ├── FlightInfo.tsx
│   │       ├── LuggageTable.tsx
│   │       ├── ContactInfo.tsx
│   │       ├── QRCodeBlock.tsx
│   │       ├── ItineraryIndex.tsx
│   │       └── PageNumber.tsx
├── engine/
│   └── brochure-layout.ts          # 排版引擎
└── types/
    └── brochure.types.ts           # 類型定義
```

---

_文件版本：v1.0_
_建立日期：2026-02-02_
_參考設計：0209東京手冊\_v2_A5.pdf_
