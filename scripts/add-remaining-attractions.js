// 新增剩餘的沖繩景點
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

const workspace_id = '8ef05a74-1f87-48ab-afd3-9bfeb423935d';

const attractions = [
  {
    city: "本部町",
    name: "沖繩美麗海水族館",
    type: "theme_park",
    description: "沖繩最具代表性的景點，擁有世界最大的壓克力觀景窗「黑潮之海」（長35m x 高10m x 深27m）。館內飼養多隻鯨鯊與鬼蝠魟，是全球少數能同時展示兩種巨型魚類的水族館。",
    duration_minutes: 240,
    opening_hours: "8:30-18:30（夏季至20:00）",
    tags: ["鯨鯊", "黑潮之海", "世界第一", "鬼蝠魟", "海豚表演", "親子必去", "珊瑚礁", "海龜"],
    notes: "16:00後門票優惠。黑潮之海餵食秀15:00和17:00。海豚表演免費。附近有翡翠海灘可順遊。"
  },
  {
    city: "今歸仁村",
    name: "古宇利島",
    type: "nature",
    description: "透過古宇利大橋連接的離島，有「戀之島」美稱。傳說這裡是沖繩版亞當與夏娃的誕生地。心形礁岩「Heart Rock」因偶像劇取景一躍成名，翡翠色海水清澈見底。",
    duration_minutes: 150,
    opening_hours: "全天開放",
    tags: ["戀之島", "心形岩", "古宇利大橋", "翡翠海", "偶像劇取景", "海膽丼", "浮潛聖地", "日落美景"],
    notes: "建議租車前往。Heart Rock在島的北端。「しらさ食堂」的海膽丼超有名但要排隊。"
  },
  {
    city: "讀谷村",
    name: "殘波岬",
    type: "nature",
    description: "沖繩本島最西端的海岬，高30公尺的斷崖絕壁綿延約2公里。純白的殘波岬燈塔是地標，可登頂眺望東海。夕陽西下時的景色被譽為沖繩最美。",
    duration_minutes: 60,
    opening_hours: "燈塔9:00-16:30",
    tags: ["斷崖絕壁", "燈塔", "夕陽勝地", "沖繩最西", "海景步道", "攝影勝地", "免費入場", "自然景觀"],
    notes: "燈塔登頂300日圓。夕陽時刻最美。附近有殘波之驛可用餐購物。"
  },
  {
    city: "河口湖",
    name: "富士山五合目",
    type: "nature",
    description: "富士山登山的起點，海拔約2300公尺。即使不登山也能搭巴士抵達，近距離感受日本第一高峰的壯觀。五合目有商店、餐廳、神社，是欣賞富士山最近距離的觀光地。",
    duration_minutes: 120,
    opening_hours: "依季節開放（7-9月全天，其他季節限時）",
    tags: ["富士山", "日本最高峰", "登山起點", "雲海", "御來光", "高山體驗", "紀念品", "神社"],
    notes: "7-8月開山期間人潮最多。高山反應注意慢慢走。冬季道路封閉需確認。巴士從河口湖站約50分鐘。"
  },
  {
    city: "河口湖",
    name: "河口湖畔",
    type: "nature",
    description: "富士五湖中最具觀光價值的湖泊，湖面倒映富士山的「逆富士」是經典美景。沿湖有溫泉旅館、美術館、遊覽船。每年11月的紅葉迴廊是人氣攝影景點。",
    duration_minutes: 180,
    opening_hours: "全天開放",
    tags: ["逆富士", "富士五湖", "溫泉", "紅葉", "遊覽船", "美術館", "纜車", "攝影勝地"],
    notes: "天上山纜車可俯瞰河口湖與富士山。音樂之森美術館很適合情侶。紅葉迴廊11月中最美。"
  }
];

async function addAttractions() {
  console.log('新增沖繩及河口湖景點...\n');

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, country_id');

  const cityMap = {};
  cities.forEach(c => cityMap[c.name] = { id: c.id, country_id: c.country_id });

  let added = 0;

  for (const item of attractions) {
    const cityData = cityMap[item.city];
    if (!cityData) {
      console.log(`✗ 找不到城市: ${item.city}`);
      continue;
    }

    const { error } = await supabase
      .from('attractions')
      .insert({
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
      });

    if (error) {
      if (error.code === '23505') {
        console.log(`⟳ 已存在: ${item.name}`);
      } else {
        console.log(`✗ 新增失敗: ${item.name} - ${error.message}`);
      }
    } else {
      console.log(`✓ 已新增: ${item.name}`);
      added++;
    }
  }

  console.log(`\n完成！新增: ${added} 筆`);
}

addAttractions();
