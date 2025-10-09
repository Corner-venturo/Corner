# 架構違規修正計劃

**建立日期**: 2025-01-06
**狀態**: 待執行
**預估工時**: 1-2 天

---

## 📊 問題總覽

發現 **35 個檔案** 違反五層架構規範：
- UI 層直接調用 Store（應該透過 Hook 層）
- 違反資料流：`UI → Store` ❌（正確應為 `UI → Hook → Store`）

---

## 🎯 修正目標

將所有 UI 層的 Store 直接調用改為透過 Hook 層調用。

**正確架構**：
```
UI Layer → Hook Layer → Store Layer → DB Layer
```

---

## 📋 違規檔案清單

### App 頁面（18 個）

| 檔案路徑 | 違規 Store | 應使用 Hook |
|---------|-----------|------------|
| `src/app/tours/page.tsx` | `useTourStore`, `useQuoteStore`, `usePaymentStore` | `useTours`, `useQuotes`, `usePayments` |
| `src/app/tours/[id]/page.tsx` | `useTourStore` | `useTours` |
| `src/app/orders/page.tsx` | `useOrderStore`, `useTourStore` | `useOrders`, `useTours` |
| `src/app/orders/[orderId]/page.tsx` | `useOrderStore`, `useTourStore` | `useOrders`, `useTours` |
| `src/app/orders/[orderId]/overview/page.tsx` | `useOrderStore` | `useOrders` |
| `src/app/orders/[orderId]/documents/page.tsx` | `useOrderStore` | `useOrders` |
| `src/app/orders/[orderId]/members/page.tsx` | `useOrderStore` | `useOrders` |
| `src/app/orders/[orderId]/payment/page.tsx` | `useOrderStore` | `useOrders` |
| `src/app/quotes/page.tsx` | `useQuoteStore` | `useQuotes` |
| `src/app/quotes/[id]/page.tsx` | `useQuoteStore` | `useQuotes` |
| `src/app/finance/page.tsx` | 多個 Store | 對應 Hooks |
| `src/app/finance/payments/page.tsx` | `usePaymentStore` | `usePayments` |
| `src/app/finance/payments/new/page.tsx` | `usePaymentStore` | `usePayments` |
| `src/app/finance/reports/page.tsx` | 多個 Store | 對應 Hooks |
| `src/app/finance/treasury/disbursement/page.tsx` | `useDisbursementStore` | `useDisbursements` |
| `src/app/visas/page.tsx` | `useVisaStore` | `useVisas` |
| `src/app/customers/page.tsx` | `useTourStore` | `useTours` |
| `src/app/calendar/page.tsx` | `useTourStore` | `useTours` |

### 組件（17 個）

| 檔案路徑 | 違規 Store | 應使用 Hook |
|---------|-----------|------------|
| `src/components/tours/tour-members.tsx` | `useTourStore` | `useTours` |
| `src/components/tours/tour-payments.tsx` | `useTourStore`, `usePaymentStore` | `useTours`, `usePayments` |
| `src/components/tours/tour-operations.tsx` | `useTourStore` | `useTours` |
| `src/components/tours/tour-costs.tsx` | `useTourStore` | `useTours` |
| `src/components/tours/tour-refunds.tsx` | `useTourStore` | `useTours` |
| `src/components/tours/tour-add-ons.tsx` | `useTourStore` | `useTours` |
| `src/components/tours/tour-orders.tsx` | `useTourStore` | `useTours` |
| `src/components/orders/order-kanban.tsx` | `useOrderStore` | `useOrders` |
| `src/components/orders/expandable-order-table.tsx` | `useOrderStore` | `useOrders` |
| `src/components/members/member-table.tsx` | `useTourStore` | `useTours` |
| `src/components/members/excel-member-table.tsx` | `useTourStore` | `useTours` |
| `src/components/todos/quick-actions/quick-group.tsx` | `useTourStore`, `useQuoteStore` | `useTours`, `useQuotes` |
| `src/components/todos/quick-actions/quick-disbursement.tsx` | `useTourStore` | `useTours` |
| `src/components/todos/quick-actions/quick-receipt.tsx` | `useTourStore`, `usePaymentStore` | `useTours`, `usePayments` |
| `src/components/templates/use-template-dialog.tsx` | `useTemplateStore` | `useTemplates` |
| `src/components/layout/sidebar.tsx` | 多個 Store | 對應 Hooks |
| `src/components/sync-indicator.tsx` | `useOfflineStore` | 保留（系統層級） |

---

## 🔧 修正步驟

### 階段 1：檢查 Hook 層是否完整

1. 檢查 `src/features/` 目錄下是否已有所有需要的 Hooks
2. 確認 Hooks 提供的 API 是否足夠（涵蓋所有 Store 操作）

**已知存在的 Hooks**：
- ✅ `useTours` - `src/features/tours/hooks/useTours.ts`
- ❓ `useOrders` - 需確認
- ❓ `useQuotes` - 需確認
- ❓ `usePayments` - 需確認
- ❓ `useCustomers` - 需確認
- ❓ `useVisas` - 需確認
- ❓ `useTemplates` - 需確認

### 階段 2：補充缺少的 Hooks（如有需要）

如果某些 Hook 不存在或 API 不足，需要：
1. 建立新的 Hook 檔案
2. 封裝 Store 的操作
3. 加入業務邏輯驗證

