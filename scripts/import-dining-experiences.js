const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

const workspace_id = '8ef05a74-1f87-48ab-afd3-9bfeb423935d'

const diningExperiences = [
  // ============================================================
  // 日本 - 東京 米其林餐廳
  // ============================================================
  { country_id: 'japan', city_id: 'tokyo', name: '壽司之神 數寄屋橋次郎', name_en: 'Sukiyabashi Jiro', type: 'food', description: '米其林三星，小野二郎傳奇壽司店' },
  { country_id: 'japan', city_id: 'tokyo', name: '龍吟', name_en: 'RyuGin', type: 'food', description: '米其林三星，現代日本料理' },
  { country_id: 'japan', city_id: 'tokyo', name: '神田', name_en: 'Kanda', type: 'food', description: '米其林三星，精緻日本料理' },
  { country_id: 'japan', city_id: 'tokyo', name: 'Quintessence', name_en: 'Quintessence', type: 'food', description: '米其林三星，法式創意料理' },
  { country_id: 'japan', city_id: 'tokyo', name: '鮨さいとう', name_en: 'Sushi Saito', type: 'food', description: '米其林三星，頂級江戶前壽司' },
  { country_id: 'japan', city_id: 'tokyo', name: '虎白', name_en: 'Kohaku', type: 'food', description: '米其林三星，創意懷石料理' },
  { country_id: 'japan', city_id: 'tokyo', name: 'L\'Effervescence', name_en: 'L\'Effervescence', type: 'food', description: '米其林三星，法日融合料理' },
  { country_id: 'japan', city_id: 'tokyo', name: '銀座小十', name_en: 'Ginza Kojyu', type: 'food', description: '米其林三星，傳統懷石料理' },
  { country_id: 'japan', city_id: 'tokyo', name: '鮨青木', name_en: 'Sushi Aoki', type: 'food', description: '米其林二星，銀座頂級壽司' },
  { country_id: 'japan', city_id: 'tokyo', name: '茶禪華', name_en: 'Chazen-ka', type: 'food', description: '米其林三星，中華料理' },
  { country_id: 'japan', city_id: 'tokyo', name: '傳', name_en: 'Den', type: 'food', description: '米其林二星，創意日本料理' },
  { country_id: 'japan', city_id: 'tokyo', name: 'Florilège', name_en: 'Florilège', type: 'food', description: '米其林二星，創新法式料理' },
  { country_id: 'japan', city_id: 'tokyo', name: '鳥しき', name_en: 'Torishiki', type: 'food', description: '米其林一星，燒鳥名店' },
  { country_id: 'japan', city_id: 'tokyo', name: 'Narisawa', name_en: 'Narisawa', type: 'food', description: '米其林二星，里山料理概念' },
  { country_id: 'japan', city_id: 'tokyo', name: '銀座久兵衛', name_en: 'Ginza Kyubey', type: 'food', description: '米其林一星，老舗壽司名店' },

  // ============================================================
  // 日本 - 京都 米其林餐廳
  // ============================================================
  { country_id: 'japan', city_id: 'kyoto', name: '菊乃井本店', name_en: 'Kikunoi Honten', type: 'food', description: '米其林三星，京懷石代表' },
  { country_id: 'japan', city_id: 'kyoto', name: '瓢亭', name_en: 'Hyotei', type: 'food', description: '米其林三星，450年歷史' },
  { country_id: 'japan', city_id: 'kyoto', name: '吉兆嵐山本店', name_en: 'Kitcho Arashiyama', type: 'food', description: '米其林三星，頂級懷石料理' },
  { country_id: 'japan', city_id: 'kyoto', name: '祇園丸山', name_en: 'Gion Maruyama', type: 'food', description: '米其林二星，祇園懷石' },
  { country_id: 'japan', city_id: 'kyoto', name: '緒方', name_en: 'Ogata', type: 'food', description: '米其林二星，割烹料理' },
  { country_id: 'japan', city_id: 'kyoto', name: '未在', name_en: 'Mizai', type: 'food', description: '米其林二星，創意京料理' },
  { country_id: 'japan', city_id: 'kyoto', name: '祇園さ々木', name_en: 'Gion Sasaki', type: 'food', description: '米其林二星，祇園名店' },

  // ============================================================
  // 日本 - 大阪 米其林餐廳
  // ============================================================
  { country_id: 'japan', city_id: 'osaka', name: '太庵', name_en: 'Taian', type: 'food', description: '米其林三星，頂級日本料理' },
  { country_id: 'japan', city_id: 'osaka', name: '弧柳', name_en: 'Koryu', type: 'food', description: '米其林三星，割烹料理' },
  { country_id: 'japan', city_id: 'osaka', name: '柏屋', name_en: 'Kashiwaya', type: 'food', description: '米其林三星，懷石料理' },
  { country_id: 'japan', city_id: 'osaka', name: 'Hajime', name_en: 'Hajime', type: 'food', description: '米其林三星，創意法式' },
  { country_id: 'japan', city_id: 'osaka', name: 'La Cime', name_en: 'La Cime', type: 'food', description: '米其林二星，現代法式' },

  // ============================================================
  // 日本 - 深度體驗
  // ============================================================
  { country_id: 'japan', city_id: 'tokyo', name: '築地市場壽司體驗班', name_en: 'Tsukiji Sushi Class', type: 'experience', description: '專業師傅指導握壽司' },
  { country_id: 'japan', city_id: 'tokyo', name: '相撲訓練見學', name_en: 'Sumo Morning Practice', type: 'experience', description: '觀看相撲力士晨練' },
  { country_id: 'japan', city_id: 'tokyo', name: '淺草人力車體驗', name_en: 'Asakusa Rickshaw', type: 'experience', description: '傳統人力車遊覽' },
  { country_id: 'japan', city_id: 'tokyo', name: '東京灣屋形船', name_en: 'Yakatabune Cruise', type: 'experience', description: '傳統屋形船晚宴遊船' },
  { country_id: 'japan', city_id: 'tokyo', name: '忍者體驗道場', name_en: 'Ninja Experience', type: 'experience', description: '忍術體驗、手裡劍' },
  { country_id: 'japan', city_id: 'tokyo', name: '和服著裝體驗', name_en: 'Kimono Experience', type: 'experience', description: '傳統和服穿著攝影' },
  { country_id: 'japan', city_id: 'tokyo', name: '機器人餐廳', name_en: 'Robot Restaurant', type: 'experience', description: '科技娛樂表演秀' },
  { country_id: 'japan', city_id: 'kyoto', name: '藝妓晚宴體驗', name_en: 'Geisha Dinner', type: 'experience', description: '舞妓/藝妓表演晚宴' },
  { country_id: 'japan', city_id: 'kyoto', name: '茶道體驗', name_en: 'Tea Ceremony', type: 'experience', description: '抹茶茶道體驗' },
  { country_id: 'japan', city_id: 'kyoto', name: '禪修冥想體驗', name_en: 'Zen Meditation', type: 'experience', description: '寺廟坐禪體驗' },
  { country_id: 'japan', city_id: 'kyoto', name: '京友禪染體驗', name_en: 'Kyo-Yuzen Dyeing', type: 'experience', description: '傳統友禪染工藝' },
  { country_id: 'japan', city_id: 'kyoto', name: '清水燒陶藝體驗', name_en: 'Kiyomizu Pottery', type: 'experience', description: '京都傳統陶藝' },
  { country_id: 'japan', city_id: 'kyoto', name: '嵐山人力車', name_en: 'Arashiyama Rickshaw', type: 'experience', description: '竹林人力車遊覽' },
  { country_id: 'japan', city_id: 'kyoto', name: '保津川遊船', name_en: 'Hozugawa River Boat', type: 'experience', description: '傳統木船漂流' },
  { country_id: 'japan', city_id: 'osaka', name: '道頓堀章魚燒教室', name_en: 'Takoyaki Cooking Class', type: 'experience', description: '大阪名物DIY' },
  { country_id: 'japan', city_id: 'osaka', name: '大阪相聲劇場', name_en: 'Yoshimoto Comedy', type: 'experience', description: '日本搞笑藝人表演' },
  { country_id: 'japan', city_id: 'nara', name: '若草山餵鹿體驗', name_en: 'Nara Deer Feeding', type: 'experience', description: '與奈良鹿互動' },
  { country_id: 'japan', city_id: 'hakone', name: '箱根溫泉旅館', name_en: 'Hakone Ryokan', type: 'experience', description: '傳統溫泉旅館一泊二食' },
  { country_id: 'japan', city_id: 'nikko', name: '日光溫泉體驗', name_en: 'Nikko Onsen', type: 'experience', description: '山中溫泉療癒' },
  { country_id: 'japan', city_id: 'kanazawa', name: '金箔貼體驗', name_en: 'Gold Leaf Workshop', type: 'experience', description: '金澤傳統金箔工藝' },
  { country_id: 'japan', city_id: 'takayama', name: '高山早市', name_en: 'Takayama Morning Market', type: 'experience', description: '傳統朝市購物體驗' },
  { country_id: 'japan', city_id: 'takayama', name: '飛驒牛燒肉', name_en: 'Hida Beef BBQ', type: 'food', description: '日本三大和牛之一' },
  { country_id: 'japan', city_id: 'kobe', name: '神戶牛鐵板燒', name_en: 'Kobe Beef Teppanyaki', type: 'food', description: '頂級神戶牛體驗' },
  { country_id: 'japan', city_id: 'matsusaka', name: '松阪牛燒肉', name_en: 'Matsusaka Beef', type: 'food', description: '日本三大和牛' },

  // ============================================================
  // 韓國 - 首爾 米其林餐廳
  // ============================================================
  { country_id: 'korea', city_id: 'seoul', name: '柳廚房 La Yeon', name_en: 'La Yeon', type: 'food', description: '米其林三星，新羅酒店韓式料理' },
  { country_id: 'korea', city_id: 'seoul', name: 'Gaon', name_en: 'Gaon', type: 'food', description: '米其林三星，現代韓國料理' },
  { country_id: 'korea', city_id: 'seoul', name: 'Mingles', name_en: 'Mingles', type: 'food', description: '米其林二星，韓式Fine Dining' },
  { country_id: 'korea', city_id: 'seoul', name: 'Jungsik', name_en: 'Jungsik', type: 'food', description: '米其林二星，新韓式料理' },
  { country_id: 'korea', city_id: 'seoul', name: 'Kojima', name_en: 'Kojima', type: 'food', description: '米其林二星，日式割烹' },
  { country_id: 'korea', city_id: 'seoul', name: 'L\'Amant Secret', name_en: 'L\'Amant Secret', type: 'food', description: '米其林一星，法式料理' },
  { country_id: 'korea', city_id: 'seoul', name: 'Mosu Seoul', name_en: 'Mosu Seoul', type: 'food', description: '米其林二星，創意料理' },
  { country_id: 'korea', city_id: 'seoul', name: '韓牛Omakase', name_en: 'Hanwoo Omakase', type: 'food', description: '頂級韓牛料理' },
  { country_id: 'korea', city_id: 'seoul', name: '土俗村蔘雞湯', name_en: 'Tosokchon Samgyetang', type: 'food', description: '總統蔘雞湯名店' },
  { country_id: 'korea', city_id: 'seoul', name: '明洞餃子', name_en: 'Myeongdong Kyoja', type: 'food', description: '米其林必比登推薦' },

  // ============================================================
  // 韓國 - 深度體驗
  // ============================================================
  { country_id: 'korea', city_id: 'seoul', name: '韓服體驗景福宮', name_en: 'Hanbok at Gyeongbokgung', type: 'experience', description: '穿韓服免費入宮' },
  { country_id: 'korea', city_id: 'seoul', name: '韓式料理教室', name_en: 'Korean Cooking Class', type: 'experience', description: '泡菜製作體驗' },
  { country_id: 'korea', city_id: 'seoul', name: 'K-Pop舞蹈教室', name_en: 'K-Pop Dance Class', type: 'experience', description: '學習偶像舞蹈' },
  { country_id: 'korea', city_id: 'seoul', name: '韓式汗蒸幕', name_en: 'Jjimjilbang', type: 'experience', description: '傳統汗蒸幕體驗' },
  { country_id: 'korea', city_id: 'seoul', name: '北村韓屋住宿', name_en: 'Bukchon Hanok Stay', type: 'experience', description: '傳統韓屋住宿' },
  { country_id: 'korea', city_id: 'seoul', name: 'SM Town體驗', name_en: 'SM Town Experience', type: 'experience', description: 'K-Pop明星展覽' },
  { country_id: 'korea', city_id: 'seoul', name: '弘大街頭表演', name_en: 'Hongdae Busking', type: 'experience', description: '街頭藝人表演' },
  { country_id: 'korea', city_id: 'seoul', name: 'DMZ非軍事區', name_en: 'DMZ Tour', type: 'experience', description: '南北韓邊界參觀' },
  { country_id: 'korea', city_id: 'busan', name: '海雲台海鮮市場', name_en: 'Haeundae Seafood Market', type: 'food', description: '現撈海鮮料理' },
  { country_id: 'korea', city_id: 'busan', name: '機張蟹料理', name_en: 'Gijang Crab', type: 'food', description: '釜山帝王蟹名店' },
  { country_id: 'korea', city_id: 'jeju', name: '黑豬肉烤肉', name_en: 'Jeju Black Pork BBQ', type: 'food', description: '濟州特產黑豬' },
  { country_id: 'korea', city_id: 'jeju', name: '海女體驗', name_en: 'Haenyeo Experience', type: 'experience', description: '傳統海女文化' },

  // ============================================================
  // 泰國 - 曼谷 米其林餐廳
  // ============================================================
  { country_id: 'thailand', city_id: 'bangkok', name: 'Gaggan Anand', name_en: 'Gaggan Anand', type: 'food', description: '米其林二星，印度分子料理' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'Le Du', name_en: 'Le Du', type: 'food', description: '米其林一星，現代泰式料理' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'Sorn', name_en: 'Sorn', type: 'food', description: '米其林二星，南泰料理' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'R-Haan', name_en: 'R-Haan', type: 'food', description: '米其林二星，皇家泰式料理' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'Mezzaluna', name_en: 'Mezzaluna', type: 'food', description: '米其林二星，高空法式餐廳' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'Paste', name_en: 'Paste Bangkok', type: 'food', description: '米其林一星，創意泰式' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'Bo.Lan', name_en: 'Bo.Lan', type: 'food', description: '米其林一星，有機泰式' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'Jay Fai', name_en: 'Jay Fai', type: 'food', description: '米其林一星，街頭小吃女王' },
  { country_id: 'thailand', city_id: 'bangkok', name: '陳億粿條', name_en: 'Thipsamai Pad Thai', type: 'food', description: '米其林必比登泰式炒麵' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'Nai Hong', name_en: 'Nai Hong', type: 'food', description: '米其林必比登魚丸麵' },

  // ============================================================
  // 泰國 - 深度體驗
  // ============================================================
  { country_id: 'thailand', city_id: 'bangkok', name: '泰式料理教室', name_en: 'Thai Cooking Class', type: 'experience', description: '市場採買+烹飪課程' },
  { country_id: 'thailand', city_id: 'bangkok', name: '泰式按摩課程', name_en: 'Thai Massage Course', type: 'experience', description: '學習傳統按摩' },
  { country_id: 'thailand', city_id: 'bangkok', name: '湄南河長尾船', name_en: 'Longtail Boat Tour', type: 'experience', description: '水上市場探索' },
  { country_id: 'thailand', city_id: 'bangkok', name: '泰拳體驗課', name_en: 'Muay Thai Class', type: 'experience', description: '泰拳訓練體驗' },
  { country_id: 'thailand', city_id: 'bangkok', name: '暹羅天使劇場', name_en: 'Siam Niramit', type: 'experience', description: '泰國文化大秀' },
  { country_id: 'thailand', city_id: 'bangkok', name: '昭披耶公主號晚宴', name_en: 'Chao Phraya Princess Cruise', type: 'experience', description: '河畔晚宴遊船' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '蘭納料理教室', name_en: 'Lanna Cooking Class', type: 'experience', description: '北泰料理體驗' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '僧侶布施體驗', name_en: 'Monk Almsgiving', type: 'experience', description: '清晨托缽布施' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '蘭納傳統舞蹈晚宴', name_en: 'Khantoke Dinner', type: 'experience', description: '傳統舞蹈+料理' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '銀飾工藝體驗', name_en: 'Silver Jewelry Making', type: 'experience', description: 'DIY銀飾工坊' },
  { country_id: 'thailand', city_id: 'phuket', name: '泰式海鮮料理課', name_en: 'Thai Seafood Cooking', type: 'experience', description: '海鮮料理教學' },
  { country_id: 'thailand', city_id: 'phuket', name: '幻多奇文化秀', name_en: 'FantaSea Show', type: 'experience', description: '大型文化表演' },

  // ============================================================
  // 越南 - 深度體驗
  // ============================================================
  { country_id: 'vietnam', city_id: 'hanoi', name: '河粉料理課', name_en: 'Pho Cooking Class', type: 'experience', description: '越南河粉DIY' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '蛋咖啡體驗', name_en: 'Egg Coffee Experience', type: 'food', description: '河內特色蛋咖啡' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '傳統越南按摩', name_en: 'Vietnamese Massage', type: 'experience', description: 'Spa按摩體驗' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '機車美食之旅', name_en: 'Motorbike Food Tour', type: 'experience', description: '騎機車吃遍河內' },
  { country_id: 'vietnam', city_id: 'hoi-an', name: '越南服飾訂製', name_en: 'Tailor Made Ao Dai', type: 'experience', description: '訂製傳統奧黛' },
  { country_id: 'vietnam', city_id: 'hoi-an', name: '燈籠製作工坊', name_en: 'Lantern Making', type: 'experience', description: '會安燈籠DIY' },
  { country_id: 'vietnam', city_id: 'hoi-an', name: '會安料理教室', name_en: 'Hoi An Cooking Class', type: 'experience', description: '中越料理學習' },
  { country_id: 'vietnam', city_id: 'hoi-an', name: '籃船體驗', name_en: 'Basket Boat Ride', type: 'experience', description: '傳統椰子船' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '越南春捲料理課', name_en: 'Spring Roll Class', type: 'experience', description: '春捲製作體驗' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '湄公河探索', name_en: 'Mekong Delta Tour', type: 'experience', description: '湄公河三角洲一日遊' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '越南咖啡文化', name_en: 'Vietnamese Coffee Culture', type: 'food', description: '滴漏咖啡體驗' },

  // ============================================================
  // 中國 - 深度美食體驗
  // ============================================================
  { country_id: 'china', city_id: 'chengdu', name: '寬窄巷子茶館', name_en: 'Kuanzhai Alley Teahouse', type: 'experience', description: '成都蓋碗茶體驗' },
  { country_id: 'china', city_id: 'chengdu', name: '川菜料理教室', name_en: 'Sichuan Cooking Class', type: 'experience', description: '正宗川菜學習' },
  { country_id: 'china', city_id: 'chengdu', name: '熊貓基地', name_en: 'Panda Base Volunteer', type: 'experience', description: '熊貓義工體驗' },
  { country_id: 'china', city_id: 'chengdu', name: '變臉表演', name_en: 'Sichuan Opera Face Changing', type: 'experience', description: '川劇變臉秀' },
  { country_id: 'china', city_id: 'chongqing', name: '重慶火鍋體驗', name_en: 'Chongqing Hotpot', type: 'food', description: '正宗九宮格火鍋' },
  { country_id: 'china', city_id: 'chongqing', name: '重慶小麵體驗', name_en: 'Chongqing Noodles', type: 'food', description: '麻辣小麵文化' },
  { country_id: 'china', city_id: 'xian', name: '餃子宴', name_en: 'Dumpling Banquet', type: 'food', description: '西安餃子盛宴' },
  { country_id: 'china', city_id: 'xian', name: '肉夾饃製作', name_en: 'Roujiamo Making', type: 'experience', description: '中國漢堡DIY' },
  { country_id: 'china', city_id: 'xian', name: '唐樂舞表演', name_en: 'Tang Dynasty Show', type: 'experience', description: '盛唐歌舞晚宴' },
  { country_id: 'china', city_id: 'guangzhou', name: '早茶體驗', name_en: 'Yum Cha Experience', type: 'food', description: '廣式飲茶點心' },
  { country_id: 'china', city_id: 'guangzhou', name: '粵菜料理課', name_en: 'Cantonese Cooking', type: 'experience', description: '廣東菜學習' },
  { country_id: 'china', city_id: 'shanghai', name: '外灘下午茶', name_en: 'Bund Afternoon Tea', type: 'food', description: '外灘景觀下午茶' },
  { country_id: 'china', city_id: 'shanghai', name: 'Ultraviolet', name_en: 'Ultraviolet by Paul Pairet', type: 'food', description: '米其林三星，感官餐飲體驗' },
  { country_id: 'china', city_id: 'shanghai', name: '8½ Otto e Mezzo', name_en: '8½ Otto e Mezzo Bombana', type: 'food', description: '米其林二星義式料理' },
  { country_id: 'china', city_id: 'beijing', name: '大董烤鴨', name_en: 'DaDong Roast Duck', type: 'food', description: '米其林一星，創意烤鴨' },
  { country_id: 'china', city_id: 'beijing', name: '全聚德烤鴨', name_en: 'Quanjude Roast Duck', type: 'food', description: '北京烤鴨百年老店' },
  { country_id: 'china', city_id: 'beijing', name: '京A精釀啤酒', name_en: 'Jing A Craft Beer', type: 'food', description: '北京精釀啤酒文化' },
  { country_id: 'china', city_id: 'beijing', name: '四合院住宿', name_en: 'Hutong Courtyard Stay', type: 'experience', description: '傳統四合院體驗' },
  { country_id: 'china', city_id: 'hangzhou', name: '龍井茶園體驗', name_en: 'Longjing Tea Experience', type: 'experience', description: '採茶製茶體驗' },
  { country_id: 'china', city_id: 'hangzhou', name: '杭幫菜料理', name_en: 'Hangzhou Cuisine', type: 'food', description: '東坡肉、西湖醋魚' },
  { country_id: 'china', city_id: 'suzhou', name: '評彈表演', name_en: 'Pingtan Performance', type: 'experience', description: '蘇州評彈藝術' },
  { country_id: 'china', city_id: 'xiamen', name: '南普陀素菜', name_en: 'Nanputuo Vegetarian', type: 'food', description: '百年素齋料理' },
  { country_id: 'china', city_id: 'xiamen', name: '閩南功夫茶', name_en: 'Kung Fu Tea Ceremony', type: 'experience', description: '閩南茶藝體驗' },

  // ============================================================
  // 沙烏地阿拉伯 - 深度體驗
  // ============================================================
  { country_id: 'saudi_arabia', city_id: 'riyadh', name: '阿拉伯咖啡體驗', name_en: 'Arabic Coffee Ceremony', type: 'experience', description: '傳統阿拉伯咖啡儀式' },
  { country_id: 'saudi_arabia', city_id: 'riyadh', name: '沙漠露營', name_en: 'Desert Camping', type: 'experience', description: '貝都因人風格露營' },
  { country_id: 'saudi_arabia', city_id: 'riyadh', name: '駱駝騎乘', name_en: 'Camel Riding', type: 'experience', description: '沙漠駱駝之旅' },
  { country_id: 'saudi_arabia', city_id: 'jeddah', name: '紅海潛水', name_en: 'Red Sea Diving', type: 'experience', description: '紅海珊瑚礁潛水' },
  { country_id: 'saudi_arabia', city_id: 'alula', name: '沙漠星空觀測', name_en: 'Desert Stargazing', type: 'experience', description: '艾爾奧拉星空之夜' },
  { country_id: 'saudi_arabia', city_id: 'alula', name: '古城音樂節', name_en: 'AlUla Music Festival', type: 'experience', description: '世界遺產音樂活動' },

  // ============================================================
  // 埃及/土耳其 - 深度體驗
  // ============================================================
  { country_id: 'egypt', city_id: 'cairo', name: '尼羅河晚宴遊船', name_en: 'Nile Dinner Cruise', type: 'experience', description: '肚皮舞表演晚宴' },
  { country_id: 'egypt', city_id: 'cairo', name: '埃及料理課', name_en: 'Egyptian Cooking Class', type: 'experience', description: '傳統埃及菜學習' },
  { country_id: 'egypt', city_id: 'luxor', name: '帝王谷日出', name_en: 'Valley of Kings Sunrise', type: 'experience', description: '黎明時分探索' },
  { country_id: 'egypt', city_id: 'aswan', name: '努比亞村晚餐', name_en: 'Nubian Village Dinner', type: 'experience', description: '努比亞傳統料理' },
  { country_id: 'turkey', city_id: 'istanbul', name: '土耳其浴體驗', name_en: 'Turkish Hammam', type: 'experience', description: '傳統土耳其浴' },
  { country_id: 'turkey', city_id: 'istanbul', name: '博斯普魯斯海峽晚宴', name_en: 'Bosphorus Dinner Cruise', type: 'experience', description: '海峽遊船+傳統舞蹈' },
  { country_id: 'turkey', city_id: 'istanbul', name: '土耳其料理課', name_en: 'Turkish Cooking Class', type: 'experience', description: '烤肉串、甜點製作' },
  { country_id: 'turkey', city_id: 'istanbul', name: '旋轉舞表演', name_en: 'Whirling Dervishes', type: 'experience', description: '蘇菲派旋轉舞' },
  { country_id: 'turkey', city_id: 'istanbul', name: '伊斯坦堡美食之旅', name_en: 'Istanbul Food Tour', type: 'experience', description: '街頭美食探索' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '陶藝工作坊', name_en: 'Pottery Workshop', type: 'experience', description: '阿瓦諾斯陶藝體驗' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '洞穴酒莊品酒', name_en: 'Cave Winery Tasting', type: 'experience', description: '卡帕多奇亞葡萄酒' }
]

async function importDining() {
  console.log('========================================')
  console.log('  米其林餐廳 & 深度體驗導入')
  console.log('  總數: ' + diningExperiences.length + ' 個')
  console.log('========================================')
  console.log('')

  let success = 0
  let skipped = 0
  let failed = 0

  for (const attr of diningExperiences) {
    const { error } = await supabase
      .from('attractions')
      .insert({
        ...attr,
        workspace_id
      })

    if (error) {
      if (error.code === '23505') {
        skipped++
      } else {
        console.log('❌ ' + attr.name + ': ' + error.message)
        failed++
      }
    } else {
      console.log('✅ ' + attr.name + ' (' + attr.type + ')')
      success++
    }
  }

  console.log('')
  console.log('========================================')
  console.log('  導入完成！')
  console.log('  成功: ' + success + ' 個')
  console.log('  已存在: ' + skipped + ' 個')
  console.log('  失敗: ' + failed + ' 個')
  console.log('========================================')

  const { count } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })

  console.log('')
  console.log('資料庫總景點數: ' + count + ' 個')
}

importDining()
