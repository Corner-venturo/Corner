# Venturo-ERP 深度檢查請求

**日期**: 2025-12-20
**請求者**: William
**目的**: 請 Gemini 進行全面的 UI/CSS/功能組件審查，找出潛在問題

---

## 1. 專案現況

### 基本資訊
| 項目 | 數值 |
|------|------|
| 技術棧 | Next.js 15 + React 19 + TypeScript 5 + Zustand 5 + Supabase |
| 原始碼檔案 | 881 個 (.ts/.tsx) |
| TypeScript 錯誤 | ~141 個（目前被 `ignoreBuildErrors: true` 隱藏）|
| `as any` 使用 | 96 處 |

### 已完成的優化（今日）
1. ✅ 建立資料存取層 (DAL) - `src/lib/data/`
2. ✅ 整合 Hooks 使用 DAL
3. ✅ 修復團體報價單列印空白問題

---

## 2. 已發現的問題類型

### 2.1 CSS/列印問題（剛修復一個）
**問題**: 團體報價單列印顯示空白
**原因**: 使用 `style={{ display: 'none' }}` 無法被 CSS `!important` 覆蓋
**修復**: 改用 `className="hidden"`

**需要檢查**: 是否還有其他組件有類似的 inline style 問題？

### 2.2 大型檔案（超過 300 行，難以維護）

| 檔案 | 行數 | 說明 |
|------|------|------|
| `OrderMembersExpandable.tsx` | 3,095 | 嚴重過大 |
| `customers/page.tsx` | 2,266 | 嚴重過大 |
| `itinerary/new/page.tsx` | 1,509 | 過大 |
| `tour-room-manager.tsx` | 1,216 | 過大 |
| `VisasPage.tsx` | 1,136 | 過大 |
| `OrderMemberView.tsx` | 1,100 | 過大 |
| `TourItinerarySectionArt.tsx` | 1,071 | 過大 |
| `itinerary/page.tsx` | 1,065 | 過大 |
| `quotes/[id]/page.tsx` | 953 | 過大 |
| `QuickQuoteDetail.tsx` | 946 | 過大 |
| ... 還有更多 | | |

### 2.3 類型安全問題
- 96 處 `as any` 繞過類型檢查
- 141 個 TypeScript 錯誤被隱藏
- `ignoreBuildErrors: true` 讓錯誤無法在建置時被發現

---

## 3. 請求 Gemini 協助的方向

### 3.1 UI/CSS 一致性審查
請檢查以下目錄的組件：
- `src/features/quotes/components/` - 報價單相關（列印、顯示）
- `src/features/tours/components/` - 旅遊團相關
- `src/components/orders/` - 訂單相關
- `src/components/tours/` - 旅遊團組件

**檢查重點**：
1. 是否有 inline style 與 Tailwind class 混用導致的優先級問題？
2. 列印組件 (`@media print`) 是否一致？
3. 響應式設計是否完整？

### 3.2 功能完整性審查
請針對以下核心功能進行檢查：
1. **報價單系統** (`src/features/quotes/`)
   - 團體報價單 vs 快速報價單
   - 產出、列印、預覽功能

2. **訂單系統** (`src/app/(main)/orders/`, `src/components/orders/`)
   - 訂單成員管理
   - 付款流程

3. **旅遊團系統** (`src/features/tours/`, `src/components/tours/`)
   - 房間分配
   - 行程管理

### 3.3 架構重構建議
針對超大檔案，請建議：
1. 如何拆分這些組件？
2. 哪些邏輯可以抽取成 Hooks？
3. 哪些可以拆成子組件？

---

## 4. 專案結構參考

```
src/
├── app/(main)/           # 頁面路由
│   ├── orders/           # 訂單頁面
│   ├── customers/        # 客戶頁面
│   ├── quotes/           # 報價單頁面
│   ├── tours/            # 旅遊團頁面
│   └── itinerary/        # 行程表頁面
│
├── features/             # 功能模組
│   ├── quotes/           # 報價單功能
│   ├── tours/            # 旅遊團功能
│   └── visas/            # 簽證功能
│
├── components/           # 共用組件
│   ├── ui/               # 基礎 UI 組件
│   ├── orders/           # 訂單組件
│   ├── tours/            # 旅遊團組件
│   └── editor/           # 編輯器組件
│
├── lib/data/             # 資料存取層 (DAL) - 新建
├── hooks/                # 自定義 Hooks
└── stores/               # Zustand 狀態管理
```

---

## 5. 期望產出

請 Gemini 提供：

1. **問題清單**：按優先級列出發現的問題
2. **修復方向**：每個問題的建議修復方式
3. **重構計劃**：大型檔案的拆分建議
4. **執行順序**：建議的修復優先順序

---

## 6. 相關文件

- `ERP_OPTIMIZATION_REPORT.md` - 已完成的優化報告
- `docs/ARCHITECTURE_STANDARDS.md` - 架構規範
- `.claude/CLAUDE.md` - 開發規範

---

*此報告由 Claude Code 協助生成，供 Gemini 進行深度審查使用*
