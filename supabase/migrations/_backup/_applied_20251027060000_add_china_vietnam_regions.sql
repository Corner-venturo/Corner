-- 新增中國和越南的地區資料

BEGIN;

-- ============================================
-- 1. 新增中國（有地區分類）
-- ============================================
INSERT INTO public.countries (id, name, name_en, emoji, code, has_regions, display_order) VALUES
  ('china', '中國', 'China', '🇨🇳', 'CN', true, 4);

-- 中國地區
INSERT INTO public.regions (id, country_id, name, name_en, display_order) VALUES
  ('northeast', 'china', '東北', 'Northeast', 1),
  ('sichuan', 'china', '四川', 'Sichuan', 2),
  ('east-china', 'china', '華東', 'East China', 3),
  ('north-china', 'china', '華北', 'North China', 4),
  ('fujian', 'china', '福建', 'Fujian', 5),
  ('hainan', 'china', '海南', 'Hainan', 6);

-- 中國城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  -- 東北（可以選擇具體城市，這裡用哈爾濱代表）
  ('harbin', 'china', 'northeast', '哈爾濱', 'Harbin', 1),
  -- 四川
  ('chengdu', 'china', 'sichuan', '成都', 'Chengdu', 1),
  -- 華東
  ('shanghai', 'china', 'east-china', '上海', 'Shanghai', 1),
  -- 華北
  ('beijing', 'china', 'north-china', '北京', 'Beijing', 1),
  -- 福建
  ('xiamen', 'china', 'fujian', '廈門', 'Xiamen', 1),
  -- 海南
  ('sanya', 'china', 'hainan', '三亞', 'Sanya', 1);

-- ============================================
-- 2. 新增越南（沒有地區分類）
-- ============================================
INSERT INTO public.countries (id, name, name_en, emoji, code, has_regions, display_order) VALUES
  ('vietnam', '越南', 'Vietnam', '🇻🇳', 'VN', false, 5);

-- 越南城市（常見旅遊城市）
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('hanoi', 'vietnam', NULL, '河內', 'Hanoi', 1),
  ('ho-chi-minh', 'vietnam', NULL, '胡志明市', 'Ho Chi Minh City', 2),
  ('da-nang', 'vietnam', NULL, '峴港', 'Da Nang', 3),
  ('nha-trang', 'vietnam', NULL, '芽莊', 'Nha Trang', 4),
  ('hoi-an', 'vietnam', NULL, '會安', 'Hoi An', 5),
  ('ha-long', 'vietnam', NULL, '下龍灣', 'Ha Long Bay', 6);

COMMIT;
