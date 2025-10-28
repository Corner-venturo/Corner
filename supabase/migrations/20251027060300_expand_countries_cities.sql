-- 完善各國的地區和城市

BEGIN;

-- ============================================
-- 1. 完善日本
-- ============================================

-- 新增日本地區
INSERT INTO public.regions (id, country_id, name, name_en, display_order) VALUES
  ('tohoku', 'japan', '東北', 'Tohoku', 6),
  ('chubu', 'japan', '中部', 'Chubu', 7),
  ('chugoku', 'japan', '中國', 'Chugoku', 8),
  ('shikoku', 'japan', '四國', 'Shikoku', 9);

-- 新增日本城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  -- 北海道
  ('otaru', 'japan', 'hokkaido', '小樽', 'Otaru', 2),
  ('hakodate', 'japan', 'hokkaido', '函館', 'Hakodate', 3),
  ('furano', 'japan', 'hokkaido', '富良野', 'Furano', 4),
  -- 關東
  ('kamakura', 'japan', 'kanto', '鎌倉', 'Kamakura', 3),
  ('nikko', 'japan', 'kanto', '日光', 'Nikko', 4),
  -- 關西
  ('nara', 'japan', 'kansai', '奈良', 'Nara', 4),
  ('himeji', 'japan', 'kansai', '姬路', 'Himeji', 5),
  ('wakayama', 'japan', 'kansai', '和歌山', 'Wakayama', 6),
  -- 九州
  ('kagoshima', 'japan', 'kyushu', '鹿兒島', 'Kagoshima', 4),
  ('miyazaki', 'japan', 'kyushu', '宮崎', 'Miyazaki', 5),
  ('beppu', 'japan', 'kyushu', '別府', 'Beppu', 6),
  -- 沖繩
  ('ishigaki', 'japan', 'okinawa', '石垣島', 'Ishigaki', 2),
  ('miyako', 'japan', 'okinawa', '宮古島', 'Miyako', 3),
  -- 東北
  ('sendai', 'japan', 'tohoku', '仙台', 'Sendai', 1),
  ('aomori', 'japan', 'tohoku', '青森', 'Aomori', 2),
  -- 中部
  ('nagoya', 'japan', 'chubu', '名古屋', 'Nagoya', 1),
  ('takayama', 'japan', 'chubu', '高山', 'Takayama', 2),
  ('kanazawa', 'japan', 'chubu', '金澤', 'Kanazawa', 3),
  -- 中國
  ('hiroshima', 'japan', 'chugoku', '廣島', 'Hiroshima', 1),
  ('okayama', 'japan', 'chugoku', '岡山', 'Okayama', 2),
  -- 四國
  ('takamatsu', 'japan', 'shikoku', '高松', 'Takamatsu', 1),
  ('matsuyama', 'japan', 'shikoku', '松山', 'Matsuyama', 2);

-- ============================================
-- 2. 完善泰國（改為有地區）
-- ============================================

-- 更新泰國為有地區
UPDATE public.countries SET has_regions = true WHERE id = 'thailand';

-- 新增泰國地區
INSERT INTO public.regions (id, country_id, name, name_en, display_order) VALUES
  ('central-thailand', 'thailand', '中部', 'Central Thailand', 1),
  ('north-thailand', 'thailand', '北部', 'North Thailand', 2),
  ('south-thailand', 'thailand', '南部', 'South Thailand', 3),
  ('northeast-thailand', 'thailand', '東北部', 'Northeast Thailand', 4);

-- 更新現有泰國城市的地區
UPDATE public.cities SET region_id = 'central-thailand' WHERE id = 'bangkok';
UPDATE public.cities SET region_id = 'north-thailand' WHERE id = 'chiang-mai';
UPDATE public.cities SET region_id = 'south-thailand' WHERE id = 'phuket';

