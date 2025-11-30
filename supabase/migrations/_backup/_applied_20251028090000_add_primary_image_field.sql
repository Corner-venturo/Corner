-- 為 cities 表格添加 primary_image 欄位
-- 用於標記哪張圖片是主要圖片（1 或 2）

BEGIN;

-- 添加 primary_image 欄位
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS primary_image integer DEFAULT 1 CHECK (primary_image IN (1, 2));

-- 添加註釋
COMMENT ON COLUMN public.cities.primary_image IS '主要圖片編號：1 = background_image_url, 2 = background_image_url_2';

COMMIT;
