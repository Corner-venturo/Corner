const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

// 各國景點資料
const countryData = {
  // 中國景點
  china: {
    '故宮博物院': { notes: '明清兩代皇宮，世界最大宮殿建築群，收藏百萬件珍貴文物，走完全程需要一整天。', duration_minutes: 300, lat: 39.9163, lng: 116.3972, ticket: '60人民幣（旺季）' },
    '長城': { notes: '世界七大奇蹟之一，八達嶺段最熱門，慕田峪段人少風景美，司馬台段保留原始風貌。', duration_minutes: 240, lat: 40.4319, lng: 116.5704, ticket: '40-65人民幣' },
    '天安門廣場': { notes: '世界最大城市廣場，見證中國近代重要歷史時刻，清晨升旗儀式莊嚴肅穆。', duration_minutes: 60, lat: 39.9054, lng: 116.3976, ticket: '免費' },
    '頤和園': { notes: '皇家園林典範，昆明湖佔全園四分之三，長廊彩繪共 14000 幅歷史故事。', duration_minutes: 180, lat: 39.9999, lng: 116.2755, ticket: '30人民幣' },
    '天壇': { notes: '明清皇帝祭天之所，祈年殿三重藍色琉璃瓦圓頂是中國建築經典符號。', duration_minutes: 120, lat: 39.8822, lng: 116.4066, ticket: '15人民幣' },
    '外灘': { notes: '上海百年租界風華，52 棟風格各異的萬國建築群，對岸陸家嘴天際線閃爍。', duration_minutes: 90, lat: 31.2400, lng: 121.4903, ticket: '免費' },
    '東方明珠塔': { notes: '上海地標建築，高 468 公尺，透明空中步道挑戰膽量，夜間彩燈璀璨。', duration_minutes: 120, lat: 31.2397, lng: 121.4998, ticket: '180人民幣起' },
    '西湖': { notes: '蘇軾詩中「欲把西湖比西子」的人間天堂，斷橋殘雪、蘇堤春曉皆是絕美意境。', duration_minutes: 180, lat: 30.2426, lng: 120.1485, ticket: '免費' },
    '兵馬俑': { notes: '秦始皇陵的守護軍團，8000 尊真人大小陶俑，每張臉都獨一無二，震撼世人。', duration_minutes: 180, lat: 34.3844, lng: 109.2783, ticket: '150人民幣' },
    '華山': { notes: '五嶽之西嶽，以險峻聞名天下，長空棧道與鷂子翻身是極限挑戰者的天堂。', duration_minutes: 480, lat: 34.4758, lng: 110.0891, ticket: '160人民幣' },
    '黃山': { notes: '迎客松、雲海、奇石、溫泉「四絕」聞名，徐霞客讚「五嶽歸來不看山」。', duration_minutes: 480, lat: 30.1396, lng: 118.1695, ticket: '190人民幣（旺季）' },
    '張家界': { notes: '阿凡達取景地，3000 多根砂岩石柱拔地而起，玻璃橋懸空 300 公尺挑戰心臟。', duration_minutes: 480, lat: 29.3249, lng: 110.4343, ticket: '225人民幣' },
    '九寨溝': { notes: '彩池、瀑布、雪峰、藏族風情構成人間仙境，「九寨歸來不看水」絕非虛言。', duration_minutes: 480, lat: 33.2600, lng: 103.9166, ticket: '169人民幣（旺季）' },
    '麗江古城': { notes: '納西族古城完整保留，小橋流水人家的浪漫氛圍，夜晚酒吧街熱鬧非凡。', duration_minutes: 240, lat: 26.8815, lng: 100.2335, ticket: '50人民幣（古城維護費）' },
    '大理古城': { notes: '白族風情古城，蒼山洱海環抱，人民路文青小店林立，是背包客的天堂。', duration_minutes: 180, lat: 25.6979, lng: 100.1646, ticket: '免費' },
    '布達拉宮': { notes: '藏傳佛教聖地，海拔 3700 公尺的宮殿群，達賴喇嘛的冬宮，藏民朝聖之地。', duration_minutes: 180, lat: 29.6575, lng: 91.1176, ticket: '200人民幣（旺季）' },
    '成都大熊貓基地': { notes: '近距離觀賞大熊貓的最佳地點，清晨是熊貓最活潑的時段。', duration_minutes: 180, lat: 30.7340, lng: 104.1456, ticket: '55人民幣' },
    '都江堰': { notes: '李冰父子 2200 年前建造的水利工程至今仍在運作，被譽為「世界水利文化鼻祖」。', duration_minutes: 180, lat: 31.0054, lng: 103.6177, ticket: '80人民幣' },
    '樂山大佛': { notes: '世界最大石刻佛像，高 71 公尺，「山是一座佛，佛是一座山」。', duration_minutes: 180, lat: 29.5444, lng: 103.7734, ticket: '80人民幣' },
    '峨眉山': { notes: '佛教四大名山之一，金頂雲海日出壯觀，峨眉山猴子調皮又可愛。', duration_minutes: 480, lat: 29.5520, lng: 103.3321, ticket: '160人民幣（旺季）' },
  },

  // 韓國景點
  korea: {
    '景福宮': { notes: '朝鮮王朝正宮，600 年歷史的皇家建築，穿韓服免費入場已成 K-文化體驗熱門。', duration_minutes: 120, lat: 37.5796, lng: 126.9770, ticket: '3,000韓元' },
    '北村韓屋村': { notes: '首爾保存最完整的傳統韓屋聚落，巷弄間咖啡館與工藝坊點綴其中。', duration_minutes: 90, lat: 37.5826, lng: 126.9850, ticket: '免費' },
    '明洞': { notes: '首爾最熱鬧購物區，韓國美妝品牌一條街，街頭小吃攤香氣四溢。', duration_minutes: 180, lat: 37.5636, lng: 126.9869, ticket: '免費' },
    '南山塔': { notes: '首爾地標，情侶鎖牆是浪漫打卡點，夜景俯瞰整個首爾盆地。', duration_minutes: 120, lat: 37.5512, lng: 126.9882, ticket: '纜車+展望台約 21,000韓元' },
    '弘大': { notes: '年輕潮流聖地，獨立音樂與街頭表演集中地，深夜俱樂部嗨到天亮。', duration_minutes: 180, lat: 37.5563, lng: 126.9236, ticket: '免費' },
    '江南區': { notes: '因 PSY「江南 Style」聞名全球，高級精品店與整形診所林立的富人區。', duration_minutes: 120, lat: 37.4979, lng: 127.0276, ticket: '免費' },
    '梨花女子大學': { notes: '校園本身就是景點，ECC 地下建築與梨花牆是必拍場景。', duration_minutes: 60, lat: 37.5618, lng: 126.9467, ticket: '免費' },
    '清溪川': { notes: '首爾市中心的都市河川再生奇蹟，散步、野餐、看燈節的好去處。', duration_minutes: 60, lat: 37.5710, lng: 126.9780, ticket: '免費' },
    'COEX Mall': { notes: '亞洲最大地下購物中心，星空圖書館是網美打卡聖地。', duration_minutes: 180, lat: 37.5116, lng: 127.0594, ticket: '免費' },
    '濟州島': { notes: '韓國夏威夷，火山島地形獨特，城山日出峰與牛島是必訪景點。', duration_minutes: 480, lat: 33.4996, lng: 126.5312, ticket: '各景點門票另計' },
    '釜山海雲台': { notes: '韓國最著名海灘，白沙海岸綿延 1.5 公里，夏季海洋祭熱鬧非凡。', duration_minutes: 180, lat: 35.1588, lng: 129.1604, ticket: '免費' },
    '甘川洞文化村': { notes: '韓國馬丘比丘，彩色房屋依山而建，小王子雕像是人氣拍照點。', duration_minutes: 120, lat: 35.0970, lng: 129.0104, ticket: '免費' },
  },

  // 泰國景點
  thailand: {
    '大皇宮': { notes: '曼谷最莊嚴的皇家建築群，玉佛寺供奉泰國國寶翡翠佛像，服裝需端莊。', duration_minutes: 180, lat: 13.7500, lng: 100.4914, ticket: '500泰銖' },
    '臥佛寺': { notes: '泰國最古老寺廟，46 公尺長臥佛金光閃閃，也是泰式按摩發源地。', duration_minutes: 90, lat: 13.7465, lng: 100.4931, ticket: '200泰銖' },
    '鄭王廟': { notes: '湄南河畔的黎明寺，79 公尺高的佛塔鑲嵌彩色陶瓷，日落時分最美。', duration_minutes: 90, lat: 13.7439, lng: 100.4893, ticket: '100泰銖' },
    '考山路': { notes: '背包客天堂，便宜住宿、街頭美食、酒吧一條街，夜晚派對不停歇。', duration_minutes: 180, lat: 13.7588, lng: 100.4971, ticket: '免費' },
    '恰圖恰週末市集': { notes: '世界最大週末市場，1 萬 5 千個攤位分佈 27 區，什麼都賣什麼都不奇怪。', duration_minutes: 240, lat: 13.7999, lng: 100.5506, ticket: '免費' },
    '芭達雅': { notes: '距曼谷最近的海灘度假勝地，Walking Street 夜生活精彩，水上活動豐富。', duration_minutes: 480, lat: 12.9236, lng: 100.8825, ticket: '免費' },
    '普吉島': { notes: '泰國最大島嶼，芭東海灘最熱鬧，攀牙灣海上桂林奇岩怪石。', duration_minutes: 480, lat: 7.8804, lng: 98.3923, ticket: '各景點另計' },
    '皮皮島': { notes: '因電影《乍浪》聞名，Maya Bay 絕美海灘重新開放，限制每日遊客數。', duration_minutes: 480, lat: 7.7386, lng: 98.7784, ticket: '國家公園費 400泰銖' },
    '清邁古城': { notes: '泰北玫瑰，700 年古城護城河環繞，寺廟密度全泰最高，夜市文青風。', duration_minutes: 240, lat: 18.7883, lng: 98.9853, ticket: '免費' },
    '雙龍寺': { notes: '清邁必訪寺廟，306 階龍形階梯通往山頂，金色佛塔供奉佛舍利。', duration_minutes: 90, lat: 18.8048, lng: 98.9219, ticket: '30泰銖' },
    '白廟': { notes: '藝術家 Chalermchai 的夢幻之作，純白建築配銀色裝飾，是地獄到天堂的隱喻。', duration_minutes: 90, lat: 19.8244, lng: 99.7631, ticket: '100泰銖' },
    '大象自然保護區': { notes: '以道德方式與大象互動，餵食、洗澡、散步，不騎乘大象的良心之旅。', duration_minutes: 480, lat: 19.2500, lng: 99.0833, ticket: '約 2,500泰銖' },
    '水上市場': { notes: '體驗泰國傳統水上交易文化，丹能莎朵最知名，安帕瓦較悠閒在地。', duration_minutes: 180, lat: 13.5189, lng: 99.9572, ticket: '船費約 100-200泰銖' },
  },

  // 越南景點
  vietnam: {
    '下龍灣': { notes: '世界自然遺產，1600 座石灰岩島嶼散佈海上，遊船過夜是最佳體驗方式。', duration_minutes: 480, lat: 20.9101, lng: 107.1839, ticket: '遊船行程約 150-300美元' },
    '河內老城區': { notes: '36 條古街各有專賣，三十六行街的熙攘市井氣息，越南咖啡飄香四溢。', duration_minutes: 180, lat: 21.0341, lng: 105.8505, ticket: '免費' },
    '還劍湖': { notes: '河內市中心的靈魂，黎太祖傳說中歸還神劍之地，玉山祠紅橋是地標。', duration_minutes: 60, lat: 21.0288, lng: 105.8525, ticket: '玉山祠 30,000越盾' },
    '胡志明陵': { notes: '越南國父長眠之地，水晶棺內遺體保存完好，每年休館維護兩個月。', duration_minutes: 60, lat: 21.0368, lng: 105.8344, ticket: '免費（服裝需端莊）' },
    '西貢聖母大教堂': { notes: '紅磚建造的法式天主教堂，雙塔高 58 公尺，是胡志明市地標。', duration_minutes: 30, lat: 10.7798, lng: 106.6990, ticket: '免費' },
    '濱城市場': { notes: '胡志明市最大市場，從乾貨、服飾到紀念品應有盡有，殺價是必備技能。', duration_minutes: 120, lat: 10.7725, lng: 106.6980, ticket: '免費' },
    '會安古鎮': { notes: '世界文化遺產，日本橋、中國會館、法式建築並存，夜晚燈籠浪漫迷人。', duration_minutes: 240, lat: 15.8801, lng: 108.3380, ticket: '120,000越盾（5景點套票）' },
    '美山聖地': { notes: '越南吳哥窟，占婆王國遺址，雖經戰火摧殘，紅磚塔群仍顯神秘莊嚴。', duration_minutes: 180, lat: 15.7630, lng: 108.1219, ticket: '150,000越盾' },
    '順化皇城': { notes: '阮朝皇宮，仿北京紫禁城而建，雖經戰爭破壞，午門與太和殿仍氣勢恢宏。', duration_minutes: 180, lat: 16.4698, lng: 107.5792, ticket: '200,000越盾' },
    '峴港': { notes: '越南最宜居城市，美溪海灘 CNN 評選全球六大最美沙灘，巴拿山法國村夢幻。', duration_minutes: 240, lat: 16.0544, lng: 108.2022, ticket: '各景點另計' },
    '巴拿山': { notes: '佛手金橋是 IG 熱門打卡點，法式城堡、花園、遊樂園，涼爽氣候適合避暑。', duration_minutes: 480, lat: 15.9951, lng: 107.9969, ticket: '纜車+門票約 1,200,000越盾' },
    '芽莊': { notes: '越南馬爾地夫，蔚藍海水清澈見底，跳島遊與泥巴浴是必玩體驗。', duration_minutes: 480, lat: 12.2388, lng: 109.1967, ticket: '各景點另計' },
    '大叻': { notes: '法國人建造的避暑勝地，瘋狂屋是高第風格建築奇觀，咖啡莊園遍佈山間。', duration_minutes: 240, lat: 11.9404, lng: 108.4583, ticket: '瘋狂屋 80,000越盾' },
    '湄公河三角洲': { notes: '越南魚米之鄉，搭船穿梭水上市場，椰子糖工廠與蜂蜜農場體驗在地生活。', duration_minutes: 480, lat: 10.2338, lng: 105.7900, ticket: '一日遊約 30-50美元' },
  },

  // 菲律賓景點
  philippines: {
    '長灘島': { notes: '菲律賓最著名海島，白沙灘細如麵粉，連綿 4 公里，日落帆船是浪漫儀式。', duration_minutes: 480, lat: 11.9674, lng: 121.9248, ticket: '環境稅 75披索' },
    '宿霧': { notes: '麥哲倫十字架與聖嬰聖殿見證西班牙殖民歷史，Oslob 看鯨鯊舉世聞名。', duration_minutes: 480, lat: 10.3157, lng: 123.8854, ticket: '各景點另計' },
    '薄荷島': { notes: '巧克力山 1268 座圓錐形山丘世界獨有，眼鏡猴保護區可近距離觀賞世界最小猴。', duration_minutes: 480, lat: 9.8500, lng: 124.0000, ticket: '巧克力山 50披索' },
    '愛妮島': { notes: '巴拉望秘境，石灰岩懸崖環抱瀉湖，跳島 Tour A-D 帶你探索不同奇景。', duration_minutes: 480, lat: 11.1936, lng: 119.4030, ticket: '跳島約 1,200-1,500披索' },
    '科隆': { notes: '二戰沉船潛水勝地，凱央根湖「菲律賓最乾淨湖泊」，雙子瀉湖美不勝收。', duration_minutes: 480, lat: 12.0047, lng: 120.2042, ticket: '跳島約 1,500披索' },
    '馬尼拉王城區': { notes: '西班牙殖民時期的城中城，聖奧古斯丁教堂是菲律賓最古老石造教堂。', duration_minutes: 180, lat: 14.5899, lng: 120.9753, ticket: '聖奧古斯丁 200披索' },
    '巴拿威梯田': { notes: '2000 年歷史的伊富高族傑作，被譽為「世界第八大奇蹟」的高山梯田。', duration_minutes: 480, lat: 16.9144, lng: 121.0566, ticket: '免費' },
    '錫亞高島': { notes: '菲律賓衝浪首都，Cloud 9 是世界級浪點，椰樹搖曳的熱帶慵懶氛圍。', duration_minutes: 480, lat: 9.8500, lng: 126.1667, ticket: '各景點另計' },
  },
};

