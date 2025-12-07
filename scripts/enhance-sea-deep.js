// 深度優化東南亞景點資料
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

const workspace_id = '8ef05a74-1f87-48ab-afd3-9bfeb423935d';

const attractions = [
  // === 泰國曼谷深度景點 ===
  {
    city: "曼谷",
    name: "鄭王廟黎明寺",
    type: "temple",
    description: "曼谷最具代表性的地標，高82公尺的中央佛塔是泰國最高的大乘佛塔。以彩瓷和貝殼裝飾，在日出日落時分閃耀金光。可登上塔身欣賞湄南河景色，夜間點燈更加壯觀。",
    duration_minutes: 90,
    opening_hours: "8:00-18:00",
    tags: ["曼谷地標", "黎明寺", "湄南河", "日落絕景", "夜間點燈", "登塔體驗", "彩瓷裝飾", "攝影聖地"],
    notes: "需著過膝褲裝和有袖上衣。登塔樓梯非常陡峭需小心。河對岸臥佛寺可搭船過來。門票100泰銖。"
  },
  {
    city: "曼谷",
    name: "玉佛寺",
    type: "temple",
    description: "泰國最神聖的佛教寺廟，位於大皇宮內。供奉66公分高的翡翠玉佛，國王會在每年換季親自為玉佛更衣。建築金碧輝煌，融合泰式、中式、西式風格。",
    duration_minutes: 120,
    opening_hours: "8:30-15:30",
    tags: ["翡翠玉佛", "大皇宮", "皇家寺廟", "金碧輝煌", "泰國國寶", "換季更衣", "必訪景點", "UNESCO"],
    notes: "需著正式服裝，可在門口租借。與大皇宮套票500泰銖。早上9點前或下午3點後人較少。禁止攝影。"
  },
  {
    city: "曼谷",
    name: "美功鐵道市集",
    type: "shopping",
    description: "全球最危險的市集，攤販就擺在鐵軌上，火車經過時攤販收起遮陽棚讓火車通過，火車一過立刻恢復營業。一天約8班火車，是曼谷最獨特的體驗。",
    duration_minutes: 180,
    opening_hours: "6:00-17:00（火車時間：8:30、11:10、14:30、17:40）",
    tags: ["鐵道市集", "火車穿越", "世界奇觀", "傳統市場", "海鮮市場", "打卡景點", "在地體驗", "半日遊"],
    notes: "從曼谷市區需1.5小時車程。建議搭配安帕瓦水上市場一日遊。火車時刻表可能調整請確認。注意安全不要太靠近軌道。"
  },
  {
    city: "曼谷",
    name: "Jodd Fairs夜市",
    type: "food",
    description: "曼谷最新網紅夜市，取代已關閉的拉差達火車夜市成為新寵。分為Jodd Fairs Dan Neramit和Jodd Fairs Vibhavadi兩區，有各種創意小吃、服飾、手作商品。火山排骨是招牌美食。",
    duration_minutes: 150,
    opening_hours: "16:00-24:00",
    tags: ["網紅夜市", "火山排骨", "文青夜市", "曼谷夜生活", "IG打卡", "創意小吃", "潮流購物", "現場音樂"],
    notes: "火山排骨大約200-300泰銖。建議傍晚5點多抵達避開人潮。兩個地點相距不遠可以都逛。"
  },
  {
    city: "曼谷",
    name: "暹羅天地ICONSIAM",
    type: "shopping",
    description: "曼谷最奢華的購物中心，耗資540億泰銖打造。結合精品百貨、室內水上市場、泰國文化藝術。SookSiam區重現泰國77府特色，每晚有湄南河水舞燈光秀。",
    duration_minutes: 240,
    opening_hours: "10:00-22:00",
    tags: ["奢華百貨", "室內水上市場", "水舞秀", "精品購物", "泰國文化", "高空餐廳", "湄南河畔", "建築設計"],
    notes: "有免費接駁船從Saphan Taksin BTS站。水舞秀每晚19:00、20:00。SookSiam可以體驗泰國各地小吃。"
  },
  {
    city: "曼谷",
    name: "王權雲頂大樓Mahanakhon",
    type: "landmark",
    description: "泰國最高建築（314公尺），獨特的「像素化」外觀設計。78樓的透明玻璃地板SkyWalk讓人腳軟，360度俯瞰曼谷全景。頂樓酒吧是欣賞曼谷夜景的絕佳地點。",
    duration_minutes: 90,
    opening_hours: "10:00-24:00",
    tags: ["泰國最高樓", "玻璃地板", "360度全景", "夜景", "像素建築", "SkyWalk", "頂樓酒吧", "打卡景點"],
    notes: "門票約880泰銖。建議傍晚去看日落和夜景。頂樓酒吧有低消。穿裙子的話玻璃地板下會用布遮住。"
  },
  // === 泰國清邁深度景點 ===
  {
    city: "清邁",
    name: "素帖寺雙龍寺",
    type: "temple",
    description: "清邁最神聖的寺廟，位於素帖山上海拔1080公尺。306階那迦龍梯直達山頂，金塔內供奉釋迦牟尼佛舍利。登塔可俯瞰清邁市區全景。",
    duration_minutes: 120,
    opening_hours: "6:00-18:00",
    tags: ["清邁必訪", "金塔舍利", "雙龍階梯", "山頂寺廟", "市區全景", "佛教聖地", "素帖山", "日落勝地"],
    notes: "可搭雙條車或纜車上山。需脫鞋入寺。穿著需莊重。下午4-5點的日落景色最美。門票50泰銖。"
  },
  {
    city: "清邁",
    name: "帕辛寺",
    type: "temple",
    description: "清邁規模最大、地位最崇高的寺廟，建於1345年蘭納王朝時期。供奉著名的帕辛佛像，每年潑水節會被抬出來遊行。藏經閣的精美雕刻是蘭納藝術代表作。",
    duration_minutes: 60,
    opening_hours: "5:00-20:30",
    tags: ["蘭納藝術", "帕辛佛像", "潑水節", "清邁最大寺", "藏經閣", "金塔", "古城地標", "免費參觀"],
    notes: "位於古城內西邊。潑水節期間非常熱鬧。可與其他古城寺廟一起安排。免費入場但可隨喜捐獻。"
  },
  {
    city: "清邁",
    name: "清邁夜間動物園",
    type: "theme_park",
    description: "泰國唯一的夜間動物園，可搭乘遊園車近距離觀看獅子、長頸鹿、斑馬等動物的夜間活動。還有步行區可以餵食動物。夜間雷射水舞秀是必看表演。",
    duration_minutes: 240,
    opening_hours: "11:00-22:00（夜間遊園18:00開始）",
    tags: ["夜間動物園", "遊園車", "餵食體驗", "親子必去", "水舞秀", "獅子", "長頸鹿", "泰國唯一"],
    notes: "建議下午5點到，先逛白天區再參加夜間遊園。門票約800泰銖。餵食動物另購飼料約50泰銖。"
  },
  // === 新加坡深度景點 ===
  {
    city: "新加坡",
    name: "濱海灣金沙",
    type: "landmark",
    description: "新加坡最著名的地標，三棟大樓頂端以空中花園「金沙空中花園」連接。無邊際泳池是世界最大的高空泳池（房客限定），觀景台對外開放。每晚有免費的水幕燈光秀「幻彩生輝」。",
    duration_minutes: 180,
    opening_hours: "觀景台9:30-22:00，燈光秀20:00&21:00",
    tags: ["新加坡地標", "無邊際泳池", "空中花園", "水幕燈光秀", "奢華酒店", "觀景台", "購物商城", "賭場"],
    notes: "無邊際泳池僅房客可使用。觀景台門票26新幣。燈光秀在B2濱海灣長廊觀看。商場有賭場、高級餐廳。"
  },
  {
    city: "新加坡",
    name: "濱海灣花園",
    type: "nature",
    description: "佔地101公頃的未來主義花園，擎天樹叢（Supertree Grove）是18棵高25-50公尺的人工樹。兩座冷室溫室：花穹（世界最大玻璃溫室）和雲霧林（35公尺高人工瀑布）。夜間燈光秀免費。",
    duration_minutes: 180,
    opening_hours: "戶外花園5:00-2:00，冷室9:00-21:00",
    tags: ["擎天樹", "花穹", "雲霧林", "燈光秀", "未來主義", "人工瀑布", "世界最大溫室", "新加坡必去"],
    notes: "戶外花園免費。冷室套票32新幣。OCBC Skyway空中步道8新幣。燈光秀19:45&20:45各15分鐘。"
  },
  {
    city: "新加坡",
    name: "聖淘沙環球影城",
    type: "theme_park",
    description: "東南亞唯一的環球影城，有7大主題區和24個遊樂設施。變形金剛3D對決、木乃伊復仇記是必玩。侏羅紀世界有亞洲獨家的雲霄飛車。比日本環球影城小但不擁擠。",
    duration_minutes: 480,
    opening_hours: "10:00-21:00（週末至22:00）",
    tags: ["環球影城", "變形金剛", "侏羅紀世界", "東南亞唯一", "親子遊", "過山車", "電影主題", "聖淘沙"],
    notes: "門票約82新幣。可買Express票省排隊時間。平日人較少。建議早上開園就進去。"
  },
  {
    city: "新加坡",
    name: "牛車水",
    type: "shopping",
    description: "新加坡最大的華人聚居區，充滿傳統建築和街頭小吃。佛牙寺龍華院供奉佛牙舍利，馬里安曼興都廟是最古老的印度教寺廟。Chinatown Heritage Centre展示早期移民歷史。",
    duration_minutes: 150,
    opening_hours: "各店約10:00-22:00",
    tags: ["唐人街", "佛牙寺", "傳統美食", "寶塔街", "中藥材", "復古店舖", "夜市", "文化遺產"],
    notes: "Smith Street美食街必吃雞飯、肉骨茶。可順遊麥士威熟食中心吃天天海南雞飯。夜間中秋節很熱鬧。"
  },
  // === 越南深度景點 ===
  {
    city: "胡志明市",
    name: "戰爭遺跡博物館",
    type: "museum",
    description: "展示越戰歷史的博物館，收藏美軍使用的戰車、直升機、炸彈。最震撼的是展示戰爭暴行和橙劑受害者的照片。是了解越戰歷史的重要場所，內容沉重但有教育意義。",
    duration_minutes: 120,
    opening_hours: "7:30-18:00",
    tags: ["越戰歷史", "戰爭博物館", "橙劑", "教育意義", "歷史遺跡", "反戰", "攝影展", "胡志明必去"],
    notes: "內容較沉重，有心理準備再去。門票40000越南盾（約50台幣）。展品有中英文說明。拍照需注意禮貌。"
  },
  {
    city: "胡志明市",
    name: "統一宮",
    type: "landmark",
    description: "原為南越總統府，1975年北越坦克攻入這裡標誌著越戰結束。保留當時總統辦公室、地下指揮室、直升機平台。是越南現代史的重要見證地。",
    duration_minutes: 90,
    opening_hours: "7:30-11:00, 13:00-16:00",
    tags: ["越戰終結地", "總統府", "歷史建築", "地下密室", "坦克展示", "統一標誌", "必訪景點", "60年代設計"],
    notes: "可看到1975年衝入的坦克。地下指揮室很有趣。門票40000越南盾。英文導覽另外收費。"
  },
  {
    city: "河內",
    name: "還劍湖",
    type: "nature",
    description: "河內市中心的著名湖泊，傳說黎利王在此湖得到神劍驅逐明朝，戰後神龜浮上來收回寶劍。湖心有龜塔，岸邊有玉山祠。是河內人晨運和傍晚散步的首選地點。",
    duration_minutes: 60,
    opening_hours: "全天開放，玉山祠8:00-17:00",
    tags: ["河內心臟", "傳說故事", "龜塔", "玉山祠", "散步", "歷史景點", "市區綠洲", "攝影勝地"],
    notes: "建議傍晚來散步看夜景。玉山祠門票30000越南盾。週末湖邊會有街頭表演。附近有很多咖啡廳。"
  },
  {
    city: "河內",
    name: "河內老城區三十六行街",
    type: "shopping",
    description: "河內最古老的商業區，因36種手工行業得名。每條街專賣一種商品：錫器街、絲綢街、藥材街等。狹窄街道兩旁是法式殖民建築與傳統筒狀屋。是體驗越南庶民生活的最佳地點。",
    duration_minutes: 180,
    opening_hours: "各店約8:00-22:00",
    tags: ["老城區", "36行街", "傳統商業", "越南體驗", "街頭小吃", "法式建築", "市場購物", "摩托車海"],
    notes: "過馬路要勇敢慢走，車會繞過你。蛋咖啡、河粉是必吃。週五六日傍晚有夜市。小心扒手。"
  },
  // === 越南下龍灣 ===
  {
    city: "下龍灣",
    name: "下龍灣遊船",
    type: "nature",
    description: "世界自然遺產，有近2000座石灰岩島嶼聳立海上。搭乘遊船穿梭島嶼間，參觀驚奇洞、天堂洞等鐘乳石洞。可選擇一日遊或過夜遊輪。被譽為「海上桂林」。",
    duration_minutes: 480,
    opening_hours: "遊船各時段出發",
    tags: ["世界遺產", "海上桂林", "石灰岩島", "鐘乳石洞", "遊船", "過夜船", "皮划艇", "UNESCO"],
    notes: "從河內車程約3.5小時。建議2天1夜過夜船行程。5-10月是旺季但可能有暴風雨。驚奇洞是最大的溶洞。"
  },
  // === 馬來西亞深度景點 ===
  {
    city: "吉隆坡",
    name: "雙峰塔KLCC",
    type: "landmark",
    description: "曾是世界最高建築（452公尺），至今仍是世界最高的雙塔。41-42樓的天橋和86樓觀景台對外開放。夜間打燈與KLCC公園噴水秀構成壯觀夜景。塔下購物中心是高級商場。",
    duration_minutes: 120,
    opening_hours: "9:00-21:00（週五13:00-14:30休息）",
    tags: ["吉隆坡地標", "最高雙塔", "天橋", "觀景台", "夜景", "KLCC公園", "噴水秀", "購物中心"],
    notes: "觀景台門票約98馬幣，建議網路預約。每晚有免費噴水秀（約20:00、21:00）。建議傍晚去看日落和夜景。"
  },
  {
    city: "吉隆坡",
    name: "黑風洞",
    type: "temple",
    description: "印度教聖地，有272階彩虹階梯通往石灰岩洞穴。42.7公尺高的金色室建陀神像矗立入口。每年大寶森節有上百萬信徒前來朝聖，場面壯觀。洞內有印度教神廟和猴子。",
    duration_minutes: 90,
    opening_hours: "6:00-21:00",
    tags: ["印度教聖地", "彩虹階梯", "石灰岩洞", "室建陀神像", "大寶森節", "猴子", "網紅景點", "免費入場"],
    notes: "需穿過膝服裝。階梯很多要有體力。小心猴子搶食物。1-2月大寶森節極度擁擠。距離市區約13公里。"
  }
];

