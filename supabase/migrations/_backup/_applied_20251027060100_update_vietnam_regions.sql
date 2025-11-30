-- 更新越南為有地區分類（北中南越）

BEGIN;

-- ============================================
-- 1. 更新越南為有地區分類
-- ============================================
UPDATE public.countries
SET has_regions = true
WHERE id = 'vietnam';

-- ============================================
-- 2. 新增越南地區
-- ============================================
INSERT INTO public.regions (id, country_id, name, name_en, display_order) VALUES
  ('north-vietnam', 'vietnam', '北越', 'North Vietnam', 1),
  ('central-vietnam', 'vietnam', '中越', 'Central Vietnam', 2),
  ('south-vietnam', 'vietnam', '南越', 'South Vietnam', 3);

-- ============================================
-- 3. 更新現有城市的地區關聯
-- ============================================

-- 北越城市
UPDATE public.cities
SET region_id = 'north-vietnam'
WHERE id IN ('hanoi', 'ha-long');

-- 中越城市
UPDATE public.cities
SET region_id = 'central-vietnam'
WHERE id IN ('da-nang', 'hoi-an', 'nha-trang');

-- 南越城市
UPDATE public.cities
SET region_id = 'south-vietnam'
WHERE id = 'ho-chi-minh';

COMMIT;
