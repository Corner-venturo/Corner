# Supabase Schema 檢查報告

**檢查日期**：2025-01-21
**目的**：對比前端實際使用的資料結構與 Supabase 資料庫 schema

---

## 🔴 關鍵問題

### 1. **tours 表 - 缺少重要欄位**

**前端需要但 Supabase 缺少：**
- ❌ `archived` (boolean) - 封存旗標

**狀態不一致：**
- 前端使用：`'提案' | '進行中' | '待結案' | '結案' | '已取消' | '特殊團'`
- Supabase 存儲：英文狀態（但 types.ts 中定義是英文）
- **需要統一**：建議 Supabase 改為中文 status，或前端改用英文

**contract_status 不一致：**
- 前端使用：`'pending' | 'partial' | 'signed'`
  （未簽署、部分簽署、已簽署）
- Supabase schema：`'unsigned' | 'signed'`
  （只有未簽署、已簽署）
- **問題**：缺少「部分簽署」狀態

**航班資訊缺失：**
- ❌ `outboundFlight` (FlightInfo) - 去程航班
- ❌ `returnFlight` (FlightInfo) - 回程航班

---

### 2. **members 表 - 缺少關鍵欄位**

**前端需要但 Supabase 缺少：**
- ❌ `tour_id` (string) - **重要！** 直接關聯旅遊團（不只透過 order_id）
- ❌ `age` (number) - 根據生日和出發日自動計算
- ❌ `custom_fields` (Record<string, any>) - 自定義欄位數據

**說明：**
- `tour_id` 非常重要，因為需要直接查詢「某旅遊團的所有團員」
- 目前只能透過 `order_id` → `order.tour_id` 間接查詢，效能較差

---

### 3. **orders 表 - 狀態值需調整**

**狀態值不一致：**
- 前端 `status`：`'pending' | 'confirmed' | 'completed' | 'cancelled'`
- 前端 `payment_status`：`'unpaid' | 'partial' | 'paid' | 'refunded'`
- Supabase `status`：`string`（沒有限制）
- Supabase `payment_status`：`string`（沒有限制）

**建議：**
- 建立 enum 類型或 check constraint，確保狀態值一致

---

### 4. **缺少的表格**

Supabase **完全缺少**以下表格：

#### ❌ tour_addons（團體加購項目）
```sql
CREATE TABLE tour_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### ❌ tour_refunds（團體退費項目）
```sql
CREATE TABLE tour_refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  order_number TEXT NOT NULL,
  member_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('申請中', '已核准', '已退款', '已拒絕')),
  applied_date DATE NOT NULL,
  processed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ⚠️ 次要問題

### 5. **employees 表 - 結構複雜度**

**現狀：**
- Supabase 使用 JSON 欄位：`personal_info`, `job_info`, `salary_info`
- 前端 types 有兩種版本：
  - `src/types/employee.types.ts`：簡化平面結構
  - `src/stores/types.ts` (User/Employee)：完整 JSON 結構

**建議：**
- 確認主要使用哪一種結構
- 統一前端 types 定義

---

### 6. **quotes 表 - 欄位差異**

**前端有但 Supabase 缺少：**
- ❌ `quote_number` (string) - 報價單號碼（如：QUOTE-2025-0001）
- ❌ `contact_person` (string) - 聯絡人
- ❌ `contact_phone` (string) - 聯絡電話
- ❌ `contact_email` (string) - Email
- ❌ `requirements` (string) - 需求說明
- ❌ `budget_range` (string) - 預算範圍
- ❌ `payment_terms` (string) - 付款條件

**說明：**
- Supabase 的 `code` 可能對應前端的 `quote_number`
- 其他欄位需要新增

---

### 7. **suppliers 表 - 結構差異**

**前端結構：**
```typescript
{
  contact: {
    contact_person: string;
    phone: string;
    email?: string;
    address?: string;
    website?: string;
  };
  bank_info?: {
    bank_name: string;
    account_number: string;
    account_name: string;
    branch?: string;
  };
  price_list: PriceListItem[];
}
```

**Supabase 結構：**
```sql
contact_person: string | null
phone: string | null
email: string | null
address: string | null
bank_account: string | null  -- 簡化版，沒有完整銀行資訊
tax_id: string | null
```

**問題：**
- Supabase 缺少 `price_list` 關聯
- 銀行資訊不完整

**建議：**
- 新增 `price_list_items` 表
- 將銀行資訊改為 JSON 欄位或新增欄位

---

## ✅ 正確的表格

以下表格前端與 Supabase 基本一致：

- ✅ customers
- ✅ payments
- ✅ payment_requests
- ✅ disbursement_orders
- ✅ receipt_orders
- ✅ todos
- ✅ visas
- ✅ calendar_events
- ✅ accounts, categories, transactions, budgets（記帳系統）
- ✅ workspace_items
- ✅ timebox_sessions
- ✅ templates

---

## 📋 修正建議

### 立即修正（影響功能運作）：

1. **新增 tour_addons 表**
2. **新增 tour_refunds 表**
3. **members 表新增 tour_id 欄位**
4. **tours 表新增 archived 欄位**

### 中期修正（改善資料一致性）：

5. **統一 tours.status 狀態值**（中文或英文）
6. **tours.contract_status 新增 'partial' 狀態**
7. **orders 新增 status/payment_status enum constraint**
8. **quotes 新增缺少的欄位**

### 長期優化（改善資料結構）：

9. **suppliers 新增 price_list_items 關聯表**
10. **tours 新增航班資訊（JSON 欄位或關聯表）**
11. **統一 employees 結構定義**

---

## 🛠️ SQL 腳本（立即修正）

```sql
-- 1. 新增 tour_addons 表
CREATE TABLE IF NOT EXISTS tour_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tour_addons_tour_id ON tour_addons(tour_id);

-- 2. 新增 tour_refunds 表
CREATE TABLE IF NOT EXISTS tour_refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  member_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '申請中' CHECK (status IN ('申請中', '已核准', '已退款', '已拒絕')),
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  processed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tour_refunds_tour_id ON tour_refunds(tour_id);
CREATE INDEX idx_tour_refunds_order_id ON tour_refunds(order_id);

-- 3. members 表新增 tour_id
ALTER TABLE members ADD COLUMN IF NOT EXISTS tour_id UUID REFERENCES tours(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_members_tour_id ON members(tour_id);

-- 更新既有資料的 tour_id（從 order 取得）
UPDATE members m
SET tour_id = o.tour_id
FROM orders o
WHERE m.order_id = o.id AND m.tour_id IS NULL;

-- 4. tours 表新增 archived
ALTER TABLE tours ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- 5. tours 表調整 contract_status（如果需要支援 partial）
-- 注意：這會影響現有資料，需要小心處理
-- ALTER TABLE tours DROP CONSTRAINT IF EXISTS tours_contract_status_check;
-- ALTER TABLE tours ADD CONSTRAINT tours_contract_status_check
--   CHECK (contract_status IN ('unsigned', 'partial', 'signed'));

-- 6. 新增觸發器自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tour_addons_updated_at BEFORE UPDATE ON tour_addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_refunds_updated_at BEFORE UPDATE ON tour_refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📌 注意事項

1. **執行 SQL 前請先備份資料庫**
2. **建議在測試環境先執行**
3. **確認現有資料不會受影響**
4. **更新 Supabase types** (`src/lib/supabase/types.ts`)

---

**檢查完成！** 🎉
