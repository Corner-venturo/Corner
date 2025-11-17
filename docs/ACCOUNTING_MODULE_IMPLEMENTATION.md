# 會計模組完整實作規劃

> **建立日期**：2025-01-17
> **目標**：建立專業的會計系統模組，整合現有的請款/收款功能

---

## 📋 目錄

1. [系統架構](#系統架構)
2. [資料表設計](#資料表設計)
3. [路由規劃](#路由規劃)
4. [權限控制](#權限控制)
5. [系統串聯點](#系統串聯點)
6. [自動拋轉邏輯](#自動拋轉邏輯)
7. [開發清單](#開發清單)

---

## 🏗️ 系統架構

### 核心概念

```
Venturo ERP
├── 基礎功能（所有客戶都有）
│   ├── 報價管理
│   ├── 訂單管理
│   ├── 請款管理（簡易版）
│   └── 收款記錄（簡易版）
│
└── 🆕 會計模組（加購功能）
    ├── 會計科目表
    ├── 傳票管理
    ├── 總帳系統
    ├── 應收應付管理
    └── 財務報表
```

### 資料流向

```
業務流程                     會計流程
────────────────────────────────────────
報價 (Quote)                 （不產生傳票）
   ↓
訂單 (Order)                 （不產生傳票）
   ↓
收款 (Payment)    ─────→    自動拋轉傳票
   ↓                         借：銀行存款
                             貸：團費收入
請款 (Payment Request) ─→   自動拋轉傳票
   ↓                         借：旅遊成本
                             貸：應付帳款
付款確認           ─────→    自動拋轉傳票
                             借：應付帳款
                             貸：銀行存款
```

---

## 🗄️ 資料表設計

### 1. workspace_modules（模組授權表）

控制哪些 workspace 可以使用會計模組。

```sql
CREATE TABLE workspace_modules (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  module_name VARCHAR(50), -- 'accounting', 'inventory', 'bi_analytics'
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- NULL = 永久授權
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**用途**：
- 控制模組顯示/隱藏
- 計費依據
- 功能權限控制

### 2. accounting_subjects（會計科目表）

```sql
CREATE TABLE accounting_subjects (
  id UUID PRIMARY KEY,
  workspace_id UUID, -- NULL = 系統預設科目
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20), -- 'asset', 'liability', 'equity', 'revenue', 'expense'
  parent_id UUID,
  level INTEGER DEFAULT 1,
  is_system BOOLEAN DEFAULT false, -- 系統預設科目（不可刪除）
  is_active BOOLEAN DEFAULT true
);
```

**預設科目**（已在 migration 中建立）：
- `1101` 現金
- `1102` 銀行存款
- `1103` 應收帳款
- `2101` 應付帳款
- `4101` 團費收入
- `5101~5106` 旅遊成本（交通、住宿、餐飲、門票、保險、其他）
- `6101~6104` 營業費用（薪資、租金、水電、行銷）

### 3. vouchers（傳票主檔）

```sql
CREATE TABLE vouchers (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  voucher_no VARCHAR(50) NOT NULL, -- V202501001
  voucher_date DATE NOT NULL,
  type VARCHAR(20), -- 'manual', 'auto'
  source_type VARCHAR(50), -- 'payment_request', 'order_payment', 'manual'
  source_id UUID, -- 來源單據 ID
  description TEXT,
  total_debit DECIMAL(15, 2) DEFAULT 0,
  total_credit DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'posted', 'void'
  created_by UUID,
  posted_by UUID,
  posted_at TIMESTAMPTZ
);
```

**狀態說明**：
- `draft` 草稿：可修改、可刪除
- `posted` 已過帳：不可修改、計入總帳
- `void` 作廢：標記刪除、保留紀錄

### 4. voucher_entries（傳票明細/分錄）

```sql
CREATE TABLE voucher_entries (
  id UUID PRIMARY KEY,
  voucher_id UUID REFERENCES vouchers(id),
  entry_no INTEGER NOT NULL, -- 分錄序號
  subject_id UUID REFERENCES accounting_subjects(id),
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  description TEXT,
  CONSTRAINT check_debit_credit CHECK (
    (debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0)
  )
);
```

**檢查規則**：
- 每筆分錄必須 「借方 > 0 且貸方 = 0」 或 「借方 = 0 且貸方 > 0」
- 傳票的 總借方 = 總貸方（借貸平衡）

### 5. general_ledger（總帳）

```sql
CREATE TABLE general_ledger (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  subject_id UUID REFERENCES accounting_subjects(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  opening_balance DECIMAL(15, 2) DEFAULT 0, -- 期初餘額
  total_debit DECIMAL(15, 2) DEFAULT 0,     -- 本期借方合計
  total_credit DECIMAL(15, 2) DEFAULT 0,    -- 本期貸方合計
  closing_balance DECIMAL(15, 2) DEFAULT 0  -- 期末餘額
);
```

**自動計算邏輯**：
- 傳票過帳時，自動更新對應科目的總帳
- `期末餘額 = 期初餘額 + 借方合計 - 貸方合計`（資產、費用）
- `期末餘額 = 期初餘額 + 貸方合計 - 借方合計`（負債、收入、權益）

---

## 🛣️ 路由規劃

### 主選單結構

```
📊 財務管理（需會計模組授權）
├── 會計科目表      /accounting/subjects
├── 傳票管理
│   ├── 手工傳票    /accounting/vouchers/manual
│   ├── 傳票查詢    /accounting/vouchers
│   └── 自動拋轉設定 /accounting/auto-rules
├── 總帳查詢        /accounting/ledger
├── 應收帳款        /accounting/receivables
├── 應付帳款        /accounting/payables
└── 財務報表
    ├── 試算表      /accounting/reports/trial-balance
    ├── 損益表      /accounting/reports/income-statement
    └── 資產負債表  /accounting/reports/balance-sheet
```

### 頁面檔案結構

```
src/app/accounting/
├── layout.tsx                 # 會計模組佈局（檢查權限）
├── subjects/
│   └── page.tsx              # 會計科目表
├── vouchers/
│   ├── page.tsx              # 傳票查詢列表
│   ├── manual/
│   │   └── page.tsx          # 手工傳票輸入
│   └── [id]/
│       └── page.tsx          # 傳票詳細
├── ledger/
│   └── page.tsx              # 總帳查詢
├── receivables/
│   └── page.tsx              # 應收帳款
├── payables/
│   └── page.tsx              # 應付帳款
└── reports/
    ├── trial-balance/
    │   └── page.tsx          # 試算表
    ├── income-statement/
    │   └── page.tsx          # 損益表
    └── balance-sheet/
        └── page.tsx          # 資產負債表
```

---

## 🔐 權限控制

### 1. 模組授權檢查

```typescript
// src/hooks/useAccountingModule.ts
export function useAccountingModule() {
  const { user } = useAuthStore()
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkModule = async () => {
      const { data } = await supabase
        .from('workspace_modules')
        .select('*')
        .eq('workspace_id', user.workspace_id)
        .eq('module_name', 'accounting')
        .eq('is_enabled', true)
        .single()

      // 檢查是否過期
      const isValid = !data?.expires_at || new Date(data.expires_at) > new Date()

      setIsEnabled(!!data && isValid)
      setIsLoading(false)
    }
    checkModule()
  }, [user.workspace_id])

  return { isEnabled, isLoading }
}
```

### 2. Layout 權限防護

```typescript
// src/app/accounting/layout.tsx
'use client'

import { useAccountingModule } from '@/hooks/useAccountingModule'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AccountingLayout({ children }: { children: React.Node }) {
  const { isEnabled, isLoading } = useAccountingModule()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isEnabled) {
      toast.error('此功能需要加購會計模組')
      router.push('/')
    }
  }, [isEnabled, isLoading, router])

  if (isLoading) {
    return <div>載入中...</div>
  }

  if (!isEnabled) {
    return null
  }

  return (
    <div className="h-full flex flex-col">
      {children}
    </div>
  )
}
```

### 3. 功能權限（employees.permissions）

```typescript
// 會計功能細分權限
const ACCOUNTING_PERMISSIONS = {
  VIEW_SUBJECTS: 'accounting:view_subjects',       // 查看科目表
  MANAGE_SUBJECTS: 'accounting:manage_subjects',   // 管理科目表
  CREATE_VOUCHER: 'accounting:create_voucher',     // 建立傳票
  POST_VOUCHER: 'accounting:post_voucher',         // 過帳傳票
  VOID_VOUCHER: 'accounting:void_voucher',         // 作廢傳票
  VIEW_REPORTS: 'accounting:view_reports',         // 查看報表
}
```

**權限檢查範例**：
```typescript
// 只有會計主管可以過帳
const canPost = user.permissions.includes('accounting:post_voucher')

<Button
  disabled={!canPost}
  onClick={handlePostVoucher}
>
  過帳
</Button>
```

---

## 🔗 系統串聯點

### 串聯點 1：訂單收款 → 傳票

**觸發時機**：`orders` 表格的 `payment_status` 從 `unpaid` 改為 `paid`

**位置**：`src/stores/order-store.ts` 或 `src/app/orders/[id]/page.tsx`

```typescript
// 收款時觸發
async function handlePayment(orderId: string, paymentAmount: number, paymentDate: string) {
  // 1. 更新訂單狀態
  await orderStore.update(orderId, {
    payment_status: 'paid',
    paid_amount: paymentAmount,
    paid_at: paymentDate,
  })

  // 2. 檢查是否啟用會計模組
  const { isEnabled } = await checkAccountingModule()
  if (!isEnabled) return

  // 3. 自動拋轉傳票
  await VoucherAutoGenerator.generateFromOrderPayment({
    order_id: orderId,
    amount: paymentAmount,
    payment_date: paymentDate,
  })
}
```

**拋轉傳票內容**：
```
借：銀行存款 (1102)     $100,000
貸：團費收入 (4101)     $100,000
摘要：訂單 O202501001 收款
```

### 串聯點 2：請款單 → 傳票

**觸發時機**：`payment_requests` 表格新增資料時

**位置**：`src/stores/payment-request-store.ts`

```typescript
// 請款時觸發
async function createPaymentRequest(data: PaymentRequestCreate) {
  // 1. 建立請款單
  const request = await paymentRequestStore.create(data)

  // 2. 檢查是否啟用會計模組
  const { isEnabled } = await checkAccountingModule()
  if (!isEnabled) return

  // 3. 自動拋轉傳票
  await VoucherAutoGenerator.generateFromPaymentRequest(request)
}
```

**拋轉傳票內容**：
```
借：旅遊成本-住宿 (5102)  $50,000
貸：應付帳款 (2101)       $50,000
摘要：請款單 PR202501001 - 台北喜來登飯店
```

### 串聯點 3：付款確認 → 傳票

**觸發時機**：`payment_requests` 的 `status` 從 `confirmed` 改為 `paid`

```typescript
// 付款確認時觸發
async function confirmPayment(requestId: string, paymentDate: string) {
  // 1. 更新請款單狀態
  await paymentRequestStore.update(requestId, {
    status: 'paid',
    paid_at: paymentDate,
  })

  // 2. 檢查是否啟用會計模組
  const { isEnabled } = await checkAccountingModule()
  if (!isEnabled) return

  // 3. 自動拋轉傳票
  const request = await paymentRequestStore.getById(requestId)
  await VoucherAutoGenerator.generateFromPayment(request)
}
```

**拋轉傳票內容**：
```
借：應付帳款 (2101)      $50,000
貸：銀行存款 (1102)      $50,000
摘要：付款 - 請款單 PR202501001
```

### 串聯點 4：報表整合

**位置**：財務儀表板 `/dashboard/finance`

```typescript
// 顯示會計模組的財務摘要
function FinanceDashboard() {
  const { isEnabled } = useAccountingModule()

  if (!isEnabled) {
    // 顯示簡易版財務資訊（從 orders 和 payment_requests 計算）
    return <SimpleFi nanceStats />
  }

  // 顯示專業版財務資訊（從總帳計算）
  return <ProFinanceStats />
}
```

---

## ⚙️ 自動拋轉邏輯

### 拋轉規則配置

```typescript
// src/services/voucher-auto-rules.ts
export const AUTO_VOUCHER_RULES = {
  // 訂單收款
  ORDER_PAYMENT: {
    debit: '1102',  // 銀行存款
    credit: '4101', // 團費收入
    description: (order: Order) => `訂單 ${order.code} 收款`
  },

  // 請款單（依供應商類型區分）
  PAYMENT_REQUEST: {
    transportation: {
      debit: '5101',  // 旅遊成本-交通
      credit: '2101', // 應付帳款
    },
    accommodation: {
      debit: '5102',  // 旅遊成本-住宿
      credit: '2101',
    },
    meal: {
      debit: '5103',  // 旅遊成本-餐飲
      credit: '2101',
    },
    ticket: {
      debit: '5104',  // 旅遊成本-門票
      credit: '2101',
    },
    insurance: {
      debit: '5105',  // 旅遊成本-保險
      credit: '2101',
    },
    other: {
      debit: '5106',  // 旅遊成本-其他
      credit: '2101',
    },
  },

  // 付款確認
  PAYMENT_CONFIRM: {
    debit: '2101',  // 應付帳款
    credit: '1102', // 銀行存款
    description: (request: PaymentRequest) => `付款 - ${request.code}`
  },
}
```

### 自動拋轉 Service

```typescript
// src/services/voucher-auto-generator.ts
export class VoucherAutoGenerator {
  // 訂單收款拋轉
  static async generateFromOrderPayment(data: {
    order_id: string
    amount: number
    payment_date: string
  }) {
    const order = await orderStore.getById(data.order_id)
    const rule = AUTO_VOUCHER_RULES.ORDER_PAYMENT

    const voucher = {
      voucher_date: data.payment_date,
      type: 'auto' as const,
      source_type: 'order_payment',
      source_id: data.order_id,
      description: rule.description(order),
      entries: [
        {
          entry_no: 1,
          subject_id: rule.debit,
          debit: data.amount,
          credit: 0,
        },
        {
          entry_no: 2,
          subject_id: rule.credit,
          debit: 0,
          credit: data.amount,
        },
      ],
    }

    return await voucherStore.create(voucher)
  }

  // 請款單拋轉
  static async generateFromPaymentRequest(request: PaymentRequest) {
    // 依供應商類型選擇規則
    const supplierType = request.supplier_type || 'other'
    const rule = AUTO_VOUCHER_RULES.PAYMENT_REQUEST[supplierType]

    const voucher = {
      voucher_date: request.request_date,
      type: 'auto' as const,
      source_type: 'payment_request',
      source_id: request.id,
      description: `請款 - ${request.supplier_name}`,
      entries: [
        {
          entry_no: 1,
          subject_id: rule.debit,
          debit: request.total_amount,
          credit: 0,
        },
        {
          entry_no: 2,
          subject_id: rule.credit,
          debit: 0,
          credit: request.total_amount,
        },
      ],
    }

    return await voucherStore.create(voucher)
  }
}
```

---

## ✅ 開發清單

### Phase 1：基礎架構（1-2 天）

- [ ] 執行 Migration（建立資料表）
- [ ] 建立 TypeScript 型別 (`src/types/accounting-pro.types.ts`)
- [ ] 建立 Zustand Stores
  - [ ] `useAccountingSubjectStore`
  - [ ] `useVoucherStore`
  - [ ] `useGeneralLedgerStore`
- [ ] 建立權限檢查 Hook (`useAccountingModule`)
- [ ] 建立 Layout (`src/app/accounting/layout.tsx`)

### Phase 2：會計科目管理（1 天）

- [ ] 會計科目列表頁面 (`/accounting/subjects`)
  - [ ] 樹狀結構顯示
  - [ ] 新增/編輯/刪除科目
  - [ ] 系統科目鎖定（不可刪除）

### Phase 3：傳票管理（2-3 天）

- [ ] 手工傳票輸入 (`/accounting/vouchers/manual`)
  - [ ] 借貸平衡檢查
  - [ ] 科目選擇器
  - [ ] 分錄動態新增/刪除
- [ ] 傳票查詢列表 (`/accounting/vouchers`)
  - [ ] 日期範圍篩選
  - [ ] 狀態篩選
  - [ ] 來源單據追蹤
- [ ] 傳票詳細頁 (`/accounting/vouchers/[id]`)
  - [ ] 過帳功能
  - [ ] 作廢功能
  - [ ] 列印功能

### Phase 4：自動拋轉整合（2-3 天）

- [ ] 建立 `VoucherAutoGenerator` Service
- [ ] 訂單收款串接
  - [ ] 修改 `order-store.ts`
  - [ ] 測試收款拋轉
- [ ] 請款單串接
  - [ ] 修改 `payment-request-store.ts`
  - [ ] 依供應商類型拋轉
- [ ] 付款確認串接

### Phase 5：總帳與報表（3-4 天）

- [ ] 總帳查詢頁面
- [ ] 試算表
- [ ] 損益表
- [ ] 資產負債表

### Phase 6：應收應付（2 天）

- [ ] 應收帳款明細
- [ ] 應付帳款明細
- [ ] 帳齡分析

---

## 🔧 技術細節

### Store 建立範例

```typescript
// src/stores/accounting-subject-store.ts
import { createStore } from './create-store-main'
import type { AccountingSubject } from '@/types/accounting-pro.types'

export const useAccountingSubjectStore = createStore<AccountingSubject>(
  'accounting_subjects',
  'AS'
)

// 樹狀結構轉換
export function buildSubjectTree(subjects: AccountingSubject[]): AccountingSubjectNode[] {
  const rootSubjects = subjects.filter(s => !s.parent_id)

  function buildChildren(parentId: string): AccountingSubjectNode[] {
    return subjects
      .filter(s => s.parent_id === parentId)
      .map(s => ({
        ...s,
        children: buildChildren(s.id),
      }))
  }

  return rootSubjects.map(s => ({
    ...s,
    children: buildChildren(s.id),
  }))
}
```

### 傳票過帳邏輯

```typescript
// src/services/voucher-post.ts
export async function postVoucher(voucherId: string) {
  const voucher = await voucherStore.getById(voucherId)

  // 1. 檢查借貸平衡
  if (voucher.total_debit !== voucher.total_credit) {
    throw new Error('借貸不平衡，無法過帳')
  }

  // 2. 更新傳票狀態
  await voucherStore.update(voucherId, {
    status: 'posted',
    posted_by: user.id,
    posted_at: new Date().toISOString(),
  })

  // 3. 更新總帳
  const year = new Date(voucher.voucher_date).getFullYear()
  const month = new Date(voucher.voucher_date).getMonth() + 1

  for (const entry of voucher.entries) {
    await updateGeneralLedger({
      subject_id: entry.subject_id,
      year,
      month,
      debit: entry.debit,
      credit: entry.credit,
    })
  }
}

async function updateGeneralLedger(data: {
  subject_id: string
  year: number
  month: number
  debit: number
  credit: number
}) {
  // 取得或建立總帳記錄
  let ledger = await generalLedgerStore.findOne({
    subject_id: data.subject_id,
    year: data.year,
    month: data.month,
  })

  if (!ledger) {
    ledger = await generalLedgerStore.create({
      subject_id: data.subject_id,
      year: data.year,
      month: data.month,
      opening_balance: 0,
      total_debit: 0,
      total_credit: 0,
      closing_balance: 0,
    })
  }

  // 累加借貸金額
  await generalLedgerStore.update(ledger.id, {
    total_debit: ledger.total_debit + data.debit,
    total_credit: ledger.total_credit + data.credit,
    closing_balance: calculateClosingBalance(ledger, data),
  })
}
```

---

## 📌 注意事項

1. **借貸平衡**：所有傳票必須借方合計 = 貸方合計
2. **過帳不可逆**：已過帳的傳票不能修改，只能作廢後重建
3. **總帳自動更新**：傳票過帳時自動更新總帳，不要手動修改
4. **科目刪除限制**：有交易記錄的科目不能刪除
5. **權限分級**：一般員工可建立傳票，只有主管可過帳

---

**下一步**：執行 Migration → 建立 TypeScript 型別 → 建立 Stores → 建立第一個頁面（會計科目表）
