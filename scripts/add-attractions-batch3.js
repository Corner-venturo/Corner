const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
);

// =============================================
// 日本 - 關西地區完整景點
// =============================================
const japanKansai = [
  // 京都神社寺廟
  { name: "伏見稻荷大社", name_en: "Fushimi Inari Taisha", description: "千本鳥居聞名世界，日本最著名神社之一", category: "神社", type: "temple", tags: ["神社", "鳥居", "狐狸"], city: "京都", country: "japan" },
  { name: "金閣寺", name_en: "Kinkaku-ji", description: "金箔覆蓋的禪宗寺廟，世界文化遺產", category: "寺廟", type: "temple", tags: ["世界遺產", "金閣", "庭園"], city: "京都", country: "japan" },
  { name: "銀閣寺", name_en: "Ginkaku-ji", description: "東山文化代表，枯山水庭園著稱", category: "寺廟", type: "temple", tags: ["世界遺產", "庭園", "東山"], city: "京都", country: "japan" },
  { name: "清水寺", name_en: "Kiyomizu-dera", description: "木造懸崖舞台，京都地標", category: "寺廟", type: "temple", tags: ["世界遺產", "懸崖舞台", "櫻花"], city: "京都", country: "japan" },
  { name: "嵐山竹林", name_en: "Arashiyama Bamboo Grove", description: "綿延竹林小徑，夢幻氛圍", category: "自然景觀", type: "attraction", tags: ["竹林", "散步", "嵐山"], city: "京都", country: "japan" },
  { name: "渡月橋", name_en: "Togetsukyo Bridge", description: "嵐山象徵，四季皆美", category: "地標", type: "attraction", tags: ["嵐山", "橋", "櫻花"], city: "京都", country: "japan" },
  { name: "天龍寺", name_en: "Tenryu-ji", description: "世界遺產，嵐山禪寺", category: "寺廟", type: "temple", tags: ["世界遺產", "禪寺", "庭園"], city: "京都", country: "japan" },
  { name: "東福寺", name_en: "Tofuku-ji", description: "楓葉名所，禪宗大寺", category: "寺廟", type: "temple", tags: ["楓葉", "禪宗", "庭園"], city: "京都", country: "japan" },
  { name: "南禪寺", name_en: "Nanzen-ji", description: "水路閣著名，禪宗名剎", category: "寺廟", type: "temple", tags: ["水路閣", "禪宗", "楓葉"], city: "京都", country: "japan" },
  { name: "哲學之道", name_en: "Philosopher's Path", description: "櫻花水路小徑，京都散步名所", category: "散步道", type: "attraction", tags: ["櫻花", "散步", "水路"], city: "京都", country: "japan" },
  { name: "二條城", name_en: "Nijo Castle", description: "德川幕府將軍居城，世界遺產", category: "城堡", type: "heritage", tags: ["世界遺產", "城堡", "二之丸"], city: "京都", country: "japan" },
  { name: "三十三間堂", name_en: "Sanjusangen-do", description: "千手觀音像群，日本最長木造建築", category: "寺廟", type: "temple", tags: ["佛像", "木造建築", "觀音"], city: "京都", country: "japan" },
  { name: "八坂神社", name_en: "Yasaka Shrine", description: "祇園祭主神社，京都代表神社", category: "神社", type: "temple", tags: ["祇園", "神社", "祭典"], city: "京都", country: "japan" },
  { name: "高台寺", name_en: "Kodai-ji", description: "豐臣秀吉正室建造，夜櫻夜楓名所", category: "寺廟", type: "temple", tags: ["夜景", "楓葉", "櫻花"], city: "京都", country: "japan" },
  { name: "平安神宮", name_en: "Heian Shrine", description: "平安京創都紀念神社，朱紅鳥居", category: "神社", type: "temple", tags: ["神社", "庭園", "鳥居"], city: "京都", country: "japan" },
  { name: "龍安寺", name_en: "Ryoan-ji", description: "石庭禪宗代表作，世界遺產", category: "寺廟", type: "temple", tags: ["石庭", "禪宗", "世界遺產"], city: "京都", country: "japan" },
  { name: "西芳寺（苔寺）", name_en: "Saiho-ji (Moss Temple)", description: "苔蘚庭園聞名，需預約", category: "寺廟", type: "temple", tags: ["苔蘚", "庭園", "預約制"], city: "京都", country: "japan" },
  { name: "知恩院", name_en: "Chion-in", description: "淨土宗總本山，大鐘著名", category: "寺廟", type: "temple", tags: ["淨土宗", "大鐘", "除夕"], city: "京都", country: "japan" },
  { name: "永觀堂", name_en: "Eikan-do", description: "楓葉名所，回首阿彌陀佛像", category: "寺廟", type: "temple", tags: ["楓葉", "佛像", "秋天"], city: "京都", country: "japan" },
  { name: "醍醐寺", name_en: "Daigo-ji", description: "櫻花名所，世界遺產", category: "寺廟", type: "temple", tags: ["櫻花", "世界遺產", "五重塔"], city: "京都", country: "japan" },
  // 京都美食
  { name: "錦市場", name_en: "Nishiki Market", description: "京都廚房，400年歷史市場", category: "市場", type: "market", tags: ["市場", "美食", "傳統"], city: "京都", country: "japan" },
  { name: "祇園", name_en: "Gion District", description: "藝妓文化中心，傳統街道", category: "街區", type: "attraction", tags: ["藝妓", "花街", "傳統"], city: "京都", country: "japan" },
  { name: "先斗町", name_en: "Pontocho", description: "狹窄石板路，京都料理名店街", category: "美食街", type: "food", tags: ["京料理", "夜生活", "餐廳"], city: "京都", country: "japan" },
  { name: "京都拉麵小路", name_en: "Kyoto Ramen Street", description: "京都車站內拉麵集合區", category: "美食", type: "food", tags: ["拉麵", "美食街", "車站"], city: "京都", country: "japan" },
  // 大阪景點
  { name: "大阪城", name_en: "Osaka Castle", description: "豐臣秀吉築城，大阪地標", category: "城堡", type: "heritage", tags: ["城堡", "歷史", "櫻花"], city: "大阪", country: "japan" },
  { name: "道頓堀", name_en: "Dotonbori", description: "霓虹燈海，美食天堂", category: "商業街", type: "shopping", tags: ["美食", "霓虹燈", "購物"], city: "大阪", country: "japan" },
  { name: "心齋橋", name_en: "Shinsaibashi", description: "大阪購物主街", category: "購物街", type: "shopping", tags: ["購物", "藥妝", "時尚"], city: "大阪", country: "japan" },
  { name: "通天閣", name_en: "Tsutenkaku Tower", description: "新世界地標塔", category: "地標", type: "attraction", tags: ["塔", "展望", "新世界"], city: "大阪", country: "japan" },
  { name: "大阪環球影城", name_en: "Universal Studios Japan", description: "亞洲環球影城，超級任天堂世界", category: "主題樂園", type: "attraction", tags: ["樂園", "哈利波特", "任天堂"], city: "大阪", country: "japan" },
  { name: "黑門市場", name_en: "Kuromon Market", description: "大阪廚房，新鮮海產市場", category: "市場", type: "market", tags: ["市場", "海鮮", "美食"], city: "大阪", country: "japan" },
  { name: "梅田藍天大廈", name_en: "Umeda Sky Building", description: "空中庭園展望台", category: "展望台", type: "attraction", tags: ["展望", "夜景", "建築"], city: "大阪", country: "japan" },
  { name: "天保山", name_en: "Tempozan", description: "海遊館所在地，摩天輪", category: "景區", type: "attraction", tags: ["水族館", "摩天輪", "港口"], city: "大阪", country: "japan" },
  { name: "海遊館", name_en: "Osaka Aquarium Kaiyukan", description: "世界最大級水族館之一", category: "水族館", type: "attraction", tags: ["水族館", "鯨鯊", "親子"], city: "大阪", country: "japan" },
  { name: "阿倍野HARUKAS", name_en: "Abeno Harukas", description: "日本最高大廈之一，展望台", category: "展望台", type: "attraction", tags: ["展望", "購物", "最高建築"], city: "大阪", country: "japan" },
  { name: "四天王寺", name_en: "Shitenno-ji", description: "日本最古老寺廟之一", category: "寺廟", type: "temple", tags: ["古寺", "聖德太子", "五重塔"], city: "大阪", country: "japan" },
  { name: "住吉大社", name_en: "Sumiyoshi Taisha", description: "大阪最著名神社", category: "神社", type: "temple", tags: ["神社", "太鼓橋", "初詣"], city: "大阪", country: "japan" },
  { name: "大阪造幣局", name_en: "Japan Mint", description: "櫻花通道，春季限定開放", category: "賞櫻", type: "attraction", tags: ["櫻花", "春季", "造幣"], city: "大阪", country: "japan" },
  // 奈良景點
  { name: "東大寺", name_en: "Todai-ji", description: "世界最大木造建築，大佛殿", category: "寺廟", type: "temple", tags: ["世界遺產", "大佛", "木造建築"], city: "奈良", country: "japan" },
  { name: "奈良公園", name_en: "Nara Park", description: "可愛鹿群棲息地", category: "公園", type: "attraction", tags: ["鹿", "公園", "神鹿"], city: "奈良", country: "japan" },
  { name: "春日大社", name_en: "Kasuga Taisha", description: "石燈籠聞名，世界遺產", category: "神社", type: "temple", tags: ["世界遺產", "石燈籠", "藤原氏"], city: "奈良", country: "japan" },
  { name: "興福寺", name_en: "Kofuku-ji", description: "五重塔與阿修羅像", category: "寺廟", type: "temple", tags: ["五重塔", "阿修羅", "世界遺產"], city: "奈良", country: "japan" },
  { name: "法隆寺", name_en: "Horyu-ji", description: "世界最古老木造建築，世界遺產", category: "寺廟", type: "temple", tags: ["世界遺產", "聖德太子", "最古木造"], city: "奈良", country: "japan" },
  { name: "唐招提寺", name_en: "Toshodai-ji", description: "鑒真和尚創建，世界遺產", category: "寺廟", type: "temple", tags: ["世界遺產", "鑒真", "唐代建築"], city: "奈良", country: "japan" },
  { name: "藥師寺", name_en: "Yakushi-ji", description: "世界遺產，奈良時代寺廟", category: "寺廟", type: "temple", tags: ["世界遺產", "雙塔", "藥師佛"], city: "奈良", country: "japan" },
  { name: "吉野山", name_en: "Mount Yoshino", description: "日本第一賞櫻名所", category: "賞櫻", type: "attraction", tags: ["櫻花", "山景", "世界遺產"], city: "奈良", country: "japan" },
  // 神戶景點
  { name: "神戶港", name_en: "Kobe Port", description: "港口夜景，紅色神戶塔", category: "港口", type: "attraction", tags: ["港口", "夜景", "神戶塔"], city: "神戶", country: "japan" },
  { name: "北野異人館", name_en: "Kitano Ijinkan", description: "異國風情歷史建築群", category: "歷史建築", type: "heritage", tags: ["異人館", "西洋建築", "異國風情"], city: "神戶", country: "japan" },
  { name: "有馬溫泉", name_en: "Arima Onsen", description: "日本三古湯之一", category: "溫泉", type: "attraction", tags: ["溫泉", "金泉", "銀泉"], city: "神戶", country: "japan" },
  { name: "南京町", name_en: "Nankinmachi", description: "神戶中華街", category: "中華街", type: "food", tags: ["中華街", "美食", "購物"], city: "神戶", country: "japan" },
  { name: "六甲山", name_en: "Mount Rokko", description: "神戶山景夜景名所", category: "山", type: "attraction", tags: ["夜景", "纜車", "植物園"], city: "神戶", country: "japan" },
  { name: "摩耶山掬星台", name_en: "Kikuseidai", description: "日本三大夜景之一", category: "展望台", type: "attraction", tags: ["夜景", "展望", "三大夜景"], city: "神戶", country: "japan" },
  { name: "神戶動物王國", name_en: "Kobe Animal Kingdom", description: "可近距離接觸動物", category: "動物園", type: "attraction", tags: ["動物園", "親子", "互動"], city: "神戶", country: "japan" },
  { name: "明石海峽大橋", name_en: "Akashi Kaikyo Bridge", description: "世界最長吊橋", category: "橋", type: "attraction", tags: ["大橋", "世界之最", "海峽"], city: "神戶", country: "japan" },
  // 和歌山
  { name: "高野山", name_en: "Mount Koya", description: "真言宗聖地，宿坊體驗", category: "寺廟", type: "temple", tags: ["世界遺產", "宿坊", "空海"], city: "和歌山", country: "japan" },
  { name: "熊野古道", name_en: "Kumano Kodo", description: "世界遺產朝聖古道", category: "古道", type: "heritage", tags: ["世界遺產", "古道", "朝聖"], city: "和歌山", country: "japan" },
  { name: "熊野那智大社", name_en: "Kumano Nachi Taisha", description: "那智瀑布旁神社", category: "神社", type: "temple", tags: ["世界遺產", "瀑布", "熊野"], city: "和歌山", country: "japan" },
  { name: "那智瀑布", name_en: "Nachi Falls", description: "日本三大瀑布之一", category: "瀑布", type: "attraction", tags: ["瀑布", "自然", "世界遺產"], city: "和歌山", country: "japan" },
  { name: "白濱溫泉", name_en: "Shirahama Onsen", description: "關西著名溫泉地", category: "溫泉", type: "attraction", tags: ["溫泉", "白沙灘", "海景"], city: "和歌山", country: "japan" },
  { name: "和歌山城", name_en: "Wakayama Castle", description: "紀州德川家居城", category: "城堡", type: "heritage", tags: ["城堡", "德川", "歷史"], city: "和歌山", country: "japan" },
];

