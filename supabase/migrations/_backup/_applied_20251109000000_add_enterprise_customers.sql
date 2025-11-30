-- 企業客戶系統
-- 新增 companies (企業) 和 company_contacts (企業聯絡人) 表格
-- 擴展 customers 表格以支援企業客戶

BEGIN;

-- =====================================================
-- 1. 建立 companies 表格（企業）
-- =====================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 基本資訊
  company_name TEXT NOT NULL,
  tax_id TEXT,  -- 統一編號
  phone TEXT,
  email TEXT,
  website TEXT,

  -- 發票資訊
  invoice_title TEXT,  -- 發票抬頭
  invoice_address TEXT,
  invoice_email TEXT,

  -- 付款資訊
  payment_terms INTEGER DEFAULT 30,  -- 付款期限（天）
  payment_method TEXT DEFAULT 'transfer',  -- 'transfer' | 'cash' | 'check' | 'credit_card'
  credit_limit DECIMAL(12,2) DEFAULT 0,  -- 信用額度

  -- 銀行資訊
  bank_name TEXT,
  bank_account TEXT,
  bank_branch TEXT,

  -- 地址資訊
  registered_address TEXT,  -- 登記地址
  mailing_address TEXT,  -- 通訊地址

  -- VIP 等級
  vip_level INTEGER DEFAULT 0,  -- 0: 普通, 1-5: VIP等級

  -- 備註
  note TEXT,

  -- 系統欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- 確保同一工作空間內統編唯一（允許 NULL）
  CONSTRAINT unique_tax_id_per_workspace UNIQUE NULLS NOT DISTINCT (workspace_id, tax_id)
);

COMMENT ON TABLE public.companies IS '企業客戶資料表';
COMMENT ON COLUMN public.companies.tax_id IS '統一編號（企業識別碼）';
COMMENT ON COLUMN public.companies.payment_terms IS '付款期限（天數），例如：30天付款';
COMMENT ON COLUMN public.companies.credit_limit IS '信用額度上限';
COMMENT ON COLUMN public.companies.vip_level IS 'VIP等級: 0=普通, 1-5=VIP1-5';

-- 建立索引
CREATE INDEX idx_companies_workspace ON public.companies(workspace_id);
CREATE INDEX idx_companies_tax_id ON public.companies(tax_id) WHERE tax_id IS NOT NULL;
CREATE INDEX idx_companies_created_at ON public.companies(created_at DESC);

-- 禁用 RLS（內部系統）
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;


-- =====================================================
-- 2. 建立 company_contacts 表格（企業聯絡人）
-- =====================================================
CREATE TABLE IF NOT EXISTS public.company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- 聯絡人資訊
  name TEXT NOT NULL,
  title TEXT,  -- 職稱
  department TEXT,  -- 部門
  phone TEXT,
  mobile TEXT,
  email TEXT,

  -- 主要聯絡人標記
  is_primary BOOLEAN DEFAULT false,

  -- 備註
  note TEXT,

  -- 系統欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.company_contacts IS '企業聯絡人資料表';
COMMENT ON COLUMN public.company_contacts.is_primary IS '是否為主要聯絡人（每個企業可以有一位主要聯絡人）';

-- 建立索引
CREATE INDEX idx_company_contacts_company ON public.company_contacts(company_id);
CREATE INDEX idx_company_contacts_primary ON public.company_contacts(company_id, is_primary) WHERE is_primary = true;

-- 禁用 RLS（內部系統）
ALTER TABLE public.company_contacts DISABLE ROW LEVEL SECURITY;


-- =====================================================
-- 3. 擴展 customers 表格
-- =====================================================
-- 新增欄位以支援企業客戶
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'individual',  -- 'individual' | 'company'
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.customers.customer_type IS '客戶類型: individual=個人, company=企業';
COMMENT ON COLUMN public.customers.company_id IS '關聯的企業ID（當 customer_type = company 時使用）';

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id) WHERE company_id IS NOT NULL;

-- 新增檢查約束：企業客戶必須關聯企業
ALTER TABLE public.customers
ADD CONSTRAINT check_company_customer
CHECK (
  (customer_type = 'individual' AND company_id IS NULL) OR
  (customer_type = 'company' AND company_id IS NOT NULL)
);


-- =====================================================
-- 4. 更新 updated_at 觸發器
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Companies 表格觸發器
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Company Contacts 表格觸發器
DROP TRIGGER IF EXISTS update_company_contacts_updated_at ON public.company_contacts;
CREATE TRIGGER update_company_contacts_updated_at
    BEFORE UPDATE ON public.company_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
