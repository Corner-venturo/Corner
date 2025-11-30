-- ============================================
-- Venturo 完整 Schema 修復
-- 日期: 2025-11-30
-- 目的: 建立所有缺失的表格，確保前端 Store 都有對應的資料庫表格
-- ============================================

BEGIN;

-- ============================================
-- 1. 簽證表 (visas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.visas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT,
  workspace_id UUID REFERENCES public.workspaces(id),

  -- 基本資訊
  customer_id TEXT, -- 對應 customers.id (TEXT 類型)
  customer_name TEXT,
  passport_number TEXT,
  passport_expiry DATE,

  -- 簽證資訊
  visa_type TEXT, -- tourist, business, work, student
  destination_country TEXT,
  entry_type TEXT, -- single, multiple

  -- 狀態追蹤
  status TEXT DEFAULT 'pending', -- pending, submitted, processing, approved, rejected, collected
  submitted_date DATE,
  approved_date DATE,
  collected_date DATE,

  -- 關聯
  tour_id UUID REFERENCES public.tours(id),
  order_id UUID REFERENCES public.orders(id),

  -- 費用
  visa_fee DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0,

  -- 備註
  notes TEXT,
  rejection_reason TEXT,

  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id),
  updated_by UUID REFERENCES public.employees(id),

  -- 同步欄位
  _needs_sync BOOLEAN DEFAULT FALSE,
  _synced_at TIMESTAMPTZ,
  _deleted BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 2. 出納單表 (disbursement_orders)
-- ============================================
CREATE TABLE IF NOT EXISTS public.disbursement_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT,
  workspace_id UUID REFERENCES public.workspaces(id),

  -- 關聯
  payment_request_id UUID REFERENCES public.payment_requests(id),
  supplier_id UUID REFERENCES public.suppliers(id),

  -- 金額資訊
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'TWD',
  exchange_rate DECIMAL(10,4) DEFAULT 1,

  -- 付款資訊
  payment_method TEXT, -- transfer, cash, check, card
  payment_date DATE,
  bank_account TEXT,
  reference_number TEXT,

  -- 狀態
  status TEXT DEFAULT 'pending', -- pending, approved, paid, cancelled

  -- 備註
  description TEXT,
  notes TEXT,

  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id),
  updated_by UUID REFERENCES public.employees(id),
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMPTZ,

  -- 同步欄位
  _needs_sync BOOLEAN DEFAULT FALSE,
  _synced_at TIMESTAMPTZ,
  _deleted BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 3. 企業客戶表 (companies)
-- ============================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT,
  workspace_id UUID REFERENCES public.workspaces(id),

  -- 基本資訊
  name TEXT NOT NULL,
  name_en TEXT,
  tax_id TEXT, -- 統一編號

  -- 聯絡資訊
  phone TEXT,
  fax TEXT,
  email TEXT,
  website TEXT,
  address TEXT,

  -- 業務資訊
  industry TEXT,
  employee_count INTEGER,
  annual_travel_budget DECIMAL(12,2),

  -- 付款條件
  payment_terms TEXT,
  credit_limit DECIMAL(12,2),

  -- 狀態
  status TEXT DEFAULT 'active', -- active, inactive, suspended
  is_vip BOOLEAN DEFAULT FALSE,
  vip_level INTEGER DEFAULT 0,

  -- 統計
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_order_date DATE,

  -- 備註
  notes TEXT,

  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id),
  updated_by UUID REFERENCES public.employees(id),

  -- 同步欄位
  _needs_sync BOOLEAN DEFAULT FALSE,
  _synced_at TIMESTAMPTZ,
  _deleted BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 4. 企業聯絡人表 (company_contacts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,

  -- 基本資訊
  name TEXT NOT NULL,
  name_en TEXT,
  title TEXT, -- 職稱
  department TEXT,

  -- 聯絡方式
  phone TEXT,
  mobile TEXT,
  email TEXT,
  line_id TEXT,

  -- 狀態
  is_primary BOOLEAN DEFAULT FALSE, -- 主要聯絡人
  is_active BOOLEAN DEFAULT TRUE,

  -- 備註
  notes TEXT,

  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id),
  updated_by UUID REFERENCES public.employees(id),

  -- 同步欄位
  _needs_sync BOOLEAN DEFAULT FALSE,
  _synced_at TIMESTAMPTZ,
  _deleted BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 5. 公司公告表 (company_announcements)
