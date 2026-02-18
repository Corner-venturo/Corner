# 出納模組程式碼審查報告

**日期:** 2026-02-18
**範圍:** `src/features/disbursement/` + 相關路由與服務
**程式碼量:** ~3,500 行（22 個檔案）

---

## 一、架構概覽

### 資料流
```
請款單 (pending) → 勾選加入出納單 → 出納單 (pending) → 確認出帳 (paid) → 請款單 (paid)
```

### 資料儲存
- **disbursement_orders** 表：`payment_request_ids` (text ARRAY) 直接存請款單 ID 陣列
- **無 disbursement_order_items 表**：不使用 join table，用 array 欄位關聯
- workspace_id 由 `createEntityHook` 自動過濾（含 `workspace_id.is.null` 向後相容）

### 主要元件
| 檔案 | 用途 |
|------|------|
| `DisbursementPage.tsx` | 出納單列表主頁（使用 ListPageLayout） |
| `CreateDisbursementDialog.tsx` | 新增出納單流程 |
| `DisbursementDetailDialog.tsx` | 詳情 + 追加/移除請款單 + 確認出帳 |
| `DisbursementPrintDialog.tsx` | 列印預覽 + iframe 列印 + PDF 下載 |
| `useCreateDisbursement.ts` | 建立出納單邏輯（直接用 dynamicFrom） |
| `useDisbursementData.ts` | 資料操作 Hook（加入/移除/確認） |
| `disbursement-order.service.ts` | BaseService 封裝（較舊，部分功能已被 Hook 取代） |

### 出納單號格式
- `useCreateDisbursement`: `DO{Y}{MM}{DD}-{NNN}` (e.g., DO60218-001)
- `useDisbursementData` / service: `P{YY}{MM}{DD}{A-Z}` (e.g., P260218A)
- ⚠️ 兩套格式並存，實際使用 `CreateDisbursementDialog` → `useCreateDisbursement` 的 DO 格式

---

## 二、DB 欄位驗證

### disbursement_orders 表（18 個欄位）
| 欄位 | 類型 | 程式碼有使用 |
|------|------|:---:|
| id | text | ✅ |
| code | text | ✅ |
| amount | numeric | ✅ |
| payment_method | text | ❌ 未使用 |
| status | text | ✅ |
| handled_by | text | ❌ 未使用 |
| handled_at | timestamptz | ❌ 未使用 |
| notes | text | ✅ (已修正) |
| created_at | timestamptz | ✅ |
| updated_at | timestamptz | ✅ |
| workspace_id | uuid | ✅ (自動注入) |
| payment_request_ids | ARRAY | ✅ |
| updated_by | uuid | ❌ 未使用 |
| order_number | text | ✅ |
| disbursement_date | date | ✅ |
| confirmed_by | uuid | ✅ (已修正) |
| confirmed_at | timestamptz | ✅ |
| created_by | uuid | ✅ |

### disbursement_order_items 表
**不存在**。程式碼中也未引用，正確。

### 所有 .from('disbursement_orders') 查詢
- `select('*')` — 安全
- `insert/update/delete` 使用的欄位皆存在 ✅
- entity hook `useDisbursementOrders` slim select: `id,code,status,amount,disbursement_date,created_at` — 皆存在 ✅

---

## 三、已修正的 Bug（4 個）

### Bug 1: 確認出帳缺少 confirmed_by（嚴重度：中）
**檔案:** `DisbursementDetailDialog.tsx` `handleConfirmPaid`
**問題:** 更新出納單狀態為 `paid` 時只設了 `confirmed_at`，缺少 `confirmed_by`
**修正:** 加入 `confirmed_by: user?.id || null`

### Bug 2: 請款單狀態不一致（嚴重度：高）
**檔案:** `useDisbursementData.ts`
**問題:** `addToCurrentDisbursementOrder` 和 `createNewDisbursementOrder` 將請款單設為 `processing`，但 `useCreateDisbursement.ts` 和 `DisbursementDetailDialog.tsx` 使用 `approved`。`DisbursementPage` 只過濾 `pending` 狀態，導致不同入口的行為不一致。
**修正:** 統一為 `approved`

### Bug 3: service note → notes 欄位名錯誤（嚴重度：低）
**檔案:** `disbursement-order.service.ts` `createWithRequests`
**問題:** 使用 `note` 但 DB 欄位是 `notes`，Supabase 會忽略不存在的欄位
**修正:** 改為 `notes: note`

### Bug 4: quick-disbursement note → notes（嚴重度：低）
**檔案:** `quick-disbursement.tsx`
**問題:** Textarea onChange 設 `note` 但表單欄位應為 `notes`
**修正:** 改為 `notes`

---

## 四、邏輯審查結果

### ✅ 正確的部分
1. **payment_request_ids 儲存方式**: 使用 Postgres ARRAY，程式碼正確操作（push/filter/spread）
2. **金額計算**: 建立時從選中的請款單 reduce 計算 `selectedAmount`，移除時用 `newAmount = order.amount - request.amount`，追加時累加。邏輯正確。
3. **workspace_id 過濾**: `createEntityHook` 自動處理，`useCreateDisbursement` 手動注入 `user?.workspace_id`。無遺漏。
4. **確認出帳流程**: 出納單 → `paid`，所有關聯請款單 → `paid` + `paid_at`，並重算團成本。正確。
5. **成本重算**: 所有狀態變更都呼叫 `recalculateExpenseStats`。完整。

### ⚠️ 注意事項（非 Bug，建議改善）
1. **重複的 getNextThursday()**: 在 3 個地方各自實作，邏輯略有不同（service 版多了 17:00 判斷）
2. **兩套出納單號格式**: `DO` prefix vs `P` prefix 並存
3. **disbursement-order.service.ts 大量未使用**: 很多方法已被 Hook + entity 取代，是歷史遺留
4. **payment_method / handled_by / handled_at / updated_by** 欄位未被使用
5. **useCreateDisbursement 直接用 dynamicFrom** 繞過 entity 層，理由是避免 workspace_id 檢查，但 entity 已自動注入

---

## 五、驗證結果

- ✅ `tsc --noEmit` 通過（0 errors）
- ✅ `vitest run` 424 tests 全部通過
- ✅ ESLint 通過
- ✅ `git push` 成功 (commit `e469efdd`)
