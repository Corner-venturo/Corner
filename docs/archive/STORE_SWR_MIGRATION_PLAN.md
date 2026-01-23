# Store → SWR 遷移計劃

> 建立日期：2026-01-08
> 目標：統一資料載入方式，減少架構混亂

---

## 現狀分析

### 兩套系統並存

| 系統 | 檔案數 | 使用方式 |
|------|--------|----------|
| **Zustand Stores** | 25+ | `useTourStore()`, `useOrderStore()` |
| **SWR Hooks** | 5 | `useTours()`, `useOrders()` (cloud-hooks.ts) |

### 問題

1. 不清楚該用哪個
2. 同樣的資料可能有兩份快取
3. 維護成本高

---

## 遷移策略

### 原則

- **新功能**：一律用 SWR Hooks (`cloud-hooks.ts`)
- **舊功能**：逐步遷移，不急著改
- **複雜邏輯**：如果 Store 有特殊邏輯（計算、轉換），保留 Store

### 不需遷移的 Store

這些 Store 有複雜邏輯或全域狀態，不適合用 SWR：

| Store | 原因 |
|-------|------|
| `auth-store.ts` | 認證狀態，非資料庫資料 |
| `ui-store.ts` | UI 狀態 |
| `regions-store.ts` | 國家/城市靜態資料 |
| `workspace/*` | Workspace 相關狀態 |

### 優先遷移的 Store

這些 Store 只是簡單 CRUD，可以用 SWR 取代：

| Store | SWR Hook | 優先級 |
|-------|----------|--------|
| `tour-store.ts` | `useTours()` | 已有 ✅ |
| `order-store.ts` | `useOrders()` | 已有 ✅ |
| `customer-store.ts` | `useCustomers()` | 已有 ✅ |
| `quote-store.ts` | `useQuotes()` | 已有 ✅ |
| `itinerary-store.ts` | `useItineraries()` | 已有 ✅ |
| `payment-request-store.ts` | `usePaymentRequests()` | 已有 ✅ |

---

## SWR Hooks 對照表

### 已建立的 SWR Hooks (`src/hooks/cloud-hooks.ts`)

```typescript
// 核心業務
useTours()              // 團行程
useOrders()             // 訂單
useCustomers()          // 客戶
useQuotes()             // 報價單
useItineraries()        // 行程表

// 財務
usePaymentRequests()    // 付款申請
usePaymentRequestItems() // 付款項目
useDisbursementOrders() // 支出單
useReceiptOrders()      // 收款單

// 人員
useMembers()            // 團員
useEmployees()          // 員工

// 其他
useTodosCloud()         // 待辦
useVisas()              // 簽證
useSuppliers()          // 供應商
useAirportImages()      // 機場圖片
useCustomerGroups()     // 客戶群組
useProposals()          // 提案
useProposalPackages()   // 團體套件
```

### 使用方式

```typescript
// ✅ 新寫法：SWR Hook
import { useTours } from '@/hooks/cloud-hooks'

function MyComponent() {
  const { items, isLoading, create, update, delete: remove } = useTours()
  // ...
}

// ❌ 舊寫法：Zustand Store（逐步淘汰）
import { useTourStore } from '@/stores'

function MyComponent() {
  const { items, fetchAll, add, update, delete: remove } = useTourStore()
  useEffect(() => { fetchAll() }, []) // 需要手動 fetch
  // ...
}
```

---

## 分層快取策略

SWR Hooks 已設定分層快取（見 `src/lib/swr/config.ts`）：

| 資料類型 | 策略 | dedupingInterval |
|---------|------|------------------|
| tours, customers, quotes | STATIC | 60 秒 |
| orders, payments | DYNAMIC | 10 秒 |
| todos, calendar_events | REALTIME | 3 秒 |

---

## 遷移步驟（給開發者）

當你要改某個頁面時：

1. **檢查**：該頁面用的是 Store 還是 SWR Hook？
2. **如果是 Store**：
   - 有對應的 SWR Hook 嗎？（查 `cloud-hooks.ts`）
   - 有的話，順手改成 SWR Hook
3. **測試**：確保功能正常

### 範例：遷移一個頁面

```diff
- import { useTourStore } from '@/stores'
+ import { useTours } from '@/hooks/cloud-hooks'

function ToursPage() {
-  const { items: tours, fetchAll, isLoading } = useTourStore()
+  const { items: tours, isLoading } = useTours()

-  useEffect(() => { fetchAll() }, [])  // 不再需要手動 fetch!

  return <TourList tours={tours} loading={isLoading} />
}
```

---

## 時程

| 階段 | 目標 | 時間 |
|------|------|------|
| Phase 1 | 新功能用 SWR | 立即生效 |
| Phase 2 | 高頻頁面遷移 | 隨機會改 |
| Phase 3 | 廢棄舊 Store | 無時間表 |

**注意**：這不是緊急任務，逐步改進即可。
