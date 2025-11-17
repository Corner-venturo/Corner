# 會計模組整合指南

> 建立日期：2025-01-17
> 說明：如何將會計模組整合到現有的收款、付款、結團流程

---

## 📋 整合檢查清單

- [x] TypeScript 型別定義
- [x] Zustand Stores（5 個）
- [x] 權限檢查 Hook
- [x] 自動拋轉 Service
- [ ] 整合收款流程
- [ ] 整合付款流程
- [ ] 整合結團流程

---

## 1️⃣ 收款流程整合（訂單 → 傳票）

### 觸發時機
當訂單的 `paid_amount` 增加時（收到客戶付款）

### 整合位置
找到處理訂單收款的函數，例如：
- `src/stores/order-store.ts` 的 `updatePaidAmount()`
- 或收款按鈕的 onClick handler

### 整合代碼範例

```typescript
import { generateVoucherFromPayment } from '@/services/voucher-auto-generator'
import { useAccountingModule } from '@/hooks/use-accounting-module'

// 在收款函數中加入
async function handlePayment(orderId: string, amount: number, paymentMethod: 'cash' | 'bank') {
  // 檢查是否啟用會計模組
  const { hasAccounting, isExpired } = useAccountingModule()

  // 1. 更新訂單的付款資料
  await updateOrder(orderId, {
    paid_amount: currentPaidAmount + amount,
    payment_status: '...',
  })

  // 2. 如果啟用會計模組 → 自動產生傳票
  if (hasAccounting && !isExpired) {
    try {
      await generateVoucherFromPayment({
        workspace_id: user.workspace_id,
        order_id: orderId,
        payment_amount: amount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        bank_account_code: paymentMethod === 'bank' ? '110201' : undefined, // 可選擇銀行
        description: `訂單 ${orderCode} 收款`,
      })

      console.log('✅ 傳票已自動產生')
    } catch (error) {
      console.error('❌ 傳票產生失敗:', error)
      // 不阻斷收款流程，只記錄錯誤
    }
  }
}
```

### 傳票內容
```
借：銀行存款（或現金）  $收款金額
貸：預收團費            $收款金額
```

---

## 2️⃣ 付款流程整合（請款單 → 傳票）

### 觸發時機
當請款單的 `status` 從 `confirmed` → `paid`（會計確認已付款）

### 整合位置
找到處理請款單付款確認的函數，例如：
- `src/stores/payment-request-store.ts` 的 `markAsPaid()`
- 或付款確認按鈕的 onClick handler

### 整合代碼範例

```typescript
import { generateVoucherFromPaymentRequest } from '@/services/voucher-auto-generator'

async function markPaymentRequestAsPaid(requestId: string) {
  // 檢查是否啟用會計模組
  const { hasAccounting, isExpired } = useAccountingModule()

  // 1. 更新請款單狀態
  const request = await updatePaymentRequest(requestId, {
    status: 'paid',
    paid_at: new Date().toISOString(),
  })

  // 2. 如果啟用會計模組 → 自動產生傳票
  if (hasAccounting && !isExpired) {
    try {
      await generateVoucherFromPaymentRequest({
        workspace_id: user.workspace_id,
        payment_request_id: requestId,
        payment_amount: request.amount,
        payment_date: new Date().toISOString().split('T')[0],
        supplier_type: request.supplier_type, // 'transportation', 'accommodation', etc.
        description: `請款單 ${request.request_no} 付款`,
      })

      console.log('✅ 傳票已自動產生')
    } catch (error) {
      console.error('❌ 傳票產生失敗:', error)
    }
  }
}
```

### 傳票內容
```
借：預付團費    $付款金額
貸：銀行存款    $付款金額
```

---

## 3️⃣ 結團流程整合（團體 → 收入/成本傳票）

### 觸發時機
當團體的 `closing_status` 變成 `closed`（結團）

### 資料表修改需求

**需先執行 Migration 新增欄位**：

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_tour_closing_fields.sql
BEGIN;

ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS closing_status VARCHAR(20) DEFAULT 'open'
  CHECK (closing_status IN ('open', 'closing', 'closed')),
ADD COLUMN IF NOT EXISTS closing_date DATE;

COMMENT ON COLUMN public.tours.closing_status IS '結團狀態：open(進行中), closing(結團中), closed(已結團)';
COMMENT ON COLUMN public.tours.closing_date IS '結團日期';

COMMIT;
```

### 整合位置
建立結團功能頁面或按鈕，例如：
- `src/app/tours/[id]/close-tour-dialog.tsx`
- 或在團體詳情頁加入「結團」按鈕

### 整合代碼範例

```typescript
import { generateVouchersFromTourClosing } from '@/services/voucher-auto-generator'

