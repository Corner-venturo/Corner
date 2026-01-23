# 旅遊團結團功能規格

> **建立日期**: 2025-11-17
> **狀態**: ✅ 已實作
> **相關模組**: 旅遊團管理、會計模組

---

## 📋 功能概述

**結團** = 旅遊團回來後，確認所有收入和成本，正式認列損益的會計處理。

---

## 🗄️ 資料庫結構

### tours 表格新增欄位

```sql
-- 結團狀態欄位
ALTER TABLE public.tours
ADD COLUMN closing_status VARCHAR(20) DEFAULT 'open'
  CHECK (closing_status IN ('open', 'closing', 'closed')),
ADD COLUMN closing_date DATE,
ADD COLUMN closed_by UUID REFERENCES public.employees(id);
```

**欄位說明**:
- `closing_status`: 結團狀態
  - `open` - 進行中（尚未結團）
  - `closing` - 結團中（保留，目前未使用）
  - `closed` - 已結團
- `closing_date`: 結團日期
- `closed_by`: 結團操作人員 ID

**Migration 檔案**: `supabase/migrations/20251117140000_add_tour_closing_fields.sql`

---

## 💰 財務計算公式

### 1. 基本計算

```typescript
// 總收入 = 該團所有訂單的收款總額
const totalRevenue = orders.reduce((sum, o) => sum + (o.paid_amount || 0), 0)

// 總成本 = 該團所有已付款請款單總額（排除 bonus 類型）
const totalCost = paymentRequests
  .filter(pr => pr.status === 'paid' && pr.supplier_type !== 'bonus')
  .reduce((sum, pr) => sum + (pr.amount || 0), 0)

// 毛利
const grossProfit = totalRevenue - totalCost

// 公司雜支 = 團員人數 × 10
const memberCount = orderMembers.length
const miscExpense = memberCount * 10

// 稅金 = (毛利 - 雜支) × 12%
const tax = (grossProfit - miscExpense) * 0.12

// 淨利潤
const netProfit = grossProfit - miscExpense - tax
```

### 2. 獎金計算

#### 業務業績（可多人分配）
```typescript
interface BonusRecipient {
  employeeId: string  // 員工 ID
  percentage: number  // 分配百分比
}

// 業務業績可以有多個人
const salesRecipients: BonusRecipient[] = [
  { employeeId: 'emp-001', percentage: 3 },    // 業務 A 分 3%
  { employeeId: 'emp-002', percentage: 2 },    // 業務 B 分 2%
]

// 計算每個人的獎金金額
salesRecipients.forEach(recipient => {
  const amount = Math.round(netProfit * (recipient.percentage / 100))
  // 產生 bonus 類型的請款單
})
```

#### OP 獎金（可多人分配）
```typescript
// OP 獎金也可以有多個人
const opRecipients: BonusRecipient[] = [
  { employeeId: 'emp-003', percentage: 2 },    // OP A 分 2%
  { employeeId: 'emp-004', percentage: 1.5 },  // OP B 分 1.5%
]

// 計算每個人的獎金金額
opRecipients.forEach(recipient => {
  const amount = Math.round(netProfit * (recipient.percentage / 100))
  // 產生 bonus 類型的請款單
})
```

---

## 🔄 結團流程

### 前端流程

1. **進入旅遊團詳細頁面**
   - 路徑: `/tours/[id]`
   - 檔案: `src/app/tours/[id]/page.tsx`

2. **點擊「結團」按鈕**
   - 只有 `closing_status !== 'closed'` 時才顯示
   - 打開 `TourCloseDialog` 對話框

3. **結團對話框**
   - 檔案: `src/components/tours/tour-close-dialog.tsx`
   - 自動計算並顯示財務數據

4. **填寫獎金分配**
   - 業務業績：可新增多個業務，各自輸入 %
   - OP 獎金：可新增多個 OP，各自輸入 %
   - 介面有「新增業務」「新增 OP」按鈕

