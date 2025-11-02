BEGIN;

-- ===================================
-- 1. 帳戶表格 (accounting_accounts)
-- ===================================
CREATE TABLE IF NOT EXISTS public.accounting_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'bank', 'credit', 'investment', 'other')),
  balance numeric(15, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TWD',
  icon text,
  color text,
  is_active boolean DEFAULT true,
  description text,
  credit_limit numeric(15, 2),
  available_credit numeric(15, 2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.accounting_accounts IS '記帳帳戶（每個員工都可以新增多個帳戶）';
COMMENT ON COLUMN public.accounting_accounts.user_id IS '帳戶所屬的使用者';
COMMENT ON COLUMN public.accounting_accounts.type IS '帳戶類型：cash 現金、bank 銀行、credit 信用卡、investment 投資、other 其他';
COMMENT ON COLUMN public.accounting_accounts.balance IS '當前餘額';
COMMENT ON COLUMN public.accounting_accounts.credit_limit IS '信用額度（僅信用卡）';
COMMENT ON COLUMN public.accounting_accounts.available_credit IS '可用額度（僅信用卡）';

-- ===================================
-- 2. 交易記錄表格 (accounting_transactions)
-- ===================================
CREATE TABLE IF NOT EXISTS public.accounting_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE CASCADE,
  account_name text,
  category_id uuid,
  category_name text,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount numeric(15, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'TWD',
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  to_account_id uuid REFERENCES public.accounting_accounts(id) ON DELETE SET NULL,
  to_account_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.accounting_transactions IS '記帳交易記錄（收入、支出、轉帳）';
COMMENT ON COLUMN public.accounting_transactions.user_id IS '交易所屬的使用者';
COMMENT ON COLUMN public.accounting_transactions.type IS '交易類型：income 收入、expense 支出、transfer 轉帳';
COMMENT ON COLUMN public.accounting_transactions.to_account_id IS '轉帳目標帳戶（僅轉帳）';

-- ===================================
-- 3. 分類表格 (accounting_categories)
-- ===================================
CREATE TABLE IF NOT EXISTS public.accounting_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  icon text,
  color text,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.accounting_categories IS '記帳分類（收入/支出分類）';
COMMENT ON COLUMN public.accounting_categories.is_system IS '是否為系統預設分類（不可刪除）';

-- ===================================
-- 4. 索引
-- ===================================
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_user_id ON public.accounting_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_is_active ON public.accounting_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_user_id ON public.accounting_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_account_id ON public.accounting_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_date ON public.accounting_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_type ON public.accounting_transactions(type);

-- ===================================
-- 5. 禁用 RLS（內部系統）
-- ===================================
ALTER TABLE public.accounting_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_categories DISABLE ROW LEVEL SECURITY;

-- ===================================
-- 6. 插入預設分類
-- ===================================
INSERT INTO public.accounting_categories (name, type, icon, color, is_system) VALUES
-- 收入分類
('薪資收入', 'income', 'Wallet', '#7B9B7E', true),
('獎金', 'income', 'TrendingUp', '#7B9B7E', true),
('投資收益', 'income', 'TrendingUp', '#B4A5C8', true),
('其他收入', 'income', 'PiggyBank', '#C9A961', true),

-- 支出分類
('餐飲', 'expense', 'Coffee', '#C89B9B', true),
('交通', 'expense', 'Car', '#8BA8C4', true),
('購物', 'expense', 'ShoppingBag', '#D9A5A5', true),
('娛樂', 'expense', 'Gamepad', '#B4A5C8', true),
('醫療', 'expense', 'Heart', '#C89B9B', true),
('教育', 'expense', 'BookOpen', '#8BA8C4', true),
('居住', 'expense', 'Home', '#9E8F81', true),
('其他支出', 'expense', 'MoreHorizontal', '#AFA598', true),

-- 轉帳
('轉帳', 'transfer', 'ArrowRightLeft', '#8BA8C4', true)
ON CONFLICT DO NOTHING;

COMMIT;