-- 新增泰國城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  -- 中部
  ('ayutthaya', 'thailand', 'central-thailand', '大城', 'Ayutthaya', 2),
  ('pattaya', 'thailand', 'central-thailand', '芭達雅', 'Pattaya', 3),
  ('hua-hin', 'thailand', 'central-thailand', '華欣', 'Hua Hin', 4),
  -- 北部
  ('chiang-rai', 'thailand', 'north-thailand', '清萊', 'Chiang Rai', 2),
  ('pai', 'thailand', 'north-thailand', '拜縣', 'Pai', 3),
  -- 南部
  ('krabi', 'thailand', 'south-thailand', '喀比', 'Krabi', 2),
  ('koh-samui', 'thailand', 'south-thailand', '蘇美島', 'Koh Samui', 3),
  ('koh-phangan', 'thailand', 'south-thailand', '帕岸島', 'Koh Phangan', 4);

-- ============================================
-- 3. 完善韓國（改為有地區）
-- ============================================

-- 更新韓國為有地區
UPDATE public.countries SET has_regions = true WHERE id = 'korea';

-- 新增韓國地區
INSERT INTO public.regions (id, country_id, name, name_en, display_order) VALUES
  ('seoul-gyeonggi', 'korea', '首爾及京畿道', 'Seoul & Gyeonggi', 1),
  ('gyeongsang', 'korea', '慶尚道', 'Gyeongsang', 2),
  ('jeju', 'korea', '濟州特別自治道', 'Jeju', 3),
  ('gangwon', 'korea', '江原道', 'Gangwon', 4);

-- 更新現有韓國城市的地區
UPDATE public.cities SET region_id = 'seoul-gyeonggi' WHERE id = 'seoul';
UPDATE public.cities SET region_id = 'gyeongsang' WHERE id = 'busan';
UPDATE public.cities SET region_id = 'jeju' WHERE id = 'jeju';

-- 新增韓國城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  -- 首爾及京畿道
  ('incheon', 'korea', 'seoul-gyeonggi', '仁川', 'Incheon', 2),
  ('suwon', 'korea', 'seoul-gyeonggi', '水原', 'Suwon', 3),
  -- 慶尚道
  ('gyeongju', 'korea', 'gyeongsang', '慶州', 'Gyeongju', 2),
  ('daegu', 'korea', 'gyeongsang', '大邱', 'Daegu', 3),
  -- 江原道
  ('gangneung', 'korea', 'gangwon', '江陵', 'Gangneung', 1),
  ('sokcho', 'korea', 'gangwon', '束草', 'Sokcho', 2);

-- ============================================
-- 4. 完善中國
-- ============================================

-- 新增中國地區
INSERT INTO public.regions (id, country_id, name, name_en, display_order) VALUES
  ('southwest', 'china', '西南', 'Southwest', 7),
  ('northwest', 'china', '西北', 'Northwest', 8),
  ('south-china', 'china', '華南', 'South China', 9),
  ('central-china', 'china', '華中', 'Central China', 10);

