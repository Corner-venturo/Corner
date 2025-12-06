const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
);

const WORKSPACE_ID = '8ef05a74-1f87-48ab-afd3-9bfeb423935d';

// =============================================
// 歐洲景點
// =============================================
const europeAttractions = [
  // 法國巴黎
  { name: "艾菲爾鐵塔", name_en: "Eiffel Tower", description: "巴黎地標，324米高鐵塔", category: "地標", type: "attraction", tags: ["地標", "夜景", "展望"], city: "巴黎", country: "france" },
  { name: "羅浮宮", name_en: "Louvre Museum", description: "世界最大藝術博物館", category: "博物館", type: "heritage", tags: ["博物館", "蒙娜麗莎", "藝術"], city: "巴黎", country: "france" },
  { name: "凱旋門", name_en: "Arc de Triomphe", description: "拿破崙紀念建築", category: "地標", type: "heritage", tags: ["地標", "歷史", "展望"], city: "巴黎", country: "france" },
  { name: "香榭麗舍大道", name_en: "Champs-Elysees", description: "世界最美大道", category: "街道", type: "shopping", tags: ["購物", "大道", "名牌"], city: "巴黎", country: "france" },
  { name: "聖母院", name_en: "Notre-Dame de Paris", description: "哥德式大教堂", category: "教堂", type: "heritage", tags: ["教堂", "哥德式", "鐘樓怪人"], city: "巴黎", country: "france" },
  { name: "蒙馬特", name_en: "Montmartre", description: "藝術家山丘，聖心堂", category: "區域", type: "attraction", tags: ["藝術", "聖心堂", "畫家"], city: "巴黎", country: "france" },
  { name: "聖心堂", name_en: "Sacre-Coeur", description: "白色圓頂教堂", category: "教堂", type: "heritage", tags: ["教堂", "白色", "蒙馬特"], city: "巴黎", country: "france" },
  { name: "奧賽博物館", name_en: "Musee d'Orsay", description: "印象派藝術殿堂", category: "博物館", type: "heritage", tags: ["博物館", "印象派", "藝術"], city: "巴黎", country: "france" },
  { name: "凡爾賽宮", name_en: "Palace of Versailles", description: "法國皇宮，世界遺產", category: "宮殿", type: "heritage", tags: ["宮殿", "世界遺產", "花園"], city: "凡爾賽", country: "france" },
  { name: "塞納河遊船", name_en: "Seine River Cruise", description: "塞納河觀光遊船", category: "遊船", type: "attraction", tags: ["遊船", "夜景", "浪漫"], city: "巴黎", country: "france" },
  { name: "瑪黑區", name_en: "Le Marais", description: "時尚購物文青區", category: "區域", type: "shopping", tags: ["購物", "猶太區", "文青"], city: "巴黎", country: "france" },
  { name: "拉法葉百貨", name_en: "Galeries Lafayette", description: "巴黎著名百貨公司", category: "購物", type: "shopping", tags: ["購物", "百貨", "名牌"], city: "巴黎", country: "france" },
  { name: "盧森堡公園", name_en: "Luxembourg Gardens", description: "巴黎最美公園", category: "公園", type: "attraction", tags: ["公園", "庭園", "噴泉"], city: "巴黎", country: "france" },
  { name: "龐畢度中心", name_en: "Centre Pompidou", description: "現代藝術博物館", category: "博物館", type: "heritage", tags: ["現代藝術", "建築", "博物館"], city: "巴黎", country: "france" },
  { name: "巴黎歌劇院", name_en: "Palais Garnier", description: "華麗歌劇院建築", category: "劇院", type: "heritage", tags: ["歌劇", "建築", "歌劇魅影"], city: "巴黎", country: "france" },
  { name: "橘園美術館", name_en: "Musee de l'Orangerie", description: "莫內睡蓮收藏", category: "博物館", type: "heritage", tags: ["莫內", "睡蓮", "印象派"], city: "巴黎", country: "france" },
  { name: "杜樂麗花園", name_en: "Tuileries Garden", description: "羅浮宮前皇家花園", category: "公園", type: "attraction", tags: ["花園", "雕塑", "皇家"], city: "巴黎", country: "france" },
  { name: "先賢祠", name_en: "Pantheon", description: "法國偉人安葬地", category: "建築", type: "heritage", tags: ["偉人", "歷史", "圓頂"], city: "巴黎", country: "france" },
  { name: "巴黎迪士尼", name_en: "Disneyland Paris", description: "歐洲迪士尼樂園", category: "主題樂園", type: "attraction", tags: ["迪士尼", "樂園", "親子"], city: "巴黎", country: "france" },
  { name: "莎士比亞書店", name_en: "Shakespeare and Company", description: "傳奇英文書店", category: "書店", type: "shopping", tags: ["書店", "文學", "歷史"], city: "巴黎", country: "france" },
  // 義大利羅馬
  { name: "羅馬競技場", name_en: "Colosseum", description: "古羅馬圓形競技場", category: "遺跡", type: "heritage", tags: ["世界遺產", "古羅馬", "競技場"], city: "羅馬", country: "italy" },
  { name: "梵蒂岡博物館", name_en: "Vatican Museums", description: "世界最大博物館之一", category: "博物館", type: "heritage", tags: ["博物館", "藝術", "宗教"], city: "梵蒂岡", country: "italy" },
  { name: "聖彼得大教堂", name_en: "St. Peter's Basilica", description: "天主教最大教堂", category: "教堂", type: "heritage", tags: ["教堂", "梵蒂岡", "米開朗基羅"], city: "梵蒂岡", country: "italy" },
  { name: "西斯廷教堂", name_en: "Sistine Chapel", description: "米開朗基羅天花板壁畫", category: "教堂", type: "heritage", tags: ["壁畫", "創世紀", "米開朗基羅"], city: "梵蒂岡", country: "italy" },
  { name: "特雷維噴泉", name_en: "Trevi Fountain", description: "許願池，羅馬最著名噴泉", category: "噴泉", type: "attraction", tags: ["噴泉", "許願", "巴洛克"], city: "羅馬", country: "italy" },
  { name: "西班牙階梯", name_en: "Spanish Steps", description: "著名階梯廣場", category: "廣場", type: "attraction", tags: ["階梯", "廣場", "購物"], city: "羅馬", country: "italy" },
  { name: "萬神殿", name_en: "Pantheon", description: "古羅馬建築傑作", category: "建築", type: "heritage", tags: ["古羅馬", "圓頂", "建築"], city: "羅馬", country: "italy" },
  { name: "古羅馬廣場", name_en: "Roman Forum", description: "古羅馬政治中心遺跡", category: "遺跡", type: "heritage", tags: ["遺跡", "古羅馬", "歷史"], city: "羅馬", country: "italy" },
  { name: "帕拉廷山", name_en: "Palatine Hill", description: "羅馬七丘之一", category: "遺跡", type: "heritage", tags: ["遺跡", "皇宮", "古羅馬"], city: "羅馬", country: "italy" },
  { name: "納沃納廣場", name_en: "Piazza Navona", description: "巴洛克風格廣場", category: "廣場", type: "attraction", tags: ["廣場", "噴泉", "巴洛克"], city: "羅馬", country: "italy" },
  { name: "真理之口", name_en: "Bocca della Verita", description: "羅馬假期取景地", category: "景點", type: "attraction", tags: ["電影", "雕刻", "傳說"], city: "羅馬", country: "italy" },
  { name: "聖天使城堡", name_en: "Castel Sant'Angelo", description: "河畔圓形城堡", category: "城堡", type: "heritage", tags: ["城堡", "博物館", "河畔"], city: "羅馬", country: "italy" },
  // 西班牙巴塞隆納
  { name: "聖家堂", name_en: "Sagrada Familia", description: "高第未完成傑作", category: "教堂", type: "heritage", tags: ["高第", "教堂", "世界遺產"], city: "巴塞隆納", country: "spain" },
  { name: "桂爾公園", name_en: "Park Guell", description: "高第馬賽克公園", category: "公園", type: "heritage", tags: ["高第", "馬賽克", "世界遺產"], city: "巴塞隆納", country: "spain" },
  { name: "巴特略之家", name_en: "Casa Batllo", description: "高第建築傑作", category: "建築", type: "heritage", tags: ["高第", "建築", "世界遺產"], city: "巴塞隆納", country: "spain" },
  { name: "米拉之家", name_en: "Casa Mila", description: "高第石頭屋", category: "建築", type: "heritage", tags: ["高第", "建築", "世界遺產"], city: "巴塞隆納", country: "spain" },
  { name: "蘭布拉大道", name_en: "La Rambla", description: "巴塞隆納主街", category: "街道", type: "shopping", tags: ["大道", "購物", "街頭表演"], city: "巴塞隆納", country: "spain" },
  { name: "波蓋利亞市場", name_en: "La Boqueria Market", description: "著名美食市場", category: "市場", type: "market", tags: ["市場", "美食", "水果"], city: "巴塞隆納", country: "spain" },
  { name: "畢卡索博物館", name_en: "Picasso Museum", description: "畢卡索作品收藏", category: "博物館", type: "heritage", tags: ["畢卡索", "藝術", "博物館"], city: "巴塞隆納", country: "spain" },
  { name: "巴塞隆納海灘", name_en: "Barceloneta Beach", description: "城市海灘", category: "海灘", type: "attraction", tags: ["海灘", "城市", "休閒"], city: "巴塞隆納", country: "spain" },
  { name: "諾坎普球場", name_en: "Camp Nou", description: "巴塞隆納足球場", category: "體育館", type: "attraction", tags: ["足球", "巴薩", "體育"], city: "巴塞隆納", country: "spain" },
  { name: "哥德區", name_en: "Gothic Quarter", description: "中世紀老城區", category: "區域", type: "heritage", tags: ["老城", "中世紀", "散步"], city: "巴塞隆納", country: "spain" },
  { name: "蒙特惠克山", name_en: "Montjuic", description: "城市山丘，魔幻噴泉", category: "山", type: "attraction", tags: ["展望", "噴泉", "纜車"], city: "巴塞隆納", country: "spain" },
  { name: "加泰隆尼亞廣場", name_en: "Placa de Catalunya", description: "巴塞隆納中心廣場", category: "廣場", type: "attraction", tags: ["廣場", "中心", "購物"], city: "巴塞隆納", country: "spain" },
  // 英國倫敦
  { name: "大笨鐘", name_en: "Big Ben", description: "倫敦地標鐘塔", category: "地標", type: "heritage", tags: ["鐘塔", "地標", "國會"], city: "倫敦", country: "uk" },
  { name: "倫敦塔橋", name_en: "Tower Bridge", description: "泰晤士河標誌性橋", category: "地標", type: "heritage", tags: ["橋", "維多利亞", "展望"], city: "倫敦", country: "uk" },
  { name: "倫敦塔", name_en: "Tower of London", description: "皇室城堡和珠寶", category: "城堡", type: "heritage", tags: ["城堡", "皇冠珠寶", "歷史"], city: "倫敦", country: "uk" },
  { name: "白金漢宮", name_en: "Buckingham Palace", description: "英國王室官邸", category: "宮殿", type: "heritage", tags: ["王室", "衛兵交接", "宮殿"], city: "倫敦", country: "uk" },
  { name: "西敏寺", name_en: "Westminster Abbey", description: "英國戴冠教堂", category: "教堂", type: "heritage", tags: ["教堂", "王室", "世界遺產"], city: "倫敦", country: "uk" },
  { name: "大英博物館", name_en: "British Museum", description: "世界最偉大博物館之一", category: "博物館", type: "heritage", tags: ["博物館", "文物", "免費"], city: "倫敦", country: "uk" },
  { name: "國家美術館", name_en: "National Gallery", description: "歐洲繪畫收藏", category: "博物館", type: "heritage", tags: ["美術館", "繪畫", "免費"], city: "倫敦", country: "uk" },
  { name: "特拉法加廣場", name_en: "Trafalgar Square", description: "倫敦中心廣場", category: "廣場", type: "attraction", tags: ["廣場", "獅子", "噴泉"], city: "倫敦", country: "uk" },
  { name: "倫敦眼", name_en: "London Eye", description: "泰晤士河摩天輪", category: "展望", type: "attraction", tags: ["摩天輪", "展望", "河畔"], city: "倫敦", country: "uk" },
  { name: "哈利波特影城", name_en: "Warner Bros. Studio Tour London", description: "哈利波特電影場景", category: "主題樂園", type: "attraction", tags: ["哈利波特", "電影", "魔法"], city: "倫敦", country: "uk" },
  { name: "攝政街", name_en: "Regent Street", description: "倫敦購物大街", category: "街道", type: "shopping", tags: ["購物", "建築", "名牌"], city: "倫敦", country: "uk" },
  { name: "牛津街", name_en: "Oxford Street", description: "歐洲最繁忙購物街", category: "街道", type: "shopping", tags: ["購物", "商店", "繁忙"], city: "倫敦", country: "uk" },
  { name: "科芬園", name_en: "Covent Garden", description: "購物和街頭表演", category: "市場", type: "shopping", tags: ["市場", "表演", "購物"], city: "倫敦", country: "uk" },
  { name: "諾丁山", name_en: "Notting Hill", description: "彩色房屋和市集", category: "區域", type: "attraction", tags: ["彩色房屋", "市集", "電影"], city: "倫敦", country: "uk" },
  { name: "海德公園", name_en: "Hyde Park", description: "倫敦皇家公園", category: "公園", type: "attraction", tags: ["公園", "皇家", "蛇形湖"], city: "倫敦", country: "uk" },
  { name: "聖保羅大教堂", name_en: "St Paul's Cathedral", description: "倫敦標誌性教堂", category: "教堂", type: "heritage", tags: ["教堂", "圓頂", "婚禮"], city: "倫敦", country: "uk" },
  { name: "碎片大廈", name_en: "The Shard", description: "西歐最高建築", category: "展望", type: "attraction", tags: ["展望", "最高", "現代"], city: "倫敦", country: "uk" },
  { name: "Borough Market", name_en: "Borough Market", description: "倫敦美食市場", category: "市場", type: "market", tags: ["市場", "美食", "在地"], city: "倫敦", country: "uk" },
  { name: "泰特現代美術館", name_en: "Tate Modern", description: "現代藝術博物館", category: "博物館", type: "heritage", tags: ["現代藝術", "博物館", "免費"], city: "倫敦", country: "uk" },
  { name: "自然史博物館", name_en: "Natural History Museum", description: "恐龍和自然展品", category: "博物館", type: "heritage", tags: ["博物館", "恐龍", "免費"], city: "倫敦", country: "uk" },
];

