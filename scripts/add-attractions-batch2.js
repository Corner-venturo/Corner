const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://pfqvdacxowpgfamuvnsn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI"
);

async function getCityId(cityName, countryId) {
  const { data } = await supabase
    .from("cities")
    .select("id")
    .eq("country_id", countryId)
    .ilike("name", "%" + cityName + "%")
    .limit(1);
  return data?.[0]?.id || null;
}

async function addMoreAttractions() {
  const workspaceId = "8ef05a74-1f87-48ab-afd3-9bfeb423935d";

  // 越南景點和餐廳
  const vietnamData = [
    { name: "Gia", description: "米其林星級越南料理餐廳", category: "米其林餐廳", type: "food", tags: ["米其林", "越南料理"], city: "河內", country: "vietnam" },
    { name: "Tầm Vị", description: "米其林推薦傳統越南菜", category: "米其林餐廳", type: "food", tags: ["米其林", "越南料理"], city: "河內", country: "vietnam" },
    { name: "Cộng Cà Phê", name_en: "Cong Caphe", description: "復古共產主義風格網紅咖啡廳", category: "網紅咖啡廳", type: "food", tags: ["網紅", "咖啡", "復古"], city: "河內", country: "vietnam" },
    { name: "Tranquil Books & Coffee", description: "書香咖啡廳，文青必訪", category: "網紅咖啡廳", type: "food", tags: ["網紅", "咖啡", "書店"], city: "河內", country: "vietnam" },
    { name: "還劍湖", name_en: "Hoan Kiem Lake", description: "河內市中心歷史湖泊，龜塔地標", category: "自然景觀", type: "landmark", tags: ["地標", "湖泊", "必遊"], city: "河內", country: "vietnam" },
    { name: "河內大教堂", name_en: "St. Joseph Cathedral", description: "法國殖民時期哥德式教堂", category: "歷史建築", type: "heritage", tags: ["教堂", "歷史", "法式建築"], city: "河內", country: "vietnam" },
    { name: "三十六行街", name_en: "36 Streets", description: "河內老城區傳統商業街區", category: "購物街區", type: "shopping", tags: ["老街", "購物", "逛街"], city: "河內", country: "vietnam" },
    { name: "Anan Saigon", description: "Peter Cuong Franklin主廚現代越南料理，亞洲50最佳", category: "米其林餐廳", type: "food", tags: ["米其林", "Fine Dining", "創新"], city: "胡志明市", country: "vietnam" },
    { name: "The Desk Saigon", description: "米其林推薦餐廳", category: "米其林餐廳", type: "food", tags: ["米其林", "Fine Dining"], city: "胡志明市", country: "vietnam" },
    { name: "Cafe Apartment 咖啡公寓", name_en: "Cafe Apartment", description: "42 Nguyễn Huệ整棟老公寓改造咖啡廳，熱門打卡點", category: "網紅咖啡廳", type: "food", tags: ["網紅", "打卡", "咖啡"], city: "胡志明市", country: "vietnam" },
    { name: "The Workshop Coffee", description: "胡志明精品咖啡名店", category: "網紅咖啡廳", type: "food", tags: ["網紅", "精品咖啡"], city: "胡志明市", country: "vietnam" },
    { name: "L Usine", name_en: "L Usine", description: "法式工業風咖啡廳", category: "網紅咖啡廳", type: "food", tags: ["網紅", "法式", "工業風"], city: "胡志明市", country: "vietnam" },
    { name: "統一宮", name_en: "Independence Palace", description: "越南戰爭歷史遺址，前南越總統府", category: "歷史遺址", type: "heritage", tags: ["歷史", "戰爭", "博物館"], city: "胡志明市", country: "vietnam" },
    { name: "濱城市場", name_en: "Ben Thanh Market", description: "胡志明市最著名傳統市場", category: "市場", type: "market", tags: ["市場", "購物", "美食"], city: "胡志明市", country: "vietnam" },
    { name: "巴拿山", name_en: "Ba Na Hills", description: "法式山城度假區，佛手金橋打卡熱點", category: "主題園區", type: "attraction", tags: ["網紅", "打卡", "金橋", "纜車"], city: "峴港", country: "vietnam" },
    { name: "佛手金橋", name_en: "Golden Bridge", description: "巴拿山最著名打卡景點，巨型手掌托起橋梁", category: "網紅景點", type: "landmark", tags: ["網紅", "打卡", "地標", "必遊"], city: "峴港", country: "vietnam" },
    { name: "美溪海灘", name_en: "My Khe Beach", description: "Forbes評選世界最美海灘之一", category: "海灘", type: "beach", tags: ["海灘", "日出", "衝浪"], city: "峴港", country: "vietnam" },
  ];

  // 法國巴黎
  const parisData = [
    { name: "L Ambroisie", name_en: "L Ambroisie", description: "孚日廣場米其林三星經典法式料理", category: "米其林三星", type: "food", tags: ["米其林", "三星", "法式料理"], city: "巴黎", country: "france" },
    { name: "Alain Ducasse au Plaza Athénée", description: "Plaza Athénée酒店三星餐廳，蔬菜魚類精緻料理", category: "米其林三星", type: "food", tags: ["米其林", "三星", "法式料理"], city: "巴黎", country: "france" },
    { name: "Le Cinq", description: "四季酒店頂級三星餐廳", category: "米其林三星", type: "food", tags: ["米其林", "三星", "法式料理"], city: "巴黎", country: "france" },
    { name: "Guy Savoy", description: "藝術與美食結合的三星餐廳", category: "米其林三星", type: "food", tags: ["米其林", "三星", "法式料理"], city: "巴黎", country: "france" },
    { name: "Arpège", description: "Alain Passard蔬菜料理三星名店", category: "米其林三星", type: "food", tags: ["米其林", "三星", "蔬菜料理"], city: "巴黎", country: "france" },
    { name: "蒙馬特高地", name_en: "Montmartre", description: "藝術家聚集地，可俯瞰巴黎全景", category: "文藝街區", type: "attraction", tags: ["藝術", "景觀", "文青"], city: "巴黎", country: "france" },
    { name: "聖心堂", name_en: "Sacre Coeur", description: "蒙馬特山頂白色教堂，巴黎全景觀景點", category: "教堂", type: "temple", tags: ["教堂", "景觀", "地標"], city: "巴黎", country: "france" },
    { name: "瑪黑區", name_en: "Le Marais", description: "時尚購物和咖啡店聚集區", category: "購物街區", type: "shopping", tags: ["購物", "時尚", "咖啡"], city: "巴黎", country: "france" },
    { name: "莎士比亞書店", name_en: "Shakespeare and Company", description: "文青必訪百年書店", category: "網紅景點", type: "attraction", tags: ["書店", "文青", "打卡"], city: "巴黎", country: "france" },
    { name: "塞納河遊船", name_en: "Seine River Cruise", description: "浪漫的塞納河遊船體驗", category: "體驗活動", type: "experience", tags: ["遊船", "浪漫", "夜景"], city: "巴黎", country: "france" },
    { name: "奧賽博物館", name_en: "Musee d Orsay", description: "印象派藝術收藏博物館", category: "博物館", type: "museum", tags: ["博物館", "藝術", "印象派"], city: "巴黎", country: "france" },
    { name: "橘園美術館", name_en: "Musee de l Orangerie", description: "莫內睡蓮畫作收藏", category: "博物館", type: "museum", tags: ["博物館", "藝術", "莫內"], city: "巴黎", country: "france" },
    { name: "拉法葉百貨", name_en: "Galeries Lafayette", description: "巴黎著名百貨公司，穹頂打卡", category: "購物", type: "shopping", tags: ["購物", "百貨", "打卡"], city: "巴黎", country: "france" },
    { name: "花神咖啡館", name_en: "Cafe de Flore", description: "存在主義哲學家聚集的百年咖啡館", category: "網紅咖啡廳", type: "food", tags: ["咖啡", "歷史", "文學"], city: "巴黎", country: "france" },
    { name: "雙叟咖啡館", name_en: "Les Deux Magots", description: "海明威等作家常去的文學咖啡館", category: "網紅咖啡廳", type: "food", tags: ["咖啡", "歷史", "文學"], city: "巴黎", country: "france" },
  ];

  // 日本更多城市
  const japanMoreData = [
    { name: "一蘭拉麵總本店", name_en: "Ichiran Ramen", description: "豚骨拉麵發源地，隔間座位特色", category: "拉麵", type: "food", tags: ["拉麵", "豚骨", "必吃"], city: "福岡", country: "japan" },
    { name: "元祖博多明太子 ふくや", name_en: "Fukuya", description: "博多明太子創始店", category: "特產", type: "food", tags: ["明太子", "特產", "必買"], city: "福岡", country: "japan" },
    { name: "太宰府天滿宮", name_en: "Dazaifu Tenmangu", description: "學問之神菅原道真祀典，賞梅名所", category: "神社", type: "temple", tags: ["神社", "學業", "梅花"], city: "福岡", country: "japan" },
    { name: "柳川遊船", name_en: "Yanagawa River Cruise", description: "柳川市傳統遊船體驗", category: "體驗活動", type: "experience", tags: ["遊船", "傳統", "水鄉"], city: "福岡", country: "japan" },
    { name: "札幌拉麵橫丁", name_en: "Sapporo Ramen Yokocho", description: "聚集多家味噌拉麵名店的小巷", category: "美食街區", type: "food", tags: ["拉麵", "味噌", "必吃"], city: "札幌", country: "japan" },
    { name: "二條市場", name_en: "Nijo Market", description: "札幌百年市場，海鮮丼推薦", category: "市場", type: "market", tags: ["市場", "海鮮", "必吃"], city: "札幌", country: "japan" },
    { name: "白色戀人公園", name_en: "Shiroi Koibito Park", description: "白色戀人巧克力餅乾工廠觀光", category: "主題園區", type: "attraction", tags: ["甜點", "工廠", "必買"], city: "札幌", country: "japan" },
    { name: "札幌啤酒博物館", name_en: "Sapporo Beer Museum", description: "日本唯一啤酒博物館", category: "博物館", type: "museum", tags: ["啤酒", "博物館", "試飲"], city: "札幌", country: "japan" },
    { name: "神戶牛排 Mouriya", name_en: "Mouriya", description: "神戶牛專門店，在地人推薦", category: "和牛餐廳", type: "food", tags: ["神戶牛", "和牛", "Fine Dining"], city: "神戶", country: "japan" },
    { name: "神戶港塔", name_en: "Kobe Port Tower", description: "神戶地標紅色塔樓，港灣夜景", category: "地標", type: "landmark", tags: ["地標", "夜景", "港口"], city: "神戶", country: "japan" },
    { name: "北野異人館", name_en: "Kitano Ijinkan", description: "明治時代外國人居留地，歐風建築", category: "歷史街區", type: "heritage", tags: ["歷史", "歐風", "散步"], city: "神戶", country: "japan" },
    { name: "有馬溫泉", name_en: "Arima Onsen", description: "日本三大古湯之一，金湯銀湯", category: "溫泉", type: "experience", tags: ["溫泉", "金湯", "日歸"], city: "神戶", country: "japan" },
    { name: "金澤21世紀美術館", name_en: "21st Century Museum", description: "現代藝術美術館，泳池作品打卡", category: "博物館", type: "museum", tags: ["藝術", "現代", "打卡"], city: "金澤", country: "japan" },
    { name: "東茶屋街", name_en: "Higashi Chaya", description: "金澤傳統茶屋街，藝妓文化", category: "歷史街區", type: "heritage", tags: ["茶屋", "藝妓", "和服"], city: "金澤", country: "japan" },
    { name: "近江町市場", name_en: "Omicho Market", description: "金澤廚房，海鮮丼名店眾多", category: "市場", type: "market", tags: ["市場", "海鮮丼", "必吃"], city: "金澤", country: "japan" },
  ];

  // 韓國更多
  const koreaMoreData = [
    { name: "景福宮", name_en: "Gyeongbokgung", description: "首爾最大王宮，可租韓服參觀", category: "歷史遺址", type: "heritage", tags: ["王宮", "韓服", "必遊"], city: "首爾", country: "korea" },
    { name: "北村韓屋村", name_en: "Bukchon Hanok Village", description: "傳統韓屋保存區，網紅打卡", category: "歷史街區", type: "heritage", tags: ["韓屋", "打卡", "傳統"], city: "首爾", country: "korea" },
    { name: "明洞", name_en: "Myeongdong", description: "首爾最熱鬧購物區，美妝天堂", category: "購物街區", type: "shopping", tags: ["購物", "美妝", "逛街"], city: "首爾", country: "korea" },
    { name: "弘大自由市集", name_en: "Hongdae Free Market", description: "週末藝術家市集，表演活動", category: "市場", type: "market", tags: ["市集", "藝術", "音樂"], city: "首爾", country: "korea" },
    { name: "南山塔", name_en: "N Seoul Tower", description: "首爾地標，情侶愛情鎖", category: "地標", type: "landmark", tags: ["地標", "夜景", "情侶"], city: "首爾", country: "korea" },
    { name: "廣藏市場", name_en: "Gwangjang Market", description: "韓國傳統市場，綠豆煎餅麻藥飯捲", category: "市場", type: "market", tags: ["市場", "美食", "必吃"], city: "首爾", country: "korea" },
    { name: "聖水洞", name_en: "Seongsu-dong", description: "首爾布魯克林，網紅咖啡廳聚集", category: "文青街區", type: "attraction", tags: ["網紅", "咖啡", "文青"], city: "首爾", country: "korea" },
    { name: "城山日出峰", name_en: "Seongsan Ilchulbong", description: "世界自然遺產，看日出必去", category: "自然景觀", type: "nature", tags: ["日出", "世界遺產", "登山"], city: "濟州島", country: "korea" },
    { name: "萬丈窟", name_en: "Manjanggul Cave", description: "世界最長熔岩洞窟", category: "自然景觀", type: "nature", tags: ["洞窟", "世界遺產", "探險"], city: "濟州島", country: "korea" },
    { name: "涉地可支", name_en: "Seopjikoji", description: "電視劇拍攝地，海岸風光", category: "自然景觀", type: "nature", tags: ["海岸", "韓劇", "打卡"], city: "濟州島", country: "korea" },
    { name: "濟州黑豬肉一條街", name_en: "Jeju Black Pork Street", description: "濟州島必吃黑豬肉烤肉", category: "美食街區", type: "food", tags: ["黑豬肉", "烤肉", "必吃"], city: "濟州島", country: "korea" },
  ];

  // 泰國更多
  const thailandMoreData = [
    { name: "大皇宮", name_en: "Grand Palace", description: "曼谷最著名皇家建築群", category: "歷史遺址", type: "heritage", tags: ["皇宮", "必遊", "歷史"], city: "曼谷", country: "thailand" },
    { name: "鄭王廟", name_en: "Wat Arun", description: "黎明寺，曼谷地標性寺廟", category: "寺廟", type: "temple", tags: ["寺廟", "地標", "日落"], city: "曼谷", country: "thailand" },
    { name: "臥佛寺", name_en: "Wat Pho", description: "巨大臥佛像，泰式按摩發源地", category: "寺廟", type: "temple", tags: ["寺廟", "臥佛", "按摩"], city: "曼谷", country: "thailand" },
    { name: "恰圖恰週末市集", name_en: "Chatuchak Market", description: "東南亞最大戶外市場", category: "市場", type: "market", tags: ["市場", "購物", "必逛"], city: "曼谷", country: "thailand" },
    { name: "ICONSIAM", name_en: "ICONSIAM", description: "曼谷最新地標購物中心，水上市場", category: "購物中心", type: "shopping", tags: ["購物", "網紅", "打卡"], city: "曼谷", country: "thailand" },
    { name: "Mahanakhon SkyWalk", description: "曼谷最高大樓玻璃天空步道", category: "觀景台", type: "viewpoint", tags: ["景觀", "打卡", "玻璃步道"], city: "曼谷", country: "thailand" },
    { name: "素帖寺雙龍寺", name_en: "Wat Phra That Doi Suthep", description: "清邁最神聖寺廟，金光閃閃", category: "寺廟", type: "temple", tags: ["寺廟", "金塔", "必遊"], city: "清邁", country: "thailand" },
    { name: "清邁古城", name_en: "Chiang Mai Old City", description: "護城河圍繞的歷史城區", category: "歷史街區", type: "heritage", tags: ["古城", "寺廟", "散步"], city: "清邁", country: "thailand" },
    { name: "週日夜市", name_en: "Sunday Walking Street", description: "清邁最大夜市，塔佩門延伸", category: "夜市", type: "market", tags: ["夜市", "購物", "美食"], city: "清邁", country: "thailand" },
    { name: "大象自然公園", name_en: "Elephant Nature Park", description: "道德大象保護區體驗", category: "體驗活動", type: "experience", tags: ["大象", "動物保護", "體驗"], city: "清邁", country: "thailand" },
  ];

  // 獲取城市ID
  async function getCityIds() {
    const cities = {};
    const cityMappings = [
      { name: "河內", country: "vietnam" },
      { name: "胡志明", country: "vietnam" },
      { name: "峴港", country: "vietnam" },
      { name: "巴黎", country: "france" },
      { name: "福岡", country: "japan" },
      { name: "札幌", country: "japan" },
      { name: "神戶", country: "japan" },
      { name: "金澤", country: "japan" },
      { name: "首爾", country: "korea" },
      { name: "濟州島", country: "korea" },
      { name: "曼谷", country: "thailand" },
      { name: "清邁", country: "thailand" },
    ];

    for (const m of cityMappings) {
      cities[m.name] = await getCityId(m.name, m.country);
    }
    return cities;
  }

  const cityIds = await getCityIds();
  console.log("城市IDs:", JSON.stringify(cityIds, null, 2));

  // 組合所有資料
  const allData = [
    ...vietnamData,
    ...parisData,
    ...japanMoreData,
    ...koreaMoreData,
    ...thailandMoreData,
  ].map(a => {
    const cityId = cityIds[a.city] || null;
    if (!cityId) {
      console.log("找不到城市: " + a.city);
    }
    return {
      name: a.name,
      name_en: a.name_en,
      description: a.description,
      category: a.category,
      type: a.type,
      tags: a.tags,
      country_id: a.country,
      city_id: cityId,
      workspace_id: workspaceId,
    };
  }).filter(a => a.city_id);

  console.log("\n準備新增 " + allData.length + " 筆資料...");

  // 逐筆插入
  let successCount = 0;
  let skipCount = 0;

  for (const item of allData) {
    const { data, error } = await supabase
      .from("attractions")
      .insert(item)
      .select();

    if (error) {
      if (error.code === "23505") {
        skipCount++;
      } else {
        console.log("Error: " + item.name + " - " + error.message);
      }
    } else {
      successCount++;
    }
  }

  console.log("新增: " + successCount + " 筆, 跳過: " + skipCount + " 筆");

  const { count } = await supabase.from("attractions").select("*", { count: "exact", head: true });
  console.log("目前總數: " + count);
}

addMoreAttractions();