-- 新增中國城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  -- 東北
  ('dalian', 'china', 'northeast', '大連', 'Dalian', 2),
  ('changchun', 'china', 'northeast', '長春', 'Changchun', 3),
  -- 華東
  ('hangzhou', 'china', 'east-china', '杭州', 'Hangzhou', 2),
  ('suzhou', 'china', 'east-china', '蘇州', 'Suzhou', 3),
  ('nanjing', 'china', 'east-china', '南京', 'Nanjing', 4),
  ('huangshan', 'china', 'east-china', '黃山', 'Huangshan', 5),
  -- 華北
  ('tianjin', 'china', 'north-china', '天津', 'Tianjin', 2),
  ('qingdao', 'china', 'north-china', '青島', 'Qingdao', 3),
  -- 四川
  ('jiuzhaigou', 'china', 'sichuan', '九寨溝', 'Jiuzhaigou', 2),
  ('leshan', 'china', 'sichuan', '樂山', 'Leshan', 3),
  -- 福建
  ('fuzhou', 'china', 'fujian', '福州', 'Fuzhou', 2),
  ('wuyishan', 'china', 'fujian', '武夷山', 'Wuyishan', 3),
  -- 西南
  ('kunming', 'china', 'southwest', '昆明', 'Kunming', 1),
  ('lijiang', 'china', 'southwest', '麗江', 'Lijiang', 2),
  ('guilin', 'china', 'southwest', '桂林', 'Guilin', 3),
  ('zhangjiajie', 'china', 'southwest', '張家界', 'Zhangjiajie', 4),
  -- 西北
  ('xian', 'china', 'northwest', '西安', 'Xi''an', 1),
  ('dunhuang', 'china', 'northwest', '敦煌', 'Dunhuang', 2),
  ('urumqi', 'china', 'northwest', '烏魯木齊', 'Urumqi', 3),
  -- 華南
  ('guangzhou', 'china', 'south-china', '廣州', 'Guangzhou', 1),
  ('shenzhen', 'china', 'south-china', '深圳', 'Shenzhen', 2),
  ('zhuhai', 'china', 'south-china', '珠海', 'Zhuhai', 3),
  -- 華中
  ('wuhan', 'china', 'central-china', '武漢', 'Wuhan', 1),
  ('changsha', 'china', 'central-china', '長沙', 'Changsha', 2),
  ('zhengzhou', 'china', 'central-china', '鄭州', 'Zhengzhou', 3);

-- ============================================
-- 5. 完善越南
-- ============================================

-- 新增越南城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  -- 北越
  ('sapa', 'vietnam', 'north-vietnam', '沙壩', 'Sapa', 3),
  ('ninh-binh', 'vietnam', 'north-vietnam', '寧平', 'Ninh Binh', 4),
  -- 中越
  ('hue', 'vietnam', 'central-vietnam', '順化', 'Hue', 4),
  ('quy-nhon', 'vietnam', 'central-vietnam', '歸仁', 'Quy Nhon', 5),
  -- 南越
  ('vung-tau', 'vietnam', 'south-vietnam', '頭頓', 'Vung Tau', 2),
  ('can-tho', 'vietnam', 'south-vietnam', '芹苴', 'Can Tho', 3),
  ('phu-quoc', 'vietnam', 'south-vietnam', '富國島', 'Phu Quoc', 4);

-- ============================================
-- 6. 完善埃及（改為有地區）
-- ============================================

-- 更新埃及為有地區
UPDATE public.countries SET has_regions = true WHERE id = 'egypt';

-- 新增埃及地區
INSERT INTO public.regions (id, country_id, name, name_en, display_order) VALUES
  ('lower-egypt', 'egypt', '下埃及', 'Lower Egypt', 1),
  ('upper-egypt', 'egypt', '上埃及', 'Upper Egypt', 2),
  ('red-sea', 'egypt', '紅海地區', 'Red Sea', 3),
  ('sinai', 'egypt', '西奈半島', 'Sinai', 4);

-- 更新現有埃及城市的地區
UPDATE public.cities SET region_id = 'lower-egypt' WHERE id IN ('cairo', 'alexandria');
UPDATE public.cities SET region_id = 'upper-egypt' WHERE id IN ('luxor', 'aswan');
UPDATE public.cities SET region_id = 'red-sea' WHERE id = 'hurghada';

-- 新增埃及城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  -- 下埃及
  ('giza', 'egypt', 'lower-egypt', '吉薩', 'Giza', 3),
  -- 上埃及
  ('abu-simbel', 'egypt', 'upper-egypt', '阿布辛貝', 'Abu Simbel', 4),
  -- 紅海地區
  ('sharm-el-sheikh', 'egypt', 'red-sea', '沙姆沙伊赫', 'Sharm El Sheikh', 2),
  ('marsa-alam', 'egypt', 'red-sea', '馬薩阿拉姆', 'Marsa Alam', 3),
  -- 西奈半島
  ('dahab', 'egypt', 'sinai', '達哈卜', 'Dahab', 1);

