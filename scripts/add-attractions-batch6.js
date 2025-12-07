const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
);

const WORKSPACE_ID = '8ef05a74-1f87-48ab-afd3-9bfeb423935d';

// =============================================
// 日本 - 東京完整景點
// =============================================
const tokyoAttractions = [
  { name: "淺草寺", name_en: "Senso-ji Temple", description: "東京最古老寺廟，雷門著名", category: "寺廟", type: "temple", tags: ["寺廟", "雷門", "仲見世"], city: "東京", country: "japan" },
  { name: "雷門", name_en: "Kaminarimon Gate", description: "淺草寺入口巨大燈籠", category: "地標", type: "temple", tags: ["燈籠", "地標", "淺草"], city: "東京", country: "japan" },
  { name: "仲見世通", name_en: "Nakamise Street", description: "淺草寺參道商店街", category: "商店街", type: "shopping", tags: ["購物", "美食", "伴手禮"], city: "東京", country: "japan" },
  { name: "晴空塔", name_en: "Tokyo Skytree", description: "世界最高自立式電波塔", category: "展望", type: "attraction", tags: ["展望", "最高", "購物"], city: "東京", country: "japan" },
  { name: "東京鐵塔", name_en: "Tokyo Tower", description: "東京經典地標", category: "展望", type: "attraction", tags: ["展望", "夜景", "經典"], city: "東京", country: "japan" },
  { name: "澀谷十字路口", name_en: "Shibuya Crossing", description: "世界最繁忙十字路口", category: "地標", type: "attraction", tags: ["十字路口", "都市", "購物"], city: "東京", country: "japan" },
  { name: "忠犬八公像", name_en: "Hachiko Statue", description: "澀谷站前著名狗狗銅像", category: "地標", type: "attraction", tags: ["銅像", "故事", "約會"], city: "東京", country: "japan" },
  { name: "新宿", name_en: "Shinjuku", description: "東京最繁華商圈", category: "商圈", type: "shopping", tags: ["購物", "娛樂", "夜生活"], city: "東京", country: "japan" },
  { name: "新宿御苑", name_en: "Shinjuku Gyoen", description: "都心大型公園，櫻花名所", category: "公園", type: "attraction", tags: ["公園", "櫻花", "庭園"], city: "東京", country: "japan" },
  { name: "明治神宮", name_en: "Meiji Shrine", description: "東京最著名神社", category: "神社", type: "temple", tags: ["神社", "森林", "參拜"], city: "東京", country: "japan" },
  { name: "原宿", name_en: "Harajuku", description: "年輕流行文化中心", category: "商圈", type: "shopping", tags: ["流行", "年輕", "潮流"], city: "東京", country: "japan" },
  { name: "竹下通", name_en: "Takeshita Street", description: "原宿潮流購物街", category: "街道", type: "shopping", tags: ["潮流", "購物", "年輕"], city: "東京", country: "japan" },
  { name: "表參道", name_en: "Omotesando", description: "名牌精品大道", category: "街道", type: "shopping", tags: ["名牌", "購物", "建築"], city: "東京", country: "japan" },
  { name: "銀座", name_en: "Ginza", description: "東京高級購物區", category: "商圈", type: "shopping", tags: ["高級", "購物", "百貨"], city: "東京", country: "japan" },
  { name: "秋葉原", name_en: "Akihabara", description: "電器與動漫聖地", category: "商圈", type: "shopping", tags: ["電器", "動漫", "御宅"], city: "東京", country: "japan" },
  { name: "上野公園", name_en: "Ueno Park", description: "博物館和動物園所在", category: "公園", type: "attraction", tags: ["公園", "博物館", "動物園"], city: "東京", country: "japan" },
  { name: "上野動物園", name_en: "Ueno Zoo", description: "日本最古老動物園", category: "動物園", type: "attraction", tags: ["動物園", "熊貓", "親子"], city: "東京", country: "japan" },
  { name: "阿美橫丁", name_en: "Ameyoko", description: "上野傳統市場", category: "市場", type: "market", tags: ["市場", "購物", "美食"], city: "東京", country: "japan" },
  { name: "東京車站", name_en: "Tokyo Station", description: "紅磚歷史建築車站", category: "車站", type: "heritage", tags: ["車站", "建築", "購物"], city: "東京", country: "japan" },
  { name: "皇居", name_en: "Imperial Palace", description: "日本天皇居所", category: "宮殿", type: "heritage", tags: ["皇居", "皇室", "庭園"], city: "東京", country: "japan" },
  { name: "二重橋", name_en: "Nijubashi Bridge", description: "皇居前著名橋樑", category: "地標", type: "heritage", tags: ["皇居", "橋", "攝影"], city: "東京", country: "japan" },
  { name: "東京國立博物館", name_en: "Tokyo National Museum", description: "日本最大博物館", category: "博物館", type: "heritage", tags: ["博物館", "藝術", "歷史"], city: "東京", country: "japan" },
  { name: "國立西洋美術館", name_en: "National Museum of Western Art", description: "世界遺產，柯比意設計", category: "博物館", type: "heritage", tags: ["美術館", "世界遺產", "建築"], city: "東京", country: "japan" },
  { name: "六本木", name_en: "Roppongi", description: "夜生活和藝術區", category: "商圈", type: "shopping", tags: ["夜生活", "藝術", "展望"], city: "東京", country: "japan" },
  { name: "六本木Hills", name_en: "Roppongi Hills", description: "複合商業設施", category: "購物", type: "shopping", tags: ["購物", "展望", "藝術"], city: "東京", country: "japan" },
  { name: "東京中城", name_en: "Tokyo Midtown", description: "六本木現代商業區", category: "購物", type: "shopping", tags: ["購物", "設計", "美術館"], city: "東京", country: "japan" },
  { name: "森美術館", name_en: "Mori Art Museum", description: "六本木Hills頂樓美術館", category: "美術館", type: "heritage", tags: ["美術館", "現代藝術", "展望"], city: "東京", country: "japan" },
  { name: "台場", name_en: "Odaiba", description: "臨海娛樂區", category: "商圈", type: "attraction", tags: ["購物", "娛樂", "海景"], city: "東京", country: "japan" },
  { name: "自由女神像", name_en: "Statue of Liberty (Tokyo)", description: "台場自由女神複製像", category: "地標", type: "attraction", tags: ["自由女神", "台場", "攝影"], city: "東京", country: "japan" },
  { name: "彩虹大橋", name_en: "Rainbow Bridge", description: "東京灣著名大橋", category: "橋", type: "attraction", tags: ["橋", "夜景", "台場"], city: "東京", country: "japan" },
  { name: "teamLab Borderless", name_en: "teamLab Borderless", description: "數位藝術博物館", category: "美術館", type: "attraction", tags: ["數位藝術", "互動", "網紅"], city: "東京", country: "japan" },
  { name: "豐洲市場", name_en: "Toyosu Market", description: "築地移轉新市場", category: "市場", type: "market", tags: ["市場", "海鮮", "壽司"], city: "東京", country: "japan" },
  { name: "築地場外市場", name_en: "Tsukiji Outer Market", description: "美食和食材市場", category: "市場", type: "market", tags: ["市場", "美食", "海鮮"], city: "東京", country: "japan" },
  { name: "池袋", name_en: "Ikebukuro", description: "東京副都心購物區", category: "商圈", type: "shopping", tags: ["購物", "動漫", "百貨"], city: "東京", country: "japan" },
  { name: "Sunshine City", name_en: "Sunshine City", description: "池袋大型商業設施", category: "購物", type: "shopping", tags: ["購物", "水族館", "展望"], city: "東京", country: "japan" },
  { name: "三鷹吉卜力美術館", name_en: "Ghibli Museum", description: "宮崎駿動畫美術館", category: "美術館", type: "attraction", tags: ["吉卜力", "動畫", "龍貓"], city: "東京", country: "japan" },
  { name: "下北澤", name_en: "Shimokitazawa", description: "文青和古著天堂", category: "街區", type: "shopping", tags: ["古著", "咖啡", "文青"], city: "東京", country: "japan" },
  { name: "代官山", name_en: "Daikanyama", description: "時尚潮流區", category: "街區", type: "shopping", tags: ["時尚", "咖啡", "蔦屋書店"], city: "東京", country: "japan" },
  { name: "蔦屋書店", name_en: "Tsutaya Books", description: "代官山設計書店", category: "書店", type: "shopping", tags: ["書店", "設計", "咖啡"], city: "東京", country: "japan" },
  { name: "中目黑", name_en: "Nakameguro", description: "櫻花名所和時尚區", category: "街區", type: "attraction", tags: ["櫻花", "河川", "咖啡"], city: "東京", country: "japan" },
  { name: "目黑川", name_en: "Meguro River", description: "東京櫻花名所", category: "河川", type: "attraction", tags: ["櫻花", "散步", "夜景"], city: "東京", country: "japan" },
  { name: "自由之丘", name_en: "Jiyugaoka", description: "歐風街道甜點天堂", category: "街區", type: "shopping", tags: ["甜點", "歐風", "雜貨"], city: "東京", country: "japan" },
  { name: "吉祥寺", name_en: "Kichijoji", description: "井之頭公園和商店街", category: "街區", type: "shopping", tags: ["公園", "購物", "居住"], city: "東京", country: "japan" },
  { name: "井之頭恩賜公園", name_en: "Inokashira Park", description: "吉祥寺人氣公園", category: "公園", type: "attraction", tags: ["公園", "湖泊", "櫻花"], city: "東京", country: "japan" },
  { name: "高尾山", name_en: "Mount Takao", description: "東京近郊登山名所", category: "山", type: "attraction", tags: ["登山", "纜車", "自然"], city: "東京", country: "japan" },
  { name: "東京迪士尼樂園", name_en: "Tokyo Disneyland", description: "亞洲第一迪士尼", category: "主題樂園", type: "attraction", tags: ["迪士尼", "樂園", "親子"], city: "千葉", country: "japan" },
  { name: "東京迪士尼海洋", name_en: "Tokyo DisneySea", description: "世界唯一海洋主題迪士尼", category: "主題樂園", type: "attraction", tags: ["迪士尼", "海洋", "獨特"], city: "千葉", country: "japan" },
  { name: "惠比壽花園廣場", name_en: "Yebisu Garden Place", description: "時尚商業區", category: "商圈", type: "shopping", tags: ["購物", "餐廳", "聖誕"], city: "東京", country: "japan" },
  { name: "惠比壽啤酒紀念館", name_en: "Museum of Yebisu Beer", description: "惠比壽啤酒歷史", category: "博物館", type: "attraction", tags: ["啤酒", "博物館", "試飲"], city: "東京", country: "japan" },
  { name: "增上寺", name_en: "Zojo-ji Temple", description: "東京鐵塔旁寺廟", category: "寺廟", type: "temple", tags: ["寺廟", "東京鐵塔", "德川"], city: "東京", country: "japan" },
  { name: "芝公園", name_en: "Shiba Park", description: "東京鐵塔最佳拍攝點", category: "公園", type: "attraction", tags: ["公園", "東京鐵塔", "攝影"], city: "東京", country: "japan" },
  { name: "日比谷公園", name_en: "Hibiya Park", description: "皇居附近大型公園", category: "公園", type: "attraction", tags: ["公園", "噴泉", "玫瑰"], city: "東京", country: "japan" },
  { name: "代代木公園", name_en: "Yoyogi Park", description: "東京最大公園之一", category: "公園", type: "attraction", tags: ["公園", "活動", "野餐"], city: "東京", country: "japan" },
  { name: "神樂坂", name_en: "Kagurazaka", description: "法式風情歷史街區", category: "街區", type: "shopping", tags: ["法式", "石板路", "隱藏店"], city: "東京", country: "japan" },
  { name: "根津神社", name_en: "Nezu Shrine", description: "杜鵑花著名神社", category: "神社", type: "temple", tags: ["神社", "杜鵑花", "鳥居"], city: "東京", country: "japan" },
  { name: "谷根千", name_en: "Yanesen Area", description: "谷中、根津、千駄木下町區", category: "街區", type: "attraction", tags: ["下町", "貓", "懷舊"], city: "東京", country: "japan" },
  { name: "谷中銀座", name_en: "Yanaka Ginza", description: "下町商店街", category: "商店街", type: "shopping", tags: ["下町", "商店街", "貓"], city: "東京", country: "japan" },
  { name: "東京巨蛋", name_en: "Tokyo Dome", description: "棒球場和遊樂園", category: "體育館", type: "attraction", tags: ["棒球", "演唱會", "遊樂園"], city: "東京", country: "japan" },
  { name: "東京巨蛋城", name_en: "Tokyo Dome City", description: "娛樂複合設施", category: "娛樂", type: "attraction", tags: ["遊樂園", "購物", "溫泉"], city: "東京", country: "japan" },
  { name: "東急Plaza表參道", name_en: "Tokyu Plaza Omotesando", description: "屋頂花園購物中心", category: "購物", type: "shopping", tags: ["購物", "建築", "屋頂"], city: "東京", country: "japan" },
  { name: "歌舞伎町", name_en: "Kabukicho", description: "新宿娛樂街", category: "娛樂", type: "attraction", tags: ["夜生活", "娛樂", "歌舞伎"], city: "東京", country: "japan" },
  { name: "黃金街", name_en: "Golden Gai", description: "新宿懷舊酒吧街", category: "酒吧街", type: "food", tags: ["酒吧", "懷舊", "夜生活"], city: "東京", country: "japan" },
  { name: "思い出橫丁", name_en: "Omoide Yokocho", description: "新宿居酒屋小巷", category: "美食街", type: "food", tags: ["居酒屋", "串燒", "昭和"], city: "東京", country: "japan" },
  { name: "兩國國技館", name_en: "Ryogoku Kokugikan", description: "相撲比賽場館", category: "體育館", type: "attraction", tags: ["相撲", "傳統", "體育"], city: "東京", country: "japan" },
  { name: "江戶東京博物館", name_en: "Edo-Tokyo Museum", description: "江戶歷史博物館", category: "博物館", type: "heritage", tags: ["博物館", "江戶", "歷史"], city: "東京", country: "japan" },
  { name: "月島文字燒街", name_en: "Monjayaki Street", description: "月島文字燒專門街", category: "美食街", type: "food", tags: ["文字燒", "美食", "下町"], city: "東京", country: "japan" },
  { name: "墨田水族館", name_en: "Sumida Aquarium", description: "晴空塔內水族館", category: "水族館", type: "attraction", tags: ["水族館", "晴空塔", "企鵝"], city: "東京", country: "japan" },
  { name: "隅田公園", name_en: "Sumida Park", description: "隅田川沿岸櫻花名所", category: "公園", type: "attraction", tags: ["櫻花", "河川", "晴空塔"], city: "東京", country: "japan" },
];