async function enhance() {
  console.log('開始優化各國景點資料...\n');

  const results = {};

  for (const [countryId, attractions] of Object.entries(countryData)) {
    console.log(`\n=== ${countryId.toUpperCase()} ===`);
    let updated = 0;
    let notFound = 0;

    for (const [name, data] of Object.entries(attractions)) {
      const { data: existing, error: findErr } = await supabase
        .from('attractions')
        .select('id, name')
        .eq('country_id', countryId)
        .or(`name.eq.${name},name.ilike.%${name}%`)
        .limit(1);

      if (findErr) {
        console.log('  查詢錯誤:', name, findErr.message);
        continue;
      }

      if (!existing || existing.length === 0) {
        notFound++;
        continue;
      }

      const updateData = {
        notes: data.notes,
        duration_minutes: data.duration_minutes,
      };

      if (data.lat && data.lng) {
        updateData.latitude = data.lat;
        updateData.longitude = data.lng;
      }

      if (data.ticket) {
        updateData.ticket_price = data.ticket;
      }

      const { error: updateErr } = await supabase
        .from('attractions')
        .update(updateData)
        .eq('id', existing[0].id);

      if (updateErr) {
        console.log('  更新錯誤:', name, updateErr.message);
      } else {
        updated++;
        console.log('  ✅', existing[0].name);
      }
    }

    results[countryId] = { updated, notFound };
    console.log(`  ${countryId}: 更新 ${updated} 筆, 找不到 ${notFound} 筆`);
  }

  console.log('\n\n=== 總結 ===');
  let total = 0;
  for (const [country, stats] of Object.entries(results)) {
    console.log(`${country}: ${stats.updated} 筆`);
    total += stats.updated;
  }
  console.log(`總計: ${total} 筆`);
}

enhance();
