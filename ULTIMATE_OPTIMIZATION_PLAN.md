# 終極優化計畫 🚀

> **審查日期**: 2026-02-14
> **審查範圍**: API Routes、TypeScript 型別、效能、資料庫查詢、程式碼風格、安全性、可維護性、無障礙
> **白話文版本**：每個問題都用 William 看得懂的方式說明

---

## 📊 總覽

| 類別 | 問題數 | 嚴重度 | 預估總工時 |
|------|--------|--------|-----------|
| API Route 品質 | 3 | 🟡 中 | 8-12h |
| TypeScript 型別 | 2 | 🟡 中 | 4-6h |
| 效能 | 3 | 🟢 低 | 4-6h |
| 資料庫查詢 | 1 | 🟢 低（已做得好） | 0h |
| 程式碼風格 | 2 | 🟡 中 | 6-8h |
| 安全性 | 2 | 🟠 中高 | 3-4h |
| 可維護性 | 1 | 🟢 低 | 2-3h |
| 無障礙 | 1 | 🟢 低 | 4-6h |

---

## 1. API Route 品質

### 1.1 錯誤回傳格式不一致

**現狀**：52 個 API route 中，約 35 個用了統一的 `ApiError` / `successResponse`，但還有約 18 個直接用 `NextResponse.json({ error: '...' })`，格式不統一。

**白話文**：就像有些員工用公司信紙寫信，有些人隨便拿張紙寫，客戶收到會覺得不專業。前端在處理錯誤時也要寫兩套邏輯。

**目標**：所有 API route 統一使用 `@/lib/api/response` 的 `successResponse` / `ApiError`。

**做法**：逐一把 `auth/`、`logan/`、`settings/` 等未遷移的 route 改用統一格式。

**影響範圍**：`src/app/api/auth/`、`src/app/api/logan/`、`src/app/api/settings/`、其他散落的 route

**預估工時**：3-4 小時

---

### 1.2 重複的驗證邏輯

**現狀**：每個需要登入的 API route 都自己寫一次 auth 驗證（建立 supabase client → 取 user → 檢查是否登入）。沒有統一的 middleware。

**白話文**：就像每個部門入口都要各自安排一個保全，不如大門統一管控。

**目標**：建立 `withAuth` 等 API middleware wrapper，自動處理認證和錯誤。

**做法**：
```typescript
// 現在每個 route 都要寫：
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 改成：
export const POST = withAuth(async (req, { user, supabase }) => {
  // 直接用 user 和 supabase
})
```

**影響範圍**：所有需要認證的 API route（約 40+）

**預估工時**：3-4 小時（建立 middleware + 遷移高優先 route）

---

### 1.3 超大 Route 需要拆分

**現狀**：
- `bot/ticket-status/route.ts` — **693 行**
- `ai/edit-image/route.ts` — **430 行**
- `itineraries/generate/route.ts` — **416 行**
- `cron/sync-logan-knowledge/route.ts` — **328 行**

**白話文**：一個檔案寫太多東西，就像一張 A4 紙塞了三份合約，很難找到重點，改的時候容易改錯。

**目標**：大於 200 行的 route 拆分業務邏輯到 service 層。

**做法**：Route 只負責接收請求和回傳，邏輯搬到 `src/lib/services/` 或對應的 feature service。

**影響範圍**：4-6 個超大 route

**預估工時**：4-6 小時

---

## 2. TypeScript 型別強度

### 2.1 過多的 `as unknown` 型別斷言

**現狀**：有 **20+ 處** 使用 `as unknown as SomeType`，主要集中在：
- `customers/page.tsx`（4 處）
- `todos/page.tsx`（4 處）
- `quotes/[id]/page.tsx`（3 處）
- `design/new/page.tsx`（3 處）

**白話文**：這就像員工跟系統說「我知道這個資料是什麼，你別管了」。大部分時候沒問題，但偶爾會出事，而且出事很難查。

**目標**：消除非必要的 `as unknown`，改用正確的泛型或 type guard。

**做法**：
- `customers/page.tsx` 的 `updateCustomer as unknown as ...` → 修正 hook 的回傳型別定義
- `todos/page.tsx` 的 `columns as unknown as ...` → 修正 `EnhancedTable` 的泛型
- Supabase RPC 的 `as unknown as ConfirmationResult` → 在 typed-client 加回傳型別

**影響範圍**：約 10 個檔案

**預估工時**：3-4 小時

---

### 2.2 寬鬆的 Record 型別

**現狀**：有 20 處使用 `Record<string, unknown>` 或 `Record<string, any>`（1 處），多數在 `types/pnr.types.ts` 和外部資料型別。

