# 手動執行 Migration 指南

> **建立日期**：2025-01-17
> **原因**：Supabase CLI 遇到 SSL 連線問題，需手動執行
> **狀態**：⏳ 待執行

---

## 🚨 背景說明

Supabase CLI 執行 `db push` 時持續遇到以下錯誤：
```
failed to connect as temp role: SSL connection is required (SQLSTATE XX000)
```

因此需要手動透過 Supabase Dashboard 執行 Migration。

---

## 📋 執行步驟

### 1. 登入 Supabase Dashboard

1. 前往：https://supabase.com/dashboard
2. 登入帳號
3. 選擇專案：`pfqvdacxowpgfamuvnsn`

### 2. 開啟 SQL Editor

1. 左側選單 → **SQL Editor**
2. 點擊 **New query**

### 3. 執行 Migration 1（會計模組主體）

**檔案位置**：`supabase/migrations/20251117133000_create_accounting_module.sql`

**執行方式**：
1. 複製以下完整 SQL 內容
2. 貼到 SQL Editor
3. 點擊 **Run** 執行

<details>
<summary>📄 點擊展開 SQL 內容（完整的 224 行）</summary>

```sql
-- =====================================================
-- Venturo 會計模組資料表（模組化設計）
-- 建立日期：2025-01-17
-- 說明：建立會計系統的核心資料表，支援模組化授權
-- =====================================================

BEGIN;

-- =====================================================
-- 1. 模組授權表（控制哪些 workspace 可以使用哪些模組）
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workspace_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  module_name VARCHAR(50) NOT NULL CHECK (module_name IN ('accounting', 'inventory', 'bi_analytics')),
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = 永久授權
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, module_name)
);

COMMENT ON TABLE public.workspace_modules IS '工作空間模組授權表';
COMMENT ON COLUMN public.workspace_modules.module_name IS '模組名稱：accounting(會計), inventory(庫存), bi_analytics(BI分析)';
COMMENT ON COLUMN public.workspace_modules.expires_at IS '授權到期日（NULL = 永久）';

-- =====================================================
-- 2. 會計科目表（Chart of Accounts）
-- =====================================================
CREATE TABLE IF NOT EXISTS public.accounting_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id UUID REFERENCES public.accounting_subjects(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 1,
  is_system BOOLEAN DEFAULT false, -- 系統預設科目（不可刪除）
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_subject_code UNIQUE(workspace_id, code)
);

COMMENT ON TABLE public.accounting_subjects IS '會計科目表';
COMMENT ON COLUMN public.accounting_subjects.type IS '科目類型：asset(資產), liability(負債), equity(權益), revenue(收入), expense(費用)';
COMMENT ON COLUMN public.accounting_subjects.is_system IS '系統預設科目（不可刪除）';

CREATE INDEX idx_accounting_subjects_workspace ON public.accounting_subjects(workspace_id);
CREATE INDEX idx_accounting_subjects_parent ON public.accounting_subjects(parent_id);

-- =====================================================
-- 3. 傳票主檔（Vouchers）
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  voucher_no VARCHAR(50) NOT NULL,
  voucher_date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('manual', 'auto')),
  source_type VARCHAR(50), -- payment_request, order_payment, manual
  source_id UUID, -- 來源單據 ID
  description TEXT,
  total_debit DECIMAL(15, 2) DEFAULT 0,
  total_credit DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'void')),
  created_by UUID REFERENCES public.employees(id),
  posted_by UUID REFERENCES public.employees(id),
  posted_at TIMESTAMPTZ,
  voided_by UUID REFERENCES public.employees(id),
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_voucher_no UNIQUE(workspace_id, voucher_no)
);

COMMENT ON TABLE public.vouchers IS '傳票主檔';
COMMENT ON COLUMN public.vouchers.type IS 'manual(手工傳票) / auto(自動拋轉)';
COMMENT ON COLUMN public.vouchers.status IS 'draft(草稿) / posted(已過帳) / void(作廢)';

CREATE INDEX idx_vouchers_workspace ON public.vouchers(workspace_id);
CREATE INDEX idx_vouchers_date ON public.vouchers(voucher_date);
CREATE INDEX idx_vouchers_status ON public.vouchers(status);
CREATE INDEX idx_vouchers_source ON public.vouchers(source_type, source_id);

-- =====================================================
-- 4. 傳票明細（分錄）
-- =====================================================
CREATE TABLE IF NOT EXISTS public.voucher_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  entry_no INTEGER NOT NULL, -- 分錄序號
  subject_id UUID NOT NULL REFERENCES public.accounting_subjects(id),
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_entry_no UNIQUE(voucher_id, entry_no),
  CONSTRAINT check_debit_credit CHECK (
    (debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0)
  )
);

COMMENT ON TABLE public.voucher_entries IS '傳票明細（分錄）';
COMMENT ON COLUMN public.voucher_entries.entry_no IS '分錄序號（1, 2, 3...）';

CREATE INDEX idx_voucher_entries_voucher ON public.voucher_entries(voucher_id);
CREATE INDEX idx_voucher_entries_subject ON public.voucher_entries(subject_id);

-- =====================================================
-- 5. 總帳（General Ledger）- 用於快速查詢餘額
-- =====================================================
CREATE TABLE IF NOT EXISTS public.general_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.accounting_subjects(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  opening_balance DECIMAL(15, 2) DEFAULT 0, -- 期初餘額
  total_debit DECIMAL(15, 2) DEFAULT 0,     -- 本期借方合計
  total_credit DECIMAL(15, 2) DEFAULT 0,    -- 本期貸方合計
  closing_balance DECIMAL(15, 2) DEFAULT 0, -- 期末餘額
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_ledger_period UNIQUE(workspace_id, subject_id, year, month)
);

COMMENT ON TABLE public.general_ledger IS '總帳（月結餘額）';

CREATE INDEX idx_general_ledger_workspace ON public.general_ledger(workspace_id);
CREATE INDEX idx_general_ledger_period ON public.general_ledger(year, month);

-- =====================================================
-- 6. 插入系統預設會計科目（台灣會計準則）
-- =====================================================
INSERT INTO public.accounting_subjects (workspace_id, code, name, type, level, is_system, is_active) VALUES
-- 資產類（1xxx）
(NULL, '1000', '資產', 'asset', 1, true, true),
(NULL, '1100', '流動資產', 'asset', 2, true, true),
(NULL, '1101', '現金', 'asset', 3, true, true),
(NULL, '1102', '銀行存款', 'asset', 3, true, true),
(NULL, '110201', '銀行存款-中國信託', 'asset', 4, true, true),
(NULL, '110202', '銀行存款-台灣銀行', 'asset', 4, true, true),
(NULL, '110203', '銀行存款-玉山銀行', 'asset', 4, true, true),
(NULL, '110204', '銀行存款-國泰世華', 'asset', 4, true, true),
(NULL, '110205', '銀行存款-第一銀行', 'asset', 4, true, true),
(NULL, '110206', '銀行存款-台新銀行', 'asset', 4, true, true),
(NULL, '1103', '應收帳款', 'asset', 3, true, true),
(NULL, '1104', '預付團費', 'asset', 3, true, true),

-- 負債類（2xxx）
(NULL, '2000', '負債', 'liability', 1, true, true),
(NULL, '2100', '流動負債', 'liability', 2, true, true),
(NULL, '2101', '應付帳款', 'liability', 3, true, true),
(NULL, '2102', '預收團費', 'liability', 3, true, true),

-- 權益類（3xxx）
(NULL, '3000', '股東權益', 'equity', 1, true, true),
(NULL, '3101', '資本', 'equity', 2, true, true),
(NULL, '3201', '本期損益', 'equity', 2, true, true),

-- 收入類（4xxx）
(NULL, '4000', '營業收入', 'revenue', 1, true, true),
(NULL, '4101', '團費收入', 'revenue', 2, true, true),
(NULL, '4102', '其他收入', 'revenue', 2, true, true),

-- 費用類（5xxx）
(NULL, '5000', '營業成本', 'expense', 1, true, true),
(NULL, '5101', '旅遊成本-交通', 'expense', 2, true, true),
(NULL, '5102', '旅遊成本-住宿', 'expense', 2, true, true),
(NULL, '5103', '旅遊成本-餐飲', 'expense', 2, true, true),
(NULL, '5104', '旅遊成本-門票', 'expense', 2, true, true),
(NULL, '5105', '旅遊成本-保險', 'expense', 2, true, true),
(NULL, '5106', '旅遊成本-其他', 'expense', 2, true, true),

-- 費用類（6xxx）
(NULL, '6000', '營業費用', 'expense', 1, true, true),
(NULL, '6101', '薪資支出', 'expense', 2, true, true),
(NULL, '6102', '租金支出', 'expense', 2, true, true),
(NULL, '6103', '水電費', 'expense', 2, true, true),
(NULL, '6104', '行銷費用', 'expense', 2, true, true)
ON CONFLICT (workspace_id, code) DO NOTHING;

-- =====================================================
-- 7. 更新 parent_id（建立科目層級關係）
-- =====================================================
UPDATE public.accounting_subjects SET parent_id = (SELECT id FROM public.accounting_subjects WHERE code = '1000') WHERE code = '1100';
UPDATE public.accounting_subjects SET parent_id = (SELECT id FROM public.accounting_subjects WHERE code = '1100') WHERE code IN ('1101', '1102', '1103', '1104');
UPDATE public.accounting_subjects SET parent_id = (SELECT id FROM public.accounting_subjects WHERE code = '1102') WHERE code IN ('110201', '110202', '110203', '110204', '110205', '110206');
UPDATE public.accounting_subjects SET parent_id = (SELECT id FROM public.accounting_subjects WHERE code = '2000') WHERE code = '2100';
UPDATE public.accounting_subjects SET parent_id = (SELECT id FROM public.accounting_subjects WHERE code = '2100') WHERE code IN ('2101', '2102');
UPDATE public.accounting_subjects SET parent_id = (SELECT id FROM public.accounting_subjects WHERE code = '3000') WHERE code IN ('3101', '3201');
UPDATE public.accounting_subjects SET parent_id = (SELECT id FROM public.accounting_subjects WHERE code = '4000') WHERE code IN ('4101', '4102');
UPDATE public.accounting_subjects SET parent_id = (SELECT id FROM public.accounting_subjects WHERE code = '5000') WHERE code IN ('5101', '5102', '5103', '5104', '5105', '5106');
UPDATE public.accounting_subjects SET parent_id = (SELECT id FROM public.accounting_subjects WHERE code = '6000') WHERE code IN ('6101', '6102', '6103', '6104');

-- =====================================================
-- 8. 建立觸發器：自動更新 updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounting_subjects_updated_at BEFORE UPDATE ON public.accounting_subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON public.vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_general_ledger_updated_at BEFORE UPDATE ON public.general_ledger FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. RLS 停用（依照專案規範）
-- =====================================================
ALTER TABLE public.workspace_modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_ledger DISABLE ROW LEVEL SECURITY;

COMMIT;
```

