-- 新增宿務（Cebu）景點資料
-- 文案規格：標題 8-12字，內文 60-80字

BEGIN;

-- 1. 巧克力山（Chocolate Hills）- 自然景觀
INSERT INTO public.attractions (
  id,
  city_id,
  country_id,
  name,
  name_en,
  category,
  description,
  tags,
  images,
  duration_minutes,
  display_order,
  is_active
) VALUES (
  'ceb-chocolate-hills',
  'cebu',
  'philippines',
  '《巧克力山》- 薄荷島奇景',
  'Chocolate Hills',
  '自然景觀',
  '位於薄荷島的《巧克力山》由1268座圓錐形山丘組成，每座高達120公尺。乾季時草地轉為棕色，遠看如同灑落大地的巧克力球，是菲律賓最獨特的地質奇觀。',
  ARRAY['自然', '拍照', '必遊', '地質奇觀'],
  ARRAY[
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1920&q=85',
    'https://images.unsplash.com/photo-1569592364213-1becfc5c8b7f?w=1920&q=85'
  ],
  120,
  1,
  true
);

-- 2. 與鯨鯊共游 - 體驗活動
INSERT INTO public.attractions (
  id,
  city_id,
  country_id,
  name,
  name_en,
  category,
  description,
  tags,
  images,
  duration_minutes,
  display_order,
  is_active
) VALUES (
  'ceb-whale-shark',
  'cebu',
  'philippines',
  '與鯨鯊共游 - 歐斯陸海洋體驗',
  'Whale Shark Swimming',
  '體驗活動',
  '來到歐斯陸（Oslob）與世界最大魚類鯨鯊近距離接觸。這些溫馴的巨型生物長達10公尺，在清澈海水中與牠們共游，感受震撼又安全的海洋奇遇。',
  ARRAY['海洋', '體驗', '刺激', '生態'],
  ARRAY[
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85'
  ],
  180,
  2,
  true
);

-- 3. 眼鏡猴保護區 - 自然景觀
INSERT INTO public.attractions (
  id,
  city_id,
  country_id,
  name,
  name_en,
  category,
  description,
  tags,
  images,
  duration_minutes,
  display_order,
  is_active
) VALUES (
  'ceb-tarsier',
  'cebu',
  'philippines',
  '《眼鏡猴》保護區 - 世界最小靈長類',
  'Tarsier Sanctuary',
  '自然景觀',
  '菲律賓特有種《眼鏡猴》體長僅10公分，卻擁有比身體還大的眼睛。在薄荷島保護區近距離觀察這些夜行性小精靈，牠們靈活轉動180度的頭部超級可愛。',
  ARRAY['生態', '保育', '可愛', '獨特'],
  ARRAY[
    'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=1920&q=85'
  ],
  60,
  3,
  true
);

-- 4. 羅博河竹筏漂流 - 體驗活動
INSERT INTO public.attractions (
  id,
  city_id,
  country_id,
  name,
  name_en,
  category,
  description,
  tags,
  images,
  duration_minutes,
  display_order,
  is_active
) VALUES (
  'ceb-loboc-river',
  'cebu',
  'philippines',
  '《羅博河》竹筏漂流午餐',
  'Loboc River Cruise',
  '體驗活動',
  '乘坐傳統竹筏順著《羅博河》緩緩前行，兩岸熱帶雨林美景盡收眼底。船上提供菲律賓自助午餐，還有現場樂團演奏，在悠閒氛圍中享受2小時的河上時光。',
  ARRAY['河流', '美食', '放鬆', '文化'],
  ARRAY[
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'
  ],
  120,
  4,
  true
);

-- 5. 麥哲倫十字架 - 歷史文化
INSERT INTO public.attractions (
  id,
  city_id,
  country_id,
  name,
  name_en,
  category,
  description,
  tags,
  images,
  duration_minutes,
  display_order,
  is_active
) VALUES (
  'ceb-magellan-cross',
  'cebu',
  'philippines',
  '《麥哲倫十字架》- 宿務歷史地標',
  'Magellan''s Cross',
  '歷史文化',
  '1521年葡萄牙探險家麥哲倫在此豎立十字架，象徵菲律賓基督教化的起點。八角形禮拜堂內天花板繪有當年受洗場景，是宿務市最重要的歷史遺跡。',
  ARRAY['歷史', '宗教', '地標', '文化'],
  ARRAY[
    'https://images.unsplash.com/photo-1555881675-d8d8d7b1c157?w=1920&q=85'
  ],
  30,
  5,
  true
);

-- 6. 聖嬰大教堂 - 歷史文化
INSERT INTO public.attractions (
  id,
  city_id,
  country_id,
  name,
  name_en,
  category,
  description,
  tags,
  images,
  duration_minutes,
  display_order,
  is_active
) VALUES (
  'ceb-santo-nino',
  'cebu',
  'philippines',
  '《聖嬰大教堂》- 菲律賓最古老教堂',
  'Basilica del Santo Niño',
  '歷史文化',
  '建於1565年的《聖嬰大教堂》是菲律賓最古老的羅馬天主教堂。教堂供奉聖嬰像，每年1月的盛大慶典吸引數百萬信徒朝聖，巴洛克式建築莊嚴華麗。',
  ARRAY['宗教', '建築', '古蹟', '朝聖'],
  ARRAY[
    'https://images.unsplash.com/photo-1583474372481-48b0aed9295e?w=1920&q=85'
  ],
  45,
  6,
  true
);

COMMIT;