// =============================================
// 日本 - 名古屋與中部地區
// =============================================
const chubuAttractions = [
  { name: "名古屋城", name_en: "Nagoya Castle", description: "德川家康築城，金鯱著名", category: "城堡", type: "heritage", tags: ["城堡", "金鯱", "德川"], city: "名古屋", country: "japan" },
  { name: "熱田神宮", name_en: "Atsuta Shrine", description: "供奉草薙劍", category: "神社", type: "temple", tags: ["神社", "三神器", "參拜"], city: "名古屋", country: "japan" },
  { name: "大須商店街", name_en: "Osu Shopping District", description: "名古屋下町商店街", category: "商店街", type: "shopping", tags: ["商店街", "美食", "二手"], city: "名古屋", country: "japan" },
  { name: "榮", name_en: "Sakae", description: "名古屋繁華商圈", category: "商圈", type: "shopping", tags: ["購物", "百貨", "夜生活"], city: "名古屋", country: "japan" },
  { name: "綠洲21", name_en: "Oasis 21", description: "未來感玻璃建築", category: "購物", type: "shopping", tags: ["建築", "購物", "夜景"], city: "名古屋", country: "japan" },
  { name: "名古屋港水族館", name_en: "Port of Nagoya Aquarium", description: "日本最大水族館之一", category: "水族館", type: "attraction", tags: ["水族館", "虎鯨", "海豚"], city: "名古屋", country: "japan" },
  { name: "LEGOLAND Japan", name_en: "LEGOLAND Japan", description: "日本樂高樂園", category: "主題樂園", type: "attraction", tags: ["樂高", "樂園", "親子"], city: "名古屋", country: "japan" },
  { name: "德川園", name_en: "Tokugawa Garden", description: "大名庭園", category: "庭園", type: "attraction", tags: ["庭園", "德川", "日式"], city: "名古屋", country: "japan" },
  { name: "白川鄉", name_en: "Shirakawa-go", description: "世界遺產合掌村", category: "世界遺產", type: "heritage", tags: ["世界遺產", "合掌造", "雪景"], city: "白川鄉", country: "japan" },
  { name: "高山老街", name_en: "Takayama Old Town", description: "飛驒小京都", category: "老街", type: "heritage", tags: ["老街", "飛驒", "古民家"], city: "高山", country: "japan" },
  { name: "飛驒牛", name_en: "Hida Beef", description: "高山著名和牛", category: "美食", type: "food", tags: ["和牛", "美食", "名物"], city: "高山", country: "japan" },
  { name: "高山陣屋", name_en: "Takayama Jinya", description: "江戶時代官廳", category: "歷史建築", type: "heritage", tags: ["歷史", "官廳", "江戶"], city: "高山", country: "japan" },
  { name: "宮川朝市", name_en: "Miyagawa Morning Market", description: "高山著名朝市", category: "市場", type: "market", tags: ["朝市", "蔬果", "手工藝"], city: "高山", country: "japan" },
  { name: "金澤21世紀美術館", name_en: "21st Century Museum of Contemporary Art", description: "圓形現代美術館", category: "美術館", type: "heritage", tags: ["美術館", "現代藝術", "泳池"], city: "金澤", country: "japan" },
  { name: "兼六園", name_en: "Kenroku-en", description: "日本三大名園", category: "庭園", type: "attraction", tags: ["三大名園", "庭園", "雪吊"], city: "金澤", country: "japan" },
  { name: "金澤城", name_en: "Kanazawa Castle", description: "加賀藩前田家居城", category: "城堡", type: "heritage", tags: ["城堡", "前田家", "石川門"], city: "金澤", country: "japan" },
  { name: "東茶屋街", name_en: "Higashi Chaya District", description: "藝妓街歷史區", category: "老街", type: "heritage", tags: ["藝妓", "老街", "金箔"], city: "金澤", country: "japan" },
  { name: "近江町市場", name_en: "Omi-cho Market", description: "金澤廚房", category: "市場", type: "market", tags: ["市場", "海鮮", "美食"], city: "金澤", country: "japan" },
  { name: "金澤金箔", name_en: "Kanazawa Gold Leaf", description: "日本金箔生產中心", category: "工藝", type: "shopping", tags: ["金箔", "工藝", "伴手禮"], city: "金澤", country: "japan" },
  { name: "上高地", name_en: "Kamikochi", description: "北阿爾卑斯山山谷", category: "自然", type: "attraction", tags: ["山岳", "健行", "河童橋"], city: "上高地", country: "japan" },
  { name: "立山黑部", name_en: "Tateyama Kurobe Alpine Route", description: "高山雪壁觀光路線", category: "自然", type: "attraction", tags: ["雪壁", "纜車", "高山"], city: "立山", country: "japan" },
  { name: "松本城", name_en: "Matsumoto Castle", description: "國寶黑城", category: "城堡", type: "heritage", tags: ["國寶", "黑城", "城堡"], city: "松本", country: "japan" },
  { name: "下呂溫泉", name_en: "Gero Onsen", description: "日本三名泉之一", category: "溫泉", type: "attraction", tags: ["溫泉", "三名泉", "泡湯"], city: "下呂", country: "japan" },
];

