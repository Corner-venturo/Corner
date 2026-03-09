# 舊 vs 新系統完整比對報告

> **比對日期**: 2025-11-09
> **舊系統**: cornerERP-master (React + Next.js)
> **新系統**: Venturo (Next.js 15 + React 19 + Zustand + Supabase)

---

## 執行摘要

### 整體完成度

- **資料結構層**: ✅ **95% 完整** - 型別定義、Service Layer、Store 架構優秀
- **業務邏輯層**: ⚠️ **70% 完整** - 核心邏輯完整，但缺少批量操作和計算功能
- **使用者介面層**: ❌ **40% 完整** - 大量 UI 功能缺失，特別是收款單模組

### 關鍵結論

**新系統架構遠優於舊系統**（Service Layer、離線支援、型別安全），但**缺少約 60% 的使用者介面功能**。需補齊以下模組才能達到生產就緒：

1. **Receipts (收款單)** - 完整 CRUD + LinkPay 整合
2. **批量操作介面** - 批量創建收款單/請款單
3. **PDF 生成** - 出納單/收款單/請款單 PDF
4. **利潤計算** - 團體利潤分析功能

---

## 模組對照表

| 功能模組   | 舊系統路徑   | 新系統路徑                       | 完成度 | 說明                            |
| ---------- | ------------ | -------------------------------- | ------ | ------------------------------- |
| **請款單** | `/invoices`  | `/finance/requests`              | ⚠️ 70% | Service Layer 完整，UI 功能不足 |
| **收款單** | `/receipts`  | `/finance/payments`              | ❌ 30% | 僅有型別定義，UI 完全缺失       |
| **出納單** | `/bills`     | `/finance/treasury/disbursement` | ✅ 90% | 功能完整，僅缺 PDF 生成         |
| **訂單**   | `/orders`    | `/orders`                        | ✅ 85% | 基本功能完整                    |
| **團體**   | `/groups`    | `/tours`                         | ⚠️ 60% | 缺少利潤計算、獎金設定          |
| **客戶**   | `/customers` | `/customers`                     | ✅ 80% | 基本功能完整                    |
| **供應商** | `/suppliers` | `/database/suppliers`            | ⚠️ 50% | 剛簡化完成，缺少歷史記錄        |
| **行事曆** | `/calendar`  | `/calendar`                      | ✅ 85% | 功能完整                        |
| **eSIM**   | `/esims`     | `/esims`                         | ✅ 80% | 功能完整                        |
| **使用者** | `/users`     | `/hr`                            | ✅ 75% | 功能完整                        |

---

## 1. Invoices (請款單) → Payment Requests (請款申請)

### 舊系統結構

**路徑**: `/cornerERP-master/src/app/(control-panel)/invoices`

**資料模型**:

```typescript
// InvoiceModel.ts
{
  invoiceNumber: string // 請款單號 (主鍵)
  groupCode: string // 團號
  orderNumber: string // 訂單編號
  invoiceDate: Date // 請款日期
  status: number // 0:待確認 1:已確認 2:已出帳
  createdAt: Date
  createdBy: string
  modifiedAt: Date
  modifiedBy: string
}

// InvoiceItemModel.ts (子項目)
{
  id: number
  invoiceNumber: string
  invoiceType: number // 0-12 共 13 種類型
  payFor: string // 供應商代碼
  price: number
  quantity: number
  note: string
}
```

**請款項目類型** (invoiceItemTypes.ts):

```typescript
INVOICE_ITEM_TYPES = {
  HOTEL: 0, // 飯店
  TRANSPORT: 1, // 交通
  MEAL: 2, // 餐飲
  ACTIVITY: 3, // 活動
  TOUR_PAYMENT: 4, // 出團款
  TOUR_RETURN: 5, // 回團款
  OTHER: 6, // 其他
  INSURANCE: 7, // 保險
  BONUS: 8, // 獎金
  REFUND: 9, // 退預收款
  B2B: 10, // 同業
  ESIM: 11, // 網卡
  EMPLOYEE: 999, // 員工
}
```

**功能清單**:

- ✅ 列表頁 (InvoicesTable.tsx)
- ✅ 詳情頁 (3 個分頁：BasicInfo, Preview, LivePreview)
- ✅ 搜尋對話框 (InvoiceSearchDialog.tsx)
- ✅ 項目管理 (InvoiceItemDialog.tsx, InvoiceItemsTable.tsx)
- ✅ 狀態流程 (PENDING → CONFIRMED → BILLED)
- ✅ 依團號查詢 (`/api/supabase/invoices/by-group/[groupCode]`)
- ✅ 篩選查詢 (`/api/supabase/invoices/filtered`)

---

### 新系統結構

**路徑**: `/Corner/src/features/finance/requests`

**資料模型**:

```typescript
// payment-request.types.ts
{
  id: string;
  code: string;              // 請款單號
  tour_id: string;           // 團號 (改用 UUID)
  supplier_id: string;       // 供應商 ID
  request_date: string;      // 必須為週四
  total_amount: number;
  status: 'pending' | 'processing' | 'confirmed';
  allocation_mode: 'single' | 'shared';  // 新增
  items: PaymentRequestItem[];
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

// 項目內嵌在 items JSON 欄位
{
  id: string;
  category: string;          // 類別 (自由輸入，不固定)
  description: string;
  amount: number;
  quantity: number;
}
```