5. **確認結團**
   - 顯示確認對話框（含總 % 數）
   - 執行結團處理

### 後端處理

```typescript
// src/components/tours/tour-close-dialog.tsx 的 handleCloseTour()

async function handleCloseTour() {
  // 1. 產生業務業績請款單
  for (const recipient of salesRecipients) {
    if (recipient.percentage > 0) {
      const amount = Math.round(netProfit * (recipient.percentage / 100))
      await supabase.from('payment_requests').insert({
        order_id: firstOrderId,
        supplier_type: 'bonus',        // ⭐ 關鍵：bonus 類型
        supplier_name: '業務業績',
        amount,
        description: `業務業績 ${recipient.percentage}%`,
        status: 'pending'
      })
    }
  }

  // 2. 產生 OP 獎金請款單
  for (const recipient of opRecipients) {
    if (recipient.percentage > 0) {
      const amount = Math.round(netProfit * (recipient.percentage / 100))
      await supabase.from('payment_requests').insert({
        order_id: firstOrderId,
        supplier_type: 'bonus',        // ⭐ 關鍵：bonus 類型
        supplier_name: 'OP 獎金',
        amount,
        description: `OP 獎金 ${recipient.percentage}%`,
        status: 'pending'
      })
    }
  }

  // 3. 更新團體狀態為已結團
  await supabase.from('tours').update({
    closing_status: 'closed',
    closing_date: new Date().toISOString().split('T')[0]
  }).eq('id', tour.id)

  // ⭐ 這裡會觸發會計模組的自動拋轉
}
```

---

## 📊 會計拋轉（給會計模組）

### 觸發點

**當 `tours.closing_status` 從 `open` 變成 `closed` 時**

### 需要產生的傳票

#### 傳票 1：轉列收入
```
借：預收團費 (2102)    $totalRevenue
貸：團費收入 (4101)    $totalRevenue
摘要：團體 {tour.code} 結團 - 收入認列
```

#### 傳票 2：轉列成本（依請款單類型分類）
```
借：旅遊成本-交通 (5101)    $交通費用
借：旅遊成本-住宿 (5102)    $住宿費用
借：旅遊成本-餐飲 (5103)    $餐飲費用
借：旅遊成本-門票 (5104)    $門票費用
借：旅遊成本-保險 (5105)    $保險費用
借：旅遊成本-其他 (5106)    $其他費用
貸：預付團費 (1104)         $totalCost
摘要：團體 {tour.code} 結團 - 成本認列
```

**成本分類對應**:
- `supplier_type = 'transportation'` → 5101
- `supplier_type = 'accommodation'` → 5102
- `supplier_type = 'meal'` → 5103
- `supplier_type = 'ticket'` → 5104
- `supplier_type = 'insurance'` → 5105
- `supplier_type = 'other'` → 5106
- `supplier_type = 'bonus'` → **不計入成本，另外處理**

#### 傳票 3：公司雜支
```
借：其他收入 (4102)    $memberCount × 10
貸：應付帳款          $memberCount × 10
摘要：團體 {tour.code} 公司雜支 ({memberCount} 人 × $10)
```

#### 傳票 4：代收稅額
```
借：代收稅額 (新科目)    $tax
貸：應付稅捐             $tax
摘要：團體 {tour.code} 代收稅額 (12%)
```

#### 傳票 5：業務業績
```
// 每個業務各一張傳票
借：業務費用         $amount
貸：應付薪資         $amount
摘要：團體 {tour.code} 業務業績 - {員工姓名} ({percentage}%)
```

#### 傳票 6：OP 獎金
```
// 每個 OP 各一張傳票
借：OP 獎金費用      $amount
貸：應付薪資         $amount
摘要：團體 {tour.code} OP 獎金 - {員工姓名} ({percentage}%)
```

---

## 🔍 如何取得結團資料

### 查詢已結團的團體
```sql
SELECT * FROM tours WHERE closing_status = 'closed';
```

### 查詢待結團的團體
```sql
SELECT * FROM tours WHERE closing_status = 'open';
```

