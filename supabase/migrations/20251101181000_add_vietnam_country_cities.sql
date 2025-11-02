-- ============================================
-- 新增越南國家與城市資料
-- ============================================

BEGIN;

-- 1. 新增越南國家
INSERT INTO public.countries (id, name, name_en, code, emoji, has_regions, is_active, display_order)
VALUES (
  'vietnam',
  '越南',
  'Vietnam',
  'VN',
  '🇻🇳',
  false,
  true,
  5
)
ON CONFLICT (id) DO NOTHING;

-- 2. 新增越南主要城市
INSERT INTO public.cities (id, country_id, name, name_en, airport_code, is_active, display_order)
VALUES
  ('ho-chi-minh', 'vietnam', '胡志明市', 'Ho Chi Minh City', 'SGN', true, 1),
  ('hanoi', 'vietnam', '河內', 'Hanoi', 'HAN', true, 2),
  ('da-nang', 'vietnam', '峴港', 'Da Nang', 'DAD', true, 3),
  ('hoi-an', 'vietnam', '會安', 'Hoi An', 'VCA', true, 4),
  ('nha-trang', 'vietnam', '芽莊', 'Nha Trang', 'CXR', true, 5),
  ('ha-long', 'vietnam', '下龍灣', 'Ha Long Bay', 'HPH', true, 6)
ON CONFLICT (id) DO NOTHING;

-- 3. 註解
COMMENT ON TABLE public.countries IS '國家資料表';
COMMENT ON TABLE public.cities IS '城市資料表';

COMMIT;
