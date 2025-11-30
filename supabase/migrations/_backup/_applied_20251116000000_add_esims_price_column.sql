-- 新增 esims 表的 price 欄位
-- 用於儲存網卡單價（從 FastMove API 取得）
BEGIN;

-- 新增 price 欄位
ALTER TABLE public.esims
ADD COLUMN IF NOT EXISTS price numeric(10, 2);

-- 註釋
COMMENT ON COLUMN public.esims.price IS '網卡單價（從 FastMove API 產品價格取得）';

COMMIT;