</details>

**預期結果**：
- ✅ 5 個資料表建立成功
- ✅ 29 個會計科目插入成功
- ✅ 索引和觸發器建立成功

---

### 4. 執行 Migration 2（結團功能）

**檔案位置**：`supabase/migrations/20251117140000_add_tour_closing_fields.sql`

**執行方式**：
1. 開啟新的 SQL Query
2. 複製以下 SQL 內容
3. 點擊 **Run** 執行

```sql
-- =====================================================
-- 新增團體結團欄位
-- 建立日期：2025-01-17
-- 說明：支援團體結團功能，用於會計模組自動拋轉
-- =====================================================

BEGIN;

-- 新增結團狀態欄位
ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS closing_status VARCHAR(20) DEFAULT 'open'
  CHECK (closing_status IN ('open', 'closing', 'closed')),
ADD COLUMN IF NOT EXISTS closing_date DATE,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES public.employees(id);

COMMENT ON COLUMN public.tours.closing_status IS '結團狀態：open(進行中), closing(結團中), closed(已結團)';
COMMENT ON COLUMN public.tours.closing_date IS '結團日期';
COMMENT ON COLUMN public.tours.closed_by IS '結團操作人員';

-- 建立索引（方便查詢已結團的團體）
CREATE INDEX IF NOT EXISTS idx_tours_closing_status ON public.tours(closing_status);
CREATE INDEX IF NOT EXISTS idx_tours_closing_date ON public.tours(closing_date);

COMMIT;
```