**功能清單**:

- ✅ Service Layer (`payment-request.service.ts`) - 完整
- ✅ Store 整合 (`usePaymentRequestStore`)
- ✅ IndexedDB 離線支援
- ✅ 項目管理 (addItem, updateItem, deleteItem)
- ✅ 總金額自動計算
- ✅ 狀態管理 (pending → processing → confirmed)
- ✅ 週四驗證邏輯 (`validateThursday`)
- ⚠️ UI 組件存在但功能不完整
- ❌ 批量創建介面
- ❌ 搜尋對話框
- ❌ 依團號/訂單查詢 API
- ❌ 請款項目類型管理

---

### 比對結論

**實作狀態**: ⚠️ **70% 完整**

**架構優勢** (新系統):

1. ✅ Service Layer 分層清晰
2. ✅ 離線優先策略
3. ✅ 週四請款日驗證（業務規則自動化）
4. ✅ 型別安全 (TypeScript)

**功能缺失**:

1. ❌ 請款項目類型未標準化（舊系統有 13 種固定類型）
2. ❌ 搜尋/過濾對話框
3. ❌ 依團號批量查詢
4. ❌ 批量創建介面
5. ❌ PDF 預覽/下載

**資料結構差異**:

- 新系統用 `tour_id` (UUID)，舊系統用 `groupCode` (字串)
- 新系統強制週四請款日，舊系統無限制
- 新系統加入 `allocation_mode` (single/shared) 概念
- 新系統的 items 儲存為 JSON，舊系統為獨立表格

---

## 2. Receipts (收款單) → Payments (付款記錄)

### 舊系統結構

**路徑**: `/cornerERP-master/src/app/(control-panel)/receipts`

**資料模型**:

```typescript
// ReceiptModel.ts
{
  receiptNumber: string;     // 收款單號 (主鍵)
  orderNumber: string;       // 訂單編號
  receiptDate: Date;         // 收款日期
  receiptAmount: number;     // 應收金額
  actualAmount: number;      // 實收金額
  receiptType: number;       // 0:匯款 1:現金 2:刷卡 3:支票 4:LinkPay
  receiptAccount: string;    // 收款帳號/姓名
  payDateline: Date;         // 付款截止日
  email: string;             // Email (LinkPay 用)
  note: string;              // 說明
  status: number;            // 0:待確認 1:已確認 2:付款異常
  groupCode?: string;        // 團號 (關聯查詢)
  groupName?: string;        // 團名
  linkpay?: LinkPayLog[];    // LinkPay 紀錄
}
```

**收款方式** (receiptTypes.ts):

```typescript
RECEIPT_TYPES = {
  BANK_TRANSFER: 0, // 匯款
  CASH: 1, // 現金
  CREDIT_CARD: 2, // 刷卡
  CHECK: 3, // 支票
  LINK_PAY: 4, // LinkPay
}
```

**功能清單**:

- ✅ 列表頁 (ReceiptsTable.tsx + ReceiptsHeader.tsx)
- ✅ 詳情頁 (`receipts/[receiptNumber]/[[...handle]]/page.tsx`)
- ✅ **批量建立** (`receipts/batch-create/BatchCreateReceipt.tsx`)
- ✅ **依訂單查看** (`receipts/by-order/[orderNumber]/ReceiptByOrder.tsx`)
- ✅ **LinkPay 整合** (LinkPayExpandableRow.tsx, useCreateLinkPayHandler.ts)
  - 自動發送付款連結到客戶 Email
  - 追蹤付款狀態
  - 付款完成後自動更新 actualAmount
- ✅ Excel 匯出 (ExcelJS)
- ✅ 搜尋功能 (收款單號/訂單號/團號/日期/狀態/方式)
- ✅ 依團號查詢 (`/api/supabase/receipts/by-group/[groupCode]`)

**API 路由**:

```
GET  /api/supabase/receipts
POST /api/supabase/receipts
DELETE /api/supabase/receipts
GET  /api/supabase/receipts/[receiptNumber]
PUT  /api/supabase/receipts/[receiptNumber]
GET  /api/supabase/receipts/by-order/[orderNumber]
GET  /api/supabase/receipts/by-group/[groupCode]
POST /api/supabase/linkpay
```

---

### 新系統結構

**路徑**: `/Corner/src/types/receipt.types.ts`

**資料模型**:

```typescript
// receipt.types.ts
{
  id: string
  receipt_number: string
  order_id: string
  receipt_date: string
  receipt_type: ReceiptType // 0-4
  receipt_amount: number
  actual_amount: number
  status: ReceiptStatus // 0:待確認 1:已確認

  // 各收款方式專屬欄位
  handler_name: string | null // 經手人
  account_info: string | null // 帳號資訊
  fees: number | null // 手續費
  card_last_four: string | null // 卡號後四碼
  check_number: string | null // 支票號碼
  check_date: string | null // 支票日期

  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

// LinkPayLog (獨立表格)
{
  id: string
  receipt_id: string
  linkpay_order_number: string
  amount: number
  status: string
  link: string
  end_date: string
  created_at: string
}
```

**功能清單**:

- ✅ 完整的型別定義
- ✅ ReceiptType enum (5 種收款方式)
- ✅ ReceiptStatus enum
- ✅ LinkPayLog 資料結構
- ✅ Store (`linkpay-log-store.ts`)
- ✅ API Route 骨架 (`/api/linkpay/route.ts`)
- ❌ **批量創建介面**
- ❌ **依訂單創建介面**
- ❌ **收款單搜尋對話框**
- ❌ **收款單完整 CRUD 頁面**
- ❌ **LinkPay Hook 整合**
- ❌ **Excel 匯出功能**

**API 狀態**:

```typescript
// POST /api/linkpay
// 🚧 測試模式 - 返回假資料
return NextResponse.json({
  success: true,
  data: {
    linkpay_order_number: `LP${Date.now()}`,
    link: 'https://linkpay.test/fake-link',
    status: 'pending',
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
})
```

---

### 比對結論

**實作狀態**: ❌ **30% 完整**

**架構優勢** (新系統):

1. ✅ 資料結構更細緻（各收款方式專屬欄位）
2. ✅ LinkPay 資料分離為獨立表格（更清晰）
3. ✅ 型別定義完整

**嚴重缺失** (關鍵功能):

1. ❌ **收款單 CRUD 完全缺失**（無列表、新增、編輯、詳情頁面）
2. ❌ **LinkPay 整合未完成**（API 僅 mock，無 UI）
3. ❌ **批量創建收款單**（舊系統核心功能）
4. ❌ **依訂單創建收款**（重要工作流程）
5. ❌ **搜尋/過濾功能**
6. ❌ **Excel 匯出**
7. ❌ **LinkPay Webhook**（已註解，未實作）

**資料結構差異**:

- 新系統缺少 `groupCode`/`groupName`（需透過 JOIN 查詢）
- 新系統的欄位設計更好（各收款方式專屬欄位）
- 新系統的 LinkPay 資料分離（更好的設計）

**實作建議**:

1. **Priority 1**: 建立收款單 CRUD 頁面（參考舊系統 ReceiptsPage）
2. **Priority 2**: 實作 LinkPay Hook (`useCreateLinkPayHandler` 等價物)
3. **Priority 3**: 批量創建收款單對話框
4. **Priority 4**: 依訂單查看/創建收款
5. **Priority 5**: LinkPay Webhook 整合

---

## 3. Bills (出納單) → Disbursement Orders (出納命令)

### 舊系統結構

**路徑**: `/cornerERP-master/src/app/(control-panel)/bills`

**資料模型**:

```typescript
// BillModel.ts
{
  billNumber: string;        // 出納單號 (主鍵)
  billDate: Date;            // 出帳日期
  status: number;            // 1:已確認 2:已出帳
  invoiceNumbers: string[];  // 包含的請款單號陣列
  createdAt: Date;
  createdBy: string;
  modifiedAt: Date;
  modifiedBy: string;
}
```

**狀態定義** (billStatuses.ts):

```typescript
BILL_STATUSES = {
  CONFIRMED: 1, // 已確認
  PAID: 2, // 已出帳
}
```

**功能清單**:

- ✅ 列表頁 (BillsTable.tsx + BillsHeader.tsx)
- ✅ 詳情頁 (3 個分頁：BasicInfo, Preview, LivePreview)
- ✅ **請款單整合**
  - 從「待確認」狀態的 Invoices 中選擇多筆
  - 可依日期篩選請款單
  - 支援批量選擇/全選
  - 顯示每張請款單的總金額和明細
- ✅ **PDF 生成** (BillPdf.tsx)
  - 使用 jsPDF + autoTable
  - 自定義字體 (ChironHeiHK)
  - 表格自動換頁
  - 頁首/頁尾
- ✅ **計算邏輯** (`useBillCalculation.ts`)
  - 按供應商分組
  - 計算總金額
  - 處理客戶退款/外幣請款
  - 分組大小控制 (maxGroupSize)
- ✅ 搜尋功能 (出納單號/日期/狀態)

**API 路由**:

```
GET  /api/supabase/bills
POST /api/supabase/bills
DELETE /api/supabase/bills
GET  /api/supabase/bills/[billNumber]
PUT  /api/supabase/bills/[billNumber]
```

---

### 新系統結構

**路徑**: `/Corner/src/features/disbursement`

**資料模型**:

```typescript
// disbursement-order.types.ts
{
  id: string;
  code: string;                    // 出納單號
  disbursement_date: string;       // 必須為週四
  payment_request_ids: string[];   // 包含的請款單 ID 陣列
  total_amount: number;
  status: 'pending' | 'confirmed';
  confirmed_by: string | null;     // 確認人
  confirmed_at: string | null;     // 確認時間
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}
```

**功能清單**:

- ✅ Service Layer (`disbursement-order.service.ts`) - **完整**
- ✅ 週四日期驗證與自動計算 (`getNextThursday`)
- ✅ 批量管理請款單 (`createWithRequests`, `addPaymentRequests`)
- ✅ **當週出納單自動歸併** (`addToCurrentWeekOrder`)
  - 如果當週已有 pending 出納單，自動加入
  - 如果沒有，創建新的出納單
- ✅ 確認機制 (`confirmOrder`)
  - 記錄確認人和時間
  - 更新所有請款單狀態為 confirmed