// =============================================
// 中國大陸景點
// =============================================
const chinaAttractions = [
  // 上海
  { name: "外灘", name_en: "The Bund", description: "萬國建築博覽會", category: "地標", type: "heritage", tags: ["地標", "夜景", "建築"], city: "上海", country: "china" },
  { name: "東方明珠塔", name_en: "Oriental Pearl Tower", description: "上海電視塔地標", category: "展望", type: "attraction", tags: ["展望", "地標", "浦東"], city: "上海", country: "china" },
  { name: "陸家嘴", name_en: "Lujiazui", description: "金融區摩天樓群", category: "商業區", type: "attraction", tags: ["金融", "摩天樓", "現代"], city: "上海", country: "china" },
  { name: "上海環球金融中心", name_en: "Shanghai World Financial Center", description: "開瓶器大廈展望台", category: "展望", type: "attraction", tags: ["展望", "開瓶器", "浦東"], city: "上海", country: "china" },
  { name: "上海中心大廈", name_en: "Shanghai Tower", description: "中國最高建築", category: "展望", type: "attraction", tags: ["最高", "展望", "旋轉"], city: "上海", country: "china" },
  { name: "豫園", name_en: "Yu Garden", description: "明代古典園林", category: "庭園", type: "heritage", tags: ["庭園", "明代", "古典"], city: "上海", country: "china" },
  { name: "城隍廟", name_en: "City God Temple", description: "老城商業區", category: "寺廟", type: "shopping", tags: ["商業", "小吃", "老城"], city: "上海", country: "china" },
  { name: "南京路", name_en: "Nanjing Road", description: "上海購物主街", category: "街道", type: "shopping", tags: ["購物", "步行街", "夜景"], city: "上海", country: "china" },
  { name: "新天地", name_en: "Xintiandi", description: "石庫門改造時尚區", category: "商圈", type: "shopping", tags: ["石庫門", "餐廳", "酒吧"], city: "上海", country: "china" },
  { name: "田子坊", name_en: "Tianzifang", description: "創意藝術區", category: "創意區", type: "shopping", tags: ["藝術", "創意", "咖啡"], city: "上海", country: "china" },
  { name: "朱家角", name_en: "Zhujiajiao", description: "水鄉古鎮", category: "古鎮", type: "heritage", tags: ["水鄉", "古鎮", "江南"], city: "上海", country: "china" },
  { name: "迪士尼度假區", name_en: "Shanghai Disneyland", description: "中國迪士尼樂園", category: "主題樂園", type: "attraction", tags: ["迪士尼", "樂園", "親子"], city: "上海", country: "china" },
  { name: "靜安寺", name_en: "Jing'an Temple", description: "上海市中心古剎", category: "寺廟", type: "temple", tags: ["寺廟", "佛教", "市中心"], city: "上海", country: "china" },
  { name: "上海博物館", name_en: "Shanghai Museum", description: "中國藝術博物館", category: "博物館", type: "heritage", tags: ["博物館", "藝術", "青銅器"], city: "上海", country: "china" },
  { name: "武康路", name_en: "Wukang Road", description: "法租界歷史街區", category: "街道", type: "attraction", tags: ["法租界", "洋房", "咖啡"], city: "上海", country: "china" },
  // 北京
  { name: "故宮", name_en: "Forbidden City", description: "明清皇宮", category: "宮殿", type: "heritage", tags: ["世界遺產", "皇宮", "紫禁城"], city: "北京", country: "china" },
  { name: "長城", name_en: "Great Wall", description: "世界七大奇蹟", category: "城牆", type: "heritage", tags: ["世界遺產", "長城", "八達嶺"], city: "北京", country: "china" },
  { name: "天安門廣場", name_en: "Tiananmen Square", description: "世界最大廣場", category: "廣場", type: "heritage", tags: ["廣場", "升旗", "歷史"], city: "北京", country: "china" },
  { name: "頤和園", name_en: "Summer Palace", description: "皇家園林", category: "庭園", type: "heritage", tags: ["世界遺產", "皇家", "園林"], city: "北京", country: "china" },
  { name: "天壇", name_en: "Temple of Heaven", description: "皇帝祭天場所", category: "寺廟", type: "heritage", tags: ["世界遺產", "祭祀", "建築"], city: "北京", country: "china" },
  { name: "南鑼鼓巷", name_en: "Nanluoguxiang", description: "胡同購物街", category: "街道", type: "shopping", tags: ["胡同", "購物", "美食"], city: "北京", country: "china" },
  { name: "什刹海", name_en: "Shichahai", description: "老北京湖區", category: "湖區", type: "attraction", tags: ["湖泊", "酒吧", "胡同"], city: "北京", country: "china" },
  { name: "798藝術區", name_en: "798 Art District", description: "當代藝術園區", category: "藝術區", type: "attraction", tags: ["當代藝術", "工廠", "畫廊"], city: "北京", country: "china" },
  { name: "圓明園", name_en: "Old Summer Palace", description: "萬園之園遺址", category: "遺跡", type: "heritage", tags: ["遺跡", "皇家", "歷史"], city: "北京", country: "china" },
  { name: "國家博物館", name_en: "National Museum of China", description: "中國最大博物館", category: "博物館", type: "heritage", tags: ["博物館", "歷史", "文物"], city: "北京", country: "china" },
  { name: "王府井", name_en: "Wangfujing", description: "北京購物大街", category: "街道", type: "shopping", tags: ["購物", "小吃", "商業"], city: "北京", country: "china" },
  { name: "景山公園", name_en: "Jingshan Park", description: "眺望故宮全景", category: "公園", type: "attraction", tags: ["展望", "故宮", "公園"], city: "北京", country: "china" },
  { name: "鳥巢", name_en: "Bird's Nest", description: "2008奧運主場館", category: "體育館", type: "attraction", tags: ["奧運", "體育館", "建築"], city: "北京", country: "china" },
  { name: "水立方", name_en: "Water Cube", description: "奧運游泳館", category: "體育館", type: "attraction", tags: ["奧運", "游泳", "建築"], city: "北京", country: "china" },
  { name: "雍和宮", name_en: "Yonghe Temple", description: "藏傳佛教寺廟", category: "寺廟", type: "temple", tags: ["藏傳佛教", "寺廟", "祈福"], city: "北京", country: "china" },
  // 廣州
  { name: "廣州塔", name_en: "Canton Tower", description: "小蠻腰地標塔", category: "展望", type: "attraction", tags: ["展望", "小蠻腰", "地標"], city: "廣州", country: "china" },
  { name: "沙面島", name_en: "Shamian Island", description: "歐洲風情歷史區", category: "歷史區", type: "heritage", tags: ["歐式建築", "歷史", "攝影"], city: "廣州", country: "china" },
  { name: "上下九步行街", name_en: "Shangxiajiu Pedestrian Street", description: "老廣州商業街", category: "街道", type: "shopping", tags: ["購物", "騎樓", "美食"], city: "廣州", country: "china" },
  { name: "陳家祠", name_en: "Chen Clan Ancestral Hall", description: "嶺南建築傑作", category: "祠堂", type: "heritage", tags: ["祠堂", "嶺南", "雕刻"], city: "廣州", country: "china" },
  { name: "北京路", name_en: "Beijing Road", description: "廣州最繁華商業街", category: "街道", type: "shopping", tags: ["購物", "歷史", "商業"], city: "廣州", country: "china" },
  { name: "珠江夜遊", name_en: "Pearl River Night Cruise", description: "珠江夜景遊船", category: "遊船", type: "attraction", tags: ["遊船", "夜景", "珠江"], city: "廣州", country: "china" },
  { name: "白雲山", name_en: "Baiyun Mountain", description: "廣州近郊名山", category: "山", type: "attraction", tags: ["登山", "纜車", "自然"], city: "廣州", country: "china" },
  { name: "越秀公園", name_en: "Yuexiu Park", description: "五羊雕像所在", category: "公園", type: "attraction", tags: ["公園", "五羊", "歷史"], city: "廣州", country: "china" },
  { name: "六榕寺", name_en: "Temple of the Six Banyan Trees", description: "千年古剎花塔", category: "寺廟", type: "temple", tags: ["寺廟", "花塔", "佛教"], city: "廣州", country: "china" },
  { name: "光孝寺", name_en: "Guangxiao Temple", description: "嶺南最古老寺廟", category: "寺廟", type: "temple", tags: ["寺廟", "古剎", "六祖"], city: "廣州", country: "china" },
  // 深圳
  { name: "華強北", name_en: "Huaqiangbei", description: "電子產品市場", category: "商圈", type: "shopping", tags: ["電子", "科技", "市場"], city: "深圳", country: "china" },
  { name: "東門老街", name_en: "Dongmen Old Street", description: "深圳老商業區", category: "街道", type: "shopping", tags: ["購物", "美食", "老城"], city: "深圳", country: "china" },
  { name: "世界之窗", name_en: "Window of the World", description: "世界名勝縮小版", category: "主題樂園", type: "attraction", tags: ["主題樂園", "縮小", "景點"], city: "深圳", country: "china" },
  { name: "歡樂谷", name_en: "Happy Valley Shenzhen", description: "主題遊樂園", category: "主題樂園", type: "attraction", tags: ["遊樂園", "刺激", "娛樂"], city: "深圳", country: "china" },
  { name: "深圳灣公園", name_en: "Shenzhen Bay Park", description: "海濱休閒公園", category: "公園", type: "attraction", tags: ["海濱", "公園", "單車"], city: "深圳", country: "china" },
  { name: "蓮花山公園", name_en: "Lianhua Mountain Park", description: "鄧小平銅像所在", category: "公園", type: "attraction", tags: ["公園", "展望", "鄧小平"], city: "深圳", country: "china" },
  // 杭州
  { name: "西湖", name_en: "West Lake", description: "世界文化遺產湖泊", category: "湖泊", type: "heritage", tags: ["世界遺產", "湖泊", "美景"], city: "杭州", country: "china" },
  { name: "靈隱寺", name_en: "Lingyin Temple", description: "杭州著名古剎", category: "寺廟", type: "temple", tags: ["寺廟", "佛教", "飛來峰"], city: "杭州", country: "china" },
  { name: "雷峰塔", name_en: "Leifeng Pagoda", description: "白蛇傳故事塔", category: "塔", type: "heritage", tags: ["塔", "白蛇傳", "西湖"], city: "杭州", country: "china" },
  { name: "斷橋", name_en: "Broken Bridge", description: "西湖著名景點", category: "橋", type: "attraction", tags: ["橋", "西湖", "白蛇傳"], city: "杭州", country: "china" },
  { name: "河坊街", name_en: "Hefang Street", description: "杭州老街", category: "街道", type: "shopping", tags: ["老街", "購物", "小吃"], city: "杭州", country: "china" },
  { name: "龍井村", name_en: "Longjing Village", description: "龍井茶產地", category: "茶村", type: "attraction", tags: ["茶葉", "龍井", "田園"], city: "杭州", country: "china" },
  { name: "西溪濕地", name_en: "Xixi Wetland", description: "城市濕地公園", category: "濕地", type: "attraction", tags: ["濕地", "自然", "非誠勿擾"], city: "杭州", country: "china" },
  { name: "六和塔", name_en: "Liuhe Pagoda", description: "錢塘江畔古塔", category: "塔", type: "heritage", tags: ["塔", "錢塘江", "歷史"], city: "杭州", country: "china" },
  // 蘇州
  { name: "拙政園", name_en: "Humble Administrator's Garden", description: "蘇州最大園林", category: "庭園", type: "heritage", tags: ["世界遺產", "園林", "蘇州"], city: "蘇州", country: "china" },
  { name: "虎丘", name_en: "Tiger Hill", description: "斜塔和歷史遺跡", category: "山", type: "heritage", tags: ["斜塔", "歷史", "劍池"], city: "蘇州", country: "china" },
  { name: "留園", name_en: "Lingering Garden", description: "四大名園之一", category: "庭園", type: "heritage", tags: ["世界遺產", "園林", "太湖石"], city: "蘇州", country: "china" },
  { name: "平江路", name_en: "Pingjiang Road", description: "水鄉歷史街區", category: "街道", type: "heritage", tags: ["水鄉", "老街", "運河"], city: "蘇州", country: "china" },
  { name: "周莊", name_en: "Zhouzhuang", description: "江南水鄉古鎮", category: "古鎮", type: "heritage", tags: ["水鄉", "古鎮", "雙橋"], city: "蘇州", country: "china" },
  { name: "寒山寺", name_en: "Hanshan Temple", description: "楓橋夜泊詩中寺", category: "寺廟", type: "temple", tags: ["寺廟", "唐詩", "鐘聲"], city: "蘇州", country: "china" },
  { name: "山塘街", name_en: "Shantang Street", description: "蘇州老街", category: "街道", type: "shopping", tags: ["老街", "水鄉", "夜景"], city: "蘇州", country: "china" },
  { name: "獅子林", name_en: "Lion Grove Garden", description: "假山迷宮園林", category: "庭園", type: "heritage", tags: ["世界遺產", "假山", "迷宮"], city: "蘇州", country: "china" },
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

  const allAttractions = [...europeAttractions, ...chinaAttractions];
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
