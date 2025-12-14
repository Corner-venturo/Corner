-- 加入 currency 欄位到 split_bill_expenses
BEGIN;

ALTER TABLE split_bill_expenses
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TWD';

COMMIT;
