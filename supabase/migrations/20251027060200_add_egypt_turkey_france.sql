-- 新增埃及、土耳其、法國

BEGIN;

-- ============================================
-- 1. 新增埃及（沒有地區分類）
-- ============================================
INSERT INTO public.countries (id, name, name_en, emoji, code, has_regions, display_order) VALUES
  ('egypt', '埃及', 'Egypt', '🇪🇬', 'EG', false, 6);

-- 埃及城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('cairo', 'egypt', NULL, '開羅', 'Cairo', 1),
  ('luxor', 'egypt', NULL, '路克索', 'Luxor', 2),
  ('aswan', 'egypt', NULL, '亞斯文', 'Aswan', 3),
  ('hurghada', 'egypt', NULL, '紅海', 'Hurghada', 4),
  ('alexandria', 'egypt', NULL, '亞歷山大港', 'Alexandria', 5);

-- ============================================
-- 2. 新增土耳其（沒有地區分類）
-- ============================================
INSERT INTO public.countries (id, name, name_en, emoji, code, has_regions, display_order) VALUES
  ('turkey', '土耳其', 'Turkey', '🇹🇷', 'TR', false, 7);

-- 土耳其城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('istanbul', 'turkey', NULL, '伊斯坦堡', 'Istanbul', 1),
  ('cappadocia', 'turkey', NULL, '卡帕多奇亞', 'Cappadocia', 2),
  ('pamukkale', 'turkey', NULL, '棉堡', 'Pamukkale', 3),
  ('antalya', 'turkey', NULL, '安塔利亞', 'Antalya', 4),
  ('ankara', 'turkey', NULL, '安卡拉', 'Ankara', 5);

-- ============================================
-- 3. 新增法國（有地區分類）
-- ============================================
INSERT INTO public.countries (id, name, name_en, emoji, code, has_regions, display_order) VALUES
  ('france', '法國', 'France', '🇫🇷', 'FR', true, 8);

-- 法國地區
INSERT INTO public.regions (id, country_id, name, name_en, display_order) VALUES
  ('ile-de-france', 'france', '法蘭西島', 'Île-de-France', 1),
  ('provence', 'france', '普羅旺斯', 'Provence', 2),
  ('normandy', 'france', '諾曼第', 'Normandy', 3),
  ('loire-valley', 'france', '羅亞爾河谷', 'Loire Valley', 4),
  ('french-riviera', 'france', '蔚藍海岸', 'French Riviera', 5);

-- 法國城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  -- 法蘭西島
  ('paris', 'france', 'ile-de-france', '巴黎', 'Paris', 1),
  ('versailles', 'france', 'ile-de-france', '凡爾賽', 'Versailles', 2),
  -- 普羅旺斯
  ('avignon', 'france', 'provence', '亞維儂', 'Avignon', 1),
  ('aix-en-provence', 'france', 'provence', '艾克斯', 'Aix-en-Provence', 2),
  -- 諾曼第
  ('mont-saint-michel', 'france', 'normandy', '聖米歇爾山', 'Mont Saint-Michel', 1),
  -- 羅亞爾河谷
  ('tours', 'france', 'loire-valley', '圖爾', 'Tours', 1),
  -- 蔚藍海岸
  ('nice', 'france', 'french-riviera', '尼斯', 'Nice', 1),
  ('cannes', 'france', 'french-riviera', '坎城', 'Cannes', 2),
  ('monaco', 'france', 'french-riviera', '摩納哥', 'Monaco', 3);

COMMIT;