// =============================================
// 日本 - 北海道完整景點
// =============================================
const japanHokkaido = [
  // 札幌
  { name: "大通公園", name_en: "Odori Park", description: "札幌市中心公園，雪祭會場", category: "公園", type: "attraction", tags: ["公園", "雪祭", "啤酒祭"], city: "札幌", country: "japan" },
  { name: "札幌時計台", name_en: "Sapporo Clock Tower", description: "札幌地標，明治建築", category: "歷史建築", type: "heritage", tags: ["時計台", "地標", "明治"], city: "札幌", country: "japan" },
  { name: "北海道舊道廳", name_en: "Former Hokkaido Government Office", description: "紅磚建築，明治風格", category: "歷史建築", type: "heritage", tags: ["紅磚", "歷史", "明治"], city: "札幌", country: "japan" },
  { name: "札幌啤酒博物館", name_en: "Sapporo Beer Museum", description: "日本唯一啤酒博物館", category: "博物館", type: "attraction", tags: ["啤酒", "博物館", "試飲"], city: "札幌", country: "japan" },
  { name: "白色戀人公園", name_en: "Shiroi Koibito Park", description: "白色戀人餅乾工廠", category: "主題公園", type: "attraction", tags: ["餅乾", "工廠", "甜點"], city: "札幌", country: "japan" },
  { name: "藻岩山", name_en: "Mount Moiwa", description: "日本新三大夜景", category: "展望", type: "attraction", tags: ["夜景", "纜車", "展望"], city: "札幌", country: "japan" },
  { name: "大倉山展望台", name_en: "Okurayama Ski Jump Stadium", description: "1972冬奧跳台滑雪場", category: "展望", type: "attraction", tags: ["滑雪", "冬奧", "展望"], city: "札幌", country: "japan" },
  { name: "薄野", name_en: "Susukino", description: "北海道最大歡樂街", category: "夜生活", type: "attraction", tags: ["夜生活", "拉麵", "螃蟹"], city: "札幌", country: "japan" },
  { name: "札幌拉麵橫丁", name_en: "Sapporo Ramen Alley", description: "17家拉麵店集中", category: "美食街", type: "food", tags: ["拉麵", "味噌", "美食"], city: "札幌", country: "japan" },
  { name: "二條市場", name_en: "Nijo Market", description: "100年歷史海鮮市場", category: "市場", type: "market", tags: ["市場", "海鮮", "螃蟹"], city: "札幌", country: "japan" },
  { name: "定山溪溫泉", name_en: "Jozankei Onsen", description: "札幌後花園溫泉鄉", category: "溫泉", type: "attraction", tags: ["溫泉", "楓葉", "河童"], city: "札幌", country: "japan" },
  { name: "圓山動物園", name_en: "Maruyama Zoo", description: "北海道知名動物園", category: "動物園", type: "attraction", tags: ["動物園", "親子", "北極熊"], city: "札幌", country: "japan" },
  { name: "北海道神宮", name_en: "Hokkaido Shrine", description: "北海道總鎮守神社", category: "神社", type: "temple", tags: ["神社", "初詣", "圓山"], city: "札幌", country: "japan" },
  // 小樽
  { name: "小樽運河", name_en: "Otaru Canal", description: "煤油燈倉庫群，浪漫運河", category: "運河", type: "attraction", tags: ["運河", "倉庫", "夜景"], city: "小樽", country: "japan" },
  { name: "小樽音樂盒堂", name_en: "Otaru Music Box Museum", description: "日本最大音樂盒專賣店", category: "博物館", type: "shopping", tags: ["音樂盒", "購物", "紀念品"], city: "小樽", country: "japan" },
  { name: "北一硝子館", name_en: "Kitaichi Glass", description: "玻璃工藝品專賣", category: "購物", type: "shopping", tags: ["玻璃", "工藝", "燈飾"], city: "小樽", country: "japan" },
  { name: "三角市場", name_en: "Sankaku Market", description: "小樽車站旁海鮮市場", category: "市場", type: "market", tags: ["市場", "海鮮", "海鮮丼"], city: "小樽", country: "japan" },
  { name: "LeTAO", name_en: "LeTAO", description: "雙層起司蛋糕名店", category: "甜點", type: "food", tags: ["起司蛋糕", "甜點", "小樽"], city: "小樽", country: "japan" },
  { name: "政壽司", name_en: "Masazushi", description: "小樽壽司名店", category: "壽司", type: "food", tags: ["壽司", "海鮮", "老店"], city: "小樽", country: "japan" },
  // 函館
  { name: "函館山夜景", name_en: "Mount Hakodate Night View", description: "世界三大夜景之一", category: "展望", type: "attraction", tags: ["夜景", "世界三大", "纜車"], city: "函館", country: "japan" },
  { name: "五稜郭", name_en: "Goryokaku Fort", description: "星形城郭，櫻花名所", category: "城堡", type: "heritage", tags: ["城堡", "星形", "櫻花"], city: "函館", country: "japan" },
  { name: "金森紅磚倉庫", name_en: "Kanemori Red Brick Warehouse", description: "歷史倉庫群購物中心", category: "購物", type: "shopping", tags: ["紅磚", "倉庫", "購物"], city: "函館", country: "japan" },
  { name: "函館朝市", name_en: "Hakodate Morning Market", description: "新鮮海產早市", category: "市場", type: "market", tags: ["朝市", "海鮮", "烏賊"], city: "函館", country: "japan" },
  { name: "八幡坂", name_en: "Hachiman-zaka Slope", description: "通往港口的美麗坡道", category: "景觀", type: "attraction", tags: ["坡道", "港口", "攝影"], city: "函館", country: "japan" },
  { name: "元町異人館", name_en: "Motomachi Historic District", description: "西洋風歷史建築區", category: "歷史建築", type: "heritage", tags: ["異人館", "西洋建築", "教堂"], city: "函館", country: "japan" },
  { name: "湯之川溫泉", name_en: "Yunokawa Onsen", description: "函館著名溫泉鄉", category: "溫泉", type: "attraction", tags: ["溫泉", "海景", "猴子"], city: "函館", country: "japan" },
  { name: "幸運小丑漢堡", name_en: "Lucky Pierrot", description: "函館限定連鎖漢堡店", category: "美食", type: "food", tags: ["漢堡", "函館限定", "平價"], city: "函館", country: "japan" },
  // 富良野美瑛
  { name: "富田農場", name_en: "Farm Tomita", description: "薰衣草田聞名", category: "農場", type: "attraction", tags: ["薰衣草", "花田", "夏季"], city: "富良野", country: "japan" },
  { name: "四季彩之丘", name_en: "Shikisai-no-Oka", description: "七彩花田農場", category: "農場", type: "attraction", tags: ["花田", "彩虹", "美瑛"], city: "美瑛", country: "japan" },
  { name: "青池", name_en: "Blue Pond", description: "夢幻藍色池塘", category: "自然", type: "attraction", tags: ["藍池", "美瑛", "神秘"], city: "美瑛", country: "japan" },
  { name: "拼布之路", name_en: "Patchwork Road", description: "色彩繽紛農田景觀路", category: "景觀", type: "attraction", tags: ["田園", "美瑛", "自駕"], city: "美瑛", country: "japan" },
  { name: "七星之樹", name_en: "Seven Star Tree", description: "美瑛代表性景點", category: "地標", type: "attraction", tags: ["樹木", "廣告", "美瑛"], city: "美瑛", country: "japan" },
  { name: "北西之丘展望公園", name_en: "Hokusai no Oka", description: "金字塔形展望台", category: "展望", type: "attraction", tags: ["展望", "金字塔", "美瑛"], city: "美瑛", country: "japan" },
  // 登別洞爺
  { name: "登別地獄谷", name_en: "Noboribetsu Jigokudani", description: "火山地熱景觀", category: "溫泉", type: "attraction", tags: ["地獄谷", "溫泉", "火山"], city: "登別", country: "japan" },
  { name: "登別溫泉", name_en: "Noboribetsu Onsen", description: "北海道代表溫泉鄉", category: "溫泉", type: "attraction", tags: ["溫泉", "溫泉街", "鬼"], city: "登別", country: "japan" },
  { name: "洞爺湖", name_en: "Lake Toya", description: "破火山口湖，世界地質公園", category: "湖泊", type: "attraction", tags: ["湖泊", "火山", "溫泉"], city: "洞爺湖", country: "japan" },
  { name: "有珠山纜車", name_en: "Usuzan Ropeway", description: "活火山觀景纜車", category: "纜車", type: "attraction", tags: ["火山", "纜車", "洞爺湖"], city: "洞爺湖", country: "japan" },
  { name: "昭和新山", name_en: "Showa Shinzan", description: "1943年形成的新火山", category: "火山", type: "attraction", tags: ["火山", "熔岩圓頂", "地質"], city: "洞爺湖", country: "japan" },
  // 旭川
  { name: "旭山動物園", name_en: "Asahiyama Zoo", description: "行動展示著名動物園", category: "動物園", type: "attraction", tags: ["動物園", "企鵝遊行", "行動展示"], city: "旭川", country: "japan" },
  { name: "旭川拉麵村", name_en: "Asahikawa Ramen Village", description: "8家拉麵店集中", category: "美食街", type: "food", tags: ["拉麵", "醬油", "美食"], city: "旭川", country: "japan" },
];

