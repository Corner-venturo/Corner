const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

const workspace_id = '8ef05a74-1f87-48ab-afd3-9bfeb423935d'

const moreAttractions = [
  // ============================================================
  // 日本 - 奈良
  // ============================================================
  { country_id: 'japan', city_id: 'nara', name: '東大寺', name_en: 'Todaiji Temple', type: 'temple', description: '世界最大木造建築，奈良大佛' },
  { country_id: 'japan', city_id: 'nara', name: '奈良公園', name_en: 'Nara Park', type: 'park', description: '1200隻野生鹿棲息地' },
  { country_id: 'japan', city_id: 'nara', name: '春日大社', name_en: 'Kasuga Grand Shrine', type: 'temple', description: '世界遺產，3000盞石燈籠' },
  { country_id: 'japan', city_id: 'nara', name: '興福寺', name_en: 'Kofukuji Temple', type: 'temple', description: '五重塔，世界遺產' },
  { country_id: 'japan', city_id: 'nara', name: '法隆寺', name_en: 'Horyuji Temple', type: 'temple', description: '世界最古老木造建築群' },
  { country_id: 'japan', city_id: 'nara', name: '奈良町', name_en: 'Naramachi', type: 'attraction', description: '江戶時代町家街區' },
  { country_id: 'japan', city_id: 'nara', name: '吉野山', name_en: 'Mount Yoshino', type: 'attraction', description: '日本第一賞櫻名所' },

  // ============================================================
  // 日本 - 廣島
  // ============================================================
  { country_id: 'japan', city_id: 'hiroshima', name: '原爆圓頂', name_en: 'Atomic Bomb Dome', type: 'heritage', description: '世界遺產，和平象徵' },
  { country_id: 'japan', city_id: 'hiroshima', name: '和平紀念公園', name_en: 'Peace Memorial Park', type: 'park', description: '原爆紀念設施' },
  { country_id: 'japan', city_id: 'hiroshima', name: '廣島和平紀念資料館', name_en: 'Hiroshima Peace Memorial Museum', type: 'museum', description: '原爆歷史展示' },
  { country_id: 'japan', city_id: 'hiroshima', name: '嚴島神社', name_en: 'Itsukushima Shrine', type: 'temple', description: '世界遺產，海上鳥居' },
  { country_id: 'japan', city_id: 'hiroshima', name: '宮島', name_en: 'Miyajima Island', type: 'attraction', description: '日本三景之一' },
  { country_id: 'japan', city_id: 'hiroshima', name: '廣島城', name_en: 'Hiroshima Castle', type: 'heritage', description: '鯉城，戰後重建' },
  { country_id: 'japan', city_id: 'hiroshima', name: '廣島燒村', name_en: 'Okonomimura', type: 'food', description: '廣島燒美食樓層' },

  // ============================================================
  // 日本 - 名古屋
  // ============================================================
  { country_id: 'japan', city_id: 'nagoya', name: '名古屋城', name_en: 'Nagoya Castle', type: 'heritage', description: '金鯱城，德川家康築城' },
  { country_id: 'japan', city_id: 'nagoya', name: '熱田神宮', name_en: 'Atsuta Shrine', type: 'temple', description: '三大神宮之一，草薙劍' },
  { country_id: 'japan', city_id: 'nagoya', name: '大須觀音', name_en: 'Osu Kannon', type: 'temple', description: '日本三大觀音' },
  { country_id: 'japan', city_id: 'nagoya', name: '大須商店街', name_en: 'Osu Shopping District', type: 'shopping', description: '復古潮流購物街' },
  { country_id: 'japan', city_id: 'nagoya', name: '名古屋港水族館', name_en: 'Port of Nagoya Aquarium', type: 'attraction', description: '虎鯨、白鯨表演' },
  { country_id: 'japan', city_id: 'nagoya', name: 'LEGOLAND Japan', name_en: 'LEGOLAND Japan', type: 'theme_park', description: '亞洲第二座樂高樂園' },
  { country_id: 'japan', city_id: 'nagoya', name: '豐田產業技術紀念館', name_en: 'Toyota Commemorative Museum', type: 'museum', description: '豐田汽車歷史' },
  { country_id: 'japan', city_id: 'nagoya', name: '矢場とん味噌豬排', name_en: 'Yabaton Miso Katsu', type: 'food', description: '名古屋名物味噌豬排' },
  { country_id: 'japan', city_id: 'nagoya', name: '鰻魚飯三吃', name_en: 'Hitsumabushi', type: 'food', description: '名古屋鰻魚料理' },

  // ============================================================
  // 日本 - 福岡
  // ============================================================
  { country_id: 'japan', city_id: 'fukuoka', name: '太宰府天滿宮', name_en: 'Dazaifu Tenmangu', type: 'temple', description: '學問之神，飛梅傳說' },
  { country_id: 'japan', city_id: 'fukuoka', name: '博多運河城', name_en: 'Canal City Hakata', type: 'shopping', description: '城中之城購物中心' },
  { country_id: 'japan', city_id: 'fukuoka', name: '中洲屋台', name_en: 'Nakasu Yatai', type: 'food', description: '博多屋台拉麵' },
  { country_id: 'japan', city_id: 'fukuoka', name: '櫛田神社', name_en: 'Kushida Shrine', type: 'temple', description: '博多祇園山笠' },
  { country_id: 'japan', city_id: 'fukuoka', name: '福岡塔', name_en: 'Fukuoka Tower', type: 'landmark', description: '海濱百道地標' },
  { country_id: 'japan', city_id: 'fukuoka', name: '海之中道海濱公園', name_en: 'Uminonakamichi', type: 'park', description: '花海、水族館' },
  { country_id: 'japan', city_id: 'fukuoka', name: '一蘭拉麵總本店', name_en: 'Ichiran Ramen Honten', type: 'food', description: '博多豚骨拉麵發源' },
  { country_id: 'japan', city_id: 'fukuoka', name: '博多內臟鍋', name_en: 'Motsu Nabe', type: 'food', description: '福岡名物內臟火鍋' },

  // ============================================================
  // 日本 - 長崎
  // ============================================================
  { country_id: 'japan', city_id: 'nagasaki', name: '原爆資料館', name_en: 'Nagasaki Atomic Bomb Museum', type: 'museum', description: '原爆歷史記錄' },
  { country_id: 'japan', city_id: 'nagasaki', name: '平和公園', name_en: 'Peace Park', type: 'park', description: '和平祈念像' },
  { country_id: 'japan', city_id: 'nagasaki', name: '哥拉巴園', name_en: 'Glover Garden', type: 'heritage', description: '西洋建築群，蝴蝶夫人' },
  { country_id: 'japan', city_id: 'nagasaki', name: '大浦天主堂', name_en: 'Oura Church', type: 'temple', description: '日本最古老天主堂' },
  { country_id: 'japan', city_id: 'nagasaki', name: '眼鏡橋', name_en: 'Megane Bridge', type: 'landmark', description: '日本最古老石拱橋' },
  { country_id: 'japan', city_id: 'nagasaki', name: '出島', name_en: 'Dejima', type: 'heritage', description: '荷蘭商館遺址' },
  { country_id: 'japan', city_id: 'nagasaki', name: '稻佐山夜景', name_en: 'Mount Inasa Night View', type: 'viewpoint', description: '世界新三大夜景' },
  { country_id: 'japan', city_id: 'nagasaki', name: '豪斯登堡', name_en: 'Huis Ten Bosch', type: 'theme_park', description: '荷蘭主題樂園' },
  { country_id: 'japan', city_id: 'nagasaki', name: '長崎蛋糕', name_en: 'Castella Cake', type: 'food', description: '葡萄牙傳來甜點' },
  { country_id: 'japan', city_id: 'nagasaki', name: '長崎強棒麵', name_en: 'Champon', type: 'food', description: '長崎名物麵食' },

  // ============================================================
  // 日本 - 熊本/阿蘇
  // ============================================================
  { country_id: 'japan', city_id: 'kumamoto', name: '熊本城', name_en: 'Kumamoto Castle', type: 'heritage', description: '日本三大名城' },
  { country_id: 'japan', city_id: 'kumamoto', name: '阿蘇火山', name_en: 'Mount Aso', type: 'attraction', description: '世界最大火山口' },
  { country_id: 'japan', city_id: 'kumamoto', name: '草千里', name_en: 'Kusasenri', type: 'attraction', description: '阿蘇火山草原' },
  { country_id: 'japan', city_id: 'kumamoto', name: '黑川溫泉', name_en: 'Kurokawa Onsen', type: 'attraction', description: '秘湯溫泉鄉' },
  { country_id: 'japan', city_id: 'kumamoto', name: '水前寺成趣園', name_en: 'Suizenji Garden', type: 'garden', description: '回遊式庭園' },
  { country_id: 'japan', city_id: 'kumamoto', name: '熊本熊廣場', name_en: 'Kumamon Square', type: 'attraction', description: '熊本熊官方據點' },
  { country_id: 'japan', city_id: 'kumamoto', name: '馬肉料理', name_en: 'Basashi', type: 'food', description: '熊本名物生馬肉' },

  // ============================================================
  // 日本 - 鹿兒島
  // ============================================================
  { country_id: 'japan', city_id: 'kagoshima', name: '櫻島', name_en: 'Sakurajima', type: 'attraction', description: '活火山，鹿兒島象徵' },
  { country_id: 'japan', city_id: 'kagoshima', name: '仙巖園', name_en: 'Sengan-en Garden', type: 'garden', description: '薩摩藩主庭園' },
  { country_id: 'japan', city_id: 'kagoshima', name: '屋久島', name_en: 'Yakushima', type: 'attraction', description: '世界遺產，繩文杉' },
  { country_id: 'japan', city_id: 'kagoshima', name: '霧島神宮', name_en: 'Kirishima Shrine', type: 'temple', description: '天孫降臨之地' },
  { country_id: 'japan', city_id: 'kagoshima', name: '指宿砂蒸溫泉', name_en: 'Ibusuki Sand Bath', type: 'experience', description: '天然砂蒸體驗' },
  { country_id: 'japan', city_id: 'kagoshima', name: '知覽特攻平和會館', name_en: 'Chiran Peace Museum', type: 'museum', description: '神風特攻隊紀念' },
  { country_id: 'japan', city_id: 'kagoshima', name: '黑豚涮涮鍋', name_en: 'Kurobuta Shabu Shabu', type: 'food', description: '鹿兒島黑豬' },
  { country_id: 'japan', city_id: 'kagoshima', name: '白熊刨冰', name_en: 'Shirokuma Shaved Ice', type: 'food', description: '鹿兒島名物冰品' },

  // ============================================================
  // 日本 - 金澤
  // ============================================================
  { country_id: 'japan', city_id: 'kanazawa', name: '兼六園', name_en: 'Kenrokuen Garden', type: 'garden', description: '日本三大名園' },
  { country_id: 'japan', city_id: 'kanazawa', name: '金澤城公園', name_en: 'Kanazawa Castle Park', type: 'heritage', description: '加賀百萬石城跡' },
  { country_id: 'japan', city_id: 'kanazawa', name: '東茶屋街', name_en: 'Higashi Chaya District', type: 'heritage', description: '江戶時代茶屋街' },
  { country_id: 'japan', city_id: 'kanazawa', name: '主計町茶屋街', name_en: 'Kazuemachi', type: 'heritage', description: '淺野川畔茶屋' },
  { country_id: 'japan', city_id: 'kanazawa', name: '金澤21世紀美術館', name_en: '21st Century Museum', type: 'museum', description: '泳池假象裝置藝術' },
  { country_id: 'japan', city_id: 'kanazawa', name: '近江町市場', name_en: 'Omicho Market', type: 'market', description: '金澤廚房，海鮮丼' },
  { country_id: 'japan', city_id: 'kanazawa', name: '長町武家屋敷', name_en: 'Nagamachi Samurai District', type: 'heritage', description: '武士住宅群' },
  { country_id: 'japan', city_id: 'kanazawa', name: '妙立寺忍者寺', name_en: 'Myoryuji Ninja Temple', type: 'temple', description: '機關重重的寺廟' },
  { country_id: 'japan', city_id: 'kanazawa', name: '金澤能樂美術館', name_en: 'Noh Museum', type: 'museum', description: '能劇文化展示' },
  { country_id: 'japan', city_id: 'kanazawa', name: '能登半島', name_en: 'Noto Peninsula', type: 'attraction', description: '白米千枚田' },

  // ============================================================
  // 日本 - 高山/白川鄉
  // ============================================================
  { country_id: 'japan', city_id: 'takayama', name: '高山老街', name_en: 'Takayama Old Town', type: 'heritage', description: '小京都，三町筋' },
  { country_id: 'japan', city_id: 'takayama', name: '高山陣屋', name_en: 'Takayama Jinya', type: 'heritage', description: '唯一現存郡代役所' },
  { country_id: 'japan', city_id: 'takayama', name: '宮川朝市', name_en: 'Miyagawa Morning Market', type: 'market', description: '日本三大朝市' },
  { country_id: 'japan', city_id: 'takayama', name: '飛驒民俗村', name_en: 'Hida Folk Village', type: 'attraction', description: '合掌造民家群' },
  { country_id: 'japan', city_id: 'shirakawago', name: '白川鄉合掌村', name_en: 'Shirakawa-go', type: 'heritage', description: '世界遺產，合掌造集落' },
  { country_id: 'japan', city_id: 'shirakawago', name: '荻町城跡展望台', name_en: 'Ogimachi Observation Deck', type: 'viewpoint', description: '俯瞰合掌村全景' },
  { country_id: 'japan', city_id: 'shirakawago', name: '和田家', name_en: 'Wada House', type: 'heritage', description: '最大合掌造民家' },
  { country_id: 'japan', city_id: 'takayama', name: '飛驒牛握壽司', name_en: 'Hida Beef Sushi', type: 'food', description: '炙燒和牛握壽司' },
  { country_id: 'japan', city_id: 'takayama', name: '五平餅', name_en: 'Gohei Mochi', type: 'food', description: '飛驒傳統烤米餅' },
  { country_id: 'japan', city_id: 'takayama', name: '朴葉味噌', name_en: 'Hoba Miso', type: 'food', description: '朴葉燒烤味噌' },

  // ============================================================
  // 韓國 - 慶州
  // ============================================================
  { country_id: 'korea', city_id: 'gyeongju', name: '佛國寺', name_en: 'Bulguksa Temple', type: 'temple', description: '世界遺產，新羅佛教藝術' },
  { country_id: 'korea', city_id: 'gyeongju', name: '石窟庵', name_en: 'Seokguram Grotto', type: 'temple', description: '世界遺產，石佛' },
  { country_id: 'korea', city_id: 'gyeongju', name: '大陵苑', name_en: 'Daereungwon', type: 'heritage', description: '新羅王陵群' },
  { country_id: 'korea', city_id: 'gyeongju', name: '天馬塚', name_en: 'Cheonmachong', type: 'heritage', description: '天馬圖出土王陵' },
  { country_id: 'korea', city_id: 'gyeongju', name: '瞻星台', name_en: 'Cheomseongdae', type: 'heritage', description: '東亞最古老天文台' },
  { country_id: 'korea', city_id: 'gyeongju', name: '雁鴨池', name_en: 'Anapji Pond', type: 'heritage', description: '新羅王宮離宮' },
  { country_id: 'korea', city_id: 'gyeongju', name: '慶州國立博物館', name_en: 'Gyeongju National Museum', type: 'museum', description: '新羅文物收藏' },
  { country_id: 'korea', city_id: 'gyeongju', name: '良洞民俗村', name_en: 'Yangdong Folk Village', type: 'heritage', description: '世界遺產傳統村落' },

  // ============================================================
  // 韓國 - 其他城市補充
  // ============================================================
  { country_id: 'korea', city_id: 'incheon', name: '松島中央公園', name_en: 'Songdo Central Park', type: 'park', description: '智慧城市綠洲' },
  { country_id: 'korea', city_id: 'incheon', name: '仁川中華街', name_en: 'Incheon Chinatown', type: 'attraction', description: '韓國最大唐人街' },
  { country_id: 'korea', city_id: 'incheon', name: '月尾島', name_en: 'Wolmido Island', type: 'attraction', description: '海濱遊樂區' },
  { country_id: 'korea', city_id: 'gangneung', name: '正東津', name_en: 'Jeongdongjin', type: 'attraction', description: '韓國最美日出' },
  { country_id: 'korea', city_id: 'gangneung', name: '鏡浦海邊', name_en: 'Gyeongpo Beach', type: 'beach', description: '東海岸沙灘' },
  { country_id: 'korea', city_id: 'gangneung', name: '烏竹軒', name_en: 'Ojukheon', type: 'heritage', description: '朝鮮時代名人故居' },
  { country_id: 'korea', city_id: 'sokcho', name: '雪嶽山國家公園', name_en: 'Seoraksan National Park', type: 'park', description: '韓國最美山岳' },
  { country_id: 'korea', city_id: 'sokcho', name: '束草海鮮市場', name_en: 'Sokcho Seafood Market', type: 'market', description: '東海岸海鮮' },
  { country_id: 'korea', city_id: 'daegu', name: '西門市場', name_en: 'Seomun Market', type: 'market', description: '大邱傳統市場' },
  { country_id: 'korea', city_id: 'daegu', name: '八公山纜車', name_en: 'Palgongsan Cable Car', type: 'attraction', description: '桐華寺、冠峰' },
  { country_id: 'korea', city_id: 'daegu', name: '金光石路', name_en: 'Kim Gwangseok Street', type: 'attraction', description: '壁畫藝術街' },
  { country_id: 'korea', city_id: 'suwon', name: '水原華城', name_en: 'Hwaseong Fortress', type: 'heritage', description: '世界遺產城郭' },
  { country_id: 'korea', city_id: 'suwon', name: '華城行宮', name_en: 'Hwaseong Haenggung Palace', type: 'heritage', description: '朝鮮國王行宮' },
  { country_id: 'korea', city_id: 'suwon', name: '水原炸雞街', name_en: 'Suwon Chicken Street', type: 'food', description: '韓國炸雞發源地' },

  // ============================================================
  // 泰國 - 清萊
  // ============================================================
  { country_id: 'thailand', city_id: 'chiang-rai', name: '白廟', name_en: 'White Temple', type: 'temple', description: '龍坤藝術寺，純白建築' },
  { country_id: 'thailand', city_id: 'chiang-rai', name: '藍廟', name_en: 'Blue Temple', type: 'temple', description: '榮坤寺，藍色主題' },
  { country_id: 'thailand', city_id: 'chiang-rai', name: '黑廟', name_en: 'Black House', type: 'museum', description: 'Baandam藝術館' },
  { country_id: 'thailand', city_id: 'chiang-rai', name: '金三角', name_en: 'Golden Triangle', type: 'attraction', description: '泰緬寮交界' },
  { country_id: 'thailand', city_id: 'chiang-rai', name: '美斯樂', name_en: 'Mae Salong', type: 'attraction', description: '雲南茶村' },
  { country_id: 'thailand', city_id: 'chiang-rai', name: '長頸族村落', name_en: 'Long Neck Village', type: 'attraction', description: '卡倫族部落' },

  // ============================================================
  // 泰國 - 華欣/芭達雅
  // ============================================================
  { country_id: 'thailand', city_id: 'hua-hin', name: '華欣海灘', name_en: 'Hua Hin Beach', type: 'beach', description: '皇家度假勝地' },
  { country_id: 'thailand', city_id: 'hua-hin', name: '華欣火車站', name_en: 'Hua Hin Railway Station', type: 'heritage', description: '泰國最美車站' },
  { country_id: 'thailand', city_id: 'hua-hin', name: '拷汪宮', name_en: 'Khao Wang Palace', type: 'heritage', description: '山頂皇宮' },
  { country_id: 'thailand', city_id: 'hua-hin', name: '華欣夜市', name_en: 'Hua Hin Night Market', type: 'market', description: '海鮮夜市' },
  { country_id: 'thailand', city_id: 'hua-hin', name: '小瑞士綿羊牧場', name_en: 'Swiss Sheep Farm', type: 'attraction', description: '親子農場' },
  { country_id: 'thailand', city_id: 'pattaya', name: '芭達雅海灘', name_en: 'Pattaya Beach', type: 'beach', description: '東方夏威夷' },
  { country_id: 'thailand', city_id: 'pattaya', name: '真理寺', name_en: 'Sanctuary of Truth', type: 'temple', description: '全木雕寺廟' },
  { country_id: 'thailand', city_id: 'pattaya', name: '格蘭島', name_en: 'Koh Larn', type: 'beach', description: '芭達雅離島' },
  { country_id: 'thailand', city_id: 'pattaya', name: '四方水上市場', name_en: 'Pattaya Floating Market', type: 'market', description: '四區水上市場' },
  { country_id: 'thailand', city_id: 'pattaya', name: 'Tiffany人妖秀', name_en: 'Tiffanys Show', type: 'attraction', description: '人妖歌舞表演' },
  { country_id: 'thailand', city_id: 'pattaya', name: '芭達雅步行街', name_en: 'Walking Street', type: 'attraction', description: '夜生活熱區' },
  { country_id: 'thailand', city_id: 'pattaya', name: '東芭樂園', name_en: 'Nong Nooch Garden', type: 'park', description: '熱帶植物園' },

  // ============================================================
  // 泰國 - 喀比/蘇美島
  // ============================================================
  { country_id: 'thailand', city_id: 'krabi', name: '萊利海灘', name_en: 'Railay Beach', type: 'beach', description: '石灰岩海灘，攀岩聖地' },
  { country_id: 'thailand', city_id: 'krabi', name: '奧南海灘', name_en: 'Ao Nang Beach', type: 'beach', description: '喀比主海灘' },
  { country_id: 'thailand', city_id: 'krabi', name: '四島遊', name_en: 'Four Islands Tour', type: 'attraction', description: '雞島、管子島、莫島、波達島' },
  { country_id: 'thailand', city_id: 'krabi', name: '虎穴寺', name_en: 'Tiger Cave Temple', type: 'temple', description: '1260階梯登頂' },
  { country_id: 'thailand', city_id: 'krabi', name: '翡翠池', name_en: 'Emerald Pool', type: 'attraction', description: '天然翡翠色溫泉' },
  { country_id: 'thailand', city_id: 'krabi', name: '洪島', name_en: 'Koh Hong', type: 'beach', description: '潟湖秘境' },
  { country_id: 'thailand', city_id: 'koh-samui', name: '查汶海灘', name_en: 'Chaweng Beach', type: 'beach', description: '蘇美島最美海灘' },
  { country_id: 'thailand', city_id: 'koh-samui', name: '大佛寺', name_en: 'Big Buddha Temple', type: 'temple', description: '12公尺金佛' },
  { country_id: 'thailand', city_id: 'koh-samui', name: '阿公阿媽石', name_en: 'Grandfather Grandmother Rocks', type: 'attraction', description: '自然奇石' },
  { country_id: 'thailand', city_id: 'koh-samui', name: '安通國家海洋公園', name_en: 'Ang Thong Marine Park', type: 'park', description: '42島群' },
  { country_id: 'thailand', city_id: 'koh-samui', name: '蘇美島夜市', name_en: 'Samui Night Market', type: 'market', description: '拉邁夜市' },
  { country_id: 'thailand', city_id: 'koh-samui', name: '帕岸島滿月派對', name_en: 'Full Moon Party', type: 'experience', description: '世界級沙灘派對' },

  // ============================================================
  // 越南 - 芽莊/順化/沙壩
  // ============================================================
  { country_id: 'vietnam', city_id: 'nha-trang', name: '芽莊海灘', name_en: 'Nha Trang Beach', type: 'beach', description: '越南度假海灘' },
  { country_id: 'vietnam', city_id: 'nha-trang', name: '珍珠島遊樂園', name_en: 'Vinpearl Land', type: 'theme_park', description: '跨海纜車、水上樂園' },
  { country_id: 'vietnam', city_id: 'nha-trang', name: '婆那加占婆塔', name_en: 'Po Nagar Cham Towers', type: 'heritage', description: '占婆王國遺跡' },
  { country_id: 'vietnam', city_id: 'nha-trang', name: '四島跳島遊', name_en: 'Four Islands Tour', type: 'attraction', description: '浮潛、水上派對' },
  { country_id: 'vietnam', city_id: 'nha-trang', name: '芽莊泥漿浴', name_en: 'Mud Bath', type: 'experience', description: '溫泉泥漿SPA' },
  { country_id: 'vietnam', city_id: 'hue', name: '順化皇城', name_en: 'Hue Imperial City', type: 'heritage', description: '世界遺產，阮朝皇宮' },
  { country_id: 'vietnam', city_id: 'hue', name: '天姥寺', name_en: 'Thien Mu Pagoda', type: 'temple', description: '順化地標七層塔' },
  { country_id: 'vietnam', city_id: 'hue', name: '嗣德皇陵', name_en: 'Tu Duc Tomb', type: 'heritage', description: '最美皇陵' },
  { country_id: 'vietnam', city_id: 'hue', name: '啟定皇陵', name_en: 'Khai Dinh Tomb', type: 'heritage', description: '中西合璧風格' },
  { country_id: 'vietnam', city_id: 'hue', name: '香江遊船', name_en: 'Perfume River Cruise', type: 'attraction', description: '順化遊河' },
  { country_id: 'vietnam', city_id: 'hue', name: '順化牛肉河粉', name_en: 'Bun Bo Hue', type: 'food', description: '辣味牛肉米線' },
  { country_id: 'vietnam', city_id: 'sapa', name: '番西邦峰', name_en: 'Fansipan Peak', type: 'attraction', description: '印度支那屋脊' },
  { country_id: 'vietnam', city_id: 'sapa', name: '沙壩梯田', name_en: 'Sapa Rice Terraces', type: 'attraction', description: '壯觀梯田景觀' },
  { country_id: 'vietnam', city_id: 'sapa', name: '貓貓村', name_en: 'Cat Cat Village', type: 'attraction', description: '黑苗族部落' },
  { country_id: 'vietnam', city_id: 'sapa', name: '塔灣村', name_en: 'Ta Van Village', type: 'attraction', description: '瑤族少數民族' },
  { country_id: 'vietnam', city_id: 'sapa', name: '沙壩愛情市場', name_en: 'Love Market', type: 'attraction', description: '週末民族聚會' },

  // ============================================================
  // 越南 - 富國島
  // ============================================================
  { country_id: 'vietnam', city_id: 'phu-quoc', name: '富國島沙灘', name_en: 'Phu Quoc Beach', type: 'beach', description: '越南馬爾地夫' },
  { country_id: 'vietnam', city_id: 'phu-quoc', name: '珍珠野生動物園', name_en: 'Vinpearl Safari', type: 'attraction', description: '開放式動物園' },
  { country_id: 'vietnam', city_id: 'phu-quoc', name: '陽東夜市', name_en: 'Duong Dong Night Market', type: 'market', description: '海鮮夜市' },
  { country_id: 'vietnam', city_id: 'phu-quoc', name: '魚露工廠', name_en: 'Fish Sauce Factory', type: 'attraction', description: '越南魚露製作' },
  { country_id: 'vietnam', city_id: 'phu-quoc', name: '胡椒農場', name_en: 'Pepper Farm', type: 'attraction', description: '富國島胡椒' },
  { country_id: 'vietnam', city_id: 'phu-quoc', name: '世界最長跨海纜車', name_en: 'Phu Quoc Cable Car', type: 'attraction', description: '7.9公里跨海纜車' },
  { country_id: 'vietnam', city_id: 'phu-quoc', name: '星灘', name_en: 'Starfish Beach', type: 'beach', description: '海星沙灘' },
  { country_id: 'vietnam', city_id: 'phu-quoc', name: '日落沙灘', name_en: 'Sunset Beach', type: 'beach', description: '最美夕陽海灘' },

  // ============================================================
  // 中國 - 香港/澳門
  // ============================================================
  { country_id: 'china', city_id: 'shanghai', name: '迪士尼樂園', name_en: 'Shanghai Disneyland', type: 'theme_park', description: '中國第一座迪士尼' },
  { country_id: 'china', city_id: 'shanghai', name: '東方明珠塔', name_en: 'Oriental Pearl Tower', type: 'landmark', description: '上海地標' },
  { country_id: 'china', city_id: 'shanghai', name: '南京路步行街', name_en: 'Nanjing Road', type: 'shopping', description: '百年商業街' },
  { country_id: 'china', city_id: 'shanghai', name: '城隍廟', name_en: 'City God Temple', type: 'temple', description: '上海老城廂' },
  { country_id: 'china', city_id: 'shanghai', name: '上海博物館', name_en: 'Shanghai Museum', type: 'museum', description: '青銅器、書畫收藏' },
  { country_id: 'china', city_id: 'shanghai', name: '靜安寺', name_en: 'Jing An Temple', type: 'temple', description: '千年古剎' },
  { country_id: 'china', city_id: 'shanghai', name: '朱家角古鎮', name_en: 'Zhujiajiao Water Town', type: 'heritage', description: '上海威尼斯' },
  { country_id: 'china', city_id: 'shanghai', name: '上海環球金融中心', name_en: 'Shanghai World Financial Center', type: 'landmark', description: '開瓶器觀景台' },
  { country_id: 'china', city_id: 'shanghai', name: '武康路', name_en: 'Wukang Road', type: 'attraction', description: '法租界洋房' },
  { country_id: 'china', city_id: 'shanghai', name: '上海小籠包', name_en: 'Shanghai Xiaolongbao', type: 'food', description: '南翔小籠包' }
]

async function importMore() {
  console.log('========================================')
  console.log('  繼續擴充景點資料庫')
  console.log('  總數: ' + moreAttractions.length + ' 個景點')
  console.log('========================================')
  console.log('')

  let success = 0
  let skipped = 0
  let failed = 0

  for (const attr of moreAttractions) {
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
      console.log('✅ ' + attr.name + ' (' + attr.city_id + ')')
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

importMore()