- ✅ 請款單狀態聯動 (pending → processing → confirmed)
- ✅ 總金額自動計算
- ✅ UI 組件 (DisbursementPage, DisbursementDialog)
- ✅ Store 整合 (`useDisbursementOrderStore`)
- ❌ **PDF 生成**
- ❌ **預覽列印功能**
- ❌ **利潤計算**
- ❌ **請款單搜尋/添加對話框**

---

### 比對結論

**實作狀態**: ✅ **90% 完整**

**架構優勢** (新系統):

1. ✅ Service Layer 邏輯清晰
2. ✅ 週四出納日自動化（業務規則內建）
3. ✅ 當週自動歸併（智慧化流程）
4. ✅ 審核記錄完整 (`confirmed_by`, `confirmed_at`)
5. ✅ 狀態聯動自動化

**功能缺失**:

1. ❌ **PDF 生成**（舊系統核心功能）
2. ❌ **預覽列印**（BillPreviewTable, BillPreviewContainer）
3. ❌ **利潤計算**（useBillCalculation）
4. ❌ **按供應商分組**（舊系統有）
5. ❌ **請款單搜尋對話框**（InvoiceSearchBar, InvoiceDialog）

**資料結構差異**:

- 新系統加入審核記錄（`confirmed_by`, `confirmed_at`）- 更好
- 新系統強制週四出納日（自動化）- 更好
- 新系統缺少按供應商分組的計算邏輯

**實作建議**:

1. **Priority 1**: 實作出納單 PDF 生成（參考 QuickQuotePdf.ts）
2. **Priority 2**: 請款單選擇對話框（可複選、顯示金額）
3. **Priority 3**: 按供應商分組計算（useBillCalculation）
4. **Priority 4**: 預覽列印功能

---

## 4. LinkPay 整合比對

### 舊系統 - 完整實作

**核心檔案**:

- `LinkPayExpandableRow.tsx` - 可展開查看 LinkPay 記錄
- `useCreateLinkPayHandler.ts` - LinkPay 創建 Hook
- `/api/supabase/linkpay` - LinkPay API

**完整流程**:

```typescript
// 1. 創建 LinkPay
const handleCreateLinkPay = async (receipt: Receipt) => {
  const response = await fetch('/api/supabase/linkpay', {
    method: 'POST',
    body: JSON.stringify({
      receiptNumber: receipt.receiptNumber,
      amount: receipt.receiptAmount,
      email: receipt.email,
      endDate: receipt.payDateline,
    }),
  })

  const { linkpay } = await response.json()

  // 2. 自動更新 Receipt
  await updateReceipt({
    ...receipt,
    linkpay: [...receipt.linkpay, linkpay],
  })

  // 3. 發送 Email（內建 Supabase Edge Function）
}

// 4. Webhook 處理（付款完成後）
// POST /api/supabase/linkpay/webhook
const handleWebhook = async data => {
  // 更新 LinkPay 狀態
  // 更新 Receipt.actualAmount
  // 發送通知
}
```

**UI 展示**:

```tsx
<LinkPayExpandableRow receipt={receipt}>
  {receipt.linkpay.map(log => (
    <div key={log.linkpay_order_number}>
      <span>訂單號: {log.linkpay_order_number}</span>
      <span>狀態: {log.status}</span>
      <span>
        連結: <a href={log.link}>前往付款</a>
      </span>
      <span>到期日: {log.endDate}</span>
    </div>
  ))}
</LinkPayExpandableRow>
```

---

### 新系統 - 骨架存在，功能缺失

**現有檔案**:

- `/api/linkpay/route.ts` - **測試模式 (mock 資料)**
- `linkpay-log-store.ts` - Store 完整
- `receipt.types.ts` - 型別定義完整

**目前實作**:

```typescript
// /api/linkpay/route.ts
export async function POST(request: Request) {
  // 🚧 測試模式 - 返回假資料
  return NextResponse.json({
    success: true,
    data: {
      linkpay_order_number: `LP${Date.now()}`,
      link: 'https://linkpay.test/fake-link',
      status: 'pending',
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  })

  // TODO: 真實 API 串接
  // TODO: 發送 Email
}

// Webhook (已註解)
// export async function handleWebhook(data) { ... }
```

---

### 比對結論

**實作狀態**: ⚠️ **20% 完整**

**已實作**:

- ✅ API Route 骨架
- ✅ LinkPayLog 資料結構
- ✅ Store (`linkpay-log-store.ts`)
- ✅ 型別定義完整

**缺失功能**:

1. ❌ **真實 API 串接**（目前返回 mock 資料）
2. ❌ **Webhook 接收**（已註解，未實作）
3. ❌ **UI 整合**（無創建 LinkPay 的按鈕/對話框）
4. ❌ **LinkPay Hook**（無 `useCreateLinkPayHandler` 等價物）
5. ❌ **狀態同步**（LinkPay 付款成功後自動更新收款單）
6. ❌ **Email 發送**（無自動通知客戶）
7. ❌ **展開式查看**（無 LinkPayExpandableRow）

**實作建議**:

