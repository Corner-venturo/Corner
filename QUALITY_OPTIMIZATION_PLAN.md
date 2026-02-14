# Venturo ERP 品質優化全面評估報告

> **評估日期**: 2026-02-14
> **評估範圍**: 邏輯與抽象層（資料存取、錯誤處理、重複邏輯、Hook/元件/API 職責）
> **問題按影響程度排序**（高 → 低）

---

## 📊 總覽

| 類別 | 問題數 | 影響檔案數 | 風險等級 |
|------|--------|-----------|---------|
| 資料存取層不一致 | 24+ 處違規 | ~20 檔案 | 🔴 高 |
| 錯誤處理缺口 | ~250 個 async 沒有 try-catch | ~40 檔案 | 🔴 高 |
| 超大元件/Hook | 20+ 個超標 | ~25 檔案 | 🟡 中 |
| 重複邏輯 | 3 大類重複 | ~15 檔案 | 🟡 中 |
| API Route 過胖 | 5+ 支超標 | ~8 檔案 | 🟡 中 |
| 狀態管理混亂 | 雙軌並行 | 全系統 | 🟠 中高 |

---

## 🔴 問題 1：資料存取層不一致（影響最大）

### 白話文解釋
> 想像你開了一間餐廳，規定所有食材必須從中央廚房領取（service 層）。但現在有些廚師偷偷自己去市場買菜（直接用 supabase.from()），買回來的品質沒人把關，出了食安問題也追查不到。

### 現在怎樣
系統已經建立了 `createEntityHook`（在 `src/data/`）和 `createStore`（在 `src/stores/core/`）作為資料存取的標準方式，但仍有 **24 處** 在 hooks、components、lib 裡直接呼叫 `supabase.from()`：

**違規熱區**：
| 位置 | 違規次數 | 說明 |
|------|---------|------|
| `features/tours/hooks/` | 8 處 | useTours-advanced、useToursForm、useToursPaginated、useTourOperations |
| `features/orders/components/` | 2 處 | OrderMembersExpandable 直接 update |
| `features/dashboard/hooks/` | 3 處 | use-notes、use-widgets |
| `features/members/hooks/` | 1 處 | usePassportUpload |
| `hooks/useMemberActions.ts` | 1 處 | 直接 insert |
| `hooks/createCloudHook.ts` | 4 處 | 這是另一套資料存取抽象，跟 createEntityHook 重疊！|
| `lib/pnr/reference-data.ts` | 5 處 | 直接查參考資料表 |
| `app/(main)/database/` | 5 處 | archive-management 頁面 |

**特別注意**：有些 feature 已經有 service 目錄但沒在用：
- `features/tours/services/tour.service.ts` 存在，但 hooks 裡還是直接查 DB
- `features/orders/services/order.service.ts` 存在，但元件裡直接操作 order_members

**雙軌系統問題**：`createStore`（舊）和 `createEntityHook`（新）兩套並存，createStore 的註解已寫「向後相容用途，新功能請使用 cloud-hooks」，但遷移未完成。

### 應該怎樣
- 所有資料存取走 `src/data/` 的 `createEntityHook` 或 `src/features/*/services/`
- Hooks 和 Components **絕對不直接** 呼叫 `supabase.from()`
- 淘汰 `createCloudHook.ts`，統一到 `createEntityHook`

### 怎麼改
1. **Phase 1**（1-2 天）：把 `lib/pnr/reference-data.ts` 的查詢抽成 `data/entities/ref-*.ts`
2. **Phase 2**（2-3 天）：把 tours hooks 裡的直接查詢搬到 `tours/services/tour.service.ts`
3. **Phase 3**（1-2 天）：處理 orders、members、dashboard 的違規
4. **Phase 4**（1 天）：廢棄 `createCloudHook.ts`，遷移到 `createEntityHook`
5. **Phase 5**（1 天）：加 ESLint rule 禁止在非 data/services 裡直接用 `supabase.from`

