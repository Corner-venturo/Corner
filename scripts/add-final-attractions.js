// 新增日本餐廳、缺少景點、2025新景點
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
const supabase = createClient(supabaseUrl, supabaseKey)

// ========== 日本缺少的景點 ==========
const missingJapanAttractions = [
  {
    name: '五稜郭公園',
    name_en: 'Goryokaku Park',
    country_id: 'japan',
    region_id: 'jp_hokkaido',
    category: '景點',
    type: 'attraction',
    description:
      '日本首座西式星形要塞，1864年建成。五稜郭塔可俯瞰整座星形城郭的壯麗景觀。春季櫻花秋季紅葉非常美麗。',
    duration_minutes: 90,
    opening_hours: { open: '全天開放', note: '五稜郭塔09:00-18:00' },
    tags: ['歷史', '櫻花', '函館', '北海道', '世界遺產'],
    notes: '五稜郭塔門票1000日圓。4月下旬至5月上旬約1600棵櫻花盛開。秋季紅葉也很美。',
  },
  {
    name: '由布院溫泉街',
    name_en: 'Yufuin Onsen Town',
    country_id: 'japan',
    region_id: 'jp_kyushu',
    category: '景點',
    type: 'attraction',
    description:
      '日本OL最愛渡假勝地，擁有日本水量第二大的溫泉。湯之坪街道文青小店林立，金鱗湖晨霧如夢似幻。',
    duration_minutes: 240,
    opening_hours: { open: '商店約10:00-17:00' },
    tags: ['必去', '溫泉', '文青', '九州', '由布院'],
    notes: '建議住一晚泡溫泉。由布院之森觀光列車可從博多直達。金鱗湖清晨霧氣最美。',
  },
  {
    name: '別府地獄巡禮',
    name_en: 'Beppu Jigoku Meguri',
    country_id: 'japan',
    region_id: 'jp_kyushu',
    category: '景點',
    type: 'attraction',
    description:
      '7個特色地獄溫泉各有奇觀。海地獄的鈷藍色、血之池的鮮紅色、龍捲地獄的間歇泉噴發都令人驚嘆。',
    duration_minutes: 180,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['溫泉', '必去', '別府', '九州', '自然奇觀'],
    notes: '7地獄套票2200日圓，分散兩區需搭巴士。海地獄和血之池最有名。溫泉太燙不能泡！',
  },
  {
    name: '高千穗峽谷',
    name_en: 'Takachiho Gorge',
    country_id: 'japan',
    region_id: 'jp_kyushu',
    category: '景點',
    type: 'attraction',
    description:
      'V字形峽谷配上真名井瀑布，如神話場景般絕美。可划船近距離欣賞17公尺高的瀑布從崖頂直瀉而下。',
    duration_minutes: 180,
    opening_hours: { open: '08:30', close: '17:00' },
    tags: ['必去', '峽谷', '瀑布', '九州', '宮崎'],
    notes: '划船30分鐘4100日圓，限3人。平日早上去避開人潮。夜神樂表演值得一看。',
  },
  {
    name: '稻佐山展望台',
    name_en: 'Mount Inasa Observatory',
    country_id: 'japan',
    region_id: 'jp_kyushu',
    category: '景點',
    type: 'viewpoint',
    description:
      '長崎夜景擁有「世界新三大夜景」、「日本三大夜景」雙重頭銜。從山頂可俯瞰長崎港灣的璀璨燈火。',
    duration_minutes: 90,
    opening_hours: { open: '纜車09:00-22:00' },
    tags: ['夜景', '世界新三大', '長崎', '九州', '必去'],
    notes: '纜車來回1250日圓。日落時上山卡位最佳。山頂有餐廳可用餐賞景。',
  },
  {
    name: '青之洞窟',
    name_en: 'Blue Cave Okinawa',
    country_id: 'japan',
    region_id: 'jp_okinawa',
    category: '景點',
    type: 'attraction',
    description:
      '陽光穿透海水照進洞窟形成夢幻藍光，是沖繩最人氣的浮潛和潛水景點。洞內有熱帶魚悠游其中。',
    duration_minutes: 180,
    opening_hours: { open: '預約制' },
    tags: ['浮潛', '潛水', '必去', '沖繩', '海洋'],
    notes: '浮潛或潛水體驗約5000-10000日圓。7-9月海況最穩定。需提前預約。真榮田岬可步行進入。',
  },
]

