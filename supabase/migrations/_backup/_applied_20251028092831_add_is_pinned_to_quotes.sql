-- 新增 quotes.is_pinned 欄位
BEGIN;

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

COMMENT ON COLUMN public.quotes.is_pinned IS '是否為置頂範本報價單';

COMMIT;