// =============================================
// 日本 - 沖繩與離島
// =============================================
const okinawaAttractions = [
  { name: "首里城", name_en: "Shuri Castle", description: "琉球王國宮殿遺址", category: "城堡", type: "heritage", tags: ["世界遺產", "琉球", "城堡"], city: "那霸", country: "japan" },
  { name: "國際通", name_en: "Kokusai Street", description: "那霸最熱鬧商店街", category: "街道", type: "shopping", tags: ["購物", "美食", "伴手禮"], city: "那霸", country: "japan" },
  { name: "第一牧志公設市場", name_en: "Makishi Public Market", description: "那霸海鮮市場", category: "市場", type: "market", tags: ["市場", "海鮮", "在地"], city: "那霸", country: "japan" },
  { name: "美國村", name_en: "American Village", description: "美式風格購物區", category: "購物", type: "shopping", tags: ["美式", "購物", "摩天輪"], city: "那霸", country: "japan" },
  { name: "美麗海水族館", name_en: "Okinawa Churaumi Aquarium", description: "世界最大水槽，鯨鯊", category: "水族館", type: "attraction", tags: ["水族館", "鯨鯊", "魟魚"], city: "沖繩", country: "japan" },
  { name: "萬座毛", name_en: "Manzamo", description: "象鼻岩海岸景觀", category: "自然", type: "attraction", tags: ["懸崖", "海景", "夕陽"], city: "沖繩", country: "japan" },
  { name: "古宇利島", name_en: "Kouri Island", description: "心型岩著名離島", category: "離島", type: "attraction", tags: ["離島", "心型岩", "海景"], city: "沖繩", country: "japan" },
  { name: "古宇利大橋", name_en: "Kouri Bridge", description: "連接古宇利島的長橋", category: "橋", type: "attraction", tags: ["橋", "海景", "自駕"], city: "沖繩", country: "japan" },
  { name: "瀨長島", name_en: "Senaga Island", description: "白色地中海風格商店", category: "購物", type: "shopping", tags: ["地中海", "白色", "夕陽"], city: "沖繩", country: "japan" },
  { name: "波上宮", name_en: "Naminoue Shrine", description: "沖繩最著名神社", category: "神社", type: "temple", tags: ["神社", "海景", "參拜"], city: "那霸", country: "japan" },
  { name: "殘波岬", name_en: "Cape Zanpa", description: "白色燈塔海岬", category: "自然", type: "attraction", tags: ["燈塔", "海岬", "夕陽"], city: "沖繩", country: "japan" },
  { name: "玉泉洞", name_en: "Gyokusendo Cave", description: "日本最大鐘乳石洞", category: "洞窟", type: "attraction", tags: ["鐘乳石", "洞窟", "探險"], city: "沖繩", country: "japan" },
  { name: "座喜味城跡", name_en: "Zakimi Castle Ruins", description: "世界遺產城堡遺跡", category: "遺跡", type: "heritage", tags: ["世界遺產", "城堡", "琉球"], city: "沖繩", country: "japan" },
  { name: "石垣島", name_en: "Ishigaki Island", description: "八重山群島主島", category: "離島", type: "attraction", tags: ["離島", "潛水", "珊瑚"], city: "石垣島", country: "japan" },
  { name: "川平灣", name_en: "Kabira Bay", description: "石垣島最美海灣", category: "海灣", type: "attraction", tags: ["海灣", "玻璃船", "珊瑚"], city: "石垣島", country: "japan" },
  { name: "竹富島", name_en: "Taketomi Island", description: "傳統沖繩村落", category: "離島", type: "attraction", tags: ["離島", "水牛車", "傳統"], city: "竹富島", country: "japan" },
  { name: "西表島", name_en: "Iriomote Island", description: "原始叢林和紅樹林", category: "離島", type: "attraction", tags: ["離島", "叢林", "紅樹林"], city: "西表島", country: "japan" },
  { name: "宮古島", name_en: "Miyako Island", description: "沖繩最美海灘", category: "離島", type: "attraction", tags: ["離島", "海灘", "潛水"], city: "宮古島", country: "japan" },
  { name: "與那霸前濱海灘", name_en: "Yonaha Maehama Beach", description: "日本最美海灘", category: "海灘", type: "attraction", tags: ["海灘", "白沙", "最美"], city: "宮古島", country: "japan" },
  { name: "伊良部大橋", name_en: "Irabu Bridge", description: "日本最長免費跨海大橋", category: "橋", type: "attraction", tags: ["橋", "海景", "自駕"], city: "宮古島", country: "japan" },
];

