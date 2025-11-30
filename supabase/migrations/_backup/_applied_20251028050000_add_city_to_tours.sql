-- 新增城市資訊到旅遊團表
-- 目的：儲存旅遊團的國家和城市，用於建立報價單時自動帶入

BEGIN;

-- 新增欄位
ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS country_id TEXT REFERENCES public.countries(id),
ADD COLUMN IF NOT EXISTS main_city_id TEXT REFERENCES public.cities(id);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_tours_country_id ON public.tours(country_id);
CREATE INDEX IF NOT EXISTS idx_tours_main_city_id ON public.tours(main_city_id);

-- 註解
COMMENT ON COLUMN public.tours.country_id IS '國家 ID';
COMMENT ON COLUMN public.tours.main_city_id IS '主要城市 ID（用於團號生成和報價單建立）';

COMMIT;