**Hook 範本**：
```typescript
// src/features/[module]/hooks/use-[module].ts
import { use[Module]Store } from '@/stores/[module]-store'

export const use[Module]s = () => {
  const store = use[Module]Store()

  return {
    // 資料
    items: store.items,
    loading: store.loading,
    error: store.error,

    // CRUD 操作
    create: async (data) => {
      // 業務邏輯驗證
      return await store.create(data)
    },
    update: async (id, data) => {
      return await store.update(id, data)
    },
    delete: async (id) => {
      return await store.delete(id)
    },
    fetchAll: async () => {
      return await store.fetchAll()
    },
  }
}
```

### 階段 3：逐一修正 UI 檔案

優先順序：高頻使用 → 低頻使用

**修正範例**：

**修正前**（`src/app/tours/page.tsx`）：
```typescript
// ❌ 錯誤
import { useTourStore } from '@/stores/tour-store'
import { useQuoteStore } from '@/stores/quote-store'

function ToursPage() {
  const { tours, addTour } = useTourStore()
  const { quotes } = useQuoteStore()
  // ...
}
```

**修正後**：
```typescript
// ✅ 正確
import { useTours } from '@/features/tours'
import { useQuotes } from '@/features/quotes'

function ToursPage() {
  const { tours, createTour } = useTours()
  const { quotes } = useQuotes()
  // ...
}
```

### 階段 4：測試驗證

每修正一個檔案後：
1. 執行 TypeScript 檢查：`npm run type-check`
2. 測試功能是否正常
3. 確認沒有 Console 錯誤

---

## 📝 修正檢查表

### 高優先級（高頻頁面）

#### Tours 模組
- [ ] `src/app/tours/page.tsx`
- [ ] `src/app/tours/[id]/page.tsx`
- [ ] `src/components/tours/tour-members.tsx`
- [ ] `src/components/tours/tour-payments.tsx`
- [ ] `src/components/tours/tour-operations.tsx`
- [ ] `src/components/tours/tour-costs.tsx`
- [ ] `src/components/tours/tour-refunds.tsx`
- [ ] `src/components/tours/tour-add-ons.tsx`
- [ ] `src/components/tours/tour-orders.tsx`

#### Orders 模組
- [ ] `src/app/orders/page.tsx`
- [ ] `src/app/orders/[orderId]/page.tsx`
- [ ] `src/app/orders/[orderId]/overview/page.tsx`
- [ ] `src/app/orders/[orderId]/documents/page.tsx`
- [ ] `src/app/orders/[orderId]/members/page.tsx`
- [ ] `src/app/orders/[orderId]/payment/page.tsx`
- [ ] `src/components/orders/order-kanban.tsx`
- [ ] `src/components/orders/expandable-order-table.tsx`

#### Quotes 模組
- [ ] `src/app/quotes/page.tsx`
- [ ] `src/app/quotes/[id]/page.tsx`
- [ ] `src/components/todos/quick-actions/quick-group.tsx`

### 中優先級

#### Payments & Finance 模組
- [ ] `src/app/finance/page.tsx`
- [ ] `src/app/finance/payments/page.tsx`
- [ ] `src/app/finance/payments/new/page.tsx`
- [ ] `src/app/finance/reports/page.tsx`
- [ ] `src/app/finance/treasury/disbursement/page.tsx`
- [ ] `src/components/todos/quick-actions/quick-disbursement.tsx`
- [ ] `src/components/todos/quick-actions/quick-receipt.tsx`

#### Members 模組
- [ ] `src/components/members/member-table.tsx`
- [ ] `src/components/members/excel-member-table.tsx`

### 低優先級

#### 其他模組
- [ ] `src/app/visas/page.tsx`
- [ ] `src/app/customers/page.tsx`
- [ ] `src/app/calendar/page.tsx`
- [ ] `src/components/templates/use-template-dialog.tsx`
- [ ] `src/components/layout/sidebar.tsx`

---

## ⚠️ 特殊情況處理

### 1. `useOfflineStore`
- **檔案**: `src/components/sync-indicator.tsx`
- **決策**: 保留直接調用（系統層級組件）
- **原因**: 離線同步是基礎設施，不屬於業務邏輯層

### 2. 多個 Store 的頁面
- **範例**: `src/app/finance/page.tsx`
- **處理**: 分別引入對應的 Hooks
- **注意**: 檢查是否有跨模組的業務邏輯需要封裝

### 3. `sidebar.tsx`
- **決策**: 待評估
- **選項**：
  - 選項 A：建立 `useNavigation` Hook 統一管理
  - 選項 B：保留直接調用（Layout 特殊性）

---

## 🎯 預期成果

修正完成後：
- ✅ 所有 UI 檔案透過 Hook 層調用資料
- ✅ 符合五層架構規範
- ✅ 業務邏輯集中在 Hook 層
- ✅ 降低耦合度，提高可維護性
- ✅ 方便未來切換到 API（Phase 3）

---

## 📈 進度追蹤

| 模組 | 總檔案數 | 已修正 | 進度 |
|------|---------|--------|------|
| Tours | 9 | 0 | 0% |
| Orders | 8 | 0 | 0% |
| Quotes | 3 | 0 | 0% |
| Payments & Finance | 7 | 0 | 0% |
| Members | 2 | 0 | 0% |
| 其他 | 6 | 0 | 0% |
| **總計** | **35** | **0** | **0%** |

---

## 📞 注意事項

1. **不要一次修正太多檔案**：每次修正 2-3 個檔案後測試
2. **保持功能完整性**：確保修正後功能不變
3. **記錄遇到的問題**：如果 Hook API 不足，記錄需要補充的功能
4. **提交前檢查**：確保沒有 TypeScript 錯誤

---

**執行者**: Claude AI
**審核者**: William Chien
**預計完成日期**: 2025-01-08