// =============================================
// 泰國更多景點
// =============================================
const thailandMoreAttractions = [
  { name: "大皇宮", name_en: "Grand Palace", description: "泰國王室宮殿", category: "宮殿", type: "heritage", tags: ["宮殿", "王室", "建築"], city: "曼谷", country: "thailand" },
  { name: "玉佛寺", name_en: "Wat Phra Kaew", description: "曼谷最神聖寺廟", category: "寺廟", type: "temple", tags: ["寺廟", "玉佛", "大皇宮"], city: "曼谷", country: "thailand" },
  { name: "臥佛寺", name_en: "Wat Pho", description: "巨大臥佛和按摩學校", category: "寺廟", type: "temple", tags: ["臥佛", "按摩", "寺廟"], city: "曼谷", country: "thailand" },
  { name: "鄭王廟", name_en: "Wat Arun", description: "黎明寺，高棉風格塔", category: "寺廟", type: "temple", tags: ["黎明寺", "河畔", "夜景"], city: "曼谷", country: "thailand" },
  { name: "考山路", name_en: "Khao San Road", description: "背包客天堂", category: "街道", type: "shopping", tags: ["背包客", "夜生活", "便宜"], city: "曼谷", country: "thailand" },
  { name: "恰圖恰週末市集", name_en: "Chatuchak Weekend Market", description: "世界最大週末市場之一", category: "市場", type: "market", tags: ["市場", "週末", "購物"], city: "曼谷", country: "thailand" },
  { name: "暹羅廣場", name_en: "Siam Square", description: "曼谷購物中心", category: "商圈", type: "shopping", tags: ["購物", "年輕", "商場"], city: "曼谷", country: "thailand" },
  { name: "Terminal 21", name_en: "Terminal 21", description: "機場主題購物中心", category: "購物", type: "shopping", tags: ["購物", "主題", "美食街"], city: "曼谷", country: "thailand" },
  { name: "Asiatique河畔夜市", name_en: "Asiatique The Riverfront", description: "河畔複合式夜市", category: "夜市", type: "shopping", tags: ["夜市", "河畔", "摩天輪"], city: "曼谷", country: "thailand" },
  { name: "拉差達火車夜市", name_en: "Train Night Market Ratchada", description: "彩色帳篷夜市", category: "夜市", type: "market", tags: ["夜市", "彩色", "網紅"], city: "曼谷", country: "thailand" },
  { name: "水門市場", name_en: "Pratunam Market", description: "服裝批發市場", category: "市場", type: "market", tags: ["市場", "服裝", "批發"], city: "曼谷", country: "thailand" },
  { name: "ICONSIAM", name_en: "ICONSIAM", description: "河畔頂級購物中心", category: "購物", type: "shopping", tags: ["購物", "高級", "河畔"], city: "曼谷", country: "thailand" },
  { name: "清邁古城", name_en: "Chiang Mai Old City", description: "護城河圍繞古城區", category: "老城", type: "heritage", tags: ["古城", "城牆", "寺廟"], city: "清邁", country: "thailand" },
  { name: "素帖寺", name_en: "Wat Phra That Doi Suthep", description: "清邁聖山金塔", category: "寺廟", type: "temple", tags: ["金塔", "聖山", "參拜"], city: "清邁", country: "thailand" },
  { name: "清邁夜間動物園", name_en: "Chiang Mai Night Safari", description: "夜間野生動物園", category: "動物園", type: "attraction", tags: ["動物園", "夜間", "safari"], city: "清邁", country: "thailand" },
  { name: "清邁週日步行街", name_en: "Sunday Walking Street", description: "塔佩門週日市集", category: "市場", type: "market", tags: ["市集", "週日", "手工藝"], city: "清邁", country: "thailand" },
  { name: "尼曼路", name_en: "Nimmanhaemin Road", description: "清邁時尚咖啡街", category: "街道", type: "shopping", tags: ["咖啡", "時尚", "購物"], city: "清邁", country: "thailand" },
  { name: "大象自然公園", name_en: "Elephant Nature Park", description: "大象保護區", category: "保護區", type: "attraction", tags: ["大象", "保育", "動物"], city: "清邁", country: "thailand" },
  { name: "白廟", name_en: "Wat Rong Khun", description: "純白雕花寺廟", category: "寺廟", type: "temple", tags: ["白色", "藝術", "獨特"], city: "清萊", country: "thailand" },
  { name: "藍廟", name_en: "Wat Rong Suea Ten", description: "藍色寺廟建築", category: "寺廟", type: "temple", tags: ["藍色", "藝術", "新建"], city: "清萊", country: "thailand" },
  { name: "芭達雅海灘", name_en: "Pattaya Beach", description: "泰國著名海濱城市", category: "海灘", type: "attraction", tags: ["海灘", "夜生活", "娛樂"], city: "芭達雅", country: "thailand" },
  { name: "Walking Street", name_en: "Walking Street", description: "芭達雅夜生活中心", category: "娛樂", type: "attraction", tags: ["夜生活", "酒吧", "娛樂"], city: "芭達雅", country: "thailand" },
  { name: "珊瑚島", name_en: "Koh Larn", description: "芭達雅離島", category: "離島", type: "attraction", tags: ["離島", "海灘", "浮潛"], city: "芭達雅", country: "thailand" },
  { name: "普吉老城", name_en: "Phuket Old Town", description: "葡式建築老城區", category: "老城", type: "heritage", tags: ["老城", "葡式", "壁畫"], city: "普吉島", country: "thailand" },
  { name: "芭東海灘", name_en: "Patong Beach", description: "普吉島最熱鬧海灘", category: "海灘", type: "attraction", tags: ["海灘", "夜生活", "購物"], city: "普吉島", country: "thailand" },
  { name: "卡塔海灘", name_en: "Kata Beach", description: "普吉島家庭海灘", category: "海灘", type: "attraction", tags: ["海灘", "家庭", "衝浪"], city: "普吉島", country: "thailand" },
  { name: "大佛", name_en: "Big Buddha Phuket", description: "普吉島巨大佛像", category: "地標", type: "temple", tags: ["大佛", "展望", "地標"], city: "普吉島", country: "thailand" },
  { name: "攀牙灣", name_en: "Phang Nga Bay", description: "007電影取景地", category: "自然", type: "attraction", tags: ["海灣", "岩石", "電影"], city: "普吉島", country: "thailand" },
  { name: "皮皮島", name_en: "Phi Phi Islands", description: "海灘電影取景地", category: "離島", type: "attraction", tags: ["離島", "海灘", "潛水"], city: "普吉島", country: "thailand" },
  { name: "蘇美島", name_en: "Koh Samui", description: "椰子島度假勝地", category: "離島", type: "attraction", tags: ["離島", "度假", "海灘"], city: "蘇美島", country: "thailand" },
];