**白話文**：就像表格裡有些欄位寫「其他備註（格式不限）」，雖然彈性大，但未來要分析這些資料很困難。

**目標**：對高頻使用的 Record 定義更具體的型別。

**做法**：
- `Record<string, any>`（`members/route.ts:65`）→ 定義 `ChannelMember` 型別
- PNR 的 `raw_fare_data`、`metadata` 等 → 如果結構穩定，定義專用型別

**影響範圍**：`types/pnr.types.ts`、API route

**預估工時**：1-2 小時

---

## 3. 效能分析

### 3.1 大型 Dependencies 檢視

**現狀**：Bundle 包含幾個大型套件：
| 套件 | 說明 | 影響 |
|------|------|------|
| `@univerjs/*`（15 個套件） | 試算表/文件編輯器 | 非常大，但功能必需 |
| `fabric` | Canvas 繪圖 | 大，但設計功能必需 |
| `pdfjs-dist` | PDF 閱讀 | 大，但功能必需 |
| `leaflet` + `react-leaflet` | 地圖 | 中等 |
| `framer-motion` | 動畫 | 中等 |
| `xlsx` | Excel 處理 | 中等 |

**白話文**：目前裝的套件都有用到，沒有明顯的浪費。但 UniverJS 佔了很大比例，如果未來不用可以省很多。

**目標**：確保大型套件都有做 dynamic import（按需載入）。

**做法**：確認 `@univerjs/*`、`fabric`、`pdfjs-dist` 是否用 `next/dynamic` 載入。

**影響範圍**：首頁載入速度

**預估工時**：2 小時（檢查 + 調整）

---

### 3.2 SWR 快取配置

**現狀**：`@/data` 用 SWR 管理資料，但沒看到全域的 `dedupingInterval` 或 `revalidateOnFocus` 設定。

**白話文**：就像每次切換分頁回來都重新載入資料。大部分時候沒問題，但可以設定「5 秒內不重複載入」來減少不必要的請求。

**目標**：設定合理的全域 SWR config。

**做法**：在 SWRConfig 設定 `dedupingInterval: 5000`、`revalidateOnFocus: false`（ERP 系統不太需要 focus revalidate）。

**影響範圍**：全域

**預估工時**：1 小時

---

### 3.3 `as any` 已控制得很好 ✅

**現狀**：全專案僅 **6 處** `as any`，而且全部集中在 `typed-client.ts`（刻意的設計決策）。

**白話文**：這項做得很好！已經把所有「不安全」的型別轉換集中管理。

---

## 4. 資料庫查詢效能 ✅

### 4.1 N+1 查詢 — 未發現 ✅

**現狀**：搜尋後 **沒有發現** 在迴圈中呼叫 supabase 的 pattern。

**白話文**：資料庫查詢寫得很好，沒有「問一百次資料庫才拿到一百筆資料」的低效問題。

### 4.2 select('*') — 未發現 ✅

**現狀**：沒有找到 `select('*')` 的使用。查詢都有指定需要的欄位。

---

## 5. 程式碼風格一致性

### 5.1 檔案命名不一致（hooks）

**現狀**：`src/features/` 下有 **137 個 .ts 檔案** 使用 camelCase 命名（如 `useAccountingReports.ts`、`useDisbursementPDF.ts`），而專案規範要求 snake_case。

**白話文**：就像公司有些文件用中文命名、有些用英文。雖然能用，但看起來不統一。hooks 檔案幾乎全部是 camelCase。

**目標**：統一命名規範。**建議**：hooks 允許 camelCase（因為 React 社群慣例），但在規範文件中明確寫出例外。

**做法**：更新 `CLAUDE.md` / `CODE_STANDARDS.md`，明確寫出：
- `.tsx` 組件檔：camelCase（React 慣例）
- hooks（`use*.ts`）：camelCase（React 慣例）
- 其他 `.ts` 檔：snake_case

**影響範圍**：文件規範

**預估工時**：1 小時

---

### 5.2 混用 default export 和 named export

**現狀**：`src/features/` 下有 **25 個** default export。

**白話文**：有些檔案用「標準出口」，有些用「命名出口」，import 的時候容易搞混名字。

**目標**：統一使用 named export（Next.js page/layout 除外）。

**做法**：逐步把 `export default` 改成 `export const` / `export function`。

**影響範圍**：約 25 個檔案

**預估工時**：2-3 小時

---

## 6. 安全性

### 6.1 dangerouslySetInnerHTML 使用（XSS 風險）

**現狀**：有 **10 處** 使用 `dangerouslySetInnerHTML`，主要在：
- Tour Hero 系列組件（7 處）— 顯示 AI 生成的 HTML
- `SaveVersionDialog` — 顯示快捷鍵提示
- `DisbursementPrintDialog` / `PrintableQuickQuote` — 列印用 `innerHTML`