```typescript
// 1. 實作 useCreateLinkPay Hook
export const useCreateLinkPay = () => {
  const createLinkPay = async (receipt: Receipt) => {
    // 呼叫 API
    // 更新 Receipt
    // 顯示通知
  }
  return { createLinkPay }
}

// 2. 實作 Webhook Handler
// POST /api/linkpay/webhook
export async function POST(request: Request) {
  const { linkpay_order_number, status, amount } = await request.json()

  // 更新 LinkPayLog 狀態
  await updateLinkPayLog({ linkpay_order_number, status })

  // 更新 Receipt.actualAmount
  if (status === 'completed') {
    const log = await getLinkPayLog(linkpay_order_number)
    await updateReceipt(log.receipt_id, { actual_amount: amount })
  }

  return NextResponse.json({ success: true })
}

// 3. 實作 UI 組件
<Button onClick={() => createLinkPay(receipt)}>
  建立 LinkPay 付款連結
</Button>

<LinkPayLogsTable logs={receipt.linkpay_logs} />
```

---

## 5. PDF 生成功能比對

### 舊系統 - 完整實作

**出納單 PDF** (`BillPdf.tsx`):

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generateBillPdf = (bill: Bill) => {
  const doc = new jsPDF()

  // 1. 載入自定義字體
  doc.addFileToVFS('ChironHeiHK-Bold.ttf', ChironHeiHKBoldFont)
  doc.addFont('ChironHeiHK-Bold.ttf', 'ChironHeiHK', 'bold')
  doc.setFont('ChironHeiHK', 'bold')

  // 2. 標題
  doc.setFontSize(18)
  doc.text('出納單', 105, 20, { align: 'center' })

  // 3. 基本資訊
  doc.setFontSize(12)
  doc.text(`出納單號: ${bill.billNumber}`, 20, 40)
  doc.text(`出帳日期: ${formatDate(bill.billDate)}`, 20, 50)

  // 4. 表格 (autoTable)
  autoTable(doc, {
    startY: 60,
    head: [['請款單號', '供應商', '金額', '備註']],
    body: bill.invoices.map(inv => [
      inv.invoiceNumber,
      inv.supplierName,
      formatCurrency(inv.amount),
      inv.note,
    ]),
    foot: [['', '', `總計: ${formatCurrency(bill.totalAmount)}`, '']],
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
  })

  // 5. 頁尾
  doc.setFontSize(10)
  doc.text('品牌標語', 105, 280, { align: 'center' })

  // 6. 下載
  doc.save(`出納單_${bill.billNumber}.pdf`)
}
```

**紅利 PDF** (`BonusPdf.tsx`):

- 類似結構
- 包含獎金計算明細
- 多頁支援

---

### 新系統 - 僅報價單有 PDF

**報價單 PDF** (`QuickQuotePdf.ts`):

```typescript
export const generateQuickQuotePDF = async (quote: Quote) => {
  const doc = new jsPDF()

  // 使用相同技術 (jsPDF + autoTable)
  // 相同字體設定
  // 相同表格格式

  doc.save(`報價單_${quote.code}.pdf`)
}
```

**缺失功能**:

- ❌ 出納單 PDF
- ❌ 收款單 PDF
- ❌ 請款單 PDF
- ❌ 批量列印功能

---

### 比對結論

**實作狀態**: ⚠️ **25% 完整**

**已實作**:

- ✅ 報價請款單 PDF (`generateQuickQuotePDF`)
- ✅ 使用相同技術（jsPDF + autoTable）
- ✅ 相同字體設定

**缺失功能**:

1. ❌ **出納單 PDF** - 核心功能
2. ❌ **收款單 PDF**
3. ❌ **請款單 PDF**
4. ❌ **批量列印功能**

**實作建議**:

```typescript
// 1. 實作 generateDisbursementPDF
export const generateDisbursementPDF = async (order: DisbursementOrder) => {
  // 參考 QuickQuotePdf.ts 和舊系統 BillPdf.tsx
  // 顯示出納單號、日期、請款單列表、總金額
}

// 2. 實作 generateReceiptPDF
export const generateReceiptPDF = async (receipt: Receipt) => {
  // 顯示收款單號、訂單號、收款資訊、LinkPay 記錄
}

