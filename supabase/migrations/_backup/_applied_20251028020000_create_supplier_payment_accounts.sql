-- Migration: 建立供應商付款帳戶表
-- Purpose: 支援供應商擁有多個付款帳戶，請款時可選擇支付對象
-- Author: Claude Code
-- Date: 2025-10-28

BEGIN;

-- 1. 建立供應商付款帳戶表
CREATE TABLE IF NOT EXISTS public.supplier_payment_accounts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  supplier_id text NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,

  -- 帳戶基本資訊
  account_name text NOT NULL, -- 帳戶名稱（如：主要帳戶、泰國當地帳戶）
  account_holder text NOT NULL, -- 戶名
  bank_name text NOT NULL, -- 銀行名稱
  bank_code text, -- 銀行代碼
  bank_branch text, -- 分行名稱
  account_number text NOT NULL, -- 帳號
  swift_code text, -- SWIFT Code（國際匯款用）

  -- 幣別與類型
  currency text DEFAULT 'TWD', -- 幣別（TWD, USD, THB, JPY...）
  account_type text, -- 帳戶類型（checking=支票, savings=儲蓄）

  -- 狀態
  is_default boolean DEFAULT false, -- 是否為預設帳戶
  is_active boolean DEFAULT true, -- 是否啟用

  -- 備註
  note text,

  -- 審計欄位
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by text,

  -- 約束：帳號必須唯一
  UNIQUE(bank_name, account_number)
);

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS idx_supplier_payment_accounts_supplier_id
  ON public.supplier_payment_accounts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_accounts_is_default
  ON public.supplier_payment_accounts(supplier_id, is_default)
  WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_supplier_payment_accounts_currency
  ON public.supplier_payment_accounts(currency);

-- 3. 註釋
COMMENT ON TABLE public.supplier_payment_accounts IS '供應商付款帳戶（支援多個帳戶）';
COMMENT ON COLUMN public.supplier_payment_accounts.account_name IS '帳戶名稱（如：主要帳戶、泰國當地帳戶）';
COMMENT ON COLUMN public.supplier_payment_accounts.account_holder IS '戶名';
COMMENT ON COLUMN public.supplier_payment_accounts.bank_name IS '銀行名稱';
COMMENT ON COLUMN public.supplier_payment_accounts.bank_code IS '銀行代碼';
COMMENT ON COLUMN public.supplier_payment_accounts.account_number IS '帳號';
COMMENT ON COLUMN public.supplier_payment_accounts.swift_code IS 'SWIFT Code（國際匯款）';
COMMENT ON COLUMN public.supplier_payment_accounts.currency IS '幣別（TWD, USD, THB, JPY...）';
COMMENT ON COLUMN public.supplier_payment_accounts.account_type IS '帳戶類型（checking=支票, savings=儲蓄）';
COMMENT ON COLUMN public.supplier_payment_accounts.is_default IS '是否為預設帳戶';

-- 4. 設定 RLS 策略
ALTER TABLE public.supplier_payment_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read supplier_payment_accounts"
  ON public.supplier_payment_accounts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert supplier_payment_accounts"
  ON public.supplier_payment_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update supplier_payment_accounts"
  ON public.supplier_payment_accounts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete supplier_payment_accounts"
  ON public.supplier_payment_accounts
  FOR DELETE
  TO authenticated
  USING (true);

-- 5. 建立觸發器：確保每個供應商只有一個預設帳戶
CREATE OR REPLACE FUNCTION ensure_single_default_payment_account()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果新設定為預設帳戶，將同供應商的其他帳戶改為非預設
  IF NEW.is_default = true THEN
    UPDATE public.supplier_payment_accounts
    SET is_default = false
    WHERE supplier_id = NEW.supplier_id
      AND id != NEW.id
      AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_payment_account
  BEFORE INSERT OR UPDATE OF is_default
  ON public.supplier_payment_accounts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_account();

-- 6. 遷移現有資料：將 suppliers 表的銀行資訊轉換為付款帳戶
INSERT INTO public.supplier_payment_accounts (
  supplier_id,
  account_name,
  account_holder,
  bank_name,
  bank_branch,
  account_number,
  is_default,
  is_active,
  created_by
)
SELECT
  id AS supplier_id,
  '主要帳戶' AS account_name,
  name AS account_holder,
  COALESCE(bank_name, '未設定') AS bank_name,
  bank_branch,
  COALESCE(bank_account, '待補') AS account_number,
  true AS is_default,
  true AS is_active,
  created_by
FROM public.suppliers
WHERE bank_account IS NOT NULL
  AND bank_account != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.supplier_payment_accounts
    WHERE supplier_id = suppliers.id
  )
ON CONFLICT (bank_name, account_number) DO NOTHING;

COMMIT;
