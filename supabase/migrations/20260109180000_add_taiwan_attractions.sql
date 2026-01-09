-- 新增台灣熱門景點
-- 如果台灣和城市不存在，會先建立

DO $$
DECLARE
  taiwan_id text;
  taipei_id text;
  newtaipei_id text;
  taichung_id text;
  tainan_id text;
  kaohsiung_id text;
BEGIN
  -- 取得或建立台灣
  SELECT id INTO taiwan_id FROM public.countries WHERE code = 'TW' LIMIT 1;

  IF taiwan_id IS NULL THEN
    -- 建立台灣國家資料
    taiwan_id := 'taiwan-' || gen_random_uuid();
    INSERT INTO public.countries (id, name, name_en, code, emoji, has_regions, display_order, is_active)
    VALUES (taiwan_id, '台灣', 'Taiwan', 'TW', '🇹🇼', false, 0, true);
    RAISE NOTICE '已建立台灣國家資料';
  END IF;

  -- 取得或建立台北
  SELECT id INTO taipei_id FROM public.cities WHERE name = '台北' AND country_id = taiwan_id LIMIT 1;
  IF taipei_id IS NULL THEN
    taipei_id := 'taipei-' || gen_random_uuid();
    INSERT INTO public.cities (id, name, name_en, country_id, airport_code, display_order, is_active)
    VALUES (taipei_id, '台北', 'Taipei', taiwan_id, 'TPE', 1, true);
  END IF;

  -- 取得或建立新北
  SELECT id INTO newtaipei_id FROM public.cities WHERE name = '新北' AND country_id = taiwan_id LIMIT 1;
  IF newtaipei_id IS NULL THEN
    newtaipei_id := 'newtaipei-' || gen_random_uuid();
    INSERT INTO public.cities (id, name, name_en, country_id, display_order, is_active)
    VALUES (newtaipei_id, '新北', 'New Taipei', taiwan_id, 2, true);
  END IF;

  -- 取得或建立台中
  SELECT id INTO taichung_id FROM public.cities WHERE name = '台中' AND country_id = taiwan_id LIMIT 1;
  IF taichung_id IS NULL THEN
    taichung_id := 'taichung-' || gen_random_uuid();
    INSERT INTO public.cities (id, name, name_en, country_id, airport_code, display_order, is_active)
    VALUES (taichung_id, '台中', 'Taichung', taiwan_id, 'RMQ', 3, true);
  END IF;

  -- 取得或建立台南
  SELECT id INTO tainan_id FROM public.cities WHERE name = '台南' AND country_id = taiwan_id LIMIT 1;
  IF tainan_id IS NULL THEN
    tainan_id := 'tainan-' || gen_random_uuid();
    INSERT INTO public.cities (id, name, name_en, country_id, airport_code, display_order, is_active)
    VALUES (tainan_id, '台南', 'Tainan', taiwan_id, 'TNN', 4, true);
  END IF;

  -- 取得或建立高雄
  SELECT id INTO kaohsiung_id FROM public.cities WHERE name = '高雄' AND country_id = taiwan_id LIMIT 1;
  IF kaohsiung_id IS NULL THEN
    kaohsiung_id := 'kaohsiung-' || gen_random_uuid();
    INSERT INTO public.cities (id, name, name_en, country_id, airport_code, display_order, is_active)
    VALUES (kaohsiung_id, '高雄', 'Kaohsiung', taiwan_id, 'KHH', 5, true);
  END IF;

  RAISE NOTICE '城市建立完成 - 台北: %, 新北: %, 台中: %, 台南: %, 高雄: %', taipei_id, newtaipei_id, taichung_id, tainan_id, kaohsiung_id;

  -- ========== 台北景點 ==========
  INSERT INTO public.attractions (name, name_en, description, country_id, city_id, category, address, latitude, longitude, duration_minutes, is_active, display_order)
  VALUES
  ('台北101', 'Taipei 101', '曾是世界最高建築，台北地標性摩天大樓，觀景台可俯瞰整個台北市', taiwan_id, taipei_id, '地標', '台北市信義區信義路五段7號', 25.0339, 121.5645, 120, true, 1),
  ('故宮博物院', 'National Palace Museum', '收藏超過69萬件中華文物，是世界四大博物館之一', taiwan_id, taipei_id, '博物館', '台北市士林區至善路二段221號', 25.1024, 121.5485, 180, true, 2),
  ('中正紀念堂', 'Chiang Kai-shek Memorial Hall', '紀念蔣中正的國家紀念建築，每日有儀隊交接儀式', taiwan_id, taipei_id, '歷史', '台北市中正區中山南路21號', 25.0347, 121.5219, 60, true, 3),
  ('龍山寺', 'Longshan Temple', '創建於1738年的百年古剎，台北最著名的寺廟', taiwan_id, taipei_id, '寺廟', '台北市萬華區廣州街211號', 25.0372, 121.4999, 45, true, 4),
  ('士林夜市', 'Shilin Night Market', '台北最大的夜市，美食小吃與購物天堂', taiwan_id, taipei_id, '夜市', '台北市士林區基河路101號', 25.0879, 121.5243, 120, true, 5),
  ('象山步道', 'Elephant Mountain Trail', '最佳觀賞台北101夜景的登山步道', taiwan_id, taipei_id, '自然', '台北市信義區信義路五段150巷', 25.0273, 121.5714, 90, true, 6),
  ('北投溫泉', 'Beitou Hot Springs', '日治時期開發的溫泉區，有多間溫泉旅館', taiwan_id, taipei_id, '溫泉', '台北市北投區中山路', 25.1364, 121.5086, 150, true, 7),
  ('西門町', 'Ximending', '台北最熱鬧的青年流行商圈', taiwan_id, taipei_id, '購物', '台北市萬華區', 25.0421, 121.5081, 120, true, 8),
  ('陽明山國家公園', 'Yangmingshan National Park', '台北近郊的火山地形國家公園，四季皆有不同花卉', taiwan_id, taipei_id, '自然', '台北市北投區竹子湖路1-20號', 25.1693, 121.5601, 240, true, 9),
  ('貓空纜車', 'Maokong Gondola', '搭乘纜車俯瞰台北盆地，山上有茶園與景觀餐廳', taiwan_id, taipei_id, '體驗', '台北市文山區新光路二段8號', 24.9686, 121.5756, 180, true, 10)
  ;

  -- ========== 新北景點 ==========
  INSERT INTO public.attractions (name, name_en, description, country_id, city_id, category, address, latitude, longitude, duration_minutes, is_active, display_order)
  VALUES
  ('九份老街', 'Jiufen Old Street', '山城老街，神隱少女取景地，石階與茶館充滿懷舊氛圍', taiwan_id, newtaipei_id, '老街', '新北市瑞芳區基山街', 25.1097, 121.8445, 180, true, 11),
  ('野柳地質公園', 'Yehliu Geopark', '擁有女王頭等奇岩怪石的海岸地質景觀', taiwan_id, newtaipei_id, '自然', '新北市萬里區野柳里港東路167-1號', 25.2059, 121.6900, 90, true, 12),
  ('淡水老街', 'Tamsui Old Street', '河岸老街，有渡輪、夕陽與阿給等美食', taiwan_id, newtaipei_id, '老街', '新北市淡水區中正路', 25.1692, 121.4387, 120, true, 13),
  ('十分瀑布', 'Shifen Waterfall', '台灣最大的簾幕式瀑布，有小尼加拉瓜之稱', taiwan_id, newtaipei_id, '自然', '新北市平溪區南山里乾坑路10號', 25.0497, 121.7773, 60, true, 14),
  ('平溪天燈', 'Pingxi Sky Lanterns', '放天燈許願的著名景點，每年元宵節有盛大天燈節', taiwan_id, newtaipei_id, '體驗', '新北市平溪區平溪街', 25.0253, 121.7394, 90, true, 15)
  ;

  -- ========== 台中景點 ==========
  INSERT INTO public.attractions (name, name_en, description, country_id, city_id, category, address, latitude, longitude, duration_minutes, is_active, display_order)
  VALUES
  ('逢甲夜市', 'Fengjia Night Market', '台中最大夜市，創意小吃與流行商品聚集地', taiwan_id, taichung_id, '夜市', '台中市西屯區文華路', 24.1789, 120.6455, 120, true, 16),
  ('高美濕地', 'Gaomei Wetlands', '可以走入潮間帶的濕地生態保護區，夕陽超美', taiwan_id, taichung_id, '自然', '台中市清水區大甲溪出海口', 24.3122, 120.5503, 90, true, 17),
  ('彩虹眷村', 'Rainbow Village', '老榮民黃永阜彩繪的繽紛眷村', taiwan_id, taichung_id, '藝術', '台中市南屯區春安路56巷25號', 24.1344, 120.6082, 45, true, 18),
  ('宮原眼科', 'Miyahara', '日治時期眼科改建的複合式甜點店', taiwan_id, taichung_id, '購物', '台中市中區中山路20號', 24.1380, 120.6847, 60, true, 19),
  ('審計新村', 'Shen Ji New Village', '老宿舍改造的文創市集聚落', taiwan_id, taichung_id, '文創', '台中市西區民生路368巷', 24.1418, 120.6622, 90, true, 20)
  ;

  -- ========== 台南景點 ==========
  INSERT INTO public.attractions (name, name_en, description, country_id, city_id, category, address, latitude, longitude, duration_minutes, is_active, display_order)
  VALUES
  ('安平古堡', 'Anping Fort', '荷蘭人建造的熱蘭遮城遺址，台灣最早的城堡', taiwan_id, tainan_id, '歷史', '台南市安平區國勝路82號', 23.0014, 120.1605, 60, true, 21),
  ('赤崁樓', 'Chihkan Tower', '荷蘭人建造的普羅民遮城遺址', taiwan_id, tainan_id, '歷史', '台南市中西區民族路二段212號', 22.9977, 120.2024, 45, true, 22),
  ('神農街', 'Shennong Street', '保留清代街屋的老街，夜晚燈籠點亮很有氣氛', taiwan_id, tainan_id, '老街', '台南市中西區神農街', 22.9985, 120.1960, 60, true, 23),
  ('奇美博物館', 'Chimei Museum', '仿歐式宮殿建築，收藏西洋藝術與樂器', taiwan_id, tainan_id, '博物館', '台南市仁德區文華路二段66號', 22.9350, 120.2266, 180, true, 24),
  ('花園夜市', 'Garden Night Market', '台南最大夜市，只有四、六、日營業', taiwan_id, tainan_id, '夜市', '台南市北區海安路三段533號', 23.0269, 120.2107, 120, true, 25)
  ;

  -- ========== 高雄景點 ==========
  INSERT INTO public.attractions (name, name_en, description, country_id, city_id, category, address, latitude, longitude, duration_minutes, is_active, display_order)
  VALUES
  ('駁二藝術特區', 'Pier-2 Art Center', '舊港口倉庫改建的藝術園區', taiwan_id, kaohsiung_id, '藝術', '高雄市鹽埕區大勇路1號', 22.6206, 120.2819, 120, true, 26),
  ('美麗島站', 'Formosa Boulevard Station', '捷運站內有全球最大的玻璃藝術「光之穹頂」', taiwan_id, kaohsiung_id, '地標', '高雄市新興區中山一路115號', 22.6317, 120.3016, 30, true, 27),
  ('西子灣', 'Sizihwan', '看夕陽的絕佳景點，旁邊有打狗英國領事館', taiwan_id, kaohsiung_id, '自然', '高雄市鼓山區蓮海路51號', 22.6244, 120.2639, 90, true, 28),
  ('旗津老街', 'Cijin Old Street', '渡輪前往的海島老街，海鮮與黑輪必吃', taiwan_id, kaohsiung_id, '老街', '高雄市旗津區廟前路', 22.6119, 120.2692, 150, true, 29),
  ('六合夜市', 'Liuhe Night Market', '高雄最著名的觀光夜市', taiwan_id, kaohsiung_id, '夜市', '高雄市新興區六合二路', 22.6318, 120.2986, 90, true, 30)
  ;

  RAISE NOTICE '已新增台灣景點資料';
END $$;
