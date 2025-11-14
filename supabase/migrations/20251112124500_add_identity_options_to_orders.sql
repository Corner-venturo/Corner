-- 在 orders 表格新增 identity_options 欄位用於儲存自訂身份選項
BEGIN;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS identity_options jsonb DEFAULT '["員工", "眷屬", "朋友", "客戶"]'::jsonb;

COMMENT ON COLUMN public.orders.identity_options IS '自訂身份選項列表（JSON 陣列）';

COMMIT;
