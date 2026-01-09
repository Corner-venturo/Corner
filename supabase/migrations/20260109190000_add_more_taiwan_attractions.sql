-- 新增花蓮、台東、南投景點
-- 擴充台灣景點資料庫

DO $$
DECLARE
  taiwan_id text;
  hualien_id text;
  taitung_id text;
  nantou_id text;
BEGIN
  -- 取得台灣 ID
  SELECT id INTO taiwan_id FROM public.countries WHERE code = 'TW' LIMIT 1;

  IF taiwan_id IS NULL THEN
    RAISE NOTICE '找不到台灣，請先執行 add_taiwan_attractions.sql';
    RETURN;
  END IF;

  -- 取得或建立花蓮
  SELECT id INTO hualien_id FROM public.cities WHERE name = '花蓮' AND country_id = taiwan_id LIMIT 1;
  IF hualien_id IS NULL THEN
    hualien_id := 'hualien-' || gen_random_uuid();
    INSERT INTO public.cities (id, name, name_en, country_id, airport_code, display_order, is_active)
    VALUES (hualien_id, '花蓮', 'Hualien', taiwan_id, 'HUN', 6, true);
  END IF;

  -- 取得或建立台東
  SELECT id INTO taitung_id FROM public.cities WHERE name = '台東' AND country_id = taiwan_id LIMIT 1;
  IF taitung_id IS NULL THEN
    taitung_id := 'taitung-' || gen_random_uuid();
    INSERT INTO public.cities (id, name, name_en, country_id, airport_code, display_order, is_active)
    VALUES (taitung_id, '台東', 'Taitung', taiwan_id, 'TTT', 7, true);
  END IF;

  -- 取得或建立南投
  SELECT id INTO nantou_id FROM public.cities WHERE name = '南投' AND country_id = taiwan_id LIMIT 1;
  IF nantou_id IS NULL THEN
    nantou_id := 'nantou-' || gen_random_uuid();
    INSERT INTO public.cities (id, name, name_en, country_id, display_order, is_active)
    VALUES (nantou_id, '南投', 'Nantou', taiwan_id, 8, true);
  END IF;

  RAISE NOTICE '城市建立完成 - 花蓮: %, 台東: %, 南投: %', hualien_id, taitung_id, nantou_id;

  -- ========== 花蓮景點 ==========
  INSERT INTO public.attractions (name, name_en, description, country_id, city_id, category, address, latitude, longitude, duration_minutes, is_active, display_order)
  VALUES
  ('太魯閣國家公園', 'Taroko National Park', '世界級峽谷地形，壯麗的大理石峽谷與步道', taiwan_id, hualien_id, '自然', '花蓮縣秀林鄉富世村富世291號', 24.1586, 121.6216, 360, true, 31),
  ('清水斷崖', 'Qingshui Cliff', '蘇花公路最美的海崖景觀，被列為台灣八大奇景之一', taiwan_id, hualien_id, '自然', '花蓮縣秀林鄉蘇花公路', 24.2238, 121.6673, 60, true, 32),
  ('七星潭', 'Qixingtan Beach', '美麗的弧形海灣，可欣賞日出與滿天星斗', taiwan_id, hualien_id, '自然', '花蓮縣新城鄉七星街', 24.0324, 121.6312, 90, true, 33),
  ('砂卡礑步道', 'Shakadang Trail', '太魯閣內的親水步道，溪水清澈碧綠', taiwan_id, hualien_id, '步道', '花蓮縣秀林鄉富世村砂卡礑', 24.1710, 121.6035, 120, true, 34),
  ('燕子口', 'Swallow Grotto', '太魯閣著名景點，岩壁上有許多燕子築巢的小洞', taiwan_id, hualien_id, '自然', '花蓮縣秀林鄉中橫公路', 24.1753, 121.5406, 45, true, 35),
  ('長春祠', 'Changchun Shrine', '紀念開鑿中橫公路殉職工人的紀念祠', taiwan_id, hualien_id, '歷史', '花蓮縣秀林鄉中橫公路', 24.1667, 121.5833, 30, true, 36),
  ('花蓮東大門夜市', 'Dongdamen Night Market', '花蓮最大夜市，原住民美食與在地小吃聚集地', taiwan_id, hualien_id, '夜市', '花蓮縣花蓮市中山路50號', 23.9757, 121.6070, 120, true, 37),
  ('瑞穗溫泉', 'Ruisui Hot Springs', '知名的碳酸鹽泉，有「生男之泉」美譽', taiwan_id, hualien_id, '溫泉', '花蓮縣瑞穗鄉溫泉路', 23.4975, 121.3736, 150, true, 38),
  ('雲山水', 'Yun Shan Shui', '夢幻湖景園區，落羽松與湖水倒影超美', taiwan_id, hualien_id, '自然', '花蓮縣壽豐鄉豐坪路二段2巷', 23.8894, 121.5203, 60, true, 39),
  ('鯉魚潭', 'Liyu Lake', '花蓮最大的內陸湖泊，可划船與環湖步道', taiwan_id, hualien_id, '自然', '花蓮縣壽豐鄉池南村環潭北路100號', 23.9308, 121.5067, 90, true, 40);

  -- ========== 台東景點 ==========
  INSERT INTO public.attractions (name, name_en, description, country_id, city_id, category, address, latitude, longitude, duration_minutes, is_active, display_order)
  VALUES
  ('三仙台', 'Sanxiantai', '八拱跨海步橋連接離岸小島，台東最著名地標', taiwan_id, taitung_id, '自然', '台東縣成功鎮三仙里基翬路74號', 23.1236, 121.4089, 90, true, 41),
  ('伯朗大道', 'Brown Avenue', '筆直稻田中的道路，金城武拍廣告而聞名', taiwan_id, taitung_id, '自然', '台東縣池上鄉伯朗大道', 23.1067, 121.2194, 60, true, 42),
  ('池上飯包文化故事館', 'Chishang Lunchbox Museum', '了解池上便當歷史，品嚐道地池上米', taiwan_id, taitung_id, '文化', '台東縣池上鄉忠孝路259號', 23.1217, 121.2172, 45, true, 43),
  ('多良車站', 'Duoliang Station', '台灣最美車站，海天一色的絕美景觀', taiwan_id, taitung_id, '地標', '台東縣太麻里鄉多良村瀧溪路8-1號', 22.5186, 120.9728, 45, true, 44),
  ('知本溫泉', 'Zhiben Hot Springs', '台東著名溫泉區，有多間溫泉飯店', taiwan_id, taitung_id, '溫泉', '台東縣卑南鄉溫泉村龍泉路', 22.7028, 121.0325, 150, true, 45),
  ('鹿野高台', 'Luye Highland', '熱氣球嘉年華舉辦地，可俯瞰花東縱谷', taiwan_id, taitung_id, '自然', '台東縣鹿野鄉永安村高台路42巷145號', 22.9139, 121.1236, 90, true, 46),
  ('台東森林公園', 'Taitung Forest Park', '琵琶湖、活水湖等，騎單車與散步的好去處', taiwan_id, taitung_id, '自然', '台東縣台東市華泰路300號', 22.7478, 121.1536, 120, true, 47),
  ('小野柳', 'Xiaoyeliu', '奇岩怪石的海岸地形，與野柳齊名', taiwan_id, taitung_id, '自然', '台東縣台東市松江路一段500號', 22.7989, 121.1833, 60, true, 48),
  ('初鹿牧場', 'Chulu Ranch', '台灣最大的坡地牧場，可與動物互動', taiwan_id, taitung_id, '體驗', '台東縣卑南鄉明峰村牧場1號', 22.8486, 121.0575, 120, true, 49),
  ('加路蘭海岸', 'Jialulan Coast', '東海岸藝術裝置與漂流木藝術聚集地', taiwan_id, taitung_id, '藝術', '台東縣台東市富岡里加路蘭', 22.8108, 121.1933, 45, true, 50);

  -- ========== 南投景點（日月潭等） ==========
  INSERT INTO public.attractions (name, name_en, description, country_id, city_id, category, address, latitude, longitude, duration_minutes, is_active, display_order)
  VALUES
  ('日月潭', 'Sun Moon Lake', '台灣最大的天然淡水湖泊，湖光山色美不勝收', taiwan_id, nantou_id, '自然', '南投縣魚池鄉中山路599號', 23.8652, 120.9163, 240, true, 51),
  ('日月潭纜車', 'Sun Moon Lake Ropeway', '連接日月潭與九族文化村，可俯瞰湖景', taiwan_id, nantou_id, '體驗', '南投縣魚池鄉中正路102號', 23.8711, 120.9356, 60, true, 52),
  ('向山遊客中心', 'Xiangshan Visitor Center', '日本建築大師團紀彥設計，清水模建築地標', taiwan_id, nantou_id, '地標', '南投縣魚池鄉中山路599號', 23.8483, 120.9047, 45, true, 53),
  ('文武廟', 'Wenwu Temple', '日月潭北岸宏偉廟宇，供奉孔子與關公', taiwan_id, nantou_id, '寺廟', '南投縣魚池鄉中山路63號', 23.8783, 120.9283, 45, true, 54),
  ('清境農場', 'Qingjing Farm', '高山草原牧場，有綿羊秀與瑞士風情', taiwan_id, nantou_id, '體驗', '南投縣仁愛鄉仁和路170號', 24.0597, 121.1647, 180, true, 55),
  ('合歡山', 'Hehuanshan', '台灣百岳之一，冬季可賞雪夏季可避暑', taiwan_id, nantou_id, '自然', '南投縣仁愛鄉台14甲線', 24.1433, 121.2750, 240, true, 56),
  ('溪頭自然教育園區', 'Xitou Nature Education Area', '巨木參天的森林遊樂區，有大學池與神木', taiwan_id, nantou_id, '自然', '南投縣鹿谷鄉森林巷9號', 23.6714, 120.7975, 180, true, 57),
  ('妖怪村', 'Monster Village', '日式風格主題村落，各種妖怪造景與商店', taiwan_id, nantou_id, '體驗', '南投縣鹿谷鄉內湖村興產路2-3號', 23.6753, 120.7961, 120, true, 58),
  ('九族文化村', 'Formosan Aboriginal Culture Village', '原住民文化主題樂園，有刺激遊樂設施', taiwan_id, nantou_id, '體驗', '南投縣魚池鄉金天巷45號', 23.8642, 120.9489, 360, true, 59),
  ('忘憂森林', 'Wangyou Forest', '枯木矗立於水中的夢幻秘境', taiwan_id, nantou_id, '自然', '南投縣竹山鎮溪山路', 23.5994, 120.7678, 120, true, 60);

  RAISE NOTICE '已新增花蓮、台東、南投景點資料';
END $$;
