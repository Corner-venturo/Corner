const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
);

const WORKSPACE_ID = '8ef05a74-1f87-48ab-afd3-9bfeb423935d';

// =============================================
// 韓國完整景點
// =============================================
const koreaAttractions = [
  // 釜山景點
  { name: "甘川文化村", name_en: "Gamcheon Culture Village", description: "彩色房屋山城，韓國馬丘比丘", category: "文化村", type: "attraction", tags: ["彩色", "壁畫", "打卡"], city: "釜山", country: "korea" },
  { name: "海雲台海水浴場", name_en: "Haeundae Beach", description: "釜山最著名海灘", category: "海灘", type: "attraction", tags: ["海灘", "夏季", "海鮮"], city: "釜山", country: "korea" },
  { name: "札嘎其市場", name_en: "Jagalchi Market", description: "韓國最大海鮮市場", category: "市場", type: "market", tags: ["海鮮", "市場", "生魚片"], city: "釜山", country: "korea" },
  { name: "西面商圈", name_en: "Seomyeon", description: "釜山購物娛樂中心", category: "商圈", type: "shopping", tags: ["購物", "美食", "夜生活"], city: "釜山", country: "korea" },
  { name: "南浦洞", name_en: "Nampo-dong", description: "BIFF廣場和購物街", category: "商圈", type: "shopping", tags: ["BIFF", "電影", "購物"], city: "釜山", country: "korea" },
  { name: "廣安大橋", name_en: "Gwangandaegyo Bridge", description: "釜山地標大橋，夜景著名", category: "地標", type: "attraction", tags: ["夜景", "大橋", "地標"], city: "釜山", country: "korea" },
  { name: "龍頭山公園", name_en: "Yongdusan Park", description: "釜山塔所在地", category: "公園", type: "attraction", tags: ["釜山塔", "公園", "展望"], city: "釜山", country: "korea" },
  { name: "海東龍宮寺", name_en: "Haedong Yonggungsa Temple", description: "海邊絕壁寺廟", category: "寺廟", type: "temple", tags: ["寺廟", "海景", "建築"], city: "釜山", country: "korea" },
  { name: "梵魚寺", name_en: "Beomeosa Temple", description: "千年古剎，韓國禪宗寺廟", category: "寺廟", type: "temple", tags: ["寺廟", "禪宗", "歷史"], city: "釜山", country: "korea" },
  { name: "太宗台", name_en: "Taejongdae", description: "懸崖海岸自然公園", category: "自然", type: "attraction", tags: ["懸崖", "燈塔", "海景"], city: "釜山", country: "korea" },
  { name: "影島大橋", name_en: "Yeongdo Bridge", description: "可開合的橋樑", category: "地標", type: "attraction", tags: ["橋", "開合", "歷史"], city: "釜山", country: "korea" },
  { name: "青沙浦", name_en: "Cheongsapo", description: "紅白燈塔，攝影名所", category: "海岸", type: "attraction", tags: ["燈塔", "攝影", "海景"], city: "釜山", country: "korea" },
  { name: "機張蟹市場", name_en: "Gijang Crab Market", description: "帝王蟹專門市場", category: "市場", type: "market", tags: ["帝王蟹", "海鮮", "市場"], city: "釜山", country: "korea" },
  { name: "新世界百貨Centum City", name_en: "Shinsegae Centum City", description: "世界最大百貨公司", category: "購物", type: "shopping", tags: ["購物", "世界之最", "百貨"], city: "釜山", country: "korea" },
  { name: "海雲台電影街", name_en: "Haeundae Film District", description: "電影院和餐廳集中區", category: "商圈", type: "shopping", tags: ["電影", "美食", "夜生活"], city: "釜山", country: "korea" },
  // 首爾追加景點
  { name: "北村韓屋村", name_en: "Bukchon Hanok Village", description: "傳統韓屋保存區", category: "傳統村落", type: "heritage", tags: ["韓屋", "傳統", "散步"], city: "首爾", country: "korea" },
  { name: "三清洞", name_en: "Samcheong-dong", description: "藝術畫廊和咖啡街", category: "街區", type: "shopping", tags: ["畫廊", "咖啡", "文青"], city: "首爾", country: "korea" },
  { name: "仁寺洞", name_en: "Insadong", description: "傳統文化街", category: "商圈", type: "shopping", tags: ["傳統", "工藝品", "茶館"], city: "首爾", country: "korea" },
  { name: "景福宮", name_en: "Gyeongbokgung Palace", description: "朝鮮王朝正宮", category: "宮殿", type: "heritage", tags: ["王宮", "守門將交接", "歷史"], city: "首爾", country: "korea" },
  { name: "昌德宮", name_en: "Changdeokgung Palace", description: "世界遺產，秘苑著名", category: "宮殿", type: "heritage", tags: ["世界遺產", "秘苑", "王宮"], city: "首爾", country: "korea" },
  { name: "德壽宮", name_en: "Deoksugung Palace", description: "石牆路散步著名", category: "宮殿", type: "heritage", tags: ["王宮", "石牆路", "現代建築"], city: "首爾", country: "korea" },
  { name: "弘大", name_en: "Hongdae", description: "年輕人街頭文化中心", category: "商圈", type: "shopping", tags: ["街頭表演", "購物", "夜生活"], city: "首爾", country: "korea" },
  { name: "梨泰院", name_en: "Itaewon", description: "國際化商圈", category: "商圈", type: "shopping", tags: ["異國料理", "購物", "夜生活"], city: "首爾", country: "korea" },
  { name: "江南", name_en: "Gangnam", description: "首爾高級商圈", category: "商圈", type: "shopping", tags: ["購物", "高級", "美食"], city: "首爾", country: "korea" },
  { name: "東大門設計廣場", name_en: "DDP (Dongdaemun Design Plaza)", description: "扎哈·哈迪德設計建築", category: "地標", type: "attraction", tags: ["建築", "設計", "夜景"], city: "首爾", country: "korea" },
  { name: "明洞", name_en: "Myeongdong", description: "購物和美妝天堂", category: "商圈", type: "shopping", tags: ["購物", "美妝", "美食"], city: "首爾", country: "korea" },
  { name: "南山塔", name_en: "N Seoul Tower", description: "首爾地標，愛情鎖", category: "展望", type: "attraction", tags: ["展望", "夜景", "愛情鎖"], city: "首爾", country: "korea" },
  { name: "廣藏市場", name_en: "Gwangjang Market", description: "傳統市場美食天堂", category: "市場", type: "market", tags: ["市場", "美食", "綠豆煎餅"], city: "首爾", country: "korea" },
  { name: "通仁市場", name_en: "Tongin Market", description: "古銅錢便當市場", category: "市場", type: "market", tags: ["銅錢便當", "傳統", "市場"], city: "首爾", country: "korea" },
  { name: "清溪川", name_en: "Cheonggyecheon Stream", description: "市中心人工河川", category: "公園", type: "attraction", tags: ["河川", "散步", "夜景"], city: "首爾", country: "korea" },
  { name: "汝矣島公園", name_en: "Yeouido Park", description: "漢江公園，櫻花著名", category: "公園", type: "attraction", tags: ["公園", "櫻花", "漢江"], city: "首爾", country: "korea" },
  { name: "樂天世界塔", name_en: "Lotte World Tower", description: "韓國最高建築", category: "展望", type: "attraction", tags: ["展望", "最高", "購物"], city: "首爾", country: "korea" },
  { name: "樂天世界", name_en: "Lotte World", description: "室內外主題樂園", category: "主題樂園", type: "attraction", tags: ["樂園", "室內", "遊樂"], city: "首爾", country: "korea" },
  { name: "COEX Mall", name_en: "COEX Mall", description: "亞洲最大地下購物中心", category: "購物", type: "shopping", tags: ["購物", "水族館", "圖書館"], city: "首爾", country: "korea" },
  { name: "益善洞韓屋村", name_en: "Ikseon-dong Hanok Village", description: "復古咖啡廳和餐廳", category: "街區", type: "shopping", tags: ["韓屋", "咖啡", "復古"], city: "首爾", country: "korea" },
  { name: "聖水洞", name_en: "Seongsu-dong", description: "首爾布魯克林，咖啡和手作", category: "街區", type: "shopping", tags: ["咖啡", "手作", "工業風"], city: "首爾", country: "korea" },
  { name: "延南洞", name_en: "Yeonnam-dong", description: "延南洞經理團街，文青區", category: "街區", type: "shopping", tags: ["咖啡", "文青", "美食"], city: "首爾", country: "korea" },
  { name: "望遠洞", name_en: "Mangwon-dong", description: "當地人喜愛的文青區", category: "街區", type: "shopping", tags: ["咖啡", "麵包", "社區"], city: "首爾", country: "korea" },
  { name: "戰爭紀念館", name_en: "War Memorial of Korea", description: "韓國軍事歷史博物館", category: "博物館", type: "heritage", tags: ["歷史", "軍事", "博物館"], city: "首爾", country: "korea" },
  { name: "國立中央博物館", name_en: "National Museum of Korea", description: "韓國最大博物館", category: "博物館", type: "heritage", tags: ["博物館", "歷史", "藝術"], city: "首爾", country: "korea" },
  // 濟州島追加景點
  { name: "城山日出峰", name_en: "Seongsan Ilchulbong", description: "世界自然遺產，火山口", category: "自然", type: "attraction", tags: ["世界遺產", "日出", "火山"], city: "濟州島", country: "korea" },
  { name: "漢拿山", name_en: "Hallasan Mountain", description: "韓國最高峰", category: "山", type: "attraction", tags: ["登山", "最高峰", "國家公園"], city: "濟州島", country: "korea" },
  { name: "萬丈窟", name_en: "Manjanggul Cave", description: "世界最長熔岩洞窟", category: "洞窟", type: "attraction", tags: ["洞窟", "熔岩", "世界遺產"], city: "濟州島", country: "korea" },
  { name: "牛島", name_en: "Udo Island", description: "濟州離島，海女文化", category: "離島", type: "attraction", tags: ["離島", "海女", "海景"], city: "濟州島", country: "korea" },
  { name: "涉地可支", name_en: "Seopjikoji", description: "海岸絕景，電視劇取景地", category: "海岸", type: "attraction", tags: ["海景", "取景地", "燈塔"], city: "濟州島", country: "korea" },
  { name: "正房瀑布", name_en: "Jeongbang Falls", description: "直接入海的瀑布", category: "瀑布", type: "attraction", tags: ["瀑布", "海景", "自然"], city: "濟州島", country: "korea" },
  { name: "濟州東門市場", name_en: "Dongmun Market", description: "濟州傳統市場", category: "市場", type: "market", tags: ["市場", "美食", "橘子"], city: "濟州島", country: "korea" },
  { name: "濟州黑豬一條街", name_en: "Jeju Black Pork Street", description: "濟州特產黑豬烤肉街", category: "美食街", type: "food", tags: ["黑豬", "烤肉", "美食"], city: "濟州島", country: "korea" },
  { name: "山房山", name_en: "Sanbangsan Mountain", description: "鐘形火山，山房窟寺", category: "山", type: "attraction", tags: ["火山", "寺廟", "海景"], city: "濟州島", country: "korea" },
  { name: "天帝淵瀑布", name_en: "Cheonjeyeon Falls", description: "三段瀑布群", category: "瀑布", type: "attraction", tags: ["瀑布", "橋", "自然"], city: "濟州島", country: "korea" },
  { name: "偶來小路", name_en: "Olle Trail", description: "濟州徒步路線", category: "步道", type: "attraction", tags: ["徒步", "海景", "自然"], city: "濟州島", country: "korea" },
  { name: "月汀里海邊", name_en: "Woljeongri Beach", description: "透明海水和咖啡街", category: "海灘", type: "attraction", tags: ["海灘", "咖啡", "透明"], city: "濟州島", country: "korea" },
  { name: "挾才海水浴場", name_en: "Hyeopjae Beach", description: "翡翠色海水海灘", category: "海灘", type: "attraction", tags: ["海灘", "翡翠", "夕陽"], city: "濟州島", country: "korea" },
  { name: "翰林公園", name_en: "Hallim Park", description: "亞熱帶植物園", category: "公園", type: "attraction", tags: ["植物園", "洞窟", "庭園"], city: "濟州島", country: "korea" },
  // 大邱景點
  { name: "西門市場", name_en: "Seomun Market", description: "大邱最大傳統市場", category: "市場", type: "market", tags: ["市場", "美食", "布料"], city: "大邱", country: "korea" },
  { name: "東城路", name_en: "Dongseongno", description: "大邱購物商圈", category: "商圈", type: "shopping", tags: ["購物", "美食", "年輕"], city: "大邱", country: "korea" },
  { name: "金光石街", name_en: "Kim Kwang-seok Street", description: "壁畫街，紀念歌手", category: "街區", type: "attraction", tags: ["壁畫", "音樂", "散步"], city: "大邱", country: "korea" },
  { name: "前山展望台", name_en: "Apsan Observatory", description: "大邱夜景著名", category: "展望", type: "attraction", tags: ["展望", "夜景", "纜車"], city: "大邱", country: "korea" },
  { name: "八公山", name_en: "Palgongsan Mountain", description: "大邱近郊名山", category: "山", type: "attraction", tags: ["登山", "寺廟", "自然"], city: "大邱", country: "korea" },
  { name: "桐華寺", name_en: "Donghwasa Temple", description: "八公山名寺", category: "寺廟", type: "temple", tags: ["寺廟", "大佛", "歷史"], city: "大邱", country: "korea" },
  { name: "大邱近代歷史館", name_en: "Daegu Modern History Museum", description: "日本殖民時期建築", category: "博物館", type: "heritage", tags: ["歷史", "建築", "博物館"], city: "大邱", country: "korea" },
  { name: "大邱藥令市", name_en: "Daegu Yangnyeongsi", description: "韓藥材市場", category: "市場", type: "market", tags: ["韓藥", "市場", "歷史"], city: "大邱", country: "korea" },
  { name: "E-World樂園", name_en: "E-World", description: "大邱主題樂園", category: "主題樂園", type: "attraction", tags: ["樂園", "83塔", "遊樂"], city: "大邱", country: "korea" },
  { name: "83塔", name_en: "83 Tower", description: "大邱地標塔", category: "展望", type: "attraction", tags: ["展望", "地標", "夜景"], city: "大邱", country: "korea" },
  // 慶州景點
  { name: "佛國寺", name_en: "Bulguksa Temple", description: "世界遺產，新羅時代寺廟", category: "寺廟", type: "temple", tags: ["世界遺產", "新羅", "佛教"], city: "慶州", country: "korea" },
  { name: "石窟庵", name_en: "Seokguram Grotto", description: "世界遺產，石窟佛像", category: "石窟", type: "heritage", tags: ["世界遺產", "石窟", "佛像"], city: "慶州", country: "korea" },
  { name: "雁鴨池", name_en: "Anapji Pond", description: "新羅王宮遺址", category: "遺跡", type: "heritage", tags: ["遺跡", "夜景", "新羅"], city: "慶州", country: "korea" },
  { name: "天馬塚", name_en: "Cheonmachong", description: "新羅王陵", category: "古墳", type: "heritage", tags: ["古墳", "新羅", "歷史"], city: "慶州", country: "korea" },
  { name: "瞻星台", name_en: "Cheomseongdae", description: "東亞最古老天文台", category: "遺跡", type: "heritage", tags: ["天文台", "新羅", "世界遺產"], city: "慶州", country: "korea" },
  { name: "國立慶州博物館", name_en: "Gyeongju National Museum", description: "新羅文化寶庫", category: "博物館", type: "heritage", tags: ["博物館", "新羅", "國寶"], city: "慶州", country: "korea" },
  { name: "慶州校村韓屋村", name_en: "Gyeongju Gyochon Hanok Village", description: "傳統韓屋體驗", category: "傳統村落", type: "heritage", tags: ["韓屋", "傳統", "體驗"], city: "慶州", country: "korea" },
  { name: "良洞民俗村", name_en: "Yangdong Folk Village", description: "世界遺產，傳統村落", category: "傳統村落", type: "heritage", tags: ["世界遺產", "民俗村", "傳統"], city: "慶州", country: "korea" },
];

