# 代轉發票系統重新設計

> **建立日期**: 2026-01-26
> **狀態**: 設計中
> **相關功能**: `/finance/travel-invoice`, 訂單詳情頁

---

## 一、業務需求

### 1.1 核心需求

| 需求 | 說明 |
|------|------|
| **不允許超開** | 發票金額 ≤ 可開金額（已收款 - 已開發票） |
| **多訂單合併** | 可多張訂單一起開一張發票 |
| **雙入口操作** | 業務從訂單頁面、財務從代轉發票頁面批次 |
| **顯示可開金額** | 訂單需顯示「已收款」「已開發票」「可開金額」 |
| **團結案自動開** | 團結案時，未開的訂單自動合併開一張 |

### 1.2 使用者流程

```
┌─────────────────────────────────────────────────────────────────┐
│ 業務人員（從訂單操作）                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  訂單詳情頁                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 訂單編號: CNX250128A-O01                                    ││
│  │ 聯絡人: 王大明                                               ││
│  │ 總金額: NT$ 45,000                                          ││
│  │ 已收款: NT$ 45,000 ✓                                        ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │ 已開發票: NT$ 30,000                                        ││
│  │ 可開金額: NT$ 15,000  ← 新增顯示                            ││
│  │                                                             ││
│  │ [開立發票] ← 點擊後帶出 Dialog，預填該訂單可開金額           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 財務人員（批次操作）                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /finance/travel-invoice                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 代轉發票管理                         [批次開立] [開立新發票] ││
│  │                                                             ││
│  │ ┌─ 篩選條件 ─────────────────────────────────────────────┐ ││
│  │ │ 團別: [CNX250128A ▼]                                   │ ││
│  │ │ 狀態: [全部 ▼]                                         │ ││
│  │ └───────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  │ ┌─ 待開發票訂單 ─────────────────────────────────────────┐ ││
│  │ │ ☑ CNX250128A-O01 | 王大明 | 可開: NT$ 15,000          │ ││
│  │ │ ☑ CNX250128A-O02 | 李小華 | 可開: NT$ 20,000          │ ││
│  │ │ ☐ CNX250128A-O03 | 張三   | 可開: NT$ 0 (已開齊)      │ ││
│  │ └───────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  │ 已選 2 筆，合計可開: NT$ 35,000    [合併開立發票]           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、資料結構設計

### 2.1 新增表格: `invoice_orders` (發票-訂單關聯表)

```sql
-- 發票與訂單的多對多關聯
CREATE TABLE public.invoice_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.travel_invoices(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL,  -- 該訂單分攤金額

  -- 標準欄位
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,

  -- 確保同一張發票不會重複關聯同一訂單
  CONSTRAINT invoice_orders_unique UNIQUE (invoice_id, order_id)
);

-- 索引
CREATE INDEX idx_invoice_orders_invoice_id ON public.invoice_orders(invoice_id);
CREATE INDEX idx_invoice_orders_order_id ON public.invoice_orders(order_id);
CREATE INDEX idx_invoice_orders_workspace_id ON public.invoice_orders(workspace_id);

-- RLS
ALTER TABLE public.invoice_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_orders_select" ON public.invoice_orders FOR SELECT
USING (workspace_id = get_current_user_workspace() OR is_super_admin());

CREATE POLICY "invoice_orders_insert" ON public.invoice_orders FOR INSERT
WITH CHECK (workspace_id = get_current_user_workspace());

CREATE POLICY "invoice_orders_delete" ON public.invoice_orders FOR DELETE
USING (workspace_id = get_current_user_workspace());
```

### 2.2 修改 `travel_invoices` 表

```sql
-- 新增 workspace_id（如果還沒有）
ALTER TABLE public.travel_invoices
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- 保留 order_id 和 tour_id 作為快速查詢用途
-- order_id: 單一訂單開立時使用（向後兼容）
-- tour_id: 記錄所屬團（必填）

