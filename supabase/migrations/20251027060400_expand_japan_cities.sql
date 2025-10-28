-- 完善日本各地區的城市資料（使用 ON CONFLICT 避免重複）

BEGIN;

-- ============================================
-- 關東地區補充
-- ============================================
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('yokohama', 'japan', 'kanto', '橫濱', 'Yokohama', 2),
  ('hakone', 'japan', 'kanto', '箱根', 'Hakone', 5),
  ('kawagoe', 'japan', 'kanto', '川越', 'Kawagoe', 6),
  ('chiba', 'japan', 'kanto', '千葉', 'Chiba', 7),
  ('enoshima', 'japan', 'kanto', '江之島', 'Enoshima', 8),
  ('kawasaki', 'japan', 'kanto', '川崎', 'Kawasaki', 9)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 關西地區補充
-- ============================================
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('kobe', 'japan', 'kansai', '神戶', 'Kobe', 3),
  ('koyasan', 'japan', 'kansai', '高野山', 'Koyasan', 7),
  ('ise', 'japan', 'kansai', '伊勢', 'Ise', 8),
  ('uji', 'japan', 'kansai', '宇治', 'Uji', 9),
  ('arashiyama', 'japan', 'kansai', '嵐山', 'Arashiyama', 10)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 九州地區補充
-- ============================================
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('kumamoto', 'japan', 'kyushu', '熊本', 'Kumamoto', 3),
  ('nagasaki', 'japan', 'kyushu', '長崎', 'Nagasaki', 7),
  ('yufuin', 'japan', 'kyushu', '由布院', 'Yufuin', 8),
  ('aso', 'japan', 'kyushu', '阿蘇', 'Aso', 9),
  ('takachiho', 'japan', 'kyushu', '高千穗', 'Takachiho', 10),
  ('yakushima', 'japan', 'kyushu', '屋久島', 'Yakushima', 11)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 北海道地區補充
-- ============================================
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('asahikawa', 'japan', 'hokkaido', '旭川', 'Asahikawa', 5),
  ('biei', 'japan', 'hokkaido', '美瑛', 'Biei', 6),
  ('noboribetsu', 'japan', 'hokkaido', '登別', 'Noboribetsu', 7),
  ('kushiro', 'japan', 'hokkaido', '釧路', 'Kushiro', 8),
  ('niseko', 'japan', 'hokkaido', '二世谷', 'Niseko', 9)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 沖繩地區補充
-- ============================================
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('taketomi', 'japan', 'okinawa', '竹富島', 'Taketomi', 4),
  ('zamami', 'japan', 'okinawa', '座間味島', 'Zamami', 5),
  ('iriomote', 'japan', 'okinawa', '西表島', 'Iriomote', 6)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 東北地區補充
-- ============================================
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('akita', 'japan', 'tohoku', '秋田', 'Akita', 3),
  ('yamagata', 'japan', 'tohoku', '山形', 'Yamagata', 4),
  ('morioka', 'japan', 'tohoku', '盛岡', 'Morioka', 5),
  ('matsushima', 'japan', 'tohoku', '松島', 'Matsushima', 6),
  ('hirosaki', 'japan', 'tohoku', '弘前', 'Hirosaki', 7),
  ('kakunodate', 'japan', 'tohoku', '角館', 'Kakunodate', 8)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 中部地區補充
-- ============================================
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('shirakawago', 'japan', 'chubu', '白川鄉', 'Shirakawa-go', 4),
  ('matsumoto', 'japan', 'chubu', '松本', 'Matsumoto', 5),
  ('toyama', 'japan', 'chubu', '富山', 'Toyama', 6),
  ('fukui', 'japan', 'chubu', '福井', 'Fukui', 7),
  ('kamikochi', 'japan', 'chubu', '上高地', 'Kamikochi', 8),
  ('tateyama', 'japan', 'chubu', '立山', 'Tateyama', 9),
  ('gero', 'japan', 'chubu', '下呂', 'Gero', 10)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 中國地區補充
-- ============================================
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('kurashiki', 'japan', 'chugoku', '倉敷', 'Kurashiki', 3),
  ('tottori', 'japan', 'chugoku', '鳥取', 'Tottori', 4),
  ('shimane', 'japan', 'chugoku', '島根', 'Shimane', 5),
  ('yamaguchi', 'japan', 'chugoku', '山口', 'Yamaguchi', 6),
  ('onomichi', 'japan', 'chugoku', '尾道', 'Onomichi', 7)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 四國地區補充
-- ============================================
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  ('kochi', 'japan', 'shikoku', '高知', 'Kochi', 3),
  ('tokushima', 'japan', 'shikoku', '德島', 'Tokushima', 4),
  ('kotohira', 'japan', 'shikoku', '琴平', 'Kotohira', 5),
  ('naruto', 'japan', 'shikoku', '鳴門', 'Naruto', 6),
  ('uwajima', 'japan', 'shikoku', '宇和島', 'Uwajima', 7)
ON CONFLICT (id) DO NOTHING;

COMMIT;