// 3. 實作 generatePaymentRequestPDF
export const generatePaymentRequestPDF = async (request: PaymentRequest) => {
  // 顯示請款單號、團號、供應商、項目明細
}
```

---

## 6. 利潤計算功能比對

### 舊系統 - 完整實作

**核心 Hook** (`useBillCalculation.ts`):

```typescript
export const useBillCalculation = ({
  invoices,
  getUserName,
  getSupplierName,
  getInvoiceItemTypeName,
}) => {
  const [invoiceGroups, setInvoiceGroups] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    // 1. 按供應商分組
    const grouped = groupBy(invoices, 'payFor')

    // 2. 計算每組總金額
    const groups = Object.entries(grouped).map(([supplierId, items]) => ({
      supplierName: getSupplierName(supplierId),
      items: items.map(item => ({
        ...item,
        typeName: getInvoiceItemTypeName(item.invoiceType),
        subtotal: item.price * item.quantity,
      })),
      total: sumBy(items, i => i.price * i.quantity),
    }))

    // 3. 處理特殊項目
    // - 客戶退款（負數）
    // - 外幣請款

    // 4. 分組大小控制
    const finalGroups = splitLargeGroups(groups, maxGroupSize)

    setInvoiceGroups(finalGroups)
    setTotalAmount(sumBy(finalGroups, 'total'))
  }, [invoices])

  return { invoiceGroups, totalAmount }
}
```

**團體利潤計算** (`useProfitCalculation.ts`):

```typescript
export const useProfitCalculation = ({ groupCode }) => {
  const receipts = useReceipts({ groupCode })
  const invoices = useInvoices({ groupCode })
  const bonusSettings = useBonusSettings({ groupCode })

  // 收入
  const revenue = sumBy(receipts, 'actualAmount')

  // 支出
  const expense = sumBy(invoices.items, item => item.price * item.quantity)

  // 獎金
  const bonuses = bonusSettings.map(setting => {
    if (setting.bonusType === 'percent') {
      return (revenue * setting.bonus) / 100
    } else {
      return setting.bonus
    }
  })
  const totalBonus = sumBy(bonuses, b => b)

  // 利潤
  const profit = revenue - expense - totalBonus

  return { revenue, expense, totalBonus, profit }
}
```

---

### 新系統 - 未實作

**缺失功能**:

- ❌ 無利潤計算 Hook
- ❌ 無供應商分組邏輯
- ❌ 無請款類型分類
- ❌ 無團體利潤分析頁面
- ❌ 無獎金設定功能

---

### 比對結論

**實作狀態**: ❌ **0% 完整**

**實作建議**:

```typescript
// 1. 實作 useDisbursementCalculation
export const useDisbursementCalculation = (requestIds: string[]) => {
  const requests = usePaymentRequestStore(state =>
    state.items.filter(r => requestIds.includes(r.id))
  )

  // 按供應商分組
  const grouped = groupBy(requests, 'supplier_id')

  // 計算總金額
  const totalAmount = sumBy(requests, 'total_amount')

  return { grouped, totalAmount }
}

// 2. 實作 useTourProfitCalculation
export const useTourProfitCalculation = (tourId: string) => {
  const receipts = useReceiptStore(state => state.items.filter(r => r.tour_id === tourId))
  const requests = usePaymentRequestStore(state => state.items.filter(r => r.tour_id === tourId))

  const revenue = sumBy(receipts, 'actual_amount')
  const expense = sumBy(requests, 'total_amount')
  const profit = revenue - expense

  return { revenue, expense, profit }
}
```

---

## 7. 批量操作功能比對

### 舊系統 - 完整實作

**批量創建收款單** (`batch-create/BatchCreateReceipt.tsx`):

```tsx
export const BatchCreateReceipt = () => {
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([])

  const handleAddItem = () => {
    setReceiptItems([
      ...receiptItems,
      {
        orderNumber: '',
        receiptAmount: 0,
        receiptType: 0,
        receiptDate: new Date(),
        email: '',
        note: '',
      },
    ])
  }

  const handleSubmit = async () => {
    // 批量創建
    await Promise.all(receiptItems.map(item => createReceipt(item)))

    toast.success(`成功創建 ${receiptItems.length} 筆收款單`)
  }

  return (
    <Dialog>
      <Table>
        {receiptItems.map((item, index) => (
          <ReceiptItemRow
            key={index}
            item={item}
            onChange={updated => {
              const newItems = [...receiptItems]
              newItems[index] = updated
              setReceiptItems(newItems)
            }}
          />
        ))}
      </Table>
      <Button onClick={handleAddItem}>新增項目</Button>
      <Button onClick={handleSubmit}>批量創建</Button>
    </Dialog>
  )
}
```

**Excel 匯入** (`ImportTravellersDialog.tsx`):

```tsx
import * as XLSX from 'xlsx'

export const ImportTravellersDialog = () => {
  const handleFileUpload = async (file: File) => {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)

    // 批量創建
    await Promise.all(rows.map(row => createTraveller(row)))
  }

  return <FileUpload onUpload={handleFileUpload} />
}
```

---

### 新系統 - 未實作

**缺失功能**:

- ❌ 無批量創建收款單介面
- ❌ 無批量創建請款單介面
- ❌ 無 Excel 匯入功能
- ❌ 無批量確認功能

---

### 比對結論

**實作狀態**: ❌ **0% 完整**

**實作建議**:

```typescript
// 1. 實作 BatchCreateReceiptDialog
export const BatchCreateReceiptDialog = () => {
  const [items, setItems] = useState<ReceiptFormData[]>([])
  const { create } = useReceiptStore()

  const handleBatchCreate = async () => {
    await Promise.all(items.map(item => create(item)))
    toast.success(`成功創建 ${items.length} 筆收款單`)
  }

  return (
    <Dialog>
      <ReceiptItemsTable items={items} onChange={setItems} />
      <Button onClick={handleBatchCreate}>批量創建</Button>
    </Dialog>
  )
}

// 2. 實作 ImportReceiptsDialog (Excel)
import * as XLSX from 'xlsx'