-- 新增欄位
ALTER TABLE public.travel_invoices
ADD COLUMN IF NOT EXISTS is_batch BOOLEAN DEFAULT false;  -- 是否為批次開立
```

### 2.3 訂單相關計算欄位

訂單需要能計算以下數值（透過 View 或即時查詢）：

| 欄位 | 計算方式 | 說明 |
|------|---------|------|
| `paid_amount` | 現有欄位 | 已收款金額 |
| `invoiced_amount` | SUM(invoice_orders.amount) | 已開發票金額 |
| `invoiceable_amount` | paid_amount - invoiced_amount | 可開發票金額 |

```sql
-- 建立 View 方便查詢
CREATE OR REPLACE VIEW public.orders_with_invoice_info AS
SELECT
  o.*,
  COALESCE(inv.invoiced_amount, 0) AS invoiced_amount,
  o.paid_amount - COALESCE(inv.invoiced_amount, 0) AS invoiceable_amount
FROM public.orders o
LEFT JOIN (
  SELECT
    io.order_id,
    SUM(io.amount) AS invoiced_amount
  FROM public.invoice_orders io
  JOIN public.travel_invoices ti ON ti.id = io.invoice_id
  WHERE ti.status NOT IN ('voided', 'failed')  -- 排除作廢和失敗的發票
  GROUP BY io.order_id
) inv ON inv.order_id = o.id;
```

---

## 三、API 設計

### 3.1 開立發票 API（修改現有）

**POST `/api/travel-invoice/issue`**

```typescript
interface IssueInvoiceRequest {
  // 基本資訊
  invoice_date: string          // 開立日期
  total_amount: number          // 總金額
  tax_type?: 'dutiable' | 'zero' | 'free'

  // 買受人
  buyerInfo: {
    buyerName: string
    buyerUBN?: string
    buyerEmail?: string
    buyerMobile?: string
  }

  // 商品明細
  items: {
    item_name: string
    item_count: number
    item_unit: string
    item_price: number
    itemAmt: number
  }[]

  // 訂單關聯（改為陣列）
  orders: {
    order_id: string
    amount: number              // 該訂單分攤金額
  }[]

  tour_id: string               // 所屬團（必填）
  created_by: string
}

interface IssueInvoiceResponse {
  success: boolean
  message: string
  data?: {
    id: string
    transactionNo: string
    invoiceNumber: string
    randomNum: string
  }
}
```

**驗證邏輯**：
```typescript
// 1. 檢查每個訂單的可開金額
for (const orderItem of request.orders) {
  const order = await getOrderWithInvoiceInfo(orderItem.order_id)

  if (orderItem.amount > order.invoiceable_amount) {
    throw new Error(
      `訂單 ${order.order_number} 可開金額不足：` +
      `可開 ${order.invoiceable_amount}，要求 ${orderItem.amount}`
    )
  }
}

// 2. 檢查總金額是否一致
const totalFromOrders = request.orders.reduce((sum, o) => sum + o.amount, 0)
if (totalFromOrders !== request.total_amount) {
  throw new Error('總金額與訂單分攤金額不符')
}
```

### 3.2 查詢可開發票訂單 API（新增）

**GET `/api/travel-invoice/orders`**

```typescript
interface QueryOrdersRequest {
  tour_id?: string              // 篩選團別
  has_invoiceable?: boolean     // 只顯示有可開金額的
}

interface QueryOrdersResponse {
  success: boolean
  data: {
    order_id: string
    order_number: string
    contact_person: string
    total_amount: number
    paid_amount: number
    invoiced_amount: number
    invoiceable_amount: number  // 可開金額
    tour_id: string
    tour_code: string
  }[]
}
```

### 3.3 批次開立發票 API（新增）

**POST `/api/travel-invoice/batch-issue`**

```typescript
interface BatchIssueRequest {
  tour_id: string               // 團別
  order_ids: string[]           // 要開立的訂單 ID 列表
  invoice_date: string

  // 共用買受人資訊（或使用團的代表人）
  buyerInfo: {
    buyerName: string
    buyerUBN?: string
    buyerEmail?: string
  }

