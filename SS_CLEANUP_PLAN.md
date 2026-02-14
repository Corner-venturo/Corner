# 🧹 SS 級清掃計畫 — Venturo ERP

> **掃描日期**: 2026-02-14
> **專案規模**: 2,040 個 .ts/.tsx 檔案
> **ESLint 狀態**: ✅ 零 warning（`npx eslint src/ --quiet` 無輸出）

---

## 📊 總覽

| 優先級 | 問題類別 | 影響檔案數 | 預估總工時 |
|--------|---------|-----------|-----------|
| 🔴 P0 | labels.ts 重複 key | 14 個檔案 | 4h |
| 🔴 P0 | 禁令違規（birthday 欄位名） | ~25 個檔案 | 3h |
| 🟠 P1 | components/ 業務邏輯未搬遷 | ~30 個檔案 | 16h |
| 🟠 P1 | @ts-ignore / @ts-expect-error | 2 個檔案 | 1h |
| 🟡 P2 | 死代碼（未使用 store） | 1 個檔案 | 0.5h |
| 🟡 P2 | 廢棄依賴 | 1 個套件 | 0.5h |
| 🟢 P3 | Barrel export 清理 | 50+ 個檔案 | 2h |
| 🟢 P3 | TODO 殘留 | 2 個檔案 | 1h |

**總預估工時: ~28 小時**

---

## 🔴 P0 — 必須立刻修復

### 1. labels.ts 重複 key（14 個檔案）

重複的 key 會導致後面的值覆蓋前面，造成翻譯錯誤。

| 檔案 | 重複 key 數量 |
|------|-------------|
| `src/constants/labels.ts` | 30+ |
| `src/features/quotes/constants/labels.ts` | 40+ |
| `src/features/erp-accounting/constants/labels.ts` | 55+ |
| `src/components/tours/constants/labels.ts` | 50+ |
| `src/app/(main)/customers/constants/labels.ts` | 25+ |
| `src/app/(main)/settings/constants/labels.ts` | 17+ |
| `src/app/(main)/confirmations/constants/labels.ts` | 31+ |
| `src/app/(main)/itinerary/constants/labels.ts` | 9+ |
| `src/app/(main)/finance/constants/labels.ts` | 6+ |
| `src/features/tour-confirmation/constants/labels.ts` | 17+ |
| `src/features/visas/constants/labels.ts` | 23+ |
| `src/features/hr/constants/labels.ts` | 22+ |
| `src/features/finance/constants/labels.ts` | 30+ |
| `src/features/proposals/constants/labels.ts` | 9+ |
| `src/features/fleet/constants/labels.ts` | 3 |
| `src/features/attractions/constants/labels.ts` | 3 |
| `src/components/contracts/constants/labels.ts` | 4 |
| `src/components/todos/constants/labels.ts` | 1 |

**建議修復方式**: 逐一去重，為同名 key 加上語意前綴（如 `dialog_cancel` vs `form_cancel`）
**預估工時**: 4h

---

### 2. 禁令違規 — `birthday` 欄位名殘留（~25 個檔案）

六大禁令規定 `birthday` → `birth_date`、`name_en` → `english_name`。目前仍有大量違規：

**主要影響區域**:
- `src/features/calendar/` — 多個 hooks 和組件
- `src/components/hr/` — 表單和型別定義
- `src/components/members/` — 會員相關
- `src/app/(main)/customers/` — 客戶相關
- `src/stores/types/` — Store 型別定義

**建議修復方式**: 全域搜尋替換 + 確認資料庫欄位是否已遷移
**預估工時**: 3h（若 DB 已遷移僅改前端；若 DB 未遷移需加 migration）

---

## 🟠 P1 — 本週內修復

### 3. components/ 下業務邏輯未搬到 features/（~30 個檔案）

以下 `src/components/` 目錄包含直接呼叫 `supabase`、`useStore`、`fetch()` 的業務邏輯，應搬遷至 `src/features/`：

