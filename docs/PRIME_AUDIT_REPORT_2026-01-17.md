# PRIME 優化審計報告

> **審計日期**: 2026-01-17
> **審計範圍**: venturo-erp 全站 (1,469 個 TypeScript/TSX 檔案)
> **審計框架**: PRIME (Performance, Redundancy, Integrity, Modularity, Error-handling)

---

## 📊 執行摘要

| 維度 | 發現問題數 | 嚴重性 | 狀態 |
|------|-----------|--------|------|
| **P** - Performance | 143 處過度載入, 4 處高複雜度計算 | 🟡 中 | 需優化 |
| **R** - Redundancy | 35 處重複工具函數, 919 處 try-catch | 🟠 高 | 需統一 |
| **I** - Integrity | 4 個高風險 API, 10 個中風險 API | 🔴 緊急 | 需修復 |
| **M** - Modularity | 0 循環依賴, 94.7% 資料層已遷移 | 🟢 良好 | 維持 |
| **E** - Error-handling | 12+ 靜默失敗, ErrorLogger 已禁用 | 🔴 緊急 | 需修復 |

---

## P - Performance 效能分析

### 🔴 最嚴重的效能熱點

| 檔案 | 問題 | 載入的表 |
|------|------|---------|
| `useCalendarTransform.ts` | 同時載入 5 個完整表 | tours, orders, members, customers, employees |
| `/itinerary/page.tsx` | 同時載入 4 個完整表 | itineraries, quotes, employees, tours |
| `use-stats-data.ts` | 前端重度計算 | tours, orders |

### 📊 載入全部資料的統計

- **總發現數**: 143 處使用 `const { items } = useXxx()` 模式
- **涉及的 Hook**: 9 種核心 hooks
- **最常被完整載入的表**: tours (68次), order_members (50次), orders (35次)

### 🎯 LOCA 快取候選

適合未來 Local-first 快取的資料表：
- `tours` - 最頻繁載入
- `orders` - 次頻繁載入
- `members` - 資料量最大
- `employees` - 變動頻率低
- `suppliers`, `attractions` - 基礎參考資料

---

## R - Redundancy 重複分析

### 🔴 重複的工具函數 (35 處)

| 類型 | 重複數 | 位置 |
|------|--------|------|
| 日期格式化 | 18 處 | 各 features, components |
| 金額格式化 | 9 處 | accounting, visas, pdf |
| 狀態轉換 | 4 處 | pdf, requests |
| 驗證函數 | 4 處 | api, stores |

**建議**: 統一使用 `/lib/utils/format-date.ts` 和 `/lib/utils/format-currency.ts`

### 🟠 重複的組件邏輯

| 邏輯類型 | 重複數 | 建議 |
|---------|--------|------|
| Dialog 開關 | 15+ 處 | 建立 `useDialogState` hook |
| Loading/Error 狀態 | 20+ 處 | 建立 `useAsyncData` hook |
| 列表搜尋過濾 | 8+ 處 | 建立 `useSearchFilters` hook |
| 表單驗證 | 12+ 處 | 建立 `useFormValidation` hook |

### 📋 try-catch 統計

- **總數**: 919 個 try-catch 區塊
- **可提煉**: 建議建立 `withErrorHandling()` wrapper 減少重複

---

## I - Integrity 完整性分析

### 🔴 高風險 API (必須立即修復)

| API 路徑 | 問題 | 影響 |
|---------|------|------|
| `/api/travel-invoice/allowance` | 無認證 | 任何人可開折讓 |
| `/api/travel-invoice/issue` | 無認證 | 任何人可開發票 |
| `/api/travel-invoice/void` | 無認證 | 任何人可作廢發票 |
| `/api/travel-invoice/query` | 無認證 | 任何人可查發票 |
| `/api/workspaces/.../members` | 無 workspace 驗證 | 跨租戶存取 |
| `/api/debug/*` (6個) | 完全開放 | 生產環境暴露 |

### 🟠 中風險 API (建議修復)

- `/api/bot-notification` - 無認證，可濫發通知
- `/api/ocr/passport` - 無認證，消耗 API 額度
- `/api/itineraries/generate` - 無認證，消耗資源
- `/api/quotes/confirmation/*` - 依賴 RPC 但無額外驗證

### 📊 類型安全統計

| 類型 | 數量 | 需修復 |
|------|------|--------|
| `:any` 註解 | 5 | 4 處 |
| `as any` 斷言 | 10 | 5 處 (Supabase 合理) |
| `:unknown` | 150+ | ✅ 大部分合理 |

---

## M - Modularity 模組化分析

### ✅ Store 依賴關係

- **循環依賴**: 0 個 ✅
- **高耦合 store**: 3 個 (channels-store, canvas-store, widgets-store)
- **設計模式**: Facade, Factory, UI/Data 分離

### 📊 資料層遷移進度

```
新架構 (@/data)        : ███████████████░░ 94.7%
舊架構 (createCloudHook): ░░ 5.3%
```

**未遷移的模組**:
- ERP Accounting (會計特殊)
- Timebox (個人工具)
- Leader Availability (垂直領域)
- cloud-hooks.ts (向後相容層)

---

## E - Error-handling 錯誤處理分析

### 🔴 緊急問題

| 問題 | 位置 | 影響 |
|------|------|------|
| **ErrorLogger 已禁用** | `ErrorLogger.tsx:7` | 生產環境全盲 |
| Batch 操作靜默失敗 | `base.service.ts:176-192` | 部分資料遺失 |
| Store JSON 解析靜默失敗 | `create-store.ts:72-112` | 認證降級 |

### 🟠 靜默失敗 (12+ 處)

- API `.catch(() => {})` 無日誌
- Date 格式化 fallback 無提示
- Manifestation 操作無聲忽略

### 📊 錯誤處理不一致

| 模式 | 使用數 | 問題 |
|------|--------|------|
| Supabase update 無檢查 | 5+ | 資料可能未保存 |
| API 回應格式不一 | 20+ | 前端無法統一處理 |
| Store 拋出策略不一 | 6+ | 呼叫方難預測 |

---

## 🎯 修復優先順序

### P0 - 立即處理 (今晚)

1. **啟用 ErrorLogger** - 恢復全域錯誤捕獲
2. **發票 API 加認證** - 4 個高風險 API
3. **刪除 Debug API** - 生產環境風險

### P1 - 本週內處理

4. **統一日期/金額格式化** - 移除 27 處重複
5. **API Update 加錯誤檢查** - 5+ 處
6. **Channel Members API 加驗證**

### P2 - 後續迭代

7. **建立共用 Hooks** - useAsyncData, useDialogState 等
8. **效能熱點優化** - useCalendarTransform
9. **API 回應格式標準化**

---

## 📋 相關文件

| 代號 | 名稱 | 說明 |
|------|------|------|
| **CARD** | Clean, Auth, Redundant, Dependencies | 功能模組審計 (已完成) |
| **PRIME** | Perf, Redundancy, Integrity, Modularity, Error | 全站深度優化 (本報告) |
| **LOCA** | Local-first Offline Cache Architecture | 離線快取架構 (未來) |

---

**報告產生時間**: 2026-01-17
**下次審計建議**: 重大功能開發後
