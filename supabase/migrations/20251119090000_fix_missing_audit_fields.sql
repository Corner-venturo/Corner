-- 修復缺失的 created_by 和 updated_by 欄位
BEGIN;

-- 1. payment_requests 表格：新增 updated_by
ALTER TABLE public.payment_requests
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.payment_requests.updated_by IS 'Last user who updated this payment request';

UPDATE public.payment_requests
SET updated_by = created_by
WHERE updated_by IS NULL;

-- 2. contracts 表格：新增 created_by 和 updated_by
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.contracts.created_by IS 'User who created this contract';
COMMENT ON COLUMN public.contracts.updated_by IS 'Last user who updated this contract';

-- 由於 contracts 沒有 created_by，使用第一個管理員或系統用戶
UPDATE public.contracts
SET created_by = (
  SELECT id FROM auth.users
  ORDER BY created_at
  LIMIT 1
),
updated_by = (
  SELECT id FROM auth.users
  ORDER BY created_at
  LIMIT 1
)
WHERE created_by IS NULL OR updated_by IS NULL;

-- 3. customers 表格：新增 created_by 和 updated_by
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.customers.created_by IS 'User who created this customer';
COMMENT ON COLUMN public.customers.updated_by IS 'Last user who updated this customer';

-- 由於 customers 沒有 created_by，使用第一個管理員或系統用戶
UPDATE public.customers
SET created_by = (
  SELECT id FROM auth.users
  ORDER BY created_at
  LIMIT 1
),
updated_by = (
  SELECT id FROM auth.users
  ORDER BY created_at
  LIMIT 1
)
WHERE created_by IS NULL OR updated_by IS NULL;

COMMIT;