### 影響範圍
~20 個檔案需要修改

### 風險
🟡 中等 — 每次搬移都是純粹的重構，功能不變。但要確保 workspace 隔離邏輯沒掉。建議逐個 feature 搬，搬完測一輪。

---

## 🔴 問題 2：錯誤處理有大洞（使用者體驗風險最大）

### 白話文解釋
> 想像你的店員在結帳時如果刷卡機壞了，他不是告訴客人「刷卡機故障請稍等」，而是直接愣住不說話，客人只看到畫面卡住。這就是 async 操作沒有 try-catch 的效果。

### 現在怎樣
- `src/features/` 裡有 **762 個 async 函數**，但只有 **516 個 try-catch**（覆蓋率 ~68%）
- 在 tours hooks 裡，60 個 async 只有 34 個 catch（覆蓋率 ~57%）
- **useEffect 裡的 async** 特別危險 — 找到多處 useEffect 裡呼叫 async 函數但沒有 catch
- 部分 API route（如 `itineraries/generate`、`proposals/convert-to-tour`）的錯誤回傳格式不一致，有些甚至沒有統一的 error response

**使用者會看到什麼？**
- 按鈕點了沒反應（async 失敗但沒通知）
- 頁面白屏（useEffect 裡的 async 拋出未捕獲例外）
- 資料消失（刪除操作部分成功部分失敗）

### 應該怎樣
- 所有 async 操作都要有 try-catch
- 失敗時用 toast 通知使用者
- useEffect 裡的 async 用 `.catch()` 收尾
- API route 有統一的錯誤回傳格式

### 怎麼改
1. **Phase 1**（1 天）：建立統一的 async wrapper 工具：
   ```typescript
   // lib/utils/safe-async.ts
   export async function safeAsync<T>(fn: () => Promise<T>, errorMsg?: string): Promise<T | null> {
     try { return await fn() }
     catch (e) { logger.error(e); toast.error(errorMsg || '操作失敗'); return null }
   }
   ```
2. **Phase 2**（2 天）：掃描所有 useEffect 裡的 async，加上 catch
3. **Phase 3**（2 天）：掃描所有 event handler 裡的 async，加上 catch
4. **Phase 4**（1 天）：API route 建立統一的 error response helper

### 影響範圍
~40 個檔案

### 風險
🟢 低 — 加 try-catch 是純添加，不改變正常流程。唯一風險是 catch 裡如果用 toast 但某些地方沒有 toast context。

---

## 🟠 問題 3：狀態管理雙軌並行（架構債最重）

### 白話文解釋
> 你的公司有兩套庫存系統在同時運作：一套舊的 Excel（createStore），一套新的 ERP（createEntityHook/SWR）。有些部門用舊的，有些用新的，同一筆貨有時候兩邊數字不一樣。

### 現在怎樣
- **舊系統**：`src/stores/` 用 `createStore` 工廠（Zustand），包含 ~15 個 store
- **新系統**：`src/data/` 用 `createEntityHook`（SWR + Supabase）
- **中間產物**：`src/hooks/createCloudHook.ts` — 又一套抽象
- 同一份資料可能在 store 裡 fetch 一次、在 SWR hook 裡又 fetch 一次
- Store 之間有隱含依賴（如 tour-request-store 可能依賴 tour 資料）

### 應該怎樣
- 統一使用 `createEntityHook`（SWR）作為資料存取層
- Zustand 只用於純 UI 狀態（theme、sidebar 開關等）
- 廢棄 `createStore` 和 `createCloudHook`

### 怎麼改
1. 盤點所有 store，分類為「資料 store」和「UI store」
2. 「資料 store」逐步遷移到 `src/data/entities/`
3. 確保遷移後沒有重複 fetch
4. 最後刪除 `createStore`

### 影響範圍
全系統，~15 個 store + 所有使用它們的元件

### 風險
🔴 高 — 這是最大的重構，牽涉面廣。建議一次遷移一個 store，搭配充分測試。

---