**預期結果**：
- ✅ tours 表格新增 3 個欄位
- ✅ 索引建立成功

---

### 5. 驗證結果

執行以下 SQL 確認資料表建立成功：

```sql
-- 檢查資料表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'workspace_modules',
    'accounting_subjects',
    'vouchers',
    'voucher_entries',
    'general_ledger'
  );

-- 檢查會計科目數量（應該有 29 個）
SELECT COUNT(*) as total_subjects
FROM public.accounting_subjects
WHERE workspace_id IS NULL;

-- 檢查銀行子科目
SELECT code, name
FROM public.accounting_subjects
WHERE code LIKE '1102%'
ORDER BY code;

-- 檢查 tours 欄位
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tours'
  AND column_name IN ('closing_status', 'closing_date', 'closed_by');
```

**預期結果**：
```
資料表數量：5 個
會計科目數量：29 個
銀行子科目：7 個（1102 + 6 個子科目）
tours 欄位：3 個新欄位
```

---

## ✅ 完成檢查清單

執行完成後，確認以下項目：

- [ ] Migration 1 執行成功（無錯誤訊息）
- [ ] Migration 2 執行成功（無錯誤訊息）
- [ ] 5 個資料表已建立
- [ ] 29 個會計科目已插入
- [ ] 6 個銀行子科目已建立
- [ ] tours 表格新增 3 個欄位

---

## 🚨 常見問題

### Q1: 執行時出現 "relation already exists" 錯誤
**A**: 這是正常的，代表該資料表已存在。SQL 中使用了 `IF NOT EXISTS`，可以安全重複執行。

### Q2: 會計科目插入失敗
**A**: 檢查是否已存在相同的科目代碼。使用 `ON CONFLICT DO NOTHING` 可避免重複插入。

### Q3: tours 欄位新增失敗
**A**: 可能欄位已存在。使用 `IF NOT EXISTS` 可安全重複執行。

---

## 📞 需要協助？

如遇到問題，請檢查：
1. Supabase Dashboard 的錯誤訊息
2. 執行的 SQL 是否完整複製
3. 是否有權限執行 DDL 語句

---

**建立日期**：2025-01-17
**維護者**：William Chien
**狀態**：⏳ 待手動執行