// ========== 日本特色餐廳 ==========
const japanRestaurants = [
  // 大阪
  {
    name: '道頓堀 元祖串炸 達摩',
    name_en: 'Kushikatsu Daruma',
    country_id: 'japan',
    region_id: 'jp_kansai',
    category: '餐廳',
    type: 'food',
    description:
      '大阪串炸發源店，創業90年以上。獨特麵衣酥脆，肉類海鮮蔬菜皆可串炸。禁止二次沾醬是店規。',
    duration_minutes: 60,
    opening_hours: { open: '11:00', close: '22:30' },
    tags: ['在地美食', '串炸', '道頓堀', '大阪', '必吃'],
    notes: '招牌是牛肉串和蓮藕串。醬料共用，沾過不能再沾。人均約1500-2500日圓。',
  },
  {
    name: '蛸之徹 道頓堀店',
    name_en: 'Takonotetsu',
    country_id: 'japan',
    region_id: 'jp_kansai',
    category: '餐廳',
    type: 'food',
    description: '大阪章魚燒DIY體驗店，可自己動手翻烤章魚燒。店員會教學，成品不好看但超好吃。',
    duration_minutes: 60,
    opening_hours: { open: '11:00', close: '22:00' },
    tags: ['體驗', '章魚燒', '道頓堀', '大阪', '親子'],
    notes: '自己做的章魚燒特別好吃！有中文菜單。人均約1000-1500日圓。',
  },
  {
    name: '千房 道頓堀店',
    name_en: 'Chibo Dotonbori',
    country_id: 'japan',
    region_id: 'jp_kansai',
    category: '餐廳',
    type: 'food',
    description: '大阪燒連鎖名店，可選擇自己做或由廚師代做。招牌道頓堀燒加入多種海鮮和起司。',
    duration_minutes: 60,
    opening_hours: { open: '11:00', close: '23:00' },
    tags: ['在地美食', '大阪燒', '道頓堀', '大阪'],
    notes: '推薦道頓堀燒（1500日圓）。也有摩登燒（包麵）可選。',
  },
  {
    name: '法善寺 夫婦善哉',
    name_en: 'Meoto Zenzai',
    country_id: 'japan',
    region_id: 'jp_kansai',
    category: '餐廳',
    type: 'food',
    description:
      '創業1883年的紅豆湯圓老店，因太宰治小說《夫婦善哉》而聞名。一份紅豆湯分成兩碗，象徵夫婦同心。',
    duration_minutes: 30,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['甜點', '老店', '法善寺', '大阪', '文學'],
    notes: '夫婦善哉880日圓。位於法善寺橫丁。情侶來吃很應景。',
  },
  // 北海道
  {
    name: '小樽三角市場',
    name_en: 'Otaru Sankaku Market',
    country_id: 'japan',
    region_id: 'jp_hokkaido',
    category: '餐廳',
    type: 'food',
    description:
      '小樽站旁的傳統市場，匯集新鮮漁產和人氣海鮮餐廳。瀧波食堂、武田鮮魚店的海鮮丼最受歡迎。',
    duration_minutes: 90,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['市場', '海鮮丼', '小樽', '北海道', '必吃'],
    notes: '海鮮丼約1500-3000日圓。越早去越新鮮。可邊逛邊試吃。',
  },
  {
    name: 'LeTAO 本店',
    name_en: 'LeTAO Main Store',
    country_id: 'japan',
    region_id: 'jp_hokkaido',
    category: '餐廳',
    type: 'food',
    description:
      '小樽代表甜點店，招牌雙層起司蛋糕（Double Fromage）入口即化。二樓咖啡廳可現場品嚐。',
    duration_minutes: 45,
    opening_hours: { open: '09:00', close: '18:00' },
    tags: ['甜點', '伴手禮', '小樽', '北海道', '必買'],
    notes: '雙層起司蛋糕是小樽必買伴手禮。現吃和冷凍的口感不同，都很棒。',
  },
  {
    name: '成吉思汗 達摩',
    name_en: 'Daruma Jingisukan',
    country_id: 'japan',
    region_id: 'jp_hokkaido',
    category: '餐廳',
    type: 'food',
    description:
      '札幌最知名的成吉思汗烤肉店，使用凸面鐵盤烤羊肉。新鮮羊肉無腥味，是北海道代表美食。',
    duration_minutes: 60,
    opening_hours: { open: '17:00', close: '03:00' },
    tags: ['在地美食', '烤肉', '羊肉', '札幌', '北海道'],
    notes: '建議吃生羊肉（ラム），比冷凍羊肉（マトン）嫩。店很小常排隊。人均約2000日圓。',
  },
  {
    name: '函館朝市',
    name_en: 'Hakodate Morning Market',
    country_id: 'japan',
    region_id: 'jp_hokkaido',
    category: '餐廳',
    type: 'food',
    description: '函館站旁的超大型朝市，以帝王蟹、花咲蟹、海膽著名。可現買現吃，也有多家食堂。',
    duration_minutes: 120,
    opening_hours: { open: '05:00', close: '14:00' },
    tags: ['市場', '海鮮', '螃蟹', '函館', '北海道', '必去'],
    notes: '釣烏賊體驗很有趣！帝王蟹現煮超鮮甜。早上去品質最好。',
  },
  // 九州
  {
    name: '一蘭拉麵 總本店',
    name_en: 'Ichiran Ramen Nakasu',
    country_id: 'japan',
    region_id: 'jp_kyushu',
    category: '餐廳',
    type: 'food',
    description:
      '一蘭拉麵發源店，獨創「味集中系統」隔板座位讓你專注品嚐。可客製麵條硬度、湯頭濃度、蔥量等。',
    duration_minutes: 45,
    opening_hours: { open: '24小時營業' },
    tags: ['拉麵', '福岡', '九州', '必吃', '24小時'],
    notes: '博多川端商店街也有一蘭。加麵只要200日圓。總本店可參觀二樓展示。',
  },
  {
    name: '中洲屋台街',
    name_en: 'Nakasu Yatai Street',
    country_id: 'japan',
    region_id: 'jp_kyushu',
    category: '餐廳',
    type: 'food',
    description:
      '福岡最具特色的屋台（路邊攤）文化，沿著中洲川端排列20多家屋台。博多拉麵、烤雞串、關東煮應有盡有。',
    duration_minutes: 90,
    opening_hours: { open: '18:00', close: '02:00' },
    tags: ['屋台', '夜市', '福岡', '九州', '體驗', '必去'],
    notes: '每家屋台只有10個位子左右。邊吃邊和老闆聊天是精髓。人均約2000-3000日圓。',
  },
  {
    name: 'Milch 由布院',
    name_en: 'Milch Yufuin',
    country_id: 'japan',
    region_id: 'jp_kyushu',
    category: '餐廳',
    type: 'food',
    description:
      '由布院人氣甜點店，招牌半熟起司蛋糕外酥內軟。金賞布丁也是必吃。使用由布院新鮮牛乳製作。',
    duration_minutes: 30,
    opening_hours: { open: '09:30', close: '17:30' },
    tags: ['甜點', '起司蛋糕', '由布院', '九州', '必吃'],
    notes: '半熟起司蛋糕現烤現吃最好吃！金賞布丁可帶走。常排隊。',
  },
  // 沖繩
  {
    name: '豬肉蛋飯糰 美國村店',
    name_en: 'Pork Tamago Onigiri American Village',
    country_id: 'japan',
    region_id: 'jp_okinawa',
    category: '餐廳',
    type: 'food',
    description: '沖繩代表美食，源自美軍統治時期。午餐肉配煎蛋夾在飯糰裡，簡單卻超美味。',
    duration_minutes: 20,
    opening_hours: { open: '07:00', close: '20:00' },
    tags: ['在地美食', '飯糰', '沖繩', '必吃', '早餐'],
    notes: '約300-500日圓。國際通牧志市場、那霸機場也有分店。現做最好吃！',
  },
  {
    name: '浜の家',
    name_en: 'Hamanoya',
    country_id: 'japan',
    region_id: 'jp_okinawa',
    category: '餐廳',
    type: 'food',
    description: '沖繩恩納的人氣海鮮餐廳，主打海膽焗烤龍蝦、黃油烤魚。可欣賞海景用餐。',
    duration_minutes: 90,
    opening_hours: { open: '11:00', close: '22:00' },
    tags: ['海鮮', '龍蝦', '恩納', '沖繩', '景觀'],
    notes: '海膽焗烤龍蝦約4000日圓。靠窗座位可看海。建議預約。',
  },
  {
    name: '暖暮拉麵 國際通店',
    name_en: 'Danbo Ramen Kokusaidori',
    country_id: 'japan',
    region_id: 'jp_okinawa',
    category: '餐廳',
    type: 'food',
    description: '九州系豚骨拉麵名店，在沖繩超人氣。濃厚豚骨湯頭配上細麵，台灣人最愛。',
    duration_minutes: 45,
    opening_hours: { open: '11:00', close: '23:00' },
    tags: ['拉麵', '國際通', '沖繩', '排隊名店'],
    notes: '用餐時間常排隊超過1小時。建議錯開用餐時段。約800日圓。',
  },
  {
    name: 'Blue Seal 冰淇淋',
    name_en: 'Blue Seal Ice Cream',
    country_id: 'japan',
    region_id: 'jp_okinawa',
    category: '餐廳',
    type: 'food',
    description:
      '1948年創立的沖繩代表冰品品牌，有紫薯、鳳梨、紅芋等30多種口味。是沖繩人的共同記憶。',
    duration_minutes: 20,
    opening_hours: { open: '09:00', close: '22:00' },
    tags: ['冰淇淋', '沖繩', '必吃', '伴手禮'],
    notes: '紫薯、鹽焦糖、芒果是人氣口味。遍佈沖繩各處。約350日圓起。',
  },
]

