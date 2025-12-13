const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://pfqvdacxowpgfamuvnsn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE"
);

async function assignCitiesToRegions() {
  // 城市到區域的對照表（根據日本地理）
  const cityRegionMap = {
    // 北海道 jp_hokkaido
    "札幌": "jp_hokkaido", "Sapporo": "jp_hokkaido",
    "函館": "jp_hokkaido", "Hakodate": "jp_hokkaido",
    "小樽": "jp_hokkaido", "Otaru": "jp_hokkaido",
    "旭川": "jp_hokkaido", "Asahikawa": "jp_hokkaido",
    "富良野": "jp_hokkaido", "Furano": "jp_hokkaido",
    "美瑛": "jp_hokkaido", "Biei": "jp_hokkaido",
    "登別": "jp_hokkaido", "Noboribetsu": "jp_hokkaido",
    "洞爺湖": "jp_hokkaido", "toyako": "jp_hokkaido",
    "二世谷": "jp_hokkaido", "Niseko": "jp_hokkaido",
    "釧路": "jp_hokkaido", "Kushiro": "jp_hokkaido",

    // 東北 jp_tohoku
    "仙台": "jp_tohoku", "Sendai": "jp_tohoku",
    "青森": "jp_tohoku", "Aomori": "jp_tohoku",
    "秋田": "jp_tohoku", "Akita": "jp_tohoku",
    "山形": "jp_tohoku", "Yamagata": "jp_tohoku",
    "盛岡": "jp_tohoku", "Morioka": "jp_tohoku",
    "弘前": "jp_tohoku", "Hirosaki": "jp_tohoku",
    "角館": "jp_tohoku", "Kakunodate": "jp_tohoku",
    "松島": "jp_tohoku", "Matsushima": "jp_tohoku",

    // 關東 jp_kanto
    "東京": "jp_kanto", "Tokyo": "jp_kanto",
    "橫濱": "jp_kanto", "Yokohama": "jp_kanto",
    "川崎": "jp_kanto", "Kawasaki": "jp_kanto",
    "千葉": "jp_kanto", "Chiba": "jp_kanto",
    "鎌倉": "jp_kanto", "Kamakura": "jp_kanto",
    "江之島": "jp_kanto", "Enoshima": "jp_kanto",
    "箱根": "jp_kanto", "Hakone": "jp_kanto",
    "日光": "jp_kanto", "Nikko": "jp_kanto",
    "川越": "jp_kanto", "Kawagoe": "jp_kanto",
    "河口湖": "jp_kanto",

    // 中部 jp_chubu
    "名古屋": "jp_chubu", "Nagoya": "jp_chubu",
    "金澤": "jp_chubu", "Kanazawa": "jp_chubu",
    "高山": "jp_chubu", "Takayama": "jp_chubu",
    "白川鄉": "jp_chubu", "Shirakawa-go": "jp_chubu",
    "富山": "jp_chubu", "Toyama": "jp_chubu",
    "立山": "jp_chubu", "Tateyama": "jp_chubu",
    "松本": "jp_chubu", "Matsumoto": "jp_chubu",
    "上高地": "jp_chubu", "Kamikochi": "jp_chubu",
    "下呂": "jp_chubu", "Gero": "jp_chubu",
    "福井": "jp_chubu", "Fukui": "jp_chubu",
    "七尾市": "jp_chubu", "Nanao": "jp_chubu",
    "羽咋市": "jp_chubu", "Hakui": "jp_chubu",
    "能登町": "jp_chubu", "Noto": "jp_chubu",

    // 關西 jp_kansai
    "大阪": "jp_kansai", "Osaka": "jp_kansai",
    "京都": "jp_kansai", "Kyoto": "jp_kansai",
    "奈良": "jp_kansai", "Nara": "jp_kansai",
    "神戶": "jp_kansai", "Kobe": "jp_kansai",
    "姬路": "jp_kansai", "Himeji": "jp_kansai",
    "和歌山": "jp_kansai", "Wakayama": "jp_kansai",
    "宇治": "jp_kansai", "Uji": "jp_kansai",
    "嵐山": "jp_kansai", "Arashiyama": "jp_kansai",
    "高野山": "jp_kansai", "Koyasan": "jp_kansai",
    "伊勢": "jp_kansai", "Ise": "jp_kansai",

    // 中國 jp_chugoku
    "廣島": "jp_chugoku", "Hiroshima": "jp_chugoku",
    "岡山": "jp_chugoku", "Okayama": "jp_chugoku",
    "倉敷": "jp_chugoku", "Kurashiki": "jp_chugoku",
    "尾道": "jp_chugoku", "Onomichi": "jp_chugoku",
    "山口": "jp_chugoku", "Yamaguchi": "jp_chugoku",
    "島根": "jp_chugoku", "Shimane": "jp_chugoku",
    "鳥取": "jp_chugoku", "Tottori": "jp_chugoku",

    // 四國 jp_shikoku
    "高松": "jp_shikoku", "Takamatsu": "jp_shikoku",
    "松山": "jp_shikoku", "Matsuyama": "jp_shikoku",
    "高知": "jp_shikoku", "Kochi": "jp_shikoku",
    "德島": "jp_shikoku", "Tokushima": "jp_shikoku",
    "鳴門": "jp_shikoku", "Naruto": "jp_shikoku",
    "琴平": "jp_shikoku", "Kotohira": "jp_shikoku",
    "宇和島": "jp_shikoku", "Uwajima": "jp_shikoku",

    // 九州 jp_kyushu
    "福岡": "jp_kyushu", "Fukuoka": "jp_kyushu",
    "長崎": "jp_kyushu", "Nagasaki": "jp_kyushu",
    "熊本": "jp_kyushu", "Kumamoto": "jp_kyushu",
    "鹿兒島": "jp_kyushu", "Kagoshima": "jp_kyushu",
    "別府": "jp_kyushu", "Beppu": "jp_kyushu",
    "由布院": "jp_kyushu", "Yufuin": "jp_kyushu",
    "宮崎": "jp_kyushu", "Miyazaki": "jp_kyushu",
    "阿蘇": "jp_kyushu", "Aso": "jp_kyushu",
    "高千穗": "jp_kyushu", "Takachiho": "jp_kyushu",
    "柳川": "jp_kyushu", "yanagawa": "jp_kyushu",
    "屋久島": "jp_kyushu", "Yakushima": "jp_kyushu",

    // 沖繩 jp_okinawa
    "沖繩": "jp_okinawa", "Okinawa": "jp_okinawa",
    "那霸": "jp_okinawa", "Naha": "jp_okinawa",
    "石垣島": "jp_okinawa", "Ishigaki": "jp_okinawa",
    "宮古島": "jp_okinawa", "Miyako": "jp_okinawa",
    "竹富島": "jp_okinawa", "Taketomi": "jp_okinawa",
    "西表島": "jp_okinawa", "Iriomote": "jp_okinawa",
    "座間味島": "jp_okinawa", "Zamami": "jp_okinawa",
    "今歸仁村": "jp_okinawa",
    "本部町": "jp_okinawa",
    "讀谷村": "jp_okinawa",
  };

  // 取得所有日本城市
  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, name_en, region_id")
    .eq("country_id", "japan");

  let updated = 0;
  let skipped = 0;
  let notFound = [];

  for (const city of cities || []) {
    // 嘗試用中文名或英文名找區域
    const regionId = cityRegionMap[city.name] || cityRegionMap[city.name_en] || cityRegionMap[city.id];

    if (regionId) {
      if (city.region_id !== regionId) {
        const { error } = await supabase
          .from("cities")
          .update({ region_id: regionId })
          .eq("id", city.id);

        if (!error) {
          updated++;
          console.log("  更新:", city.name, "->", regionId);
        }
      } else {
        skipped++;
      }
    } else {
      notFound.push(city.name + " (" + (city.name_en || city.id) + ")");
    }
  }

  console.log("\n【更新結果】");
  console.log("  已更新:", updated, "個城市");
  console.log("  已跳過:", skipped, "個城市（已有正確區域）");
  console.log("  未找到對照:", notFound.length, "個城市");
  if (notFound.length > 0) {
    console.log("\n【需手動處理的城市】");
    notFound.forEach(c => console.log("  -", c));
  }
}

assignCitiesToRegions();