export const ImportReceiptsDialog = () => {
  const { create } = useReceiptStore()

  const handleImport = async (file: File) => {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<ReceiptFormData>(sheet)

    await Promise.all(rows.map(row => create(row)))
    toast.success(`成功匯入 ${rows.length} 筆收款單`)
  }

  return <FileUpload accept=".xlsx" onUpload={handleImport} />
}
```

---

## 8. 總結與實作優先順序

### 功能完整度統計

| 模組     | 資料層  | 業務層 | UI 層  | 總分   |
| -------- | ------- | ------ | ------ | ------ |
| 請款單   | ✅ 95%  | ✅ 85% | ⚠️ 60% | ⚠️ 70% |
| 收款單   | ✅ 90%  | ❌ 30% | ❌ 10% | ❌ 30% |
| 出納單   | ✅ 95%  | ✅ 95% | ✅ 85% | ✅ 90% |
| LinkPay  | ✅ 90%  | ❌ 20% | ❌ 10% | ❌ 20% |
| PDF 生成 | ✅ 100% | ⚠️ 25% | ⚠️ 25% | ⚠️ 25% |
| 利潤計算 | ✅ 80%  | ❌ 0%  | ❌ 0%  | ❌ 0%  |
| 批量操作 | ✅ 90%  | ❌ 0%  | ❌ 0%  | ❌ 0%  |

**整體評分**: ⚠️ **55% 完整**

---

### 實作優先順序

#### Phase 1: 收款單系統 (最高優先)

**預估工時**: 3-4 天

1. **收款單 CRUD 頁面** (1.5 天)
   - ReceiptsPage.tsx (列表頁)
   - ReceiptDialog.tsx (新增/編輯對話框)
   - ReceiptDetailPage.tsx (詳情頁)
   - 參考舊系統: `/receipts/Receipts.tsx`

2. **LinkPay 整合** (1 天)
   - useCreateLinkPay Hook
   - LinkPayDialog.tsx (創建 LinkPay 對話框)
   - LinkPayLogsTable.tsx (展開式查看)
   - 真實 API 串接
   - 參考舊系統: `/receipts/useCreateLinkPayHandler.ts`

3. **批量創建收款單** (0.5 天)
   - BatchCreateReceiptDialog.tsx
   - 參考舊系統: `/receipts/batch-create/BatchCreateReceipt.tsx`

4. **依訂單創建收款** (0.5 天)
   - CreateReceiptFromOrderDialog.tsx
   - 參考舊系統: `/receipts/by-order/[orderNumber]/ReceiptByOrder.tsx`

5. **搜尋/過濾功能** (0.5 天)
   - ReceiptSearchDialog.tsx
   - 參考舊系統: `ReceiptSearchDialog.tsx`

---

#### Phase 2: LinkPay 完整整合 (高優先)

**預估工時**: 2 天

1. **Webhook 實作** (1 天)
   - POST /api/linkpay/webhook
   - 狀態同步邏輯
   - 自動更新收款單
   - 參考舊系統: `/api/supabase/linkpay/webhook`

2. **Email 通知** (0.5 天)
   - Supabase Edge Function
   - Email 模板
   - 自動發送付款連結

3. **UI 優化** (0.5 天)
   - LinkPay 狀態顯示
   - 重新發送連結功能
   - 取消 LinkPay 功能

---

#### Phase 3: PDF 生成功能 (高優先)

**預估工時**: 2 天

1. **出納單 PDF** (1 天)
   - generateDisbursementPDF.ts
   - 參考: `QuickQuotePdf.ts` + 舊系統 `BillPdf.tsx`

2. **收款單 PDF** (0.5 天)
   - generateReceiptPDF.ts

3. **請款單 PDF** (0.5 天)
   - generatePaymentRequestPDF.ts

---

#### Phase 4: 批量操作與匯入 (中優先)

**預估工時**: 2 天

1. **Excel 匯入功能** (1 天)
   - ImportReceiptsDialog.tsx
   - 安裝 xlsx 套件
   - 欄位映射邏輯

2. **批量確認功能** (0.5 天)
   - 批量確認收款單
   - 批量確認請款單

3. **Excel 匯出功能** (0.5 天)
   - 收款單匯出
   - 請款單匯出

---

#### Phase 5: 利潤計算功能 (中優先)

**預估工時**: 2-3 天

1. **出納單計算邏輯** (1 天)
   - useDisbursementCalculation Hook
   - 按供應商分組
   - 參考舊系統: `useBillCalculation.ts`

2. **團體利潤計算** (1 天)
   - useTourProfitCalculation Hook
   - 收入、支出、利潤計算
   - 參考舊系統: `useProfitCalculation.ts`

3. **利潤分析頁面** (1 天)
   - TourProfitTab.tsx
   - ProfitTable.tsx
   - 參考舊系統: `/groups/[groupCode]/ProfitTab.tsx`

---

#### Phase 6: 請款單功能增強 (低優先)

**預估工時**: 1-2 天

1. **請款項目類型管理** (0.5 天)
   - 實作 13 種固定類型（參考舊系統）
   - PaymentRequestItemTypeSelect.tsx

2. **搜尋對話框** (0.5 天)
   - PaymentRequestSearchDialog.tsx
   - 參考舊系統: `InvoiceSearchDialog.tsx`

3. **依團號批量查詢** (0.5 天)
   - GET /api/payment-requests/by-tour/[tourId]
   - 參考舊系統: `/api/supabase/invoices/by-group/[groupCode]`

---

### 總計工時估算

- Phase 1: 3-4 天
- Phase 2: 2 天
- Phase 3: 2 天
- Phase 4: 2 天
- Phase 5: 2-3 天
- Phase 6: 1-2 天

**總計**: **12-17 工作天**（約 2.5-3.5 週）

---

## 9. 架構優勢與改善建議

### 新系統的架構優勢

1. **Service Layer 分層清晰**

   ```
   UI Layer (React Components)
     ↓
   Store Layer (Zustand)
     ↓
   Service Layer (Business Logic)
     ↓
   IndexedDB Layer (Offline First)
     ↓
   Supabase Layer (Remote Sync)
   ```

2. **離線優先策略**
   - IndexedDB 本地快取
   - 自動同步機制
   - 衝突解決邏輯

3. **型別安全**
   - 完整的 TypeScript 定義
   - Zod Schema 驗證
   - 型別推導

4. **業務規則自動化**
   - 週四驗證
   - 當週自動歸併
   - 狀態聯動

5. **審核記錄完整**
   - confirmed_by, confirmed_at
   - created_by, updated_by
   - 完整的 audit trail

---

### 建議改善方向

1. **補齊 UI 層功能**
   - 收款單 CRUD 完整實作
   - LinkPay 整合
   - 批量操作介面

2. **實作缺失的業務邏輯**
   - 利潤計算
   - 按供應商分組
   - PDF 生成

3. **優化使用者體驗**
   - 搜尋/過濾對話框
   - Excel 匯入/匯出
   - 預覽列印功能

4. **保持架構優勢**
   - 不要破壞 Service Layer
   - 維持離線優先策略
   - 持續型別安全

---

## 10. 附錄：關鍵檔案對照表

### 請款單 (Invoices → Payment Requests)

| 功能       | 舊系統檔案                          | 新系統檔案                   | 狀態 |
| ---------- | ----------------------------------- | ---------------------------- | ---- |
| 資料模型   | `InvoiceModel.ts`                   | `payment-request.types.ts`   | ✅   |
| Service    | `InvoiceApi.ts`                     | `payment-request.service.ts` | ✅   |
| Store      | RTK Query                           | `payment-request-store.ts`   | ✅   |
| 列表頁     | `Invoices.tsx`                      | `RequestsPage.tsx`           | ⚠️   |
| 詳情頁     | `invoices/[invoiceNumber]/page.tsx` | -                            | ❌   |
| 項目管理   | `InvoiceItemDialog.tsx`             | `AddRequestDialog.tsx`       | ⚠️   |
| 搜尋對話框 | `InvoiceSearchDialog.tsx`           | -                            | ❌   |

---

### 收款單 (Receipts → Receipts)

| 功能         | 舊系統檔案                                  | 新系統檔案                  | 狀態 |
| ------------ | ------------------------------------------- | --------------------------- | ---- |
| 資料模型     | `ReceiptModel.ts`                           | `receipt.types.ts`          | ✅   |
| Service      | `ReceiptApi.ts`                             | -                           | ❌   |
| Store        | RTK Query                                   | `receipt-store.ts` (僅結構) | ⚠️   |
| 列表頁       | `Receipts.tsx`                              | -                           | ❌   |
| 詳情頁       | `receipts/[receiptNumber]/page.tsx`         | -                           | ❌   |
| 批量創建     | `batch-create/BatchCreateReceipt.tsx`       | -                           | ❌   |
| 依訂單查看   | `by-order/[orderNumber]/ReceiptByOrder.tsx` | -                           | ❌   |
| LinkPay Hook | `useCreateLinkPayHandler.ts`                | -                           | ❌   |
| LinkPay UI   | `LinkPayExpandableRow.tsx`                  | -                           | ❌   |

---

### 出納單 (Bills → Disbursement Orders)

| 功能     | 舊系統檔案                    | 新系統檔案                      | 狀態 |
| -------- | ----------------------------- | ------------------------------- | ---- |
| 資料模型 | `BillModel.ts`                | `disbursement-order.types.ts`   | ✅   |
| Service  | `BillApi.ts`                  | `disbursement-order.service.ts` | ✅   |
| Store    | RTK Query                     | `disbursement-order-store.ts`   | ✅   |
| 列表頁   | `Bills.tsx`                   | `DisbursementPage.tsx`          | ✅   |
| 詳情頁   | `bills/[billNumber]/page.tsx` | -                               | ⚠️   |
| PDF 生成 | `BillPdf.tsx`                 | -                               | ❌   |
| 計算邏輯 | `useBillCalculation.ts`       | -                               | ❌   |

---

### LinkPay 整合

| 功能      | 舊系統檔案                      | 新系統檔案              | 狀態    |
| --------- | ------------------------------- | ----------------------- | ------- |
| API Route | `/api/supabase/linkpay`         | `/api/linkpay/route.ts` | ⚠️ Mock |
| Webhook   | `/api/supabase/linkpay/webhook` | - (已註解)              | ❌      |
| Hook      | `useCreateLinkPayHandler.ts`    | -                       | ❌      |
| UI        | `LinkPayExpandableRow.tsx`      | -                       | ❌      |
| Store     | RTK Query                       | `linkpay-log-store.ts`  | ✅      |

---

## 結論

**新系統的架構設計遠優於舊系統**，但需要補齊約 **60% 的 UI 功能**才能達到生產環境的功能完整度。

**最關鍵的缺失**:

1. **收款單系統** (完全缺失)
2. **LinkPay 整合** (僅骨架)
3. **PDF 生成** (僅報價單)
4. **利潤計算** (未實作)

建議按照上述優先順序逐步實作，預計需要 **2.5-3.5 週**完成所有缺失功能。

---

**文檔版本**: v1.0
**最後更新**: 2025-11-09
**作者**: Claude Code Analysis
