-- 修正 orders 表格的 contact_phone 欄位為可選
-- 問題：資料庫要求 contact_phone NOT NULL，但建立訂單時沒有提供此欄位

BEGIN;

-- 將 contact_phone 改為可選 (允許 NULL)
ALTER TABLE public.orders
ALTER COLUMN contact_phone DROP NOT NULL;

-- 為現有沒有 contact_phone 的記錄設定預設值
UPDATE public.orders
SET contact_phone = ''
WHERE contact_phone IS NULL;

COMMIT;