  created_by: string
}
```

---

## 四、UI 設計

### 4.1 訂單詳情頁 - 發票區塊

**位置**: 訂單詳情頁的財務區域

```tsx
// 新增發票資訊卡片
<Card>
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <FileText className="h-4 w-4" />
      發票資訊
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="text-sm text-morandi-secondary">已收款</p>
        <p className="font-medium">
          <CurrencyCell amount={order.paid_amount} />
        </p>
      </div>
      <div>
        <p className="text-sm text-morandi-secondary">已開發票</p>
        <p className="font-medium">
          <CurrencyCell amount={order.invoiced_amount} />
        </p>
      </div>
      <div>
        <p className="text-sm text-morandi-secondary">可開金額</p>
        <p className="font-medium text-morandi-gold">
          <CurrencyCell amount={order.invoiceable_amount} />
        </p>
      </div>
    </div>

    {/* 已開發票列表 */}
    {invoices.length > 0 && (
      <div className="mt-4 border-t pt-4">
        <p className="text-sm text-morandi-secondary mb-2">已開立發票</p>
        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv.id} className="flex justify-between text-sm">
              <span>{inv.invoice_number || inv.transactionNo}</span>
              <CurrencyCell amount={inv.amount} />
            </div>
          ))}
        </div>
      </div>
    )}

    {/* 開立按鈕 */}
    {order.invoiceable_amount > 0 && (
      <div className="mt-4 pt-4 border-t">
        <Button
          onClick={() => setShowInvoiceDialog(true)}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
        >
          <FileText size={16} />
          開立發票
        </Button>
      </div>
    )}
  </CardContent>
</Card>
```

### 4.2 代轉發票頁面 - 批次開立功能

**位置**: `/finance/travel-invoice`

```tsx
// ResponsiveHeader 新增批次開立按鈕
<ResponsiveHeader
  title="代轉發票管理"
  icon={FileText}
  actions={
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => setShowBatchDialog(true)}
        className="gap-2"
      >
        <ListChecks size={16} />
        批次開立
      </Button>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
      >
        <Plus size={16} />
        開立發票
      </Button>
    </div>
  }
/>
```

### 4.3 批次開立 Dialog

**檔案**: `src/features/finance/travel-invoice/components/BatchInvoiceDialog.tsx`

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent level={1} className="max-w-4xl max-h-[90vh]">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <ListChecks size={20} />
        批次開立發票
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      {/* 團別選擇 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label>選擇團別</Label>
          <Combobox
            options={tourOptions}
            value={selectedTourId}
            onChange={setSelectedTourId}
            placeholder="選擇團別..."
          />
        </div>
      </div>

      {/* 訂單列表 */}
      {selectedTourId && (
        <div className="border rounded-lg">
          <div className="p-3 bg-morandi-container/40 border-b font-medium">
            待開發票訂單
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {orders.map(order => (
              <div
                key={order.id}
                className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedOrders.includes(order.id)}
                  onCheckedChange={(checked) => toggleOrder(order.id, checked)}
                  disabled={order.invoiceable_amount <= 0}
                />
                <div className="flex-1">
                  <div className="font-medium">{order.order_number}</div>
                  <div className="text-sm text-morandi-secondary">
                    {order.contact_person}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-morandi-secondary">可開金額</div>
                  <div className={cn(
                    "font-medium",
                    order.invoiceable_amount > 0 ? "text-morandi-gold" : "text-morandi-muted"
                  )}>
                    <CurrencyCell amount={order.invoiceable_amount} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 統計 */}
      {selectedOrders.length > 0 && (
        <div className="flex justify-between items-center p-4 bg-morandi-container/40 rounded-lg">
          <div>
            已選 <span className="font-bold">{selectedOrders.length}</span> 筆訂單
          </div>
          <div className="text-right">
            <div className="text-sm text-morandi-secondary">合計可開金額</div>
            <div className="text-xl font-bold text-morandi-gold">
              <CurrencyCell amount={totalAmount} />
            </div>
          </div>
        </div>
      )}

      {/* 買受人資訊 */}
      {selectedOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">發票資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="買受人名稱" required>
                <Input
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  placeholder="請輸入買受人名稱"
                />
              </FormField>
              <FormField label="統一編號">
                <Input
                  value={buyerUBN}
                  onChange={e => setBuyerUBN(e.target.value)}
                  placeholder="8 碼數字"
                />
              </FormField>
            </div>
            <FormField label="開立日期" required>
              <DatePicker
                value={invoiceDate}
                onChange={setInvoiceDate}
              />
            </FormField>
          </CardContent>
        </Card>
      )}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
        <X size={16} />
        取消
      </Button>
      <Button
        onClick={handleBatchIssue}
        disabled={selectedOrders.length === 0 || !buyerName || isLoading}
        className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
      >
        <Check size={16} />
        {isLoading ? '開立中...' : `開立 ${selectedOrders.length} 張發票`}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 五、檔案結構

### 5.1 新增/修改檔案

```
src/
├── app/
│   └── api/
│       └── travel-invoice/
│           ├── issue/route.ts          # 修改：支援多訂單
│           ├── orders/route.ts         # 新增：查詢可開發票訂單
│           └── batch-issue/route.ts    # 新增：批次開立
│
├── features/
│   └── finance/
│       └── travel-invoice/
│           ├── components/
│           │   ├── BatchInvoiceDialog.tsx     # 新增
│           │   ├── OrderInvoiceCard.tsx       # 新增：訂單頁面用
│           │   └── InvoiceOrdersTable.tsx     # 新增：發票關聯訂單表
│           ├── hooks/
│           │   ├── useInvoiceableOrders.ts    # 新增
│           │   └── useBatchInvoice.ts         # 新增
│           └── types.ts                        # 新增
│
├── stores/
│   └── useTravelInvoiceStore.ts        # 修改：新增批次開立
│
└── types/
    └── invoice.types.ts                # 新增
