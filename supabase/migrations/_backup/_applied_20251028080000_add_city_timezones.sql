-- 為城市添加時區資訊
-- 使用 IANA 時區資料庫格式（例如 Asia/Tokyo）
-- 這些時區會自動處理夏令時（DST）

BEGIN;

-- 日本城市
UPDATE public.cities SET timezone = 'Asia/Tokyo' WHERE country_id = 'japan';

-- 菲律賓城市
UPDATE public.cities SET timezone = 'Asia/Manila' WHERE country_id = 'philippines';

-- 泰國城市
UPDATE public.cities SET timezone = 'Asia/Bangkok' WHERE country_id = 'thailand';

-- 越南城市
UPDATE public.cities SET timezone = 'Asia/Ho_Chi_Minh' WHERE country_id = 'vietnam';

-- 中國城市
UPDATE public.cities SET timezone = 'Asia/Shanghai' WHERE country_id = 'china';

-- 埃及城市
UPDATE public.cities SET timezone = 'Africa/Cairo' WHERE country_id = 'egypt';

-- 土耳其城市
UPDATE public.cities SET timezone = 'Europe/Istanbul' WHERE country_id = 'turkey';

-- 法國城市
UPDATE public.cities SET timezone = 'Europe/Paris' WHERE country_id = 'france';

-- 添加註釋
COMMENT ON COLUMN public.cities.timezone IS 'IANA 時區標識符（例如 Asia/Tokyo），自動處理夏令時';

COMMIT;