**白話文**：這個功能允許直接把 HTML 碼放進網頁顯示。如果 HTML 來自不信任的來源（例如使用者輸入），可能被攻擊者利用來偷資料。

**目標**：確保所有 `dangerouslySetInnerHTML` 的內容都經過 `DOMPurify` 消毒。

**做法**：
- Tour Hero 系列：已經叫 `cleanHtml`，需確認是否有經過 `DOMPurify.sanitize()`
- `SaveVersionDialog`：靜態內容，風險低，但建議改用 JSX
- 列印用 `innerHTML`：風險低（內部資料），但建議加註解說明

**影響範圍**：10 個檔案

**預估工時**：2 小時

---

### 6.2 API Key 硬編碼風險

**現狀**：
- `gemini/generate-image/route.ts` 從 `process.env` 讀取多把 API key（這是正確的）
- `settings/env/route.ts` 列出環境變數名稱（用於管理介面）
- `CLAUDE.md` 中有 **Supabase Access Token 明文**（`sbp_94746...`）

**白話文**：API 金鑰在程式碼裡的處理大致正確（從環境變數讀取）。但 `CLAUDE.md` 裡寫了 Supabase token 明文，如果這個檔案被公開（例如放到 GitHub），任何人都能操作你的資料庫。

**目標**：
- 確認 `.claude/` 在 `.gitignore` 中
- 考慮把 token 移到環境變數

**做法**：檢查 `.gitignore`，確保 `.claude/CLAUDE.md` 不會被 push。

**影響範圍**：安全性

**預估工時**：0.5 小時

---

## 7. 可維護性

### 7.1 console.log 使用

**現狀**：全專案有 **15 處** `console.log/error/warn`，但大部分在 `ErrorLogger.tsx`（合理的錯誤日誌元件）。實際違規的很少。

**白話文**：大致做得不錯。`ErrorLogger` 組件本來就是用來攔截錯誤的，用 `console.error` 是正確的。

**目標**：保持現狀，偶爾掃描確保沒有新增的 debug 用 console.log。

**預估工時**：0 小時

---

## 8. Accessibility（無障礙）

### 8.1 表單 / 按鈕 / 圖片

**現狀**：因為是內部 ERP 系統，無障礙需求較低。但如果未來要符合規範：

**白話文**：無障礙就是讓視障人士也能用螢幕閱讀器操作系統。對內部 ERP 來說優先度很低，但如果要做會是大工程。

**目標**：低優先度。先確保新組件有基本的 `aria-label`。

**預估工時**：4-6 小時（如果要做全面改善）

---

## 🏆 總優先序建議

依照「投入少 × 效益高」排序：

| 優先序 | 項目 | 工時 | 為什麼先做 |
|--------|------|------|-----------|
| **P1** | 6.2 確認 `.claude/` 在 gitignore | 0.5h | 安全隱患，一分鐘就能確認 |
| **P2** | 3.2 SWR 全域配置 | 1h | 一行設定，全站效能提升 |
| **P3** | 1.2 API middleware（withAuth） | 3-4h | 減少重複程式碼，未來開發更快 |
| **P4** | 1.1 統一 API 錯誤格式 | 3-4h | 前端錯誤處理更簡單 |
| **P5** | 2.1 消除 `as unknown` | 3-4h | 型別安全，減少潛在 bug |
| **P6** | 6.1 檢查 dangerouslySetInnerHTML | 2h | 安全性，確認已有消毒 |
| **P7** | 1.3 拆分超大 route | 4-6h | 可維護性，但不急 |
| **P8** | 5.1 命名規範文件化 | 1h | 寫清楚規範就好 |
| **P9** | 5.2 統一 export 風格 | 2-3h | 一致性，可慢慢改 |
| **P10** | 3.1 確認大型套件 dynamic import | 2h | 效能優化，不急 |
| **P11** | 8.1 Accessibility | 4-6h | 內部系統，最低優先 |

### 做得好的地方 👏

- ✅ **零 N+1 查詢** — 資料庫查詢效能很好
- ✅ **零 select('*')** — 查詢都有指定欄位
- ✅ **僅 6 處 as any** — 且全部集中管理
- ✅ **已有統一 API response 工具** — 只是還沒全面採用
- ✅ **console.log 控管良好** — 幾乎沒有 debug log 殘留
- ✅ **已用 DOMPurify** — XSS 防護有基礎

---

**總預估工時**：25-40 小時（全部做完的話）
**建議策略**：P1-P4 先做（約 8 小時），立刻能感受到品質提升。其他的排進日常開發中慢慢消化。