async function enhanceSEA() {
  console.log('開始深度優化東南亞景點資料...\n');

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, country_id');

  const cityMap = {};
  cities.forEach(c => cityMap[c.name] = { id: c.id, country_id: c.country_id });

  let added = 0;
  let updated = 0;
  let errors = 0;

  for (const item of attractions) {
    const cityData = cityMap[item.city];
    if (!cityData) {
      console.log(`✗ 找不到城市: ${item.city}`);
      errors++;
      continue;
    }

    const insertData = {
      name: item.name,
      city_id: cityData.id,
      country_id: cityData.country_id,
      workspace_id,
      type: item.type,
      description: item.description,
      duration_minutes: item.duration_minutes,
      opening_hours: item.opening_hours,
      tags: item.tags,
      notes: item.notes
    };

    const { error } = await supabase
      .from('attractions')
      .insert(insertData);

    if (error) {
      if (error.code === '23505') {
        const { error: updateError } = await supabase
          .from('attractions')
          .update({
            description: item.description,
            duration_minutes: item.duration_minutes,
            opening_hours: item.opening_hours,
            tags: item.tags,
            notes: item.notes
          })
          .eq('name', item.name);

        if (updateError) {
          console.log(`✗ 更新失敗: ${item.name} - ${updateError.message}`);
          errors++;
        } else {
          console.log(`⟳ 已更新: ${item.name}`);
          updated++;
        }
      } else {
        console.log(`✗ 新增失敗: ${item.name} - ${error.message}`);
        errors++;
      }
    } else {
      console.log(`✓ 已新增: ${item.name}`);
      added++;
    }
  }

  console.log(`\n完成！新增: ${added} 筆, 更新: ${updated} 筆, 錯誤: ${errors} 筆`);
}

enhanceSEA();