## 🟡 問題 4：超大 Hook 職責不清（維護性問題）

### 白話文解釋
> 你有一個員工，他同時負責接電話、煮咖啡、修電腦、處理客訴。他很忙、很累、出錯率也很高。把工作拆給不同人做會更有效率。

### 現在怎樣
有 **14 個 Hook 超過 400 行**，最大的達 854 行：

| Hook | 行數 | 問題 |
|------|------|------|
| `usePackageItinerary` | 854 | 行程編輯 + 拖拽 + 資料轉換全混在一起 |
| `useRoomVehicleAssignments` | 770 | 房間分配 + 車輛分配 + 直接操作 DB |
| `usePayroll` | 689 | 薪資計算 + 出勤統計 + 匯出 |
| `useAccountingReports` | 682 | 多種報表邏輯全塞一個 hook |
| `usePassportUpload` | 632 | OCR + 驗證 + 上傳 + 客戶比對（且有兩份！）|
| `useTourEdit` | 616 | 表單管理 + 驗證 + 儲存 + 副作用 |

**特別嚴重**：`usePassportUpload` 在 `src/app/(main)/customers/hooks/` 和 `src/features/members/hooks/` 各有一份（632 行 vs 409 行），明顯重複！

### 應該怎樣
- 每個 hook < 300 行
- 拆分原則：資料取得 / 業務邏輯 / UI 互動 分開
- 重複的 hook 合併為一個

### 怎麼改
1. 合併兩份 `usePassportUpload`（優先！）
2. 拆 `usePackageItinerary` → `usePackageItineraryData` + `usePackageItineraryDragDrop` + `usePackageItineraryTransform`
3. 拆 `useRoomVehicleAssignments` → `useRoomAssignments` + `useVehicleAssignments`
4. 拆 `useAccountingReports` → 每種報表一個 hook

### 影響範圍
~14 個 hook 檔案 + 使用它們的元件

### 風險
🟡 中等 — 拆 hook 不改功能，但要確保拆完後 state 共享正確。

---

## 🟡 問題 5：超大元件需要拆分

### 白話文解釋
> 你寫了一份 1000 頁的合約，裡面混了條款、附件、計算公式。要找某一條很難，要改某個計算也怕弄壞別的地方。拆成獨立章節會好管理很多。

### 現在怎樣
有 **15+ 個元件超過 700 行**，最大的達 1012 行：

| 元件 | 行數 | 問題 |
|------|------|------|
| `ItineraryDialog` | 1012 | 巨型 Dialog，混合資料處理和 UI |
| `design/new/page.tsx` | 996 | 頁面級元件做了太多事 |
| `OrderMembersExpandable` | 930 | 列表 + 展開 + 編輯 + 直接操作 DB |
| `PnrMatchDialog` | 889 | PNR 匹配的整個流程 |
| `AddRequestDialog` | 848 | 表單 + 驗證 + 提交 |
| `itinerary/page.tsx` | 842 | 行程頁面 |
| `TourPnrToolDialog` | 833 | PNR 工具 |

### 應該怎樣
- 元件 < 500 行
- Container（資料 + 邏輯）和 Presentational（純 UI）分離
- Dialog 的表單邏輯抽到 hook

### 怎麼改
按大小排序逐一重構：
1. `ItineraryDialog` → hook(`useItineraryDialog`) + 子元件
2. `OrderMembersExpandable` → 拆出 `MemberRow`、`MemberBulkActions`
3. 其餘依序處理

### 影響範圍
~15 個元件檔案

### 風險
🟡 中等 — 拆元件是安全的重構，但要注意 props drilling 和 state lifting。

---

## 🟡 問題 6：重複邏輯散落各處

### 白話文解釋
> 你的公司有五個部門，每個部門各自發明了一套計算匯率的方式。有天匯率規則改了，你得跑五個部門去改，還怕漏改某個。

### 現在怎樣

**6a. 日期格式化** — 找到 332 處日期相關操作，大多用了統一的 util，但 `app/confirm/[token]/page.tsx` 裡自己寫了 `formatCurrency`。

