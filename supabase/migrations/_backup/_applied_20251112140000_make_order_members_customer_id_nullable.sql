-- 將 order_members.customer_id 改為可選
BEGIN;

ALTER TABLE public.order_members
ALTER COLUMN customer_id DROP NOT NULL;

COMMENT ON COLUMN public.order_members.customer_id IS '客戶 ID（可選，成員資料可能還沒有對應的客戶）';

COMMIT;