async function closeTour(tourId: string) {
  const { hasAccounting, isExpired } = useAccountingModule()

  // 1. 收集團體資料
  const tour = await fetchTourById(tourId)
  const orders = await fetchOrdersByTourId(tourId)
  const paymentRequests = await fetchPaymentRequestsByTourId(tourId)

  // 計算總收入
  const totalRevenue = orders.reduce((sum, order) => sum + order.paid_amount, 0)

  // 計算各項成本
  const costs = {
    transportation: 0,
    accommodation: 0,
    meal: 0,
    ticket: 0,
    insurance: 0,
    other: 0,
  }

  paymentRequests.forEach(req => {
    if (req.status === 'paid') {
      costs[req.supplier_type] += req.amount
    }
  })

  // 2. 更新團體狀態
  await updateTour(tourId, {
    closing_status: 'closed',
    closing_date: new Date().toISOString().split('T')[0],
  })

  // 3. 如果啟用會計模組 → 自動產生傳票（兩張）
  if (hasAccounting && !isExpired) {
    try {
      const result = await generateVouchersFromTourClosing({
        workspace_id: user.workspace_id,
        tour_id: tourId,
        tour_code: tour.tour_code,
        closing_date: new Date().toISOString().split('T')[0],
        total_revenue: totalRevenue,
        costs: costs,
      })

      console.log('✅ 結團傳票已產生：')
      console.log('  - 收入傳票:', result.revenueVoucher.voucher_no)
      console.log('  - 成本傳票:', result.costVoucher.voucher_no)
    } catch (error) {
      console.error('❌ 結團傳票產生失敗:', error)
    }
  }
}
```

### 傳票內容（兩張）

**傳票 1：轉收入**
```
借：預收團費    $總收入
貸：團費收入    $總收入
```

**傳票 2：轉成本**
```
借：旅遊成本-交通    $交通費
借：旅遊成本-住宿    $住宿費
借：旅遊成本-餐飲    $餐飲費
借：旅遊成本-門票    $門票費
借：旅遊成本-保險    $保險費
借：旅遊成本-其他    $其他費
貸：預付團費        $總成本
```

---

## 🔍 測試方式

### 1. 檢查會計模組是否啟用

```typescript
import { useAccountingModule } from '@/hooks/use-accounting-module'

function TestComponent() {
  const { hasAccounting, isExpired, loading } = useAccountingModule()

  return (
    <div>
      <p>載入中: {loading ? '是' : '否'}</p>
      <p>已啟用: {hasAccounting ? '是' : '否'}</p>
      <p>已過期: {isExpired ? '是' : '否'}</p>
    </div>
  )
}
```

### 2. 手動產生測試傳票

```typescript
// 測試收款傳票
await generateVoucherFromPayment({
  workspace_id: 'xxx',
  order_id: 'O202501001',
  payment_amount: 30000,
  payment_date: '2025-01-17',
  payment_method: 'bank',
  bank_account_code: '110201', // 中國信託
})

// 測試付款傳票
await generateVoucherFromPaymentRequest({
  workspace_id: 'xxx',
  payment_request_id: 'PR202501001',
  payment_amount: 40000,
  payment_date: '2025-01-17',
  supplier_type: 'accommodation',
})
```

### 3. 檢查傳票是否產生

```typescript
import { useVoucherStore } from '@/stores/voucher-store'

const vouchers = useVoucherStore(state => state.items)
console.log('所有傳票:', vouchers)

// 檢查借貸平衡
vouchers.forEach(v => {
  if (v.total_debit !== v.total_credit) {
    console.error('❌ 傳票不平衡:', v.voucher_no)
  }
})
```

---

## ⚠️ 注意事項

1. **會計模組為選購功能**
   - 未啟用時不會產生傳票
   - 使用 `useAccountingModule()` 檢查

2. **錯誤處理**
   - 傳票產生失敗不應阻斷業務流程
   - 使用 try-catch 包裹，只記錄錯誤

3. **權限控制**
   - 傳票建立後預設為 `draft` 狀態
   - 需要會計主管過帳（`status: 'posted'`）才計入總帳

4. **資料一致性**
   - 結團前應確認所有請款單都已付款
   - 可加入檢查邏輯避免資料不一致

5. **銀行科目選擇**
   - 收款時可讓使用者選擇銀行帳戶
   - 預設使用 `1102` 銀行存款（父科目）

---

## 📚 相關文件

- `docs/ACCOUNTING_FINAL_WORKFLOW.md` - 完整會計流程說明
- `src/services/voucher-auto-generator.ts` - 自動拋轉 Service
- `src/hooks/use-accounting-module.ts` - 權限檢查 Hook
- `supabase/migrations/20251117133000_create_accounting_module.sql` - 資料表結構

---

**最後更新**：2025-01-17
**維護者**：William Chien