// ========== 2025 新景點 ==========
const new2025Attractions = [
  {
    name: 'JUNGLIA恐龍主題樂園',
    name_en: 'JUNGLIA Theme Park',
    country_id: 'japan',
    region_id: 'jp_okinawa',
    category: '景點',
    type: 'theme_park',
    description:
      '2025年開幕的沖繩全新恐龍主題樂園，佔地60公頃、投資額達700億日圓。位於山原國立公園內，結合自然與科技。',
    duration_minutes: 360,
    opening_hours: { open: '預計2025年開幕' },
    tags: ['2025新景點', '遊樂園', '恐龍', '沖繩', '親子'],
    notes: '預計2025年夏季開幕。設有刺激遊樂設施、SPA無邊際泳池、度假村。關注官網公布開幕日期。',
  },
  {
    name: 'Central Park 曼谷',
    name_en: 'Central Park Bangkok',
    country_id: 'thailand',
    region_id: 'th_central',
    category: '景點',
    type: 'shopping',
    description:
      '2025年9月最新開幕的曼谷巨型購物中心，集結超過500個品牌。LG層有米其林餐廳，頂樓有Dust空中花園。',
    duration_minutes: 240,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['2025新景點', '購物', '曼谷', '商場'],
    notes: '位於拉瑪四路。頂樓空中花園可俯瞰曼谷市景。LG層美食區集結多家米其林餐廳。',
  },
  {
    name: '松瓦路',
    name_en: 'Song Wat Road',
    country_id: 'thailand',
    region_id: 'th_central',
    category: '景點',
    type: 'attraction',
    description:
      '2025年最有人氣的曼谷街區，被Time Out評選為全球最酷街區之一。獨特風格小店、咖啡廳和街頭藝術集中地。',
    duration_minutes: 180,
    opening_hours: { open: '約10:00-22:00' },
    tags: ['2025熱門', '文青', '曼谷', '街區', '咖啡'],
    notes: '靠近唐人街，可一起遊覽。許多隱藏咖啡廳和選物店。週末人潮較多。',
  },
  {
    name: '2025大阪世博會',
    name_en: 'Expo 2025 Osaka',
    country_id: 'japan',
    region_id: 'jp_kansai',
    category: '景點',
    type: 'event',
    description:
      '2025年4月13日至10月13日舉辦的大阪關西萬國博覽會，主題為「設計未來社會，閃耀生命光輝」。',
    duration_minutes: 480,
    opening_hours: { open: '2025/4/13-10/13' },
    tags: ['2025活動', '世博會', '大阪', '必去'],
    notes: '地點在夢洲人工島。建議預購門票避免排隊。可搭配大阪旅遊一起規劃。門票約7500日圓。',
  },
  {
    name: '大阪造幣局櫻花隧道',
    name_en: 'Osaka Mint Cherry Blossom',
    country_id: 'japan',
    region_id: 'jp_kansai',
    category: '景點',
    type: 'attraction',
    description:
      '大阪造幣局每年僅開放約一週的櫻花隧道，有130種以上的珍貴櫻花品種。2025年開放日期為4月5日至11日。',
    duration_minutes: 90,
    opening_hours: { open: '2025/4/5-4/11', note: '10:00-19:30' },
    tags: ['2025活動', '櫻花', '大阪', '期間限定'],
    notes: '2025年開放日期：4月5日至11日。需在官網預約才能參觀。免費入場。夜間點燈至19:30。',
  },
]

// ========== 執行 ==========
async function addAttractions(attractions, label) {
  console.log(`\n🆕 正在新增 ${label}...`)
  let added = 0
  let skipped = 0

  for (const attraction of attractions) {
    const { data: existing } = await supabase
      .from('attractions')
      .select('id')
      .eq('country_id', attraction.country_id)
      .eq('name', attraction.name)
      .single()

    if (existing) {
      console.log(`  ⏭️ ${attraction.name} (已存在)`)
      skipped++
      continue
    }

    const { error } = await supabase.from('attractions').insert(attraction)
    if (error) {
      console.log(`  ❌ ${attraction.name}: ${error.message}`)
    } else {
      console.log(`  ✅ ${attraction.name}`)
      added++
    }
  }

  console.log(`📊 ${label}: ${added} 新增, ${skipped} 跳過`)
}

async function main() {
  console.log('========================================')
  console.log('最終資料補充工具')
  console.log('========================================')

  await addAttractions(missingJapanAttractions, '日本缺少的景點')
  await addAttractions(japanRestaurants, '日本特色餐廳')
  await addAttractions(new2025Attractions, '2025新景點')

  console.log('\n✅ 所有補充完成！')
}

main().catch(console.error)
