// 深度優化韓國景點資料
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

const workspace_id = '8ef05a74-1f87-48ab-afd3-9bfeb423935d';

const attractions = [
  // === 首爾深度景點 ===
  {
    city: "首爾",
    name: "昌德宮秘苑",
    type: "landmark",
    description: "朝鮮王朝五大宮殿中保存最完整的宮殿，1997年列入世界文化遺產。後苑（秘苑）是國王的御花園，佔地約30萬坪，有300年以上古木與300多種植物。需預約導覽才能入內。",
    duration_minutes: 120,
    opening_hours: "9:00-18:00（冬季至17:30），週一休",
    tags: ["世界遺產", "朝鮮王宮", "秘苑", "古木森林", "預約制", "四季庭園", "歷史遺跡", "導覽行程"],
    notes: "秘苑必須預約導覽，每梯次90分鐘。網路預約：www.cdg.go.kr。門票5000韓元，秘苑另加5000韓元。"
  },
  {
    city: "首爾",
    name: "N首爾塔",
    type: "landmark",
    description: "首爾地標，位於南山頂端海拔480公尺處。展望台可360度俯瞰首爾全景，夜景尤其浪漫。愛情鎖牆是情侶必訪，數位觀景台有互動體驗。每晚有燈光秀。",
    duration_minutes: 90,
    opening_hours: "10:00-23:00（週六至24:00）",
    tags: ["首爾地標", "360度全景", "夜景", "愛情鎖", "約會勝地", "南山", "纜車", "燈光秀"],
    notes: "可搭南山纜車或爬南山步道上去。展望台門票16000韓元。建議傍晚去看日落和夜景。"
  },
  {
    city: "首爾",
    name: "弘大商圈",
    type: "shopping",
    description: "韓國年輕人與藝術的聖地，以弘益大學為中心發展的潮流商圈。街頭藝人表演、塗鴉藝術、獨立咖啡廳、地下購物街應有盡有。夜間活動豐富，是首爾夜生活重心。",
    duration_minutes: 240,
    opening_hours: "全天（商店約12:00-22:00）",
    tags: ["年輕人聖地", "街頭藝術", "夜生活", "潮流服飾", "咖啡廳", "夜店", "美妝購物", "週末市集"],
    notes: "週六下午有自由市場和街頭表演。夜店一條街「想像空間」是知名夜店區。建議下午到晚上安排。"
  },
  {
    city: "首爾",
    name: "三清洞",
    type: "shopping",
    description: "傳統韓屋與現代設計融合的文青街區，緊鄰北村韓屋村和景福宮。狹窄巷弄中隱藏著特色咖啡廳、藝廊、設計選品店。擁有首爾最美的街道之一美譽。",
    duration_minutes: 150,
    opening_hours: "各店約10:00-21:00",
    tags: ["文青街區", "韓屋", "設計選品", "藝廊", "特色咖啡", "首爾最美街道", "北村韓屋", "復古氛圍"],
    notes: "可與北村韓屋村、景福宮安排同一天。週末人較多。藍瓶咖啡、CAFE BORA紫薯甜點是人氣店。"
  },
  {
    city: "首爾",
    name: "梨花女子大學",
    type: "landmark",
    description: "1886年創校的韓國第一所女子大學，校園建築兼具歐式與現代風格。「ECC」地下校園是建築大師Dominique Perrault設計，如同峽谷般壯觀。是韓劇取景勝地。",
    duration_minutes: 60,
    opening_hours: "校園全天開放",
    tags: ["校園美景", "歐式建築", "ECC地下校園", "韓劇取景", "梨花壁畫", "女子大學", "免費參觀", "建築設計"],
    notes: "校門口到ECC的斜坡很適合拍照。正門旁的「梨花52」商店街可購物用餐。建議搭配新村商圈一起逛。"
  },
  {
    city: "首爾",
    name: "汝矣島漢江公園",
    type: "nature",
    description: "首爾最大的漢江公園，春季有1800棵櫻花形成「輪中路櫻花道」，是首爾最美賞櫻景點。可租自行車沿江騎行，河邊野餐、騎電動滑板車是韓國年輕人假日首選。",
    duration_minutes: 180,
    opening_hours: "全天開放",
    tags: ["櫻花道", "漢江野餐", "自行車", "夜景", "汝矣島", "春季賞櫻", "遊覽船", "電動滑板車"],
    notes: "4月第一週櫻花祭期間超多人。便利商店可買炸雞配啤酒在河邊野餐。晚上汝矣島大橋噴水秀（夏季限定）。"
  },
  {
    city: "首爾",
    name: "東大門設計廣場DDP",
    type: "landmark",
    description: "由建築女王Zaha Hadid設計的未來主義建築，流線型銀色外觀被稱為「太空船」。是首爾時裝週主會場，常設有藝術展覽。夜間LED玫瑰花園超級浪漫。",
    duration_minutes: 90,
    opening_hours: "10:00-21:00（週一休，廣場24小時）",
    tags: ["Zaha Hadid", "未來建築", "LED玫瑰園", "夜景", "設計", "時裝週", "藝術展覽", "網美打卡"],
    notes: "LED玫瑰園晚上更美。週邊東大門市場可逛街購物。經常有各種設計展覽，需另購票。"
  },
  {
    city: "首爾",
    name: "樂天世界",
    type: "theme_park",
    description: "金氏世界紀錄認證的全球最大室內主題樂園「探險世界」，加上戶外的「魔幻島」。有過山車、旋轉木馬、遊行表演。樂天水族館、樂天塔117也在同一園區。",
    duration_minutes: 480,
    opening_hours: "10:00-21:00（週末至22:00）",
    tags: ["室內樂園", "過山車", "魔幻島", "遊行表演", "樂天塔", "親子遊", "韓國最大", "水族館"],
    notes: "門票約62000韓元。下雨天也能玩，室內設施豐富。可買combo票一起逛樂天塔展望台。"
  },
  // === 釜山深度景點 ===
  {
    city: "釜山",
    name: "海雲台海水浴場",
    type: "nature",
    description: "韓國最著名的海灘，白沙綿延1.5公里。夏天是避暑勝地，冬天可欣賞日出。周邊有海雲台市場、冬柏島海上散步道、The Bay 101夜景餐廳。是釜山必去景點。",
    duration_minutes: 180,
    opening_hours: "全天開放（海水浴季6-8月）",
    tags: ["韓國第一海灘", "白沙灘", "海景", "The Bay 101", "冬柏島", "日出", "海鮮餐廳", "釜山代表"],
    notes: "夏天非常擁擠。The Bay 101是看夜景喝咖啡的熱門地點。冬柏島的APEC世峰樓可免費參觀。"
  },
  {
    city: "釜山",
    name: "甘川文化村",
    type: "landmark",
    description: "被稱為「韓國的聖托里尼」，彩色房屋層層疊疊蓋在山坡上。1950年代韓戰難民聚落，現在轉型為藝術村。小王子雕像、魚型裝置藝術是必拍景點。",
    duration_minutes: 120,
    opening_hours: "9:00-18:00（3-11月至17:00）",
    tags: ["彩虹村", "韓國聖托里尼", "小王子", "拍照景點", "藝術村", "壁畫村", "階梯街", "手作體驗"],
    notes: "建議穿好走的鞋，階梯很多。可購買地圖蓋章換明信片。咖啡廳露台看海景很棒。交通：地鐵土城站轉公車。"
  },
  {
    city: "釜山",
    name: "廣安里海灘",
    type: "nature",
    description: "以廣安大橋夜景聞名的海灘，是釜山夜景最美的地方。沙灘邊有酒吧、咖啡廳、海鮮餐廳一字排開。每年10月釜山煙火節在此舉辦，煙火配合橋景堪稱絕景。",
    duration_minutes: 150,
    opening_hours: "全天開放",
    tags: ["廣安大橋", "夜景", "煙火節", "海景酒吧", "約會勝地", "海鮮一條街", "釜山夜景", "沙灘散步"],
    notes: "10月煙火節要提早訂住宿。晚上7-8點橋點燈最美。沿岸咖啡廳二樓視野最好。"
  },
  {
    city: "釜山",
    name: "札嘎其市場",
    type: "food",
    description: "韓國最大的海鮮市場，「札嘎其阿嬤」是釜山的象徵。一樓買海鮮二樓加工料理，可現挑現煮。鮑魚、活章魚、生魚片、烤貝類都是必吃。凌晨4點起就開始營業。",
    duration_minutes: 120,
    opening_hours: "5:00-22:00",
    tags: ["韓國最大海鮮市場", "活海鮮", "生魚片", "烤貝類", "活章魚", "札嘎其阿嬤", "現吃現煮", "釜山美食"],
    notes: "可以砍價但要有技巧。加工費另計約5000-10000韓元。不吃生食的話可選烤或煮。推薦鮑魚、海螺、比目魚。"
  },
  {
    city: "釜山",
    name: "海東龍宮寺",
    type: "temple",
    description: "韓國唯一建在海邊岩壁上的寺廟，創建於1376年高麗時代。面朝大海的觀音菩薩像氣勢磅礴，108階石階通往海邊的祈願岩。元旦日出和農曆新年特別熱門。",
    duration_minutes: 90,
    opening_hours: "5:00-日落",
    tags: ["海邊寺廟", "觀音菩薩", "日出聖地", "許願", "108階梯", "海景", "高麗古剎", "能量景點"],
    notes: "建議日出前抵達看海上日出。入口到寺廟步行約10分鐘。可順遊附近的機張市場吃雪蟹。"
  },
  // === 濟州島深度景點 ===
  {
    city: "濟州",
    name: "城山日出峰",
    type: "nature",
    description: "世界自然遺產，海拔182公尺的火山口。是韓國觀看日出的第一勝地，火山口內草原如綠色碗狀。頂峰可俯瞰整個火山口與濟州海岸線，美不勝收。",
    duration_minutes: 120,
    opening_hours: "日出前1小時-20:00（冬季至19:00）",
    tags: ["世界自然遺產", "火山口", "日出勝地", "濟州象徵", "登山步道", "海女", "絕景", "UNESCO"],
    notes: "登頂約25分鐘，階梯較多但不難。山下有海女表演和烤貝類。門票5000韓元。日出時間需查詢。"
  },
  {
    city: "濟州",
    name: "涉地可支",
    type: "nature",
    description: "濟州東部最美的海岸散步道，因韓劇《ALL IN》取景而聞名。油菜花田、海岸懸崖、燈塔構成絕美畫面。旁邊的濟州民俗村展示傳統茅草屋。",
    duration_minutes: 90,
    opening_hours: "全天開放",
    tags: ["韓劇取景", "油菜花", "海岸步道", "燈塔", "民俗村", "攝影勝地", "春季限定", "濟州東部"],
    notes: "4月油菜花季最美。與城山日出峰距離近可安排同一天。步道約30分鐘可走完。"
  },
  {
    city: "濟州",
    name: "牛島",
    type: "nature",
    description: "濟州東邊的小島，形狀像臥牛而得名。有翡翠色的下牛牧沙灘、紅色火山岩海岸、油菜花田。繞島一圈約4小時，可租電動車或自行車環島。花生冰淇淋是必吃。",
    duration_minutes: 240,
    opening_hours: "渡輪7:00-17:00（依季節調整）",
    tags: ["離島", "翡翠海", "紅色岩岸", "電動車環島", "花生冰淇淋", "潛水", "珊瑚礁", "小島慢活"],
    notes: "從城山港搭渡輪15分鐘。來回渡輪8500韓元。建議租電動車環島約2小時。夏天可浮潛。"
  },
  {
    city: "濟州",
    name: "漢拏山國立公園",
    type: "nature",
    description: "韓國最高峰（1950公尺），韓國三大靈山之一。有多條登山路線，白鹿潭火山湖是山頂絕景。一年四季風景各異：春季杜鵑、夏季綠林、秋季楓紅、冬季雪景。",
    duration_minutes: 420,
    opening_hours: "依路線不同（城板岳路線日出-14:30入山）",
    tags: ["韓國最高峰", "白鹿潭", "火山湖", "登山", "四季美景", "杜鵑花", "雪景", "靈山"],
    notes: "登頂需7-9小時，務必早起。御里牧路線較容易適合初學者。山頂天氣多變需備足裝備。"
  }
];

async function enhanceKorea() {
  console.log('開始深度優化韓國景點資料...\n');

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
        // 已存在，更新
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

enhanceKorea();