async function main() {
  const { data: cities, error: citiesError } = await supabase.from('cities').select('id, name');
  if (citiesError || !cities) {
    console.error('無法取得城市資料:', citiesError);
    return;
  }
  const cityIdMap = {};
  cities.forEach(c => {
    cityIdMap[c.name] = c.id;
  });

  // 需要添加沖繩城市
  const newCities = [
    { id: 'okinawa', name: '沖繩', name_en: 'Okinawa', country_id: 'japan' }
  ];
  for (const city of newCities) {
    const { error } = await supabase.from('cities').insert(city);
    if (!error) {
      cityIdMap[city.name] = city.id;
      console.log('新增城市:', city.name);
    }
  }

  const allAttractions = [...tokyoAttractions, ...chubuAttractions, ...okinawaAttractions, ...thailandMoreAttractions];
  const toInsert = [];
  const missingCities = new Set();

  for (const item of allAttractions) {
    const cityId = cityIdMap[item.city];
    if (!cityId) {
      missingCities.add(item.city);
      continue;
    }
    toInsert.push({
      name: item.name,
      name_en: item.name_en,
      description: item.description,
      category: item.category,
      type: item.type,
      tags: item.tags,
      city_id: cityId,
      country_id: item.country,
      workspace_id: WORKSPACE_ID
    });
  }

  if (missingCities.size > 0) {
    console.log('找不到城市:', [...missingCities].join(', '));
  }

  console.log(`\n準備新增 ${toInsert.length} 筆資料...`);

  let added = 0;
  let skipped = 0;

  for (const item of toInsert) {
    const { error } = await supabase.from('attractions').insert(item);
    if (error) {
      if (error.code === '23505') {
        skipped++;
      } else {
        console.log('錯誤:', error.message, item.name);
      }
    } else {
      added++;
    }
  }

  const { count } = await supabase.from('attractions').select('*', { count: 'exact', head: true });
  console.log(`新增: ${added} 筆, 跳過: ${skipped} 筆`);
  console.log(`目前總數: ${count}`);
}

main().catch(console.error);
