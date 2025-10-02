# 🎯 架構重構指南

## 📋 已完成的工作

### ✅ 創建的 Service Layer：
1. **PaymentService** - `src/features/payments/services/payment.service.ts`
2. **QuoteService** - `src/features/quotes/services/quote.service.ts`
3. **OrderService** - `src/features/orders/services/order.service.ts`
4. **TodoService** - `src/features/todos/services/todo.service.ts`
5. **AccountingService** - `src/features/accounting/services/accounting.service.ts`

### ✅ 創建的 Custom Hooks：
1. **usePayments** - `src/features/payments/hooks/usePayments.ts`
2. **useQuotes** - `src/features/quotes/hooks/useQuotes.ts`
3. **useOrders** - `src/features/orders/hooks/useOrders.ts`
4. **useTodos** - `src/features/todos/hooks/useTodos.ts`
5. **useAccounting** - `src/features/accounting/hooks/useAccounting.ts`

### ✅ 已重構的頁面示範：
- `src/app/finance/requests/page.tsx` - 使用新的 `usePayments` 和 `useTours` hooks

---

## 🔧 如何重構其他頁面

### 步驟 1：修改 Import

**❌ 舊寫法：**
```typescript
import { usePaymentStore } from '@/stores/payment-store';
import { useTourStore } from '@/stores/tour-store';
import { useQuoteStore } from '@/stores/quote-store';
import { useOrderStore } from '@/stores/order-store';
import { useTodoStore } from '@/stores/todo-store';
import { useAccountingStore } from '@/stores/accounting-store';
```

**✅ 新寫法：**
```typescript
import { usePayments } from '@/features/payments/hooks/usePayments';
import { useTours } from '@/features/tours/hooks/useTours';
import { useQuotes } from '@/features/quotes/hooks/useQuotes';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { useTodos } from '@/features/todos/hooks/useTodos';
import { useAccounting } from '@/features/accounting/hooks/useAccounting';
```

---

### 步驟 2：修改 Hook 使用

#### Payment 相關：

**❌ 舊寫法：**
```typescript
const {
  paymentRequests,
  addPaymentRequest,
  updatePaymentRequest,
  deletePaymentRequest,
  addPaymentItem,
  generateRequestNumber,
  getPendingPaymentRequests
} = usePaymentStore();
```

**✅ 新寫法：**
```typescript
const {
  paymentRequests,
  createPaymentRequest,      // ← 改名了
  updatePaymentRequest,
  deletePaymentRequest,
  addPaymentItem,
  generateRequestNumber,
  getPendingRequests          // ← 改名了
} = usePayments();
```

#### Tour 相關：

**❌ 舊寫法：**
```typescript
const { tours, addTour, updateTour, deleteTour } = useTourStore();
```

**✅ 新寫法：**
```typescript
const { tours, createTour, updateTour, deleteTour } = useTours();
```

#### Quote 相關：

**❌ 舊寫法：**
```typescript
const { quotes, addQuote, updateQuote, deleteQuote } = useQuoteStore();
```

**✅ 新寫法：**
```typescript
const { quotes, createQuote, updateQuote, deleteQuote } = useQuotes();
```

#### Order 相關：

**❌ 舊寫法：**
```typescript
const { orders, addOrder, updateOrder, deleteOrder } = useOrderStore();
```

**✅ 新寫法：**
```typescript
const { orders, createOrder, updateOrder, deleteOrder } = useOrders();
```

#### Todo 相關：

**❌ 舊寫法：**
```typescript
const { todos, addTodo, updateTodo, deleteTodo } = useTodoStore();
```

**✅ 新寫法：**
```typescript
const { todos, createTodo, updateTodo, deleteTodo } = useTodos();
```

#### Accounting 相關：

**❌ 舊寫法：**
```typescript
const {
  accounts,
  addAccount,
  updateAccount,
  deleteAccount,
  addTransaction
} = useAccountingStore();
```

**✅ 新寫法：**
```typescript
const {
  accounts,
  createAccount,          // ← 改名了
  updateAccount,
  deleteAccount,
  createTransaction       // ← 改名了
} = useAccounting();
```

---

### 步驟 3：修改函數調用

#### 1. Payment 操作：

**❌ 舊寫法：**
```typescript
const requestId = addPaymentRequest({
  tourId: '123',
  requestDate: '2025-01-01',
  // ...
});
```

**✅ 新寫法：**
```typescript
const request = await createPaymentRequest({
  tourId: '123',
  requestDate: '2025-01-01',
  // ...
});
// 使用 request.id 而不是 requestId
```

**注意**：`createPaymentRequest` 是 async 函數，記得加 `await`！