-- ============================================
CREATE TABLE IF NOT EXISTS public.company_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id),

  -- 內容
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'general', -- general, urgent, event, policy

  -- 顯示設定
  is_pinned BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,

  -- 時間範圍
  publish_date TIMESTAMPTZ DEFAULT NOW(),
  expire_date TIMESTAMPTZ,

  -- 可見性
  visibility TEXT DEFAULT 'all', -- all, selected
  visible_to_roles TEXT[], -- 可見的角色
  visible_to_employees UUID[], -- 可見的員工

  -- 狀態
  status TEXT DEFAULT 'draft', -- draft, published, archived

  -- 閱讀追蹤
  read_by UUID[] DEFAULT '{}',

  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id),
  updated_by UUID REFERENCES public.employees(id),

  -- 同步欄位
  _needs_sync BOOLEAN DEFAULT FALSE,
  _synced_at TIMESTAMPTZ,
  _deleted BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 6. 團體加購項目表 (tour_addons)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tour_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id),
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,

  -- 項目資訊
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- meal, activity, transport, insurance, other

  -- 價格
  unit_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TWD',

  -- 數量限制
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  available_quantity INTEGER,

  -- 時間限制
  deadline DATE, -- 加購截止日

  -- 狀態
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,

  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id),
  updated_by UUID REFERENCES public.employees(id),

  -- 同步欄位
  _needs_sync BOOLEAN DEFAULT FALSE,
  _synced_at TIMESTAMPTZ,
  _deleted BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 7. 請款項目表 (payment_request_items)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id UUID REFERENCES public.payment_requests(id) ON DELETE CASCADE,

  -- 項目資訊
  description TEXT NOT NULL,
  category TEXT, -- accommodation, transport, meal, ticket, guide, other

  -- 金額
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TWD',

  -- 關聯
  supplier_id UUID REFERENCES public.suppliers(id),

  -- 備註
  notes TEXT,

  -- 審計欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 同步欄位
  _needs_sync BOOLEAN DEFAULT FALSE,
  _synced_at TIMESTAMPTZ,
  _deleted BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 8. 確保空表格有正確結構
-- ============================================

-- 8.1 檢查並修復 itineraries 表
DO $$
BEGIN
  -- 確保 itineraries 有 workspace_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itineraries' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.itineraries ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id);
  END IF;

  -- 確保有 created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itineraries' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.itineraries ADD COLUMN created_by UUID REFERENCES public.employees(id);
  END IF;

  -- 確保有 updated_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itineraries' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE public.itineraries ADD COLUMN updated_by UUID REFERENCES public.employees(id);
  END IF;
END $$;

-- 8.2 檢查並修復 cost_templates 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cost_templates' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.cost_templates ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id);
  END IF;
END $$;

-- 8.3 檢查並修復 payment_requests 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_requests' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.payment_requests ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id);
  END IF;
END $$;

-- 8.4 檢查並修復 receipts 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipts' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.receipts ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id);
  END IF;
END $$;

-- 8.5 檢查並修復 pnrs 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pnrs' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.pnrs ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id);
  END IF;
END $$;

-- ============================================
-- 9. 建立索引
-- ============================================

-- visas 索引
CREATE INDEX IF NOT EXISTS idx_visas_workspace_id ON public.visas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_visas_customer_id ON public.visas(customer_id);
CREATE INDEX IF NOT EXISTS idx_visas_status ON public.visas(status);

-- disbursement_orders 索引
CREATE INDEX IF NOT EXISTS idx_disbursement_orders_workspace_id ON public.disbursement_orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disbursement_orders_status ON public.disbursement_orders(status);

-- companies 索引
CREATE INDEX IF NOT EXISTS idx_companies_workspace_id ON public.companies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_companies_tax_id ON public.companies(tax_id);

-- company_contacts 索引
CREATE INDEX IF NOT EXISTS idx_company_contacts_company_id ON public.company_contacts(company_id);

-- company_announcements 索引
CREATE INDEX IF NOT EXISTS idx_company_announcements_workspace_id ON public.company_announcements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_company_announcements_status ON public.company_announcements(status);

-- tour_addons 索引
CREATE INDEX IF NOT EXISTS idx_tour_addons_tour_id ON public.tour_addons(tour_id);

-- payment_request_items 索引
CREATE INDEX IF NOT EXISTS idx_payment_request_items_payment_request_id ON public.payment_request_items(payment_request_id);

-- ============================================
-- 10. 禁用 RLS（Venturo 不使用 RLS）
-- ============================================
ALTER TABLE public.visas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursement_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_request_items DISABLE ROW LEVEL SECURITY;

COMMIT;
