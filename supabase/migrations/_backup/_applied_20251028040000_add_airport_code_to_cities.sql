-- 新增機場代號到城市表
-- 目的：用於生成團號（如 CNX250128-01）

BEGIN;

-- 新增 airport_code 欄位
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS airport_code TEXT;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_cities_airport_code ON public.cities(airport_code);

-- 更新現有資料的機場代號
UPDATE public.cities SET airport_code = 'NRT' WHERE id = 'tokyo';
UPDATE public.cities SET airport_code = 'SPK' WHERE id = 'sapporo';
UPDATE public.cities SET airport_code = 'YOK' WHERE id = 'yokohama';
UPDATE public.cities SET airport_code = 'OSA' WHERE id = 'osaka';
UPDATE public.cities SET airport_code = 'KIX' WHERE id = 'kyoto';
UPDATE public.cities SET airport_code = 'UKB' WHERE id = 'kobe';
UPDATE public.cities SET airport_code = 'FUK' WHERE id = 'fukuoka';
UPDATE public.cities SET airport_code = 'KMJ' WHERE id = 'kumamoto';
UPDATE public.cities SET airport_code = 'NGS' WHERE id = 'nagasaki';
UPDATE public.cities SET airport_code = 'OKA' WHERE id = 'naha';
UPDATE public.cities SET airport_code = 'BKK' WHERE id = 'bangkok';
UPDATE public.cities SET airport_code = 'CNX' WHERE id = 'chiang-mai';
UPDATE public.cities SET airport_code = 'HKT' WHERE id = 'phuket';
UPDATE public.cities SET airport_code = 'ICN' WHERE id = 'seoul';
UPDATE public.cities SET airport_code = 'PUS' WHERE id = 'busan';
UPDATE public.cities SET airport_code = 'CJU' WHERE id = 'jeju';

-- 註解
COMMENT ON COLUMN public.cities.airport_code IS '機場代號（用於生成團號，如 CNX、BKK）';

COMMIT;