#### 2. 如果函數需要改成 async：

**❌ 舊寫法：**
```typescript
const handleSubmit = () => {
  const requestId = addPaymentRequest(data);
  // ...
};
```

**✅ 新寫法：**
```typescript
const handleSubmit = async () => {
  const request = await createPaymentRequest(data);
  // ...
};
```

---

## 📝 重構 Checklist

需要重構的頁面列表（按優先級排序）：

### 高優先級（核心功能）：
- [ ] `src/app/finance/treasury/page.tsx` - 使用 `usePayments`
- [ ] `src/app/finance/treasury/disbursement/page.tsx` - 使用 `usePayments`
- [ ] `src/app/quotes/page.tsx` - 使用 `useQuotes`
- [ ] `src/app/quotes/[id]/page.tsx` - 使用 `useQuotes`
- [ ] `src/app/orders/page.tsx` - 使用 `useOrders`
- [ ] `src/app/todos/page.tsx` - 使用 `useTodos`
- [ ] `src/app/accounting/page.tsx` - 使用 `useAccounting`

### 中優先級（常用功能）：
- [ ] `src/app/calendar/page.tsx` - 可能使用多個 hooks
- [ ] `src/app/timebox/page.tsx` - 使用 `useTodos`
- [ ] `src/components/tours/tour-*.tsx` - 使用 `useTours`
- [ ] `src/components/accounting/*.tsx` - 使用 `useAccounting`

### 低優先級（輔助頁面）：
- [ ] 其他使用 Store 的組件

---

## 🎯 命名對照表

| Store 方法 | Hook 方法 | 說明 |
|-----------|----------|------|
| `addPaymentRequest` | `createPaymentRequest` | 創建請款單 |
| `addQuote` | `createQuote` | 創建報價單 |
| `addOrder` | `createOrder` | 創建訂單 |
| `addTodo` | `createTodo` | 創建待辦事項 |
| `addAccount` | `createAccount` | 創建帳戶 |
| `addTransaction` | `createTransaction` | 創建交易 |
| `getPendingPaymentRequests` | `getPendingRequests` | 獲取待處理請款單 |
| `getProcessingPaymentRequests` | `getProcessingRequests` | 獲取處理中請款單 |

---

## 💡 常見問題

### Q1: 為什麼要改名（add → create）？
**A**: 統一命名規範，與 Service Layer 的 CRUD 方法對齊（create/update/delete）。

### Q2: 所有方法都要加 await 嗎？
**A**: 只有返回 Promise 的方法需要：
- ✅ 需要 await: `createPaymentRequest`, `updatePaymentRequest`, `deletePaymentRequest`
- ❌ 不需要 await: `generateRequestNumber`, `getPendingRequests`（同步方法）

### Q3: 改完後怎麼測試？
**A**:
1. 執行 `npm run build` 檢查編譯錯誤
2. 在瀏覽器測試對應功能是否正常
3. 檢查 Console 是否有錯誤

### Q4: 改錯了怎麼辦？
**A**: 參考已重構的 `src/app/finance/requests/page.tsx` 範例

---

## 📚 額外資源

### Service 提供的額外方法：

#### PaymentService:
```typescript
generateRequestNumber()
calculateTotalAmount(request)
getNextThursday()
createFromQuote(tourId, quoteId, date)
getPendingRequests()
getProcessingRequests()
createDisbursementOrder(ids, note)
confirmDisbursementOrder(id, confirmedBy)
```

#### QuoteService:
```typescript
duplicateQuote(id)
createNewVersion(id, updates)
getQuotesByTour(tourId)
getQuotesByStatus(status)
calculateTotalCost(quote)
```

#### OrderService:
```typescript
getOrdersByTour(tourId)
getOrdersByStatus(status)
getOrdersByCustomer(customerId)
calculateTotalRevenue()
getPendingOrders()
getConfirmedOrders()
```

#### TodoService:
```typescript
getTodosByUser(userId)
getTodosByStatus(completed)
getTodosByPriority(priority)
getOverdueTodos()
getTodayTodos()
getUpcomingTodos(days)
```

#### AccountingService:
```typescript
getAccountsByType(type)
getCategoriesByType(type)
getTransactionsByAccount(accountId)
getTransactionsByDateRange(start, end)
getTotalAssets()
getMonthlyIncome()
getMonthlyExpense()
getNetWorth()
```

---

## 🎬 開始重構

建議順序：
1. 先改 1 個頁面測試（已完成 `finance/requests`）
2. 確認功能正常後，再批量改其他頁面
3. 每改完一個頁面，測試一次

祝重構順利！🚀
