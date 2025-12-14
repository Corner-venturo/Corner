-- 加入缺失的欄位到 split_bill_projects
BEGIN;

ALTER TABLE split_bill_projects
ADD COLUMN IF NOT EXISTS enabled_currencies TEXT[] DEFAULT ARRAY['TWD'];

ALTER TABLE split_bill_projects
ADD COLUMN IF NOT EXISTS settlement_currency TEXT DEFAULT 'TWD';

ALTER TABLE split_bill_projects
ADD COLUMN IF NOT EXISTS exchange_rates JSONB DEFAULT '{}';

COMMIT;