```

### 5.2 Migration 檔案

```
supabase/migrations/
└── 20260126000000_invoice_orders_table.sql
```

---

## 六、實作步驟

### Phase 1: 資料庫

- [ ] 建立 `invoice_orders` 表
- [ ] 建立 `orders_with_invoice_info` View
- [ ] 為 `travel_invoices` 新增 `workspace_id`
- [ ] 更新 TypeScript types

### Phase 2: API

- [ ] 修改 `/api/travel-invoice/issue` 支援多訂單
- [ ] 新增 `/api/travel-invoice/orders` 查詢 API
- [ ] 新增 `/api/travel-invoice/batch-issue` 批次 API

### Phase 3: Store

- [ ] 更新 `useTravelInvoiceStore`
- [ ] 新增 `useInvoiceableOrders` hook
- [ ] 新增批次開立功能

### Phase 4: UI - 訂單頁面

- [ ] 新增 `OrderInvoiceCard` 組件
- [ ] 在訂單詳情頁整合發票區塊
- [ ] 開立發票 Dialog 改用新 API

### Phase 5: UI - 代轉發票頁面

- [ ] 新增 `BatchInvoiceDialog` 組件
- [ ] 修改發票列表顯示關聯訂單
- [ ] 新增批次開立入口

### Phase 6: 測試與文件

- [ ] 測試單一訂單開立
- [ ] 測試多訂單合併開立
- [ ] 測試超開阻擋
- [ ] 更新 SITEMAP

---

## 七、注意事項

### 7.1 向後兼容

- 保留 `travel_invoices.order_id` 欄位
- 舊的單一訂單發票同時寫入 `order_id` 和 `invoice_orders`
- 查詢時優先使用 `invoice_orders` 表

### 7.2 權限控制

- 業務只能開立自己負責的訂單
- 財務可以開立所有訂單
- 透過 workspace_id 隔離不同公司

### 7.3 UI 規範遵循

- 所有 Dialog 必須設定 `level` 屬性
- 按鈕必須有圖標 + 文字
- 使用 `CurrencyCell` 顯示金額
- 使用 `DateCell` 顯示日期
- 主要按鈕使用 `bg-morandi-gold`

---

*設計文件結束*
