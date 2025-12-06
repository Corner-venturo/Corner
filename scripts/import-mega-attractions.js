const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

const workspace_id = '8ef05a74-1f87-48ab-afd3-9bfeb423935d'

// ============================================================
// 超完整景點資料庫
// ============================================================

const allAttractions = [
  // ============================================================
  // 日本 - 東京
  // ============================================================
  { country_id: 'japan', city_id: 'tokyo', name: '東京晴空塔', name_en: 'Tokyo Skytree', type: 'landmark', description: '世界第二高塔，634公尺，東京地標' },
  { country_id: 'japan', city_id: 'tokyo', name: '東京鐵塔', name_en: 'Tokyo Tower', type: 'landmark', description: '經典地標，333公尺，夜景絕美' },
  { country_id: 'japan', city_id: 'tokyo', name: '淺草寺', name_en: 'Sensoji Temple', type: 'temple', description: '東京最古老寺廟，雷門大燈籠' },
  { country_id: 'japan', city_id: 'tokyo', name: '明治神宮', name_en: 'Meiji Shrine', type: 'temple', description: '供奉明治天皇，都市中的森林' },
  { country_id: 'japan', city_id: 'tokyo', name: '皇居', name_en: 'Imperial Palace', type: 'heritage', description: '日本天皇住所，二重橋' },
  { country_id: 'japan', city_id: 'tokyo', name: '新宿御苑', name_en: 'Shinjuku Gyoen', type: 'park', description: '日式、法式、英式三種庭園風格' },
  { country_id: 'japan', city_id: 'tokyo', name: '上野公園', name_en: 'Ueno Park', type: 'park', description: '賞櫻名所，多個博物館聚集' },
  { country_id: 'japan', city_id: 'tokyo', name: '東京迪士尼樂園', name_en: 'Tokyo Disneyland', type: 'theme_park', description: '亞洲第一座迪士尼' },
  { country_id: 'japan', city_id: 'tokyo', name: '東京迪士尼海洋', name_en: 'Tokyo DisneySea', type: 'theme_park', description: '全球唯一海洋主題迪士尼' },
  { country_id: 'japan', city_id: 'tokyo', name: '澀谷十字路口', name_en: 'Shibuya Crossing', type: 'landmark', description: '世界最繁忙路口，澀谷象徵' },
  { country_id: 'japan', city_id: 'tokyo', name: '澀谷SKY', name_en: 'Shibuya Sky', type: 'viewpoint', description: '360度全景觀景台，網美打卡點' },
  { country_id: 'japan', city_id: 'tokyo', name: '原宿竹下通', name_en: 'Takeshita Street', type: 'shopping', description: '日本年輕人流行文化聖地' },
  { country_id: 'japan', city_id: 'tokyo', name: '秋葉原電器街', name_en: 'Akihabara', type: 'shopping', description: '電器動漫天堂，宅文化聖地' },
  { country_id: 'japan', city_id: 'tokyo', name: '銀座', name_en: 'Ginza', type: 'shopping', description: '高級購物區，精品百貨林立' },
  { country_id: 'japan', city_id: 'tokyo', name: '築地場外市場', name_en: 'Tsukiji Outer Market', type: 'market', description: '生猛海鮮，壽司早餐' },
  { country_id: 'japan', city_id: 'tokyo', name: '豐洲市場', name_en: 'Toyosu Market', type: 'market', description: '新魚市場，鮪魚拍賣' },
  { country_id: 'japan', city_id: 'tokyo', name: 'teamLab Planets', name_en: 'teamLab Planets', type: 'museum', description: '沉浸式數位藝術館' },
  { country_id: 'japan', city_id: 'tokyo', name: 'teamLab Borderless', name_en: 'teamLab Borderless', type: 'museum', description: '無界數位藝術美術館' },
  { country_id: 'japan', city_id: 'tokyo', name: '國立新美術館', name_en: 'National Art Center Tokyo', type: 'museum', description: '黑川紀章設計，波浪玻璃帷幕' },
  { country_id: 'japan', city_id: 'tokyo', name: '東京國立博物館', name_en: 'Tokyo National Museum', type: 'museum', description: '日本最大博物館，國寶收藏' },
  { country_id: 'japan', city_id: 'tokyo', name: '六本木之丘', name_en: 'Roppongi Hills', type: 'landmark', description: '東京城市觀景台，森美術館' },
  { country_id: 'japan', city_id: 'tokyo', name: '表參道', name_en: 'Omotesando', type: 'shopping', description: '建築藝術大道，精品旗艦店' },
  { country_id: 'japan', city_id: 'tokyo', name: '台場海濱公園', name_en: 'Odaiba Seaside Park', type: 'park', description: '彩虹大橋、自由女神像' },
  { country_id: 'japan', city_id: 'tokyo', name: '新宿歌舞伎町', name_en: 'Kabukicho', type: 'attraction', description: '亞洲最大歡樂街' },
  { country_id: 'japan', city_id: 'tokyo', name: '池袋Sunshine City', name_en: 'Sunshine City', type: 'shopping', description: '水族館、展望台、購物商城' },
  { country_id: 'japan', city_id: 'tokyo', name: '東京車站', name_en: 'Tokyo Station', type: 'landmark', description: '百年紅磚建築，東京門戶' },
  { country_id: 'japan', city_id: 'tokyo', name: '中目黑', name_en: 'Nakameguro', type: 'attraction', description: '文青咖啡街，目黑川賞櫻' },
  { country_id: 'japan', city_id: 'tokyo', name: '下北澤', name_en: 'Shimokitazawa', type: 'shopping', description: '二手古著天堂，獨立咖啡廳' },
  { country_id: 'japan', city_id: 'tokyo', name: '吉祥寺', name_en: 'Kichijoji', type: 'attraction', description: '井之頭公園，最想居住街區' },
  { country_id: 'japan', city_id: 'tokyo', name: '東京巨蛋', name_en: 'Tokyo Dome', type: 'attraction', description: '棒球聖地，演唱會場館' },

  // ============================================================
  // 日本 - 大阪
  // ============================================================
  { country_id: 'japan', city_id: 'osaka', name: '大阪城', name_en: 'Osaka Castle', type: 'heritage', description: '豐臣秀吉築城，天守閣' },
  { country_id: 'japan', city_id: 'osaka', name: '道頓堀', name_en: 'Dotonbori', type: 'attraction', description: '固力果跑跑人，美食天堂' },
  { country_id: 'japan', city_id: 'osaka', name: '心齋橋', name_en: 'Shinsaibashi', type: 'shopping', description: '大阪最大購物街' },
  { country_id: 'japan', city_id: 'osaka', name: '日本環球影城', name_en: 'Universal Studios Japan', type: 'theme_park', description: '哈利波特魔法世界、任天堂園區' },
  { country_id: 'japan', city_id: 'osaka', name: '通天閣', name_en: 'Tsutenkaku', type: 'landmark', description: '新世界地標，幸運之神比利肯' },
  { country_id: 'japan', city_id: 'osaka', name: '新世界', name_en: 'Shinsekai', type: 'attraction', description: '復古商店街，串炸發源地' },
  { country_id: 'japan', city_id: 'osaka', name: '黑門市場', name_en: 'Kuromon Market', type: 'market', description: '大阪廚房，新鮮海鮮' },
  { country_id: 'japan', city_id: 'osaka', name: '阿倍野HARUKAS', name_en: 'Abeno Harukas', type: 'landmark', description: '日本最高摩天大樓，300公尺觀景台' },
  { country_id: 'japan', city_id: 'osaka', name: '梅田空中庭園', name_en: 'Umeda Sky Building', type: 'viewpoint', description: '空中連結雙塔，360度夜景' },
  { country_id: 'japan', city_id: 'osaka', name: '天王寺動物園', name_en: 'Tennoji Zoo', type: 'attraction', description: '百年動物園' },
  { country_id: 'japan', city_id: 'osaka', name: '海遊館', name_en: 'Osaka Aquarium Kaiyukan', type: 'attraction', description: '世界最大級水族館，鯨鯊' },
  { country_id: 'japan', city_id: 'osaka', name: '難波', name_en: 'Namba', type: 'shopping', description: '購物美食中心，南海電鐵站' },
  { country_id: 'japan', city_id: 'osaka', name: '天神橋筋商店街', name_en: 'Tenjinbashisuji', type: 'shopping', description: '日本最長商店街，2.6公里' },
  { country_id: 'japan', city_id: 'osaka', name: '住吉大社', name_en: 'Sumiyoshi Taisha', type: 'temple', description: '住吉神社總本社，反橋' },
  { country_id: 'japan', city_id: 'osaka', name: '中之島', name_en: 'Nakanoshima', type: 'attraction', description: '水都大阪象徵，玫瑰園' },

  // ============================================================
  // 日本 - 京都
  // ============================================================
  { country_id: 'japan', city_id: 'kyoto', name: '金閣寺', name_en: 'Kinkakuji', type: 'temple', description: '金箔覆蓋的舍利殿，世界遺產' },
  { country_id: 'japan', city_id: 'kyoto', name: '清水寺', name_en: 'Kiyomizudera', type: 'temple', description: '懸空舞台，求戀愛地主神社' },
  { country_id: 'japan', city_id: 'kyoto', name: '伏見稻荷大社', name_en: 'Fushimi Inari Taisha', type: 'temple', description: '千本鳥居，狐狸神使' },
  { country_id: 'japan', city_id: 'kyoto', name: '嵐山竹林', name_en: 'Arashiyama Bamboo Grove', type: 'attraction', description: '竹林小徑，京都代表景觀' },
  { country_id: 'japan', city_id: 'kyoto', name: '渡月橋', name_en: 'Togetsukyo Bridge', type: 'landmark', description: '嵐山地標，楓葉名所' },
  { country_id: 'japan', city_id: 'kyoto', name: '銀閣寺', name_en: 'Ginkakuji', type: 'temple', description: '東山文化代表，銀沙灘' },
  { country_id: 'japan', city_id: 'kyoto', name: '二條城', name_en: 'Nijo Castle', type: 'heritage', description: '德川家康居城，鶯聲地板' },
  { country_id: 'japan', city_id: 'kyoto', name: '八坂神社', name_en: 'Yasaka Shrine', type: 'temple', description: '祇園祭總本社' },
  { country_id: 'japan', city_id: 'kyoto', name: '祇園花見小路', name_en: 'Gion Hanamikoji', type: 'attraction', description: '藝妓街道，傳統町家' },
  { country_id: 'japan', city_id: 'kyoto', name: '南禪寺', name_en: 'Nanzenji', type: 'temple', description: '水路閣，紅磚建築融合禪寺' },
  { country_id: 'japan', city_id: 'kyoto', name: '哲學之道', name_en: 'Philosophers Path', type: 'attraction', description: '櫻花隧道，漫步思考' },
  { country_id: 'japan', city_id: 'kyoto', name: '平安神宮', name_en: 'Heian Shrine', type: 'temple', description: '朱紅大鳥居，神苑庭園' },
  { country_id: 'japan', city_id: 'kyoto', name: '龍安寺', name_en: 'Ryoanji', type: 'temple', description: '枯山水石庭，禪意代表' },
  { country_id: 'japan', city_id: 'kyoto', name: '天龍寺', name_en: 'Tenryuji', type: 'temple', description: '嵐山世界遺產，曹源池庭園' },
  { country_id: 'japan', city_id: 'kyoto', name: '三十三間堂', name_en: 'Sanjusangendo', type: 'temple', description: '1001尊千手觀音' },
  { country_id: 'japan', city_id: 'kyoto', name: '東寺', name_en: 'Toji Temple', type: 'temple', description: '日本最高五重塔，弘法市' },
  { country_id: 'japan', city_id: 'kyoto', name: '錦市場', name_en: 'Nishiki Market', type: 'market', description: '京都廚房，400年歷史' },
  { country_id: 'japan', city_id: 'kyoto', name: '京都御所', name_en: 'Kyoto Imperial Palace', type: 'heritage', description: '天皇舊居，皇室庭園' },
  { country_id: 'japan', city_id: 'kyoto', name: '建仁寺', name_en: 'Kenninji', type: 'temple', description: '京都最古禪寺，風神雷神圖' },
  { country_id: 'japan', city_id: 'kyoto', name: '永觀堂', name_en: 'Eikando', type: 'temple', description: '楓葉名所，回首阿彌陀佛' },
  { country_id: 'japan', city_id: 'kyoto', name: '貴船神社', name_en: 'Kifune Shrine', type: 'temple', description: '水神社，川床料理' },
  { country_id: 'japan', city_id: 'kyoto', name: '下鴨神社', name_en: 'Shimogamo Shrine', type: 'temple', description: '糺之森，結緣神社' },
  { country_id: 'japan', city_id: 'kyoto', name: '上賀茂神社', name_en: 'Kamigamo Shrine', type: 'temple', description: '京都最古神社，世界遺產' },
  { country_id: 'japan', city_id: 'kyoto', name: '西本願寺', name_en: 'Nishi Honganji', type: 'temple', description: '淨土真宗總本山，世界遺產' },
  { country_id: 'japan', city_id: 'kyoto', name: '知恩院', name_en: 'Chion-in', type: 'temple', description: '淨土宗總本山，巨大三門' },

  // ============================================================
  // 日本 - 北海道
  // ============================================================
  { country_id: 'japan', city_id: 'sapporo', name: '札幌電視塔', name_en: 'Sapporo TV Tower', type: 'landmark', description: '大通公園地標，夜景觀景台' },
  { country_id: 'japan', city_id: 'sapporo', name: '大通公園', name_en: 'Odori Park', type: 'park', description: '札幌中心綠地，雪祭會場' },
  { country_id: 'japan', city_id: 'sapporo', name: '札幌時計台', name_en: 'Sapporo Clock Tower', type: 'heritage', description: '北海道開拓象徵' },
  { country_id: 'japan', city_id: 'sapporo', name: '北海道神宮', name_en: 'Hokkaido Shrine', type: 'temple', description: '北海道總鎮守，圓山公園' },
  { country_id: 'japan', city_id: 'sapporo', name: '二條市場', name_en: 'Nijo Market', type: 'market', description: '百年市場，海鮮丼' },
  { country_id: 'japan', city_id: 'sapporo', name: '狸小路商店街', name_en: 'Tanukikoji', type: 'shopping', description: '北海道最大商店街' },
  { country_id: 'japan', city_id: 'sapporo', name: '札幌啤酒博物館', name_en: 'Sapporo Beer Museum', type: 'museum', description: '日本啤酒歷史，試飲體驗' },
  { country_id: 'japan', city_id: 'sapporo', name: '白色戀人公園', name_en: 'Shiroi Koibito Park', type: 'attraction', description: '巧克力工廠，歐風城堡' },
  { country_id: 'japan', city_id: 'sapporo', name: '藻岩山', name_en: 'Mt. Moiwa', type: 'viewpoint', description: '日本新三大夜景，戀人聖地' },
  { country_id: 'japan', city_id: 'sapporo', name: '北海道大學', name_en: 'Hokkaido University', type: 'attraction', description: '銀杏大道，克拉克博士' },
  { country_id: 'japan', city_id: 'otaru', name: '小樽運河', name_en: 'Otaru Canal', type: 'attraction', description: '浪漫運河，煤氣燈夜景' },
  { country_id: 'japan', city_id: 'otaru', name: '小樽音樂盒堂', name_en: 'Otaru Music Box Museum', type: 'museum', description: '蒸汽鐘，音樂盒收藏' },
  { country_id: 'japan', city_id: 'otaru', name: '北一硝子', name_en: 'Kitaichi Glass', type: 'shopping', description: '玻璃工藝品，倉庫群' },
  { country_id: 'japan', city_id: 'otaru', name: 'LeTAO本店', name_en: 'LeTAO', type: 'food', description: '雙層起司蛋糕發源店' },
  { country_id: 'japan', city_id: 'hakodate', name: '函館山夜景', name_en: 'Mt. Hakodate Night View', type: 'viewpoint', description: '世界三大夜景，百萬夜景' },
  { country_id: 'japan', city_id: 'hakodate', name: '五稜郭', name_en: 'Goryokaku', type: 'heritage', description: '星形要塞，幕末歷史' },
  { country_id: 'japan', city_id: 'hakodate', name: '金森紅磚倉庫', name_en: 'Kanemori Red Brick Warehouse', type: 'shopping', description: '港口購物區，明治建築' },
  { country_id: 'japan', city_id: 'hakodate', name: '函館朝市', name_en: 'Hakodate Morning Market', type: 'market', description: '活跳跳海鮮，釣烏賊' },
  { country_id: 'japan', city_id: 'hakodate', name: '八幡坂', name_en: 'Hachimanzaka Slope', type: 'attraction', description: '通往港口的美麗坡道' },
  { country_id: 'japan', city_id: 'hakodate', name: '元町異人館', name_en: 'Motomachi', type: 'heritage', description: '西洋建築群，教堂街' },
  { country_id: 'japan', city_id: 'biei', name: '青池', name_en: 'Blue Pond', type: 'attraction', description: '夢幻藍色水池，枯木倒影' },
  { country_id: 'japan', city_id: 'biei', name: '四季彩之丘', name_en: 'Shikisai no Oka', type: 'park', description: '彩虹花田，羊駝牧場' },
  { country_id: 'japan', city_id: 'biei', name: '拼布之路', name_en: 'Patchwork Road', type: 'attraction', description: '田園風光，廣告樹' },
  { country_id: 'japan', city_id: 'furano', name: '富田農場', name_en: 'Farm Tomita', type: 'park', description: '薰衣草花海，北海道代表' },
  { country_id: 'japan', city_id: 'furano', name: '富良野起司工房', name_en: 'Furano Cheese Factory', type: 'attraction', description: '手作起司體驗' },
  { country_id: 'japan', city_id: 'niseko', name: '二世谷滑雪場', name_en: 'Niseko Ski Resort', type: 'attraction', description: '粉雪天堂，世界級滑雪場' },
  { country_id: 'japan', city_id: 'noboribetsu', name: '登別地獄谷', name_en: 'Jigokudani', type: 'attraction', description: '硫磺噴氣，溫泉源頭' },
  { country_id: 'japan', city_id: 'noboribetsu', name: '登別熊牧場', name_en: 'Noboribetsu Bear Park', type: 'attraction', description: '棕熊牧場，纜車觀景' },

  // ============================================================
  // 日本 - 沖繩
  // ============================================================
  { country_id: 'japan', city_id: 'naha', name: '首里城', name_en: 'Shuri Castle', type: 'heritage', description: '琉球王國宮殿，世界遺產' },
  { country_id: 'japan', city_id: 'naha', name: '國際通', name_en: 'Kokusai Street', type: 'shopping', description: '那霸主街，奇蹟的一哩' },
  { country_id: 'japan', city_id: 'naha', name: '牧志公設市場', name_en: 'Makishi Public Market', type: 'market', description: '沖繩廚房，海鮮代客料理' },
  { country_id: 'japan', city_id: 'naha', name: '波上宮', name_en: 'Naminoue Shrine', type: 'temple', description: '懸崖上的神社，沖繩八社之首' },
  { country_id: 'japan', city_id: 'naha', name: '美國村', name_en: 'American Village', type: 'shopping', description: '美式購物娛樂區，摩天輪' },
  { country_id: 'japan', city_id: 'naha', name: '沖繩美麗海水族館', name_en: 'Okinawa Churaumi Aquarium', type: 'attraction', description: '黑潮之海，鯨鯊' },
  { country_id: 'japan', city_id: 'naha', name: '萬座毛', name_en: 'Manzamo', type: 'attraction', description: '象鼻岩，斷崖絕壁' },
  { country_id: 'japan', city_id: 'naha', name: '古宇利島', name_en: 'Kouri Island', type: 'beach', description: '心形岩，最美海灘' },
  { country_id: 'japan', city_id: 'naha', name: '瀨底島', name_en: 'Sesoko Island', type: 'beach', description: '透明度極高的海灘' },
  { country_id: 'japan', city_id: 'naha', name: '殘波岬', name_en: 'Cape Zanpa', type: 'attraction', description: '白色燈塔，夕陽名所' },
  { country_id: 'japan', city_id: 'naha', name: '玉泉洞', name_en: 'Gyokusendo Cave', type: 'attraction', description: '日本最大鐘乳石洞' },
  { country_id: 'japan', city_id: 'naha', name: '琉球村', name_en: 'Ryukyu Mura', type: 'attraction', description: '傳統琉球文化體驗' },
  { country_id: 'japan', city_id: 'naha', name: '齋場御嶽', name_en: 'Sefa Utaki', type: 'heritage', description: '琉球最高聖地，世界遺產' },
  { country_id: 'japan', city_id: 'ishigaki', name: '川平灣', name_en: 'Kabira Bay', type: 'beach', description: '日本百景，玻璃船' },
  { country_id: 'japan', city_id: 'ishigaki', name: '石垣島鐘乳石洞', name_en: 'Ishigaki Limestone Cave', type: 'attraction', description: '20萬年鐘乳石' },
  { country_id: 'japan', city_id: 'miyako', name: '與那霸前濱海灘', name_en: 'Yonaha Maehama Beach', type: 'beach', description: '東洋第一美海灘' },

  // ============================================================
  // 韓國 - 首爾
  // ============================================================
  { country_id: 'korea', city_id: 'seoul', name: '景福宮', name_en: 'Gyeongbokgung Palace', type: 'heritage', description: '朝鮮王朝正宮，守門將交接' },
  { country_id: 'korea', city_id: 'seoul', name: '昌德宮', name_en: 'Changdeokgung Palace', type: 'heritage', description: '世界遺產，秘苑後花園' },
  { country_id: 'korea', city_id: 'seoul', name: '北村韓屋村', name_en: 'Bukchon Hanok Village', type: 'heritage', description: '傳統韓屋群，韓服體驗' },
  { country_id: 'korea', city_id: 'seoul', name: '明洞', name_en: 'Myeongdong', type: 'shopping', description: '購物天堂，美妝聖地' },
  { country_id: 'korea', city_id: 'seoul', name: '弘大', name_en: 'Hongdae', type: 'attraction', description: '年輕人文化，街頭表演' },
  { country_id: 'korea', city_id: 'seoul', name: '梨泰院', name_en: 'Itaewon', type: 'attraction', description: '異國風情，多元文化' },
  { country_id: 'korea', city_id: 'seoul', name: '江南', name_en: 'Gangnam', type: 'shopping', description: '時尚商圈，COEX Mall' },
  { country_id: 'korea', city_id: 'seoul', name: 'N首爾塔', name_en: 'N Seoul Tower', type: 'landmark', description: '南山地標，愛情鎖' },
  { country_id: 'korea', city_id: 'seoul', name: '樂天世界塔', name_en: 'Lotte World Tower', type: 'landmark', description: '韓國最高建築，555公尺' },
  { country_id: 'korea', city_id: 'seoul', name: '樂天世界', name_en: 'Lotte World', type: 'theme_park', description: '室內遊樂園，魔幻城堡' },
  { country_id: 'korea', city_id: 'seoul', name: '愛寶樂園', name_en: 'Everland', type: 'theme_park', description: '韓國最大主題樂園' },
  { country_id: 'korea', city_id: 'seoul', name: '仁寺洞', name_en: 'Insadong', type: 'shopping', description: '傳統文化街，工藝品' },
  { country_id: 'korea', city_id: 'seoul', name: '三清洞', name_en: 'Samcheongdong', type: 'attraction', description: '文青咖啡街，藝廊' },
  { country_id: 'korea', city_id: 'seoul', name: '益善洞', name_en: 'Ikseon-dong', type: 'attraction', description: '復古韓屋咖啡廳' },
  { country_id: 'korea', city_id: 'seoul', name: '清溪川', name_en: 'Cheonggyecheon', type: 'attraction', description: '都市河川復興，夜間燈飾' },
  { country_id: 'korea', city_id: 'seoul', name: '廣藏市場', name_en: 'Gwangjang Market', type: 'market', description: '傳統市場，綠豆煎餅' },
  { country_id: 'korea', city_id: 'seoul', name: '東大門設計廣場', name_en: 'DDP', type: 'landmark', description: 'Zaha Hadid設計，夜間LED玫瑰' },
  { country_id: 'korea', city_id: 'seoul', name: '汝矣島漢江公園', name_en: 'Yeouido Hangang Park', type: 'park', description: '漢江野餐，炸雞啤酒' },
  { country_id: 'korea', city_id: 'seoul', name: '星空圖書館', name_en: 'Starfield Library', type: 'attraction', description: 'COEX Mall巨型書牆' },
  { country_id: 'korea', city_id: 'seoul', name: '梨花女子大學', name_en: 'Ewha Womans University', type: 'attraction', description: '最美校園，梨大商圈' },
  { country_id: 'korea', city_id: 'seoul', name: '德壽宮石牆路', name_en: 'Deoksugung Stonewall Walkway', type: 'attraction', description: '浪漫散步道' },
  { country_id: 'korea', city_id: 'seoul', name: '戰爭紀念館', name_en: 'War Memorial of Korea', type: 'museum', description: '韓戰歷史，軍事展示' },
  { country_id: 'korea', city_id: 'seoul', name: '國立中央博物館', name_en: 'National Museum of Korea', type: 'museum', description: '韓國最大博物館' },
  { country_id: 'korea', city_id: 'seoul', name: '駱山公園', name_en: 'Naksan Park', type: 'park', description: '首爾城郭，夜景' },
  { country_id: 'korea', city_id: 'seoul', name: '漢江遊船', name_en: 'Han River Cruise', type: 'attraction', description: '首爾夜景遊船' },

  // ============================================================
  // 韓國 - 釜山
  // ============================================================
  { country_id: 'korea', city_id: 'busan', name: '海雲台海灘', name_en: 'Haeundae Beach', type: 'beach', description: '韓國最著名海灘' },
  { country_id: 'korea', city_id: 'busan', name: '甘川洞文化村', name_en: 'Gamcheon Culture Village', type: 'attraction', description: '韓國馬丘比丘，彩色房屋' },
  { country_id: 'korea', city_id: 'busan', name: '廣安里海灘', name_en: 'Gwangalli Beach', type: 'beach', description: '廣安大橋夜景' },
  { country_id: 'korea', city_id: 'busan', name: '太宗台', name_en: 'Taejongdae', type: 'attraction', description: '海蝕崖，燈塔' },
  { country_id: 'korea', city_id: 'busan', name: '海東龍宮寺', name_en: 'Haedong Yonggungsa', type: 'temple', description: '海邊寺廟，日出名所' },
  { country_id: 'korea', city_id: 'busan', name: '札嘎其市場', name_en: 'Jagalchi Market', type: 'market', description: '韓國最大海鮮市場' },
  { country_id: 'korea', city_id: 'busan', name: '西面', name_en: 'Seomyeon', type: 'shopping', description: '釜山最熱鬧商圈' },
  { country_id: 'korea', city_id: 'busan', name: '南浦洞', name_en: 'Nampo-dong', type: 'shopping', description: 'BIFF廣場，購物街' },
  { country_id: 'korea', city_id: 'busan', name: '松島天空步道', name_en: 'Songdo Skywalk', type: 'attraction', description: '海上玻璃步道，纜車' },
  { country_id: 'korea', city_id: 'busan', name: '梵魚寺', name_en: 'Beomeosa Temple', type: 'temple', description: '千年古寺，山中清幽' },
  { country_id: 'korea', city_id: 'busan', name: '釜山塔', name_en: 'Busan Tower', type: 'viewpoint', description: '龍頭山公園，夜景觀景' },
  { country_id: 'korea', city_id: 'busan', name: '白淺灘文化村', name_en: 'Huinnyeoul Culture Village', type: 'attraction', description: '海邊藝術村落' },
  { country_id: 'korea', city_id: 'busan', name: 'The Bay 101', name_en: 'The Bay 101', type: 'attraction', description: '海雲台夜景酒吧' },

  // ============================================================
  // 韓國 - 濟州島
  // ============================================================
  { country_id: 'korea', city_id: 'jeju', name: '城山日出峰', name_en: 'Seongsan Ilchulbong', type: 'attraction', description: '世界遺產，火山噴火口' },
  { country_id: 'korea', city_id: 'jeju', name: '漢拿山', name_en: 'Hallasan Mountain', type: 'attraction', description: '韓國最高峰，登山健行' },
  { country_id: 'korea', city_id: 'jeju', name: '牛島', name_en: 'Udo Island', type: 'beach', description: '騎單車環島，翡翠海' },
  { country_id: 'korea', city_id: 'jeju', name: '涉地可支', name_en: 'Seopjikoji', type: 'attraction', description: '韓劇拍攝地，燈塔' },
  { country_id: 'korea', city_id: 'jeju', name: '濟州泰迪熊博物館', name_en: 'Teddy Bear Museum', type: 'museum', description: '泰迪熊展覽' },
  { country_id: 'korea', city_id: 'jeju', name: '萬丈窟', name_en: 'Manjanggul Cave', type: 'attraction', description: '世界遺產，熔岩洞窟' },
  { country_id: 'korea', city_id: 'jeju', name: '天帝淵瀑布', name_en: 'Cheonjeyeon Falls', type: 'attraction', description: '三段瀑布，仙臨橋' },
  { country_id: 'korea', city_id: 'jeju', name: '正房瀑布', name_en: 'Jeongbang Falls', type: 'attraction', description: '亞洲唯一直落海瀑布' },
  { country_id: 'korea', city_id: 'jeju', name: '山君不離', name_en: 'Sangumburi Crater', type: 'attraction', description: '芒草季節美景' },
  { country_id: 'korea', city_id: 'jeju', name: '龍頭岩', name_en: 'Yongduam Rock', type: 'attraction', description: '龍頭形狀岩石' },
  { country_id: 'korea', city_id: 'jeju', name: '濟州民俗村', name_en: 'Jeju Folk Village', type: 'attraction', description: '傳統生活體驗' },
  { country_id: 'korea', city_id: 'jeju', name: '東門傳統市場', name_en: 'Dongmun Market', type: 'market', description: '濟州名產，橘子' },
  { country_id: 'korea', city_id: 'jeju', name: '神奇之路', name_en: 'Mysterious Road', type: 'attraction', description: '錯覺道路，上坡變下坡' },

  // ============================================================
  // 泰國 - 曼谷
  // ============================================================
  { country_id: 'thailand', city_id: 'bangkok', name: '大皇宮', name_en: 'Grand Palace', type: 'heritage', description: '泰國王室宮殿，金碧輝煌' },
  { country_id: 'thailand', city_id: 'bangkok', name: '玉佛寺', name_en: 'Wat Phra Kaew', type: 'temple', description: '泰國最神聖寺廟，翡翠佛' },
  { country_id: 'thailand', city_id: 'bangkok', name: '臥佛寺', name_en: 'Wat Pho', type: 'temple', description: '46公尺臥佛，泰式按摩發源地' },
  { country_id: 'thailand', city_id: 'bangkok', name: '鄭王廟', name_en: 'Wat Arun', type: 'temple', description: '黎明寺，湄南河畔地標' },
  { country_id: 'thailand', city_id: 'bangkok', name: '考山路', name_en: 'Khao San Road', type: 'attraction', description: '背包客天堂，夜生活' },
  { country_id: 'thailand', city_id: 'bangkok', name: '恰圖恰週末市集', name_en: 'Chatuchak Weekend Market', type: 'market', description: '世界最大週末市場' },
  { country_id: 'thailand', city_id: 'bangkok', name: '水上市場', name_en: 'Floating Market', type: 'market', description: '丹嫩莎朵水上市場' },
  { country_id: 'thailand', city_id: 'bangkok', name: '暹羅廣場', name_en: 'Siam Square', type: 'shopping', description: '曼谷購物中心' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'Terminal 21', name_en: 'Terminal 21', type: 'shopping', description: '機場主題購物中心' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'ICONSIAM', name_en: 'ICONSIAM', type: 'shopping', description: '河畔頂級購物中心' },
  { country_id: 'thailand', city_id: 'bangkok', name: '四面佛', name_en: 'Erawan Shrine', type: 'temple', description: '有求必應四面佛' },
  { country_id: 'thailand', city_id: 'bangkok', name: '曼谷藝術文化中心', name_en: 'BACC', type: 'museum', description: '當代藝術展覽' },
  { country_id: 'thailand', city_id: 'bangkok', name: '金山寺', name_en: 'Wat Saket', type: 'temple', description: '金山塔，曼谷全景' },
  { country_id: 'thailand', city_id: 'bangkok', name: '曼谷夜市火車市場', name_en: 'Train Night Market', type: 'market', description: '拉差達火車夜市' },
  { country_id: 'thailand', city_id: 'bangkok', name: '唐人街耀華力路', name_en: 'Chinatown Yaowarat', type: 'food', description: '曼谷唐人街美食' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'Asiatique河濱夜市', name_en: 'Asiatique', type: 'market', description: '河畔購物夜市' },
  { country_id: 'thailand', city_id: 'bangkok', name: 'Mahanakhon Skywalk', name_en: 'Mahanakhon Skywalk', type: 'viewpoint', description: '玻璃天空步道，314公尺' },
  { country_id: 'thailand', city_id: 'bangkok', name: '帕蓬夜市', name_en: 'Patpong Night Market', type: 'market', description: '觀光夜市' },
  { country_id: 'thailand', city_id: 'bangkok', name: '中央世界百貨', name_en: 'CentralWorld', type: 'shopping', description: '東南亞最大百貨' },
  { country_id: 'thailand', city_id: 'bangkok', name: '曼谷王船博物館', name_en: 'Royal Barge Museum', type: 'museum', description: '皇家船隊展示' },

  // ============================================================
  // 泰國 - 清邁
  // ============================================================
  { country_id: 'thailand', city_id: 'chiang-mai', name: '雙龍寺', name_en: 'Doi Suthep', type: 'temple', description: '清邁最神聖寺廟，素帖山' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '古城區', name_en: 'Old City', type: 'heritage', description: '蘭納王國古城' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '帕邢寺', name_en: 'Wat Phra Singh', type: 'temple', description: '最高級別寺廟' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '柴迪隆寺', name_en: 'Wat Chedi Luang', type: 'temple', description: '古城中心大佛塔' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '週日夜市', name_en: 'Sunday Walking Street', type: 'market', description: '塔佩門延伸，最大夜市' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '週六夜市', name_en: 'Saturday Night Market', type: 'market', description: '瓦萊路夜市' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '尼曼區', name_en: 'Nimmanhaemin', type: 'shopping', description: '文青咖啡街' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '大象自然公園', name_en: 'Elephant Nature Park', type: 'attraction', description: '道德大象園區' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '清邁夜間動物園', name_en: 'Chiang Mai Night Safari', type: 'attraction', description: '夜間野生動物園' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '瓦洛洛市場', name_en: 'Warorot Market', type: 'market', description: '當地人市場，傳統美食' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '蒲屏皇宮', name_en: 'Bhubing Palace', type: 'heritage', description: '皇室冬宮，玫瑰園' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '清邁藍廟', name_en: 'Blue Temple', type: 'temple', description: '藍色主題寺廟' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '銀廟', name_en: 'Silver Temple', type: 'temple', description: '全銀裝飾，女性禁入' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '茵他儂國家公園', name_en: 'Doi Inthanon', type: 'park', description: '泰國最高峰，瀑布群' },
  { country_id: 'thailand', city_id: 'chiang-mai', name: '清邁藝術文化中心', name_en: 'Chiang Mai Arts Center', type: 'museum', description: '蘭納文化展示' },

  // ============================================================
  // 泰國 - 普吉島
  // ============================================================
  { country_id: 'thailand', city_id: 'phuket', name: '芭東海灘', name_en: 'Patong Beach', type: 'beach', description: '普吉最熱鬧海灘，夜生活' },
  { country_id: 'thailand', city_id: 'phuket', name: '卡塔海灘', name_en: 'Kata Beach', type: 'beach', description: '適合衝浪，家庭友善' },
  { country_id: 'thailand', city_id: 'phuket', name: '卡倫海灘', name_en: 'Karon Beach', type: 'beach', description: '寧靜長沙灘' },
  { country_id: 'thailand', city_id: 'phuket', name: '普吉大佛', name_en: 'Big Buddha', type: 'landmark', description: '45公尺白色大佛，俯瞰全島' },
  { country_id: 'thailand', city_id: 'phuket', name: '查龍寺', name_en: 'Wat Chalong', type: 'temple', description: '普吉最重要寺廟' },
  { country_id: 'thailand', city_id: 'phuket', name: '普吉老城區', name_en: 'Phuket Old Town', type: 'heritage', description: '中葡建築，彩色街屋' },
  { country_id: 'thailand', city_id: 'phuket', name: '攀牙灣', name_en: 'Phang Nga Bay', type: 'attraction', description: '007占士邦島，石灰岩' },
  { country_id: 'thailand', city_id: 'phuket', name: '披披島', name_en: 'Phi Phi Islands', type: 'beach', description: '瑪雅灣，浮潛天堂' },
  { country_id: 'thailand', city_id: 'phuket', name: '珊瑚島', name_en: 'Coral Island', type: 'beach', description: '水上活動，香蕉船' },
  { country_id: 'thailand', city_id: 'phuket', name: '神仙半島', name_en: 'Promthep Cape', type: 'viewpoint', description: '普吉最美日落點' },
  { country_id: 'thailand', city_id: 'phuket', name: 'Fantasea主題樂園', name_en: 'Phuket Fantasea', type: 'theme_park', description: '泰國文化表演' },
  { country_id: 'thailand', city_id: 'phuket', name: '西蒙人妖秀', name_en: 'Simon Cabaret', type: 'attraction', description: '人妖歌舞表演' },
  { country_id: 'thailand', city_id: 'phuket', name: '邦拉夜市', name_en: 'Bangla Road', type: 'attraction', description: '芭東夜生活中心' },

  // ============================================================
  // 越南 - 河內
  // ============================================================
  { country_id: 'vietnam', city_id: 'hanoi', name: '還劍湖', name_en: 'Hoan Kiem Lake', type: 'attraction', description: '河內心臟，龜塔傳說' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '河內大教堂', name_en: 'St. Josephs Cathedral', type: 'heritage', description: '法式哥德建築' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '胡志明陵', name_en: 'Ho Chi Minh Mausoleum', type: 'heritage', description: '越南國父長眠處' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '文廟', name_en: 'Temple of Literature', type: 'temple', description: '越南第一大學，孔子廟' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '河內老城區36街', name_en: 'Old Quarter 36 Streets', type: 'attraction', description: '傳統商業街' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '昇龍水上木偶劇', name_en: 'Thang Long Water Puppet', type: 'attraction', description: '越南傳統藝術' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '西湖', name_en: 'West Lake', type: 'attraction', description: '河內最大湖泊' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '鎮國寺', name_en: 'Tran Quoc Pagoda', type: 'temple', description: '河內最古老佛寺' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '河內火車街', name_en: 'Train Street', type: 'attraction', description: '火車穿越民居，咖啡廳' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '河內歌劇院', name_en: 'Hanoi Opera House', type: 'heritage', description: '法式建築傑作' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '越南民族學博物館', name_en: 'Vietnam Museum of Ethnology', type: 'museum', description: '54民族文化' },
  { country_id: 'vietnam', city_id: 'hanoi', name: '河內夜市', name_en: 'Hanoi Night Market', type: 'market', description: '週末老城夜市' },

  // ============================================================
  // 越南 - 下龍灣
  // ============================================================
  { country_id: 'vietnam', city_id: 'ha-long', name: '下龍灣遊船', name_en: 'Ha Long Bay Cruise', type: 'attraction', description: '世界遺產，遊船過夜' },
  { country_id: 'vietnam', city_id: 'ha-long', name: '天堂洞', name_en: 'Thien Cung Cave', type: 'attraction', description: '最美鐘乳石洞' },
  { country_id: 'vietnam', city_id: 'ha-long', name: '驚奇洞', name_en: 'Sung Sot Cave', type: 'attraction', description: '最大石灰岩洞穴' },
  { country_id: 'vietnam', city_id: 'ha-long', name: '基托夫島', name_en: 'Ti Top Island', type: 'beach', description: '登高看下龍灣全景' },
  { country_id: 'vietnam', city_id: 'ha-long', name: '鬥雞石', name_en: 'Fighting Cock Rocks', type: 'landmark', description: '下龍灣象徵' },

  // ============================================================
  // 越南 - 峴港/會安
  // ============================================================
  { country_id: 'vietnam', city_id: 'da-nang', name: '巴拿山', name_en: 'Ba Na Hills', type: 'attraction', description: '佛手金橋，法式城堡' },
  { country_id: 'vietnam', city_id: 'da-nang', name: '美溪海灘', name_en: 'My Khe Beach', type: 'beach', description: '福布斯最美海灘' },
  { country_id: 'vietnam', city_id: 'da-nang', name: '山茶半島', name_en: 'Son Tra Peninsula', type: 'attraction', description: '靈應寺，67公尺觀音像' },
  { country_id: 'vietnam', city_id: 'da-nang', name: '龍橋', name_en: 'Dragon Bridge', type: 'landmark', description: '週末噴火噴水表演' },
  { country_id: 'vietnam', city_id: 'da-nang', name: '五行山', name_en: 'Marble Mountains', type: 'attraction', description: '五座大理石山，洞穴佛像' },
  { country_id: 'vietnam', city_id: 'hoi-an', name: '會安古鎮', name_en: 'Hoi An Ancient Town', type: 'heritage', description: '世界遺產，燈籠之城' },
  { country_id: 'vietnam', city_id: 'hoi-an', name: '日本橋', name_en: 'Japanese Bridge', type: 'heritage', description: '會安象徵，400年歷史' },
  { country_id: 'vietnam', city_id: 'hoi-an', name: '會安夜市', name_en: 'Hoi An Night Market', type: 'market', description: '河畔燈籠夜市' },
  { country_id: 'vietnam', city_id: 'hoi-an', name: '美山聖地', name_en: 'My Son Sanctuary', type: 'heritage', description: '占婆王國遺址，世界遺產' },
  { country_id: 'vietnam', city_id: 'hoi-an', name: '放水燈體驗', name_en: 'Lantern Release', type: 'attraction', description: '秋盆河放燈祈福' },

  // ============================================================
  // 越南 - 胡志明市
  // ============================================================
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '中央郵局', name_en: 'Central Post Office', type: 'heritage', description: '法式殖民建築，艾菲爾設計' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '西貢聖母院', name_en: 'Notre Dame Cathedral', type: 'heritage', description: '紅磚大教堂' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '統一宮', name_en: 'Independence Palace', type: 'heritage', description: '越戰終結地' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '戰爭遺跡博物館', name_en: 'War Remnants Museum', type: 'museum', description: '越戰歷史' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '濱城市場', name_en: 'Ben Thanh Market', type: 'market', description: '胡志明地標市場' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '古芝地道', name_en: 'Cu Chi Tunnels', type: 'heritage', description: '越戰地下隧道網' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '西貢河遊船', name_en: 'Saigon River Cruise', type: 'attraction', description: '夜遊西貢河' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '范五老街', name_en: 'Pham Ngu Lao', type: 'attraction', description: '背包客街，夜生活' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '胡志明市大劇院', name_en: 'Saigon Opera House', type: 'heritage', description: '法式劇院' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: 'Landmark 81', name_en: 'Landmark 81', type: 'landmark', description: '東南亞最高建築，461公尺' },
  { country_id: 'vietnam', city_id: 'ho-chi-minh', name: '粉紅教堂', name_en: 'Tan Dinh Church', type: 'heritage', description: '粉紅色哥德式教堂' },

  // ============================================================
  // 沙烏地阿拉伯
  // ============================================================
  { country_id: 'saudi_arabia', city_id: 'riyadh', name: '王國塔', name_en: 'Kingdom Centre Tower', type: 'landmark', description: '利雅德地標，空中天橋' },
  { country_id: 'saudi_arabia', city_id: 'riyadh', name: '馬斯瑪克堡', name_en: 'Masmak Fortress', type: 'heritage', description: '沙國統一歷史起點' },
  { country_id: 'saudi_arabia', city_id: 'riyadh', name: '國家博物館', name_en: 'National Museum', type: 'museum', description: '沙烏地歷史文化' },
  { country_id: 'saudi_arabia', city_id: 'riyadh', name: '德拉伊耶', name_en: 'Diriyah', type: 'heritage', description: '世界遺產，沙國第一王朝發源地' },
  { country_id: 'saudi_arabia', city_id: 'riyadh', name: '世界邊緣', name_en: 'Edge of the World', type: 'attraction', description: '懸崖壯麗景觀' },
  { country_id: 'saudi_arabia', city_id: 'riyadh', name: '布萊達野生動物園', name_en: 'Riyadh Zoo', type: 'attraction', description: '家庭休閒去處' },
  { country_id: 'saudi_arabia', city_id: 'jeddah', name: '吉達濱海大道', name_en: 'Jeddah Corniche', type: 'attraction', description: '紅海濱海步道' },
  { country_id: 'saudi_arabia', city_id: 'jeddah', name: '阿爾巴拉德老城', name_en: 'Al-Balad', type: 'heritage', description: '世界遺產，傳統建築群' },
  { country_id: 'saudi_arabia', city_id: 'jeddah', name: '法赫德國王噴泉', name_en: 'King Fahd Fountain', type: 'landmark', description: '世界最高噴泉，312公尺' },
  { country_id: 'saudi_arabia', city_id: 'jeddah', name: '浮動清真寺', name_en: 'Floating Mosque', type: 'temple', description: '漲潮時如浮海面' },
  { country_id: 'saudi_arabia', city_id: 'jeddah', name: '紅海購物中心', name_en: 'Red Sea Mall', type: 'shopping', description: '大型購物娛樂中心' },
  { country_id: 'saudi_arabia', city_id: 'mecca', name: '麥加大清真寺', name_en: 'Masjid al-Haram', type: 'temple', description: '伊斯蘭第一聖地，天房卡巴' },
  { country_id: 'saudi_arabia', city_id: 'mecca', name: '麥加皇家鐘塔', name_en: 'Makkah Royal Clock Tower', type: 'landmark', description: '世界最高鐘塔' },
  { country_id: 'saudi_arabia', city_id: 'medina', name: '先知清真寺', name_en: 'Al-Masjid an-Nabawi', type: 'temple', description: '伊斯蘭第二聖地，先知長眠處' },
  { country_id: 'saudi_arabia', city_id: 'medina', name: '庫巴清真寺', name_en: 'Quba Mosque', type: 'temple', description: '伊斯蘭第一座清真寺' },
  { country_id: 'saudi_arabia', city_id: 'alula', name: '艾爾奧拉', name_en: 'AlUla', type: 'heritage', description: '沙漠中的露天博物館' },
  { country_id: 'saudi_arabia', city_id: 'alula', name: '瑪甸沙勒', name_en: 'Hegra (Mada in Salih)', type: 'heritage', description: '世界遺產，納巴泰王國遺址' },
  { country_id: 'saudi_arabia', city_id: 'alula', name: '象岩', name_en: 'Elephant Rock', type: 'landmark', description: '天然大象形狀岩石' },
  { country_id: 'saudi_arabia', city_id: 'alula', name: '艾爾奧拉老城', name_en: 'AlUla Old Town', type: 'heritage', description: '800年土磚建築群' },
  { country_id: 'saudi_arabia', city_id: 'neom', name: 'NEOM未來城市', name_en: 'NEOM', type: 'attraction', description: '願景2030超級城市計畫' },
  { country_id: 'saudi_arabia', city_id: 'neom', name: 'The Line', name_en: 'The Line', type: 'attraction', description: '170公里線性零碳城市' },
  { country_id: 'saudi_arabia', city_id: 'tabuk', name: '塔布克城堡', name_en: 'Tabuk Castle', type: 'heritage', description: '奧斯曼帝國遺跡' },
  { country_id: 'saudi_arabia', city_id: 'abha', name: '阿西爾國家公園', name_en: 'Asir National Park', type: 'park', description: '沙烏地唯一山區國家公園' },
  { country_id: 'saudi_arabia', city_id: 'abha', name: '阿西爾傳統村落', name_en: 'Rijal Almaa Village', type: 'heritage', description: '彩色石屋村落' },

  // ============================================================
  // 中國其他城市補充
  // ============================================================
  { country_id: 'china', city_id: 'beijing', name: '故宮', name_en: 'Forbidden City', type: 'heritage', description: '紫禁城，明清皇宮' },
  { country_id: 'china', city_id: 'beijing', name: '長城八達嶺', name_en: 'Great Wall Badaling', type: 'heritage', description: '萬里長城最著名段' },
  { country_id: 'china', city_id: 'beijing', name: '天安門廣場', name_en: 'Tiananmen Square', type: 'landmark', description: '世界最大城市廣場' },
  { country_id: 'china', city_id: 'beijing', name: '頤和園', name_en: 'Summer Palace', type: 'heritage', description: '皇家園林' },
  { country_id: 'china', city_id: 'beijing', name: '天壇', name_en: 'Temple of Heaven', type: 'temple', description: '明清祭天場所' },
  { country_id: 'china', city_id: 'beijing', name: '圓明園', name_en: 'Old Summer Palace', type: 'heritage', description: '萬園之園遺址' },
  { country_id: 'china', city_id: 'beijing', name: '鳥巢', name_en: 'Bird Nest Stadium', type: 'landmark', description: '2008奧運主場館' },
  { country_id: 'china', city_id: 'beijing', name: '水立方', name_en: 'Water Cube', type: 'landmark', description: '奧運游泳館' },
  { country_id: 'china', city_id: 'beijing', name: '798藝術區', name_en: '798 Art Zone', type: 'attraction', description: '當代藝術聚落' },
  { country_id: 'china', city_id: 'beijing', name: '南鑼鼓巷', name_en: 'Nanluoguxiang', type: 'shopping', description: '胡同文創街' },
  { country_id: 'china', city_id: 'beijing', name: '王府井', name_en: 'Wangfujing', type: 'shopping', description: '百年商業街' },
  { country_id: 'china', city_id: 'beijing', name: '三里屯', name_en: 'Sanlitun', type: 'shopping', description: '時尚購物區' },
  { country_id: 'china', city_id: 'hangzhou', name: '西湖', name_en: 'West Lake', type: 'attraction', description: '世界遺產，人間天堂' },
  { country_id: 'china', city_id: 'hangzhou', name: '靈隱寺', name_en: 'Lingyin Temple', type: 'temple', description: '江南名剎' },
  { country_id: 'china', city_id: 'hangzhou', name: '雷峰塔', name_en: 'Leifeng Pagoda', type: 'landmark', description: '白蛇傳故事' },
  { country_id: 'china', city_id: 'hangzhou', name: '河坊街', name_en: 'Hefang Street', type: 'shopping', description: '南宋御街' },
  { country_id: 'china', city_id: 'hangzhou', name: '西溪濕地', name_en: 'Xixi Wetland', type: 'park', description: '城市濕地公園' },
  { country_id: 'china', city_id: 'suzhou', name: '拙政園', name_en: 'Humble Administrator Garden', type: 'garden', description: '中國四大名園' },
  { country_id: 'china', city_id: 'suzhou', name: '獅子林', name_en: 'Lion Grove Garden', type: 'garden', description: '太湖石假山' },
  { country_id: 'china', city_id: 'suzhou', name: '寒山寺', name_en: 'Hanshan Temple', type: 'temple', description: '楓橋夜泊' },
  { country_id: 'china', city_id: 'suzhou', name: '周莊', name_en: 'Zhouzhuang', type: 'heritage', description: '江南第一水鄉' },
  { country_id: 'china', city_id: 'suzhou', name: '平江路', name_en: 'Pingjiang Road', type: 'attraction', description: '古街水巷' },
  { country_id: 'china', city_id: 'nanjing', name: '中山陵', name_en: 'Sun Yat-sen Mausoleum', type: 'heritage', description: '國父長眠處' },
  { country_id: 'china', city_id: 'nanjing', name: '夫子廟', name_en: 'Confucius Temple', type: 'temple', description: '秦淮河畔' },
  { country_id: 'china', city_id: 'nanjing', name: '明孝陵', name_en: 'Ming Xiaoling Mausoleum', type: 'heritage', description: '朱元璋陵墓' },
  { country_id: 'china', city_id: 'nanjing', name: '南京城牆', name_en: 'Nanjing City Wall', type: 'heritage', description: '世界最長古城牆' },
  { country_id: 'china', city_id: 'guilin', name: '灕江', name_en: 'Li River', type: 'attraction', description: '桂林山水甲天下' },
  { country_id: 'china', city_id: 'guilin', name: '陽朔', name_en: 'Yangshuo', type: 'attraction', description: '遇龍河漂流' },
  { country_id: 'china', city_id: 'guilin', name: '象鼻山', name_en: 'Elephant Trunk Hill', type: 'landmark', description: '桂林城徽' },
  { country_id: 'china', city_id: 'guilin', name: '龍脊梯田', name_en: 'Longji Rice Terraces', type: 'attraction', description: '世界梯田之冠' },
  { country_id: 'china', city_id: 'guilin', name: '印象劉三姐', name_en: 'Impression Liu Sanjie', type: 'attraction', description: '張藝謀山水實景秀' },
  { country_id: 'china', city_id: 'zhangjiajie', name: '張家界國家森林公園', name_en: 'Zhangjiajie National Park', type: 'park', description: '阿凡達取景地' },
  { country_id: 'china', city_id: 'zhangjiajie', name: '天門山', name_en: 'Tianmen Mountain', type: 'attraction', description: '天門洞，玻璃棧道' },
  { country_id: 'china', city_id: 'zhangjiajie', name: '大峽谷玻璃橋', name_en: 'Zhangjiajie Glass Bridge', type: 'attraction', description: '世界最高玻璃橋' },
  { country_id: 'china', city_id: 'jiuzhaigou', name: '九寨溝', name_en: 'Jiuzhaigou Valley', type: 'park', description: '童話世界，五彩池' },
  { country_id: 'china', city_id: 'jiuzhaigou', name: '黃龍', name_en: 'Huanglong', type: 'park', description: '彩池、雪山、峽谷' },
  { country_id: 'china', city_id: 'huangshan', name: '黃山', name_en: 'Huangshan Mountain', type: 'attraction', description: '天下第一奇山' },
  { country_id: 'china', city_id: 'huangshan', name: '宏村', name_en: 'Hongcun Village', type: 'heritage', description: '世界遺產徽派古村' },
  { country_id: 'china', city_id: 'huangshan', name: '西遞', name_en: 'Xidi Village', type: 'heritage', description: '徽商古宅群' },
  { country_id: 'china', city_id: 'lijiang', name: '麗江古城', name_en: 'Lijiang Old Town', type: 'heritage', description: '世界遺產納西古城' },
  { country_id: 'china', city_id: 'lijiang', name: '玉龍雪山', name_en: 'Jade Dragon Snow Mountain', type: 'attraction', description: '納西族神山' },
  { country_id: 'china', city_id: 'lijiang', name: '束河古鎮', name_en: 'Shuhe Ancient Town', type: 'heritage', description: '茶馬古道驛站' },
  { country_id: 'china', city_id: 'kunming', name: '石林', name_en: 'Stone Forest', type: 'attraction', description: '世界遺產喀斯特奇景' },
  { country_id: 'china', city_id: 'kunming', name: '滇池', name_en: 'Dianchi Lake', type: 'attraction', description: '高原明珠' },
  { country_id: 'china', city_id: 'kunming', name: '翠湖公園', name_en: 'Green Lake Park', type: 'park', description: '紅嘴鷗冬季棲息地' },
  { country_id: 'china', city_id: 'wuhan', name: '黃鶴樓', name_en: 'Yellow Crane Tower', type: 'heritage', description: '江南三大名樓' },
  { country_id: 'china', city_id: 'wuhan', name: '東湖', name_en: 'East Lake', type: 'park', description: '中國最大城中湖' },
  { country_id: 'china', city_id: 'wuhan', name: '武漢長江大橋', name_en: 'Wuhan Yangtze River Bridge', type: 'landmark', description: '萬里長江第一橋' },
  { country_id: 'china', city_id: 'harbin', name: '冰雪大世界', name_en: 'Ice and Snow World', type: 'attraction', description: '世界最大冰雪主題樂園' },
  { country_id: 'china', city_id: 'harbin', name: '聖索菲亞教堂', name_en: 'Saint Sophia Cathedral', type: 'heritage', description: '俄羅斯東正教教堂' },
  { country_id: 'china', city_id: 'harbin', name: '中央大街', name_en: 'Central Street', type: 'shopping', description: '百年歐式建築街' },
  { country_id: 'china', city_id: 'sanya', name: '亞龍灣', name_en: 'Yalong Bay', type: 'beach', description: '天下第一灣' },
  { country_id: 'china', city_id: 'sanya', name: '天涯海角', name_en: 'Tianya Haijiao', type: 'attraction', description: '浪漫愛情聖地' },
  { country_id: 'china', city_id: 'sanya', name: '南山寺', name_en: 'Nanshan Temple', type: 'temple', description: '108公尺海上觀音' },
  { country_id: 'china', city_id: 'sanya', name: '蜈支洲島', name_en: 'Wuzhizhou Island', type: 'beach', description: '中國馬爾地夫' }
]

async function importAttractions() {
  console.log('========================================')
  console.log('  超完整景點資料庫導入')
  console.log('  總數: ' + allAttractions.length + ' 個景點')
  console.log('========================================')
  console.log('')

  let success = 0
  let skipped = 0
  let failed = 0

  for (const attr of allAttractions) {
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

  // 最終統計
  const { count } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })

  console.log('')
  console.log('資料庫總景點數: ' + count + ' 個')
}

importAttractions()
