# 最終掃描報告

> 掃描時間：2026-02-14 21:54  
> 只列出「真的還能改的東西」，按影響程度排序

---

## 🔴 高影響

### 1. Git 追蹤了大量不該追蹤的檔案（~72MB+）

| 檔案/目錄                               | 大小   | 說明                                                                       |
| --------------------------------------- | ------ | -------------------------------------------------------------------------- |
| `public/city-backgrounds-all/`          | 34 MB  | 程式碼沒有引用這個目錄（code 引用的是 Supabase bucket `city-backgrounds`） |
| `public/city-backgrounds-2/`            | 32 MB  | 同上，沒有被引用                                                           |
| `public/city-backgrounds/`              | 5 MB   | 同上，圖片是透過 Supabase storage 拉的                                     |
| `public/assets/fonts/NotoSansTC-*.ttf`  | 32 MB  | 有用到（PDF），但建議用 Git LFS                                            |
| `public/assets/fonts/ChironHeiHK-*.ttf` | 29 MB  | 有用到（PDF），但建議用 Git LFS                                            |
| `Claude.pdf`                            | 1.3 MB | 不該在 repo 裡                                                             |
| `lint-report.json`                      | 504 KB | 產出物，不該追蹤                                                           |
| `playwright-report/index.html`          | 522 KB | 產出物，不該追蹤                                                           |

**建議：**

- 把三個 `city-backgrounds*` 目錄從 git 移除（加到 `.gitignore`）
- `Claude.pdf`、`lint-report.json`、`playwright-report/` 加到 `.gitignore`
- 字體檔考慮用 Git LFS 或移到 CDN

### 2. 零測試覆蓋

整個專案沒有任何測試檔（`.test.*`、`.spec.*`、`__tests__`）。

**建議：** 至少為核心邏輯加單元測試：

- `src/lib/utils/format-currency.ts`
- `src/lib/utils/format-date.ts`
- `src/lib/utils/receipt-number-generator.ts`
- PDF 產生相關邏輯

### 3. 1395 個 inline style（`style={{}}`）

大量使用 inline style 而非 Tailwind class，影響效能和一致性。

**建議：** 逐步將高頻元件的 inline style 改為 Tailwind class。不需一次全改，先從共用元件開始。

---

## 🟡 中影響

### 4. 未使用的 dependency

- `html2canvas` — 程式碼中完全沒有 import

**建議：** `npm uninstall html2canvas`

### 5. public/ 有 19 個 debug/工具用 HTML 檔案

```
check-airport-codes.html, check-channel-members.html, check-employees.html,
clean-data.html, cleanup-duplicate-channels.html, clear-all-cache.html,
clear-cache.html, clear-indexeddb.html, clear-workspace.html, clear.html,
debug-employee-dropdown.html, debug-todos.html, diagnose-user.html,
enable-realtime.html, fix-ghost-channels.html, quick-fix.html,
run-migration.html, schema-checker.html, test-realtime.html
```

這些是 debug 工具，不該部署到 production。

**建議：** 移到 `tools/` 或 `scripts/` 目錄，從 `public/` 移除。

### 6. `fitness-manifest.json` 在 public/ 裡

看起來是 PWA manifest，但只給 fitness 模組用。確認是否還需要。

### 7. Dynamic import 使用數：0

整個專案沒有用 `next/dynamic` 做 lazy loading。以下大型依賴建議 dynamic import：

- `@univerjs/*`（整個 spreadsheet engine）
- `fabric`（Canvas 編輯器）
- `leaflet` / `react-leaflet`（地圖）
- `@fullcalendar/*`（日曆）
- `@tiptap/*`（富文字編輯器）
- `react-best-gradient-color-picker`

**建議：** 對這些重量級元件用 `dynamic(() => import(...), { ssr: false })` 包裝。

### 8. 環境變數不一致

**在 code 裡引用但 `.env.local` 沒定義的：**

- `BOT_API_SECRET`, `CRON_SECRET`, `GOOGLE_VISION_API_KEY`
- `NEXT_PUBLIC_FASTMOVE_API_KEY`, `NEXT_PUBLIC_FASTMOVE_API_URL`
- `NEXT_PUBLIC_LOG_LEVEL`, `NEXT_PUBLIC_ONLINE_URL`
- `NEXT_PUBLIC_QUICK_LOGIN_SECRET`, `NEXT_PUBLIC_RAPIDAPI_KEY`
- `NEXT_PUBLIC_REMOTE_LOGGING`
- `OLLAMA_MODEL`, `OLLAMA_URL`, `QUOTAGUARD_STATIC_URL`
- `GEMINI_API_KEY_`（注意結尾多了底線，可能是 typo）

**在 `.env.local` 定義但 code 沒用到的：**

- `NEXT_PUBLIC_DEV_MODE`
- `NEXT_PUBLIC_ENABLE_DEVTOOLS`
- `NEXT_PUBLIC_SKIP_AUTH`

**建議：** 清理不用的、補上遺漏的、修正 `GEMINI_API_KEY_` typo。

---

## 🟢 低影響

### 9. Accessibility：1 個 img 缺少 alt

- `src/features/attractions/components/AttractionsMap.tsx:218` — 地圖 popup 裡的 `<img>` 沒有 `alt` 屬性

### 10. 不需要的 `'use client'`

專案有大量 `'use client'` 檔案（光 `src/app/` 就有 32 個以上的 `use client` 標示的 page/layout）。部分 error boundary 和簡單 page 可能不需要。值得逐一檢視。

### 11. CSS 檔案檢查

3 個 CSS 檔案，都有在用：

- `src/app/globals.css` ✅
- `src/features/itinerary/components/PrintItineraryPreview.module.css` ✅
- `src/components/documents/itinerary-document.css` ✅

### 12. Google Fonts 在 CSS 中 @import

`globals.css` 用 `@import url(...)` 載入 7 種 Google Fonts（Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Quicksand）。這會阻塞渲染。

**建議：** 改用 `next/font` 或 `<link rel="preload">`。

---

## ✅ 已經做好的（不需動作）

- README.md 內容完整且是最新的
- docs/ 有完整的文件結構
- Tailwind config 正常
- `@vercel/analytics` 和 `@vercel/speed-insights` 有在 `layout.tsx` 使用
- 所有字體檔都有被引用
- `src/constants/labels.ts` 有被廣泛引用

---

_報告結束_