// =============================================
// 東南亞景點
// =============================================
const southeastAsiaAttractions = [
  // 馬來西亞 - 吉隆坡
  { name: "雙子塔", name_en: "Petronas Twin Towers", description: "世界最高雙塔，吉隆坡地標", category: "地標", type: "attraction", tags: ["地標", "最高", "購物"], city: "吉隆坡", country: "malaysia" },
  { name: "茨廠街", name_en: "Petaling Street", description: "吉隆坡唐人街", category: "商圈", type: "shopping", tags: ["唐人街", "美食", "購物"], city: "吉隆坡", country: "malaysia" },
  { name: "黑風洞", name_en: "Batu Caves", description: "印度教聖地，272階彩虹階梯", category: "寺廟", type: "temple", tags: ["印度教", "洞窟", "彩虹階梯"], city: "吉隆坡", country: "malaysia" },
  { name: "吉隆坡塔", name_en: "Menara KL", description: "通訊塔展望台", category: "展望", type: "attraction", tags: ["展望", "夜景", "塔"], city: "吉隆坡", country: "malaysia" },
  { name: "亞羅街夜市", name_en: "Jalan Alor", description: "露天美食街", category: "美食街", type: "food", tags: ["夜市", "美食", "在地"], city: "吉隆坡", country: "malaysia" },
  { name: "獨立廣場", name_en: "Merdeka Square", description: "馬來西亞獨立宣言地", category: "廣場", type: "heritage", tags: ["歷史", "廣場", "建築"], city: "吉隆坡", country: "malaysia" },
  { name: "中央藝術坊", name_en: "Central Market", description: "傳統工藝品購物中心", category: "購物", type: "shopping", tags: ["工藝品", "購物", "文化"], city: "吉隆坡", country: "malaysia" },
  { name: "國家清真寺", name_en: "Masjid Negara", description: "馬來西亞國家清真寺", category: "清真寺", type: "temple", tags: ["清真寺", "建築", "宗教"], city: "吉隆坡", country: "malaysia" },
  { name: "武吉免登", name_en: "Bukit Bintang", description: "購物娛樂區", category: "商圈", type: "shopping", tags: ["購物", "娛樂", "夜生活"], city: "吉隆坡", country: "malaysia" },
  { name: "吉隆坡鳥園", name_en: "KL Bird Park", description: "世界最大開放式鳥園", category: "動物園", type: "attraction", tags: ["鳥類", "自然", "親子"], city: "吉隆坡", country: "malaysia" },
  // 馬來西亞 - 檳城
  { name: "喬治市壁畫", name_en: "George Town Street Art", description: "城市壁畫藝術", category: "街區", type: "attraction", tags: ["壁畫", "藝術", "打卡"], city: "檳城", country: "malaysia" },
  { name: "極樂寺", name_en: "Kek Lok Si Temple", description: "東南亞最大佛寺", category: "寺廟", type: "temple", tags: ["佛寺", "觀音", "建築"], city: "檳城", country: "malaysia" },
  { name: "升旗山", name_en: "Penang Hill", description: "纜車觀景，涼爽山頂", category: "山", type: "attraction", tags: ["纜車", "展望", "涼爽"], city: "檳城", country: "malaysia" },
  { name: "姓氏橋", name_en: "Clan Jetties", description: "水上人家，華人聚落", category: "文化遺產", type: "heritage", tags: ["水上", "華人", "歷史"], city: "檳城", country: "malaysia" },
  { name: "娘惹博物館", name_en: "Pinang Peranakan Mansion", description: "峇峇娘惹文化", category: "博物館", type: "heritage", tags: ["娘惹", "博物館", "文化"], city: "檳城", country: "malaysia" },
  { name: "汕頭街", name_en: "Chulia Street", description: "背包客街區和美食", category: "街區", type: "food", tags: ["背包客", "美食", "夜生活"], city: "檳城", country: "malaysia" },
  { name: "檳城叻沙", name_en: "Penang Laksa", description: "檳城代表美食", category: "美食", type: "food", tags: ["叻沙", "酸辣", "特色"], city: "檳城", country: "malaysia" },
  { name: "愛情巷", name_en: "Love Lane", description: "文青咖啡廳街", category: "街區", type: "shopping", tags: ["咖啡", "文青", "住宿"], city: "檳城", country: "malaysia" },
  // 印尼 - 峇里島
  { name: "海神廟", name_en: "Tanah Lot Temple", description: "海上神廟，夕陽名所", category: "寺廟", type: "temple", tags: ["神廟", "夕陽", "海景"], city: "峇里島", country: "indonesia" },
  { name: "烏布皇宮", name_en: "Ubud Palace", description: "烏布文化中心", category: "宮殿", type: "heritage", tags: ["王宮", "舞蹈", "文化"], city: "峇里島", country: "indonesia" },
  { name: "烏布市場", name_en: "Ubud Market", description: "傳統工藝品市場", category: "市場", type: "market", tags: ["市場", "工藝品", "購物"], city: "峇里島", country: "indonesia" },
  { name: "聖泉寺", name_en: "Tirta Empul", description: "聖水沐浴淨化寺廟", category: "寺廟", type: "temple", tags: ["聖泉", "淨化", "宗教"], city: "峇里島", country: "indonesia" },
  { name: "烏魯瓦圖斷崖廟", name_en: "Uluwatu Temple", description: "斷崖上的海神廟", category: "寺廟", type: "temple", tags: ["斷崖", "夕陽", "凱恰克舞"], city: "峇里島", country: "indonesia" },
  { name: "德格拉朗梯田", name_en: "Tegallalang Rice Terrace", description: "著名梯田景觀", category: "自然", type: "attraction", tags: ["梯田", "稻田", "自然"], city: "峇里島", country: "indonesia" },
  { name: "象窟", name_en: "Goa Gajah", description: "千年佛教石窟", category: "遺跡", type: "heritage", tags: ["石窟", "佛教", "歷史"], city: "峇里島", country: "indonesia" },
  { name: "水之宮殿", name_en: "Tirta Gangga", description: "皇室水宮花園", category: "庭園", type: "attraction", tags: ["水宮", "花園", "皇室"], city: "峇里島", country: "indonesia" },
  { name: "金巴蘭海灘", name_en: "Jimbaran Beach", description: "海鮮燒烤夕陽名所", category: "海灘", type: "attraction", tags: ["海灘", "海鮮", "夕陽"], city: "峇里島", country: "indonesia" },
  { name: "庫塔海灘", name_en: "Kuta Beach", description: "衝浪和夜生活", category: "海灘", type: "attraction", tags: ["海灘", "衝浪", "夜生活"], city: "峇里島", country: "indonesia" },
  { name: "水明漾", name_en: "Seminyak", description: "高級度假區", category: "度假區", type: "attraction", tags: ["度假", "購物", "餐廳"], city: "峇里島", country: "indonesia" },
  { name: "烏布猴林", name_en: "Sacred Monkey Forest", description: "神聖猴子保護區", category: "自然", type: "attraction", tags: ["猴子", "森林", "神廟"], city: "峇里島", country: "indonesia" },
  { name: "巴杜爾火山", name_en: "Mount Batur", description: "日出登山聖地", category: "火山", type: "attraction", tags: ["火山", "日出", "登山"], city: "峇里島", country: "indonesia" },
  { name: "阿貢火山", name_en: "Mount Agung", description: "峇里島最高峰", category: "火山", type: "attraction", tags: ["火山", "最高峰", "登山"], city: "峇里島", country: "indonesia" },
  { name: "百沙基母廟", name_en: "Pura Besakih", description: "峇里島最神聖寺廟", category: "寺廟", type: "temple", tags: ["母廟", "神聖", "建築群"], city: "峇里島", country: "indonesia" },
  // 菲律賓
  { name: "長灘島白沙灘", name_en: "White Beach Boracay", description: "世界最美白沙灘", category: "海灘", type: "attraction", tags: ["白沙", "海灘", "夕陽"], city: "長灘島", country: "philippines" },
  { name: "D'Mall", name_en: "D'Mall Boracay", description: "長灘島購物中心", category: "購物", type: "shopping", tags: ["購物", "餐廳", "夜生活"], city: "長灘島", country: "philippines" },
  { name: "普卡海灘", name_en: "Puka Beach", description: "貝殼沙灘", category: "海灘", type: "attraction", tags: ["海灘", "貝殼", "安靜"], city: "長灘島", country: "philippines" },
  { name: "西堤區", name_en: "Station 1, 2, 3", description: "長灘島各區域", category: "區域", type: "attraction", tags: ["海灘", "住宿", "分區"], city: "長灘島", country: "philippines" },
  { name: "愛妮島", name_en: "El Nido", description: "巴拉望秘境海島", category: "島嶼", type: "attraction", tags: ["島嶼", "潛水", "秘境"], city: "巴拉望", country: "philippines" },
  { name: "科隆島", name_en: "Coron", description: "沉船潛水勝地", category: "島嶼", type: "attraction", tags: ["潛水", "沉船", "湖泊"], city: "巴拉望", country: "philippines" },
  { name: "公主港地下河", name_en: "Puerto Princesa Underground River", description: "世界自然遺產", category: "自然", type: "heritage", tags: ["世界遺產", "地下河", "鐘乳石"], city: "巴拉望", country: "philippines" },
  { name: "宿霧鯨鯊", name_en: "Oslob Whale Sharks", description: "鯨鯊共游體驗", category: "海洋活動", type: "attraction", tags: ["鯨鯊", "潛水", "體驗"], city: "宿務", country: "philippines" },
  { name: "卡瓦山瀑布", name_en: "Kawasan Falls", description: "藍綠色瀑布秘境", category: "瀑布", type: "attraction", tags: ["瀑布", "溯溪", "自然"], city: "宿務", country: "philippines" },
  { name: "聖嬰大教堂", name_en: "Basilica del Santo Nino", description: "菲律賓最古老教堂", category: "教堂", type: "heritage", tags: ["教堂", "歷史", "宗教"], city: "宿務", country: "philippines" },
  { name: "麥哲倫十字架", name_en: "Magellan's Cross", description: "1521年麥哲倫立下的十字架", category: "歷史遺跡", type: "heritage", tags: ["歷史", "十字架", "麥哲倫"], city: "宿務", country: "philippines" },
  { name: "巧克力山", name_en: "Chocolate Hills", description: "1200座圓錐形山丘", category: "自然", type: "attraction", tags: ["山丘", "自然", "奇景"], city: "薄荷島", country: "philippines" },
  { name: "眼鏡猴保護區", name_en: "Tarsier Sanctuary", description: "世界最小靈長類", category: "保護區", type: "attraction", tags: ["眼鏡猴", "動物", "保育"], city: "薄荷島", country: "philippines" },
  { name: "馬尼拉大教堂", name_en: "Manila Cathedral", description: "菲律賓首都教堂", category: "教堂", type: "heritage", tags: ["教堂", "建築", "歷史"], city: "馬尼拉", country: "philippines" },
  { name: "聖奧古斯丁教堂", name_en: "San Agustin Church", description: "世界遺產巴洛克教堂", category: "教堂", type: "heritage", tags: ["世界遺產", "巴洛克", "教堂"], city: "馬尼拉", country: "philippines" },
  { name: "王城區", name_en: "Intramuros", description: "西班牙殖民時期古城區", category: "歷史區", type: "heritage", tags: ["古城", "歷史", "殖民"], city: "馬尼拉", country: "philippines" },
];

async function main() {
  // 先取得城市ID映射
  const { data: cities, error: citiesError } = await supabase.from('cities').select('id, name');
  if (citiesError || !cities) {
    console.error('無法取得城市資料:', citiesError);
    return;
  }
  const cityIdMap = {};
  cities.forEach(c => {
    cityIdMap[c.name] = c.id;
  });

  const allAttractions = [...koreaAttractions, ...southeastAsiaAttractions];
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

  // 取得總數
  const { count } = await supabase.from('attractions').select('*', { count: 'exact', head: true });
  console.log(`新增: ${added} 筆, 跳過: ${skipped} 筆`);
  console.log(`目前總數: ${count}`);
}

main().catch(console.error);
