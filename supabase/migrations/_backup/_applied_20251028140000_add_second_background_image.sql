-- 新增第二張城市背景圖欄位
-- 目的：為每個城市提供備選背景圖，增加多樣性

BEGIN;

-- 新增 background_image_url_2 欄位
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS background_image_url_2 TEXT;

COMMENT ON COLUMN public.cities.background_image_url_2 IS '城市背景圖（備選）';

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_cities_background_image_2
ON public.cities(background_image_url_2)
WHERE background_image_url_2 IS NOT NULL;

COMMIT;
