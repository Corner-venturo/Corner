-- 新增菲律賓資料（含宿務、長灘島）
-- 目的：擴充地區管理系統，新增菲律賓國家及城市

BEGIN;

-- 新增菲律賓國家
INSERT INTO public.countries (id, name, name_en, emoji, code, has_regions, display_order)
VALUES ('philippines', '菲律賓', 'Philippines', '🇵🇭', 'PH', false, 10)
ON CONFLICT (id) DO NOTHING;

-- 新增城市：宿務、長灘島
INSERT INTO public.cities (id, country_id, region_id, name, name_en, timezone, display_order)
VALUES
  ('cebu', 'philippines', NULL, '宿務', 'Cebu', 'Asia/Manila', 1),
  ('boracay', 'philippines', NULL, '長灘島', 'Boracay', 'Asia/Manila', 2)
ON CONFLICT (country_id, name) DO NOTHING;

COMMIT;