| 目錄 | 含業務邏輯的檔案 |
|------|----------------|
| `components/tours/` | tour-orders, tour-costs, tour-itinerary-tab, TourAssignmentManager, TourFilesManager, tour-checkin, tour-confirmation-sheet 等 ~15 個 |
| `components/workspace/` | ChatMessages, MessageInput, BotSection ~3 個 |
| `components/manifestation/` | WishWall ~1 個 |
| `components/contracts/` | ContractViewDialog ~1 個 |
| `components/tours/assignment-tabs/` | TourVehicleTab, TourRoomTab, TourTableTab ~3 個 |
| `components/tours/pnr-tool/` | TourPnrToolDialog ~1 個 |

**建議修復方式**: 按 `features/orders` 搬遷模式，逐模組搬遷
**預估工時**: 16h（`tours/` 最大，建議分 3-4 個 PR）

---

### 4. @ts-ignore / @ts-expect-error（2 個檔案）

| 檔案 | 說明 |
|------|------|
| `src/components/shared/react-datasheet-wrapper/ReactDatasheetWrapper.tsx` | 第三方套件型別問題 |
| `src/data/core/createEntityHook.ts` | 通用 hook 工廠 |

**建議修復方式**: 為第三方套件寫 `.d.ts`；重構 `createEntityHook` 的泛型
**預估工時**: 1h

---

## 🟡 P2 — 本月修復

### 5. 死代碼 — 未使用的 Store（1 個檔案）

| 檔案 | 說明 |
|------|------|
| `src/stores/adapters/supabase-adapter.ts` | 沒被任何地方引用 |

**建議修復方式**: 確認無用後刪除
**預估工時**: 0.5h

---

### 6. 廢棄依賴（1 個套件）

| 套件 | 使用狀況 |
|------|---------|
| `prop-types` | **0 個檔案使用** — 完全廢棄 |

其他套件雖使用量低但仍有引用：
- `react-datasheet`: 3 個檔案
- `@xdadda/mini-gl`: 2 個檔案
- `react-best-gradient-color-picker`: 1 個檔案
- `react-easy-crop`: 1 個檔案
- `svg2pdf.js`: 2 個檔案

**建議修復方式**: `npm uninstall prop-types`
**預估工時**: 0.5h

---

## 🟢 P3 — 有空再做

### 7. Barrel Export 清理（50+ 個 index.ts）

找到 50+ 個只有 1-5 行 re-export 的 `index.ts`。這些本身無害，但部分可能指向不存在的模組。

**建議修復方式**: 逐一檢查是否有空 barrel（export 的東西不存在），刪除無意義的
**預估工時**: 2h

---

### 8. TODO 殘留（2 個檔案）

| 檔案 | 內容 |
|------|------|
| `src/features/supplier/components/SupplierFinancePage.tsx:116` | `// TODO: 需要新增 payment_status 欄位`（出現 2 次） |
| `src/components/workspace/channel-sidebar/CreateChannelDialog.tsx:87` | `// TODO: migrate to Dialog component` |

**建議修復方式**: 決定是要做還是刪除 TODO
**預估工時**: 1h

---

## ✅ 已通過的檢查項

| 項目 | 狀態 | 說明 |
|------|------|------|
| ESLint warnings | ✅ | `npx eslint src/ --quiet` 零輸出 |
| `as any` 使用 | ✅ | 僅 `typed-client.ts` 中有設計性使用，附完整註解 |
| `console.log` | ✅ | 僅 `ErrorLogger.tsx`（合理）和 JSDoc 範例中 |
| API 路由 | ✅ | 51 個 route，無空檔案，最小 36 行 |
| 檔案命名一致性 | ✅ | kebab-case（檔案）+ PascalCase（組件）混合但符合 Next.js 慣例 |
| 未使用 import | ✅ | ESLint 已處理，無殘留 |
| Non-null assertion (!) | ⚠️ | 部分檔案使用較多但在合理範圍內 |

---

## 📋 建議執行順序

1. **🔴 labels.ts 去重** — 影響最廣，可能已造成 bug（4h）
2. **🔴 birthday → birth_date 遷移** — 違反禁令（3h）
3. **🟠 components/tours/ 搬遷第一批** — 架構一致性（8h）
4. **🟠 ts-ignore 修復** — 型別安全（1h）
5. **🟡 刪除死代碼和廢棄依賴** — 快速清理（1h）
6. **🟢 其餘搬遷和 TODO** — 持續改善（11h）