-- ============================================
-- 7. 完善土耳其（改為有地區）
-- ============================================

-- 更新土耳其為有地區
UPDATE public.countries SET has_regions = true WHERE id = 'turkey';

-- 新增土耳其地區
INSERT INTO public.regions (id, country_id, name, name_en, display_order) VALUES
  ('marmara', 'turkey', '馬爾馬拉', 'Marmara', 1),
  ('central-anatolia', 'turkey', '中安納托利亞', 'Central Anatolia', 2),
  ('aegean', 'turkey', '愛琴海', 'Aegean', 3),
  ('mediterranean', 'turkey', '地中海', 'Mediterranean', 4);

-- 更新現有土耳其城市的地區
UPDATE public.cities SET region_id = 'marmara' WHERE id IN ('istanbul', 'ankara');
UPDATE public.cities SET region_id = 'central-anatolia' WHERE id = 'cappadocia';
UPDATE public.cities SET region_id = 'aegean' WHERE id = 'pamukkale';
UPDATE public.cities SET region_id = 'mediterranean' WHERE id = 'antalya';

-- 新增土耳其城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  -- 馬爾馬拉
  ('bursa', 'turkey', 'marmara', '布爾薩', 'Bursa', 3),
  -- 中安納托利亞
  ('konya', 'turkey', 'central-anatolia', '孔亞', 'Konya', 2),
  -- 愛琴海
  ('izmir', 'turkey', 'aegean', '伊茲密爾', 'Izmir', 2),
  ('ephesus', 'turkey', 'aegean', '以弗所', 'Ephesus', 3),
  ('bodrum', 'turkey', 'aegean', '博德魯姆', 'Bodrum', 4),
  -- 地中海
  ('fethiye', 'turkey', 'mediterranean', '費特希耶', 'Fethiye', 2),
  ('kas', 'turkey', 'mediterranean', '卡什', 'Kas', 3);

-- ============================================
-- 8. 完善法國
-- ============================================

-- 新增法國地區
INSERT INTO public.regions (id, country_id, name, name_en, display_order) VALUES
  ('alsace', 'france', '阿爾薩斯', 'Alsace', 6),
  ('brittany', 'france', '布列塔尼', 'Brittany', 7),
  ('burgundy', 'france', '勃艮第', 'Burgundy', 8),
  ('rhone-alps', 'france', '隆河-阿爾卑斯', 'Rhône-Alpes', 9);

-- 新增法國城市
INSERT INTO public.cities (id, country_id, region_id, name, name_en, display_order) VALUES
  -- 普羅旺斯
  ('marseille', 'france', 'provence', '馬賽', 'Marseille', 3),
  ('arles', 'france', 'provence', '阿爾勒', 'Arles', 4),
  -- 諾曼第
  ('rouen', 'france', 'normandy', '魯昂', 'Rouen', 2),
  -- 羅亞爾河谷
  ('orleans', 'france', 'loire-valley', '奧爾良', 'Orleans', 2),
  -- 阿爾薩斯
  ('strasbourg', 'france', 'alsace', '史特拉斯堡', 'Strasbourg', 1),
  ('colmar', 'france', 'alsace', '科爾馬', 'Colmar', 2),
  -- 布列塔尼
  ('rennes', 'france', 'brittany', '雷恩', 'Rennes', 1),
  ('saint-malo', 'france', 'brittany', '聖馬洛', 'Saint-Malo', 2),
  -- 勃艮第
  ('dijon', 'france', 'burgundy', '第戎', 'Dijon', 1),
  ('beaune', 'france', 'burgundy', '博訥', 'Beaune', 2),
  -- 隆河-阿爾卑斯
  ('lyon', 'france', 'rhone-alps', '里昂', 'Lyon', 1),
  ('annecy', 'france', 'rhone-alps', '安錫', 'Annecy', 2),
  ('chamonix', 'france', 'rhone-alps', '霞慕尼', 'Chamonix', 3);

COMMIT;