**6b. 金額格式化** — `formatCurrency` 有集中的 `lib/utils/format-currency.ts`，但 `app/confirm/[token]/page.tsx` 又自己寫了一份（第 120 行），沒用共用的。

**6c. 刪除前的關聯檢查** — `archive-management/page.tsx` 和 `useTourOperations.ts` 有幾乎一模一樣的邏輯：查 order_members count、receipt_orders count、payment_requests count、pnrs count。應該抽成共用函數。

**6d. Passport Upload** — 前面提過，兩份獨立實作。

### 應該怎樣
- 工具函數集中在 `lib/utils/`
- 業務邏輯重複的抽成 shared hook 或 service

### 怎麼改
1. 刪除 `confirm/[token]/page.tsx` 裡的自製 `formatCurrency`，改用 `lib/utils/format-currency`
2. 把「刪除前關聯檢查」抽成 `lib/utils/check-tour-dependencies.ts`
3. 合併兩份 `usePassportUpload`

### 影響範圍
~15 個檔案

### 風險
🟢 低 — 抽取共用函數風險很低。

---

## 🟡 問題 7：API Route 過胖且格式不一

### 白話文解釋
> 你的客服部門有些人用制式回覆模板，有些人隨便回。客人的體驗不一致，出問題也很難追蹤。

### 現在怎樣
- `bot/ticket-status/route.ts` 有 **693 行**，做了太多事
- `ai/edit-image/route.ts` 有 **430 行**
- `itineraries/generate/route.ts` 有 **416 行**
- 錯誤回傳不一致：有些用 `NextResponse.json({ error: ... }, { status: 500 })`，有些直接 throw
- 沒有統一的驗證 middleware（每個 route 各自檢查 auth）

### 應該怎樣
- 每個 route < 200 行
- 建立統一的 API error response helper
- 建立統一的 auth middleware
- 複雜邏輯抽到 service 層

### 怎麼改
1. 建立 `lib/api/response.ts`：統一 success/error 回傳格式
2. 建立 `lib/api/middleware.ts`：統一 auth 檢查
3. `bot/ticket-status` 的核心邏輯搬到 service
4. 其他過胖 route 同理

### 影響範圍
~8 個 API route 檔案

### 風險
🟡 中等 — 改 API 回傳格式要注意前端是否有依賴特定格式。

---

## 📋 執行優先順序建議

| 順序 | 項目 | 預估時間 | 原因 |
|------|------|---------|------|
| 1 | 錯誤處理（建立 safe-async + 掃描 useEffect） | 3 天 | 直接影響使用者體驗，修復風險最低 |
| 2 | 合併重複的 usePassportUpload | 1 天 | 明確的重複，修起來快 |
| 3 | 重複邏輯抽取（formatCurrency、tour 依賴檢查） | 1 天 | 簡單、風險低 |
| 4 | 資料存取層統一（逐 feature 搬移） | 5-7 天 | 架構性改善，但範圍大需分批 |
| 5 | 超大 Hook 拆分 | 3-5 天 | 維護性改善 |
| 6 | 超大元件拆分 | 3-5 天 | 維護性改善 |
| 7 | API Route 瘦身 | 2-3 天 | 影響範圍小，可以慢慢做 |
| 8 | 狀態管理統一（store → SWR） | 持續 | 最大的重構，建議穿插在其他工作中漸進式遷移 |

**總預估**：約 3-4 週（假設穿插在日常開發中）

---

## 📌 快速勝利（Quick Wins）

這些可以立刻做，每個 < 30 分鐘：

1. ✅ 刪除 `confirm/[token]/page.tsx` 裡的自製 `formatCurrency`
2. ✅ 為 5 個最重要的 useEffect async 加上 catch
3. ✅ 加 ESLint 註解標記所有 `supabase.from()` 違規處，留下 TODO

---

*報告結束。如有疑問歡迎討論。*
