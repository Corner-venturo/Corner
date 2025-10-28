-- 新增城市背景圖欄位和 Storage Bucket
-- 目的：支援城市背景圖管理，從 Storage 讀取而非硬編碼 URL

BEGIN;

-- ============================================
-- 1. 新增 background_image_url 欄位到 cities 表
-- ============================================
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

COMMENT ON COLUMN public.cities.background_image_url IS '城市背景圖 URL（存放在 Supabase Storage）';

-- ============================================
-- 2. 建立索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cities_background_image ON public.cities(background_image_url) WHERE background_image_url IS NOT NULL;

COMMIT;
