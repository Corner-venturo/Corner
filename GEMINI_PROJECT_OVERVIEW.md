# Venturo-New 專案分析總覽 (GEMINI PROJECT OVERVIEW)

這份文件由 Gemini 自動產生，旨在提供 `venturo-new` 專案的快速導覽，幫助開發者迅速了解系統架構、技術棧和關鍵部分。

## 專案總覽 (Project Overview)

`venturo-new` 是一個複雜的旅遊管理企業資源規劃 (ERP) 系統。它採用了現代化的 Web 技術棧，核心是 **Next.js 15** 框架和 **Supabase** 後端即服務平台。

此專案在架構上的一大特點是其**離線優先 (Offline-First)** 的設計，資料庫結構中包含了 `_needs_sync` 和 `_deleted` 等欄位，這表明應用程式能夠在沒有網路連線的情況下運作，並在連線恢復後進行資料同步。

## 技術棧 (Technology Stack)

- **框架 (Framework):** [Next.js](https://nextjs.org/) 15 (App Router)
- **後端 & 資料庫 (Backend & Database):** [Supabase](https://supabase.io/)
- **狀態管理 (State Management):** [Zustand](https://zustand-demo.pmnd.rs/)
- **資料請求 (Data Fetching):** [SWR](https://swr.vercel.app/)
- **UI 元件 (UI Components):** [Radix UI](https://www.radix-ui.com/) 與 [shadcn/ui](https://ui.shadcn.com/) 風格的自訂元件庫
- **樣式 (Styling):** [Tailwind CSS](https://tailwindcss.com/)
- **語言 (Language):** TypeScript

## 專案架構亮點 (Architectural Highlights)

1.  **混合式 Supabase 客戶端 (Hybrid Supabase Client):**
    - 系統同時使用了兩種 Supabase 客戶端實例：
        - 一個是現代的、支援伺服器端渲染 (SSR) 的客戶端 (`createBrowserClient`)。
        - 另一個是舊版的單例客戶端 (`createClient`)，主要由 Zustand stores 用於狀態管理，這是一個關鍵的架構決策，需要特別注意。

2.  **Next.js Server Actions:**
    - 專案啟用了 Next.js 15 的 Server Actions，用於處理伺服器端的資料變更和操作，簡化了 API 的撰寫。

3.  **應用程式初始化器 (`AppInitializer`):**
    - 這是應用程式在客戶端的邏輯入口點，位於 `src/app/layout.tsx`。它很可能負責處理用戶認證、狀態初始化 (hydration) 和其他關鍵的啟動任務。

4.  **離線優先設計 (Offline-First Design):**
    - 資料庫 schema 中的 `_needs_sync` 和 `_deleted` 欄位強烈暗示了系統具備離線資料同步能力，這是理解其資料流和狀態管理的核心。

## 關鍵檔案路徑 (Key File Paths)

- **`package.json`**:
  - **路徑:** `/Users/williamchien/Projects/venturo-new/package.json`
  - **描述:** 定義了所有專案依賴、框架和執行腳本 (`dev`, `build`, `db:*`)，是了解專案技術組成的起點。

- **`next.config.ts`**:
  - **路徑:** `/Users/williamchien/Projects/venturo-new/next.config.ts`
  - **描述:** Next.js 的設定檔。顯示 Server Actions 已啟用，並且目前的建置設定會忽略 TypeScript 和 ESLint 錯誤，暗示專案仍在積極開發中。

- **`src/lib/supabase/client.ts`**:
  - **路徑:** `/Users/williamchien/Projects/venturo-new/src/lib/supabase/client.ts`
  - **描述:** 揭示了混合式 Supabase 客戶端策略的關鍵檔案，定義了 SSR 和舊版兩種客戶端。

- **`src/lib/supabase/types.ts`**:
  - **路徑:** `/Users/williamchien/Projects/venturo-new/src/lib/supabase/types.ts`
  - **描述:** 自動產生的資料庫結構 TypeScript 型別定義檔。從表格名稱可確認其 ERP 的性質，並且 `_needs_sync` 等欄位暗示了離線同步功能。

- **`src/app/layout.tsx`**:
  - **路徑:** `/Users/williamchien/Projects/venturo-new/src/app/layout.tsx`
  - **描述:** 應用程式的根佈局，包含了關鍵的 `AppInitializer` 元件，是客戶端邏輯的起點。

## 結論與建議

`venturo-new` 是一個結構精良但複雜的系統。為了更深入地理解，建議下一步可以從以下幾個方面進行探索：

- **`AppInitializer` 元件的實作細節。**
- **Zustand stores 的狀態管理邏輯。**
- **離線資料同步的具體實現機制。**
