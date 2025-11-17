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