// =============================================
// 日本 - 九州完整景點
// =============================================
const japanKyushu = [
  // 福岡
  { name: "太宰府天滿宮", name_en: "Dazaifu Tenmangu", description: "學問之神菅原道真供奉神社", category: "神社", type: "temple", tags: ["神社", "學問", "梅花"], city: "福岡", country: "japan" },
  { name: "天神地下街", name_en: "Tenjin Underground City", description: "九州最大地下商店街", category: "購物", type: "shopping", tags: ["購物", "地下街", "美食"], city: "福岡", country: "japan" },
  { name: "中洲屋台", name_en: "Nakasu Yatai", description: "博多夜生活屋台街", category: "美食街", type: "food", tags: ["屋台", "拉麵", "夜生活"], city: "福岡", country: "japan" },
  { name: "博多運河城", name_en: "Canal City Hakata", description: "大型購物娛樂中心", category: "購物", type: "shopping", tags: ["購物", "運河", "劇場"], city: "福岡", country: "japan" },
  { name: "福岡塔", name_en: "Fukuoka Tower", description: "日本最高海濱塔", category: "展望", type: "attraction", tags: ["展望", "海景", "夜景"], city: "福岡", country: "japan" },
  { name: "櫛田神社", name_en: "Kushida Shrine", description: "博多祇園山笠祭主神社", category: "神社", type: "temple", tags: ["神社", "山笠", "博多"], city: "福岡", country: "japan" },
  { name: "柳川遊船", name_en: "Yanagawa River Cruise", description: "水鄉小鎮遊船", category: "遊船", type: "attraction", tags: ["遊船", "水鄉", "柳川"], city: "福岡", country: "japan" },
  { name: "一蘭拉麵總本店", name_en: "Ichiran Ramen Headquarters", description: "一蘭拉麵發源地", category: "拉麵", type: "food", tags: ["拉麵", "豚骨", "一蘭"], city: "福岡", country: "japan" },
  // 長崎
  { name: "原爆資料館", name_en: "Nagasaki Atomic Bomb Museum", description: "長崎原爆歷史紀念館", category: "博物館", type: "heritage", tags: ["和平", "歷史", "原爆"], city: "長崎", country: "japan" },
  { name: "和平公園", name_en: "Peace Park", description: "原爆紀念和平象徵", category: "公園", type: "heritage", tags: ["和平", "雕像", "紀念"], city: "長崎", country: "japan" },
  { name: "眼鏡橋", name_en: "Meganebashi Bridge", description: "日本最古老石拱橋", category: "橋", type: "heritage", tags: ["橋", "歷史", "石橋"], city: "長崎", country: "japan" },
  { name: "哥拉巴園", name_en: "Glover Garden", description: "西洋歷史建築群", category: "歷史建築", type: "heritage", tags: ["洋館", "港口", "歷史"], city: "長崎", country: "japan" },
  { name: "大浦天主堂", name_en: "Oura Church", description: "日本最古老木造天主教堂，世界遺產", category: "教堂", type: "heritage", tags: ["教堂", "世界遺產", "基督教"], city: "長崎", country: "japan" },
  { name: "出島", name_en: "Dejima", description: "江戶時代唯一對外貿易據點", category: "歷史遺跡", type: "heritage", tags: ["出島", "荷蘭", "鎖國"], city: "長崎", country: "japan" },
  { name: "長崎新地中華街", name_en: "Nagasaki Shinchi Chinatown", description: "日本三大中華街之一", category: "中華街", type: "food", tags: ["中華街", "美食", "長崎"], city: "長崎", country: "japan" },
  { name: "稻佐山夜景", name_en: "Mount Inasa Night View", description: "世界新三大夜景", category: "展望", type: "attraction", tags: ["夜景", "展望", "纜車"], city: "長崎", country: "japan" },
  { name: "軍艦島", name_en: "Hashima Island (Gunkanjima)", description: "廢墟島嶼，世界遺產", category: "世界遺產", type: "heritage", tags: ["廢墟", "世界遺產", "礦島"], city: "長崎", country: "japan" },
  { name: "豪斯登堡", name_en: "Huis Ten Bosch", description: "荷蘭主題樂園", category: "主題樂園", type: "attraction", tags: ["主題樂園", "荷蘭", "鬱金香"], city: "長崎", country: "japan" },
  // 別府
  { name: "別府地獄巡禮", name_en: "Beppu Hell Tour", description: "七大地獄溫泉巡禮", category: "溫泉", type: "attraction", tags: ["地獄", "溫泉", "地熱"], city: "別府", country: "japan" },
  { name: "海地獄", name_en: "Umi Jigoku", description: "藍色溫泉池", category: "溫泉", type: "attraction", tags: ["藍色", "地獄", "溫泉"], city: "別府", country: "japan" },
  { name: "血之池地獄", name_en: "Chinoike Jigoku", description: "紅色溫泉池", category: "溫泉", type: "attraction", tags: ["紅色", "地獄", "溫泉"], city: "別府", country: "japan" },
  { name: "竹瓦溫泉", name_en: "Takegawara Onsen", description: "明治時代公共溫泉", category: "溫泉", type: "attraction", tags: ["溫泉", "砂湯", "歷史"], city: "別府", country: "japan" },
  { name: "鐵輪溫泉", name_en: "Kannawa Onsen", description: "別府最大溫泉區", category: "溫泉", type: "attraction", tags: ["溫泉", "蒸氣料理", "湯煙"], city: "別府", country: "japan" },
  // 由布院
  { name: "湯布院溫泉", name_en: "Yufuin Onsen", description: "文藝氣息溫泉小鎮", category: "溫泉", type: "attraction", tags: ["溫泉", "文藝", "小鎮"], city: "由布院", country: "japan" },
  { name: "湯之坪街道", name_en: "Yunotsubo Street", description: "由布院主要商店街", category: "商店街", type: "shopping", tags: ["購物", "美食", "雜貨"], city: "由布院", country: "japan" },
  { name: "金鱗湖", name_en: "Lake Kinrinko", description: "清晨霧氣繚繞湖泊", category: "湖泊", type: "attraction", tags: ["湖泊", "霧氣", "溫泉"], city: "由布院", country: "japan" },
  { name: "由布岳", name_en: "Mount Yufu", description: "由布院象徵山峰", category: "山", type: "attraction", tags: ["登山", "雙峰", "由布院"], city: "由布院", country: "japan" },
  // 熊本
  { name: "熊本城", name_en: "Kumamoto Castle", description: "日本三大名城之一", category: "城堡", type: "heritage", tags: ["城堡", "名城", "加藤清正"], city: "熊本", country: "japan" },
  { name: "阿蘇火山", name_en: "Mount Aso", description: "世界最大破火山口", category: "火山", type: "attraction", tags: ["火山", "草千里", "中岳"], city: "熊本", country: "japan" },
  { name: "草千里", name_en: "Kusasenri", description: "阿蘇火山口草原", category: "草原", type: "attraction", tags: ["草原", "阿蘇", "火山"], city: "熊本", country: "japan" },
  { name: "黑川溫泉", name_en: "Kurokawa Onsen", description: "秘境溫泉鄉", category: "溫泉", type: "attraction", tags: ["溫泉", "露天", "入湯手形"], city: "熊本", country: "japan" },
  { name: "水前寺成趣園", name_en: "Suizenji Garden", description: "迷你東海道庭園", category: "庭園", type: "attraction", tags: ["庭園", "迴遊式", "富士山"], city: "熊本", country: "japan" },
  // 鹿兒島
  { name: "櫻島", name_en: "Sakurajima", description: "活躍火山島", category: "火山", type: "attraction", tags: ["火山", "渡輪", "活火山"], city: "鹿兒島", country: "japan" },
  { name: "仙巖園", name_en: "Sengan-en", description: "島津家別邸庭園", category: "庭園", type: "attraction", tags: ["庭園", "島津", "櫻島"], city: "鹿兒島", country: "japan" },
  { name: "天文館", name_en: "Tenmonkan", description: "鹿兒島最大商店街", category: "商店街", type: "shopping", tags: ["購物", "美食", "白熊"], city: "鹿兒島", country: "japan" },
  { name: "城山展望台", name_en: "Shiroyama Observation Point", description: "眺望櫻島最佳地點", category: "展望", type: "attraction", tags: ["展望", "櫻島", "夕陽"], city: "鹿兒島", country: "japan" },
  { name: "指宿溫泉", name_en: "Ibusuki Onsen", description: "砂蒸溫泉聞名", category: "溫泉", type: "attraction", tags: ["砂蒸", "溫泉", "特色"], city: "鹿兒島", country: "japan" },
  { name: "屋久島", name_en: "Yakushima Island", description: "世界遺產，繩文杉", category: "自然遺產", type: "heritage", tags: ["世界遺產", "繩文杉", "原始森林"], city: "鹿兒島", country: "japan" },
  { name: "白谷雲水峽", name_en: "Shiratani Unsuikyo", description: "魔法公主取景地", category: "森林", type: "attraction", tags: ["森林", "吉卜力", "苔蘚"], city: "鹿兒島", country: "japan" },
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
  console.log('城市IDs:', JSON.stringify(cityIdMap, null, 2));

  const allAttractions = [...japanKansai, ...japanHokkaido, ...japanKyushu];
  const toInsert = [];

  for (const item of allAttractions) {
    const cityId = cityIdMap[item.city];
    if (!cityId) {
      console.log(`找不到城市: ${item.city}`);
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
      workspace_id: '8ef05a74-1f87-48ab-afd3-9bfeb423935d'
    });
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