### 取得團體的完整財務資料
```typescript
// 1. 取得團體資訊
const { data: tour } = await supabase
  .from('tours')
  .select('*')
  .eq('id', tourId)
  .single()

// 2. 取得所有訂單
const { data: orders } = await supabase
  .from('orders')
  .select('id, paid_amount')
  .eq('tour_id', tourId)

// 3. 計算總收入
const totalRevenue = orders.reduce((sum, o) => sum + (o.paid_amount || 0), 0)

// 4. 取得所有請款單（排除 bonus）
const orderIds = orders.map(o => o.id)
const { data: paymentRequests } = await supabase
  .from('payment_requests')
  .select('amount, supplier_type')
  .in('order_id', orderIds)
  .eq('status', 'paid')
  .neq('supplier_type', 'bonus')

// 5. 計算總成本（依類型分類）
const costByType = {
  transportation: 0,
  accommodation: 0,
  meal: 0,
  ticket: 0,
  insurance: 0,
  other: 0
}

paymentRequests.forEach(pr => {
  if (costByType[pr.supplier_type] !== undefined) {
    costByType[pr.supplier_type] += pr.amount || 0
  }
})

// 6. 取得團員人數
const { data: members } = await supabase
  .from('order_members')
  .select('id')
  .in('order_id', orderIds)

const memberCount = members.length

// 7. 取得獎金請款單
const { data: bonusRequests } = await supabase
  .from('payment_requests')
  .select('supplier_name, amount, description')
  .in('order_id', orderIds)
  .eq('supplier_type', 'bonus')
```

---

## 📁 相關檔案

### 資料庫
- `supabase/migrations/20251117140000_add_tour_closing_fields.sql` - 結團欄位
- `supabase/migrations/20251117150000_add_bonus_to_payment_requests.sql` - bonus 類型

### 型別定義
- `src/types/tour.types.ts` - Tour 介面（含 closing_status 等欄位）

### 組件
- `src/components/tours/tour-close-dialog.tsx` - 結團對話框
- `src/app/tours/[id]/page.tsx` - 旅遊團詳細頁面（含結團按鈕）

### 列表頁面
- `src/features/tours/components/ToursPage.tsx` - 旅遊團列表（含封存分頁）

---

## 🎯 重要提醒（給會計模組）

### 1. bonus 類型的請款單
- `supplier_type = 'bonus'` 的請款單 **不計入旅遊成本**
- 獎金另外拋轉成「業務費用」或「OP 獎金費用」

### 2. 百分比 (%)
- 業務和 OP 的獎金是用「淨利潤」× 百分比計算
- 百分比可以是小數（如 1.5%、2.5%）
- 允許多人分配，總 % 數不限制

### 3. 結團狀態
- 結團後 `closing_status = 'closed'`
- 已結團的團體會移到「封存」分頁
- 管理員可以解鎖（將 closed 改回 open）

### 4. 會計拋轉時機
- **監聽 `tours.closing_status` 欄位變更**
- 當變成 `closed` 時，自動產生傳票
- 使用 Supabase Realtime 或 Database Triggers

---

## ✅ 檢查清單

會計模組實作時需要確認：

- [ ] 監聽 tours 表格的 closing_status 變更
- [ ] 當 closing_status = 'closed' 時觸發拋轉
- [ ] 正確計算各類型成本（transportation, accommodation, meal 等）
- [ ] 排除 supplier_type = 'bonus' 的請款單
- [ ] 產生收入認列傳票（借：預收團費 / 貸：團費收入）
- [ ] 產生成本認列傳票（依類型分類）
- [ ] 產生公司雜支傳票（團員數 × 10）
- [ ] 產生代收稅額傳票（12%）
- [ ] 產生業務業績傳票（每個業務各一張）
- [ ] 產生 OP 獎金傳票（每個 OP 各一張）

---

**文件版本**: 1.0
**最後更新**: 2025-11-17
**維護者**: William Chien
