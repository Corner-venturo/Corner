// 批量新增特色餐廳
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
const supabase = createClient(supabaseUrl, supabaseKey)

// ========== 埃及特色餐廳 ==========
const egyptRestaurants = [
  {
    name: 'Sachi',
    name_en: 'Sachi',
    country_id: 'egypt',
    category: '餐廳',
    type: 'food',
    description:
      '多次榮獲中東&北非50 Best餐廳，提供精緻創意料理，融合日式與中東風味。環境高雅奢華，適合特殊場合用餐。',
    duration_minutes: 120,
    opening_hours: { open: '12:00', close: '23:00' },
    tags: ['米其林推薦', '高級餐廳', '創意料理', '約會'],
    notes: '建議提前預約。人均消費約100-150美金。有多間分店，Heliopolis店最受歡迎。',
  },
  {
    name: 'Kababgy El Azhar Farahat',
    name_en: 'Kababgy El Azhar Farahat',
    country_id: 'egypt',
    category: '餐廳',
    type: 'food',
    description:
      '開羅歷史悠久的烤肉餐廳，以招牌烤鴿聞名，深受當地人和觀光客喜愛。傳統埃及風味，份量實在。',
    duration_minutes: 90,
    opening_hours: { open: '12:00', close: '02:00' },
    tags: ['在地美食', '烤肉', '傳統', '必吃'],
    notes: '必點烤鴿（Hamam Mahshi），約80-100埃鎊。位於艾茲哈爾清真寺附近，可順道遊覽。',
  },
  {
    name: 'Felfela',
    name_en: 'Felfela',
    country_id: 'egypt',
    category: '餐廳',
    type: 'food',
    description:
      '開羅市中心的老牌餐廳，提供多樣埃及傳統小吃。環境有特色的埃及鄉村風裝潢，價格親民。',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '01:00' },
    tags: ['在地美食', '平價', '傳統', '早餐'],
    notes: '推薦Ful Medames（蠶豆泥）、Koshari（埃及國民料理）、Falafel。人均約50-80埃鎊。',
  },
  {
    name: "Khufu's Restaurant",
    name_en: "Khufu's Restaurant",
    country_id: 'egypt',
    category: '餐廳',
    type: 'food',
    description:
      '位於吉薩金字塔群附近的景觀餐廳，提供金字塔景觀座位，讓旅人能沉浸在歷史氛圍中用餐。',
    duration_minutes: 90,
    opening_hours: { open: '11:00', close: '23:00' },
    tags: ['景觀餐廳', '金字塔', '觀光', '西式'],
    notes: '建議預約戶外露台座位欣賞金字塔。日落時分最佳。人均約30-50美金。',
  },
  {
    name: 'El Abd Patisserie',
    name_en: 'El Abd Patisserie',
    country_id: 'egypt',
    category: '餐廳',
    type: 'food',
    description:
      '創立於1974年的老牌甜品店，以琳瑯滿目的餅乾、甜點和冰淇淋深受當地人喜愛。埃及人的甜點首選。',
    duration_minutes: 30,
    opening_hours: { open: '09:00', close: '23:00' },
    tags: ['甜點', '老店', '伴手禮', '必吃'],
    notes: '推薦Kunafa（中東起司甜點）、Basbousa（椰子糕）。多間分店，Downtown店最老牌。',
  },
  {
    name: 'Naguib Mahfouz Café',
    name_en: 'Naguib Mahfouz Café',
    country_id: 'egypt',
    category: '餐廳',
    type: 'food',
    description: '以諾貝爾文學獎得主命名的咖啡館，位於哈利利市場內。提供傳統埃及料理和水煙體驗。',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '02:00' },
    tags: ['咖啡館', '文化', '水煙', '市場'],
    notes: '可在購物後來此休息。建議嘗試薄荷茶和埃及傳統甜點。氛圍懷舊有特色。',
  },
]

// ========== 沙烏地阿拉伯特色餐廳 ==========
const saudiRestaurants = [
  {
    name: 'Maraya Social Restaurant',
    name_en: 'Maraya Social Restaurant',
    country_id: 'saudi_arabia',
    category: '餐廳',
    type: 'food',
    description:
      '由Jason Atherton主理的高級餐廳，位於艾爾奧拉標誌性的鏡面建築Maraya內。提供地中海創意料理。',
    duration_minutes: 150,
    opening_hours: { open: '18:00', close: '23:00', note: '建議提前預約' },
    tags: ['高級餐廳', '米其林', '艾爾奧拉', '約會', '網紅'],
    notes: '低消150里亞爾/人。必須提前在官網預約。建議搭配Maraya音樂廳參觀。環境極為獨特。',
  },
  {
    name: 'Mama Noura',
    name_en: 'Mama Noura',
    country_id: 'saudi_arabia',
    category: '餐廳',
    type: 'food',
    description: '沙烏地最受歡迎的連鎖餐廳，主打傳統阿拉伯烤肉和Shawarma。24小時營業，價格親民。',
    duration_minutes: 45,
    opening_hours: { open: '24小時營業' },
    tags: ['在地美食', '平價', '連鎖', '烤肉', '24小時'],
    notes: '推薦Shawarma（沙威瑪）、烤雞、Hummus。全國多間分店。人均約30-50里亞爾。',
  },
  {
    name: 'Bujairi Terrace',
    name_en: 'Bujairi Terrace',
    country_id: 'saudi_arabia',
    category: '餐廳',
    type: 'food',
    description: '位於德拉伊耶歷史區的時尚餐飲區，匯集多間高級餐廳。可俯瞰世界遺產老城區。',
    duration_minutes: 120,
    opening_hours: { open: '12:00', close: '00:00' },
    tags: ['高級餐廳', '景觀', '德拉伊耶', '利雅德'],
    notes: '有多間餐廳可選，包括義式、日式、阿拉伯料理。傍晚時分用餐可欣賞日落和老城夜景。',
  },
  {
    name: 'Najd Village',
    name_en: 'Najd Village',
    country_id: 'saudi_arabia',
    category: '餐廳',
    type: 'food',
    description: '利雅德知名的傳統阿拉伯餐廳，環境佈置如傳統納季德風格村落。提供地道的沙烏地料理。',
    duration_minutes: 90,
    opening_hours: { open: '12:00', close: '00:00' },
    tags: ['傳統', '沙烏地料理', '文化體驗', '利雅德'],
    notes: '推薦Kabsa（香料飯）、烤全羊。可選擇地毯座或桌椅座。周末建議預約。',
  },
  {
    name: 'Takya',
    name_en: 'Takya',
    country_id: 'saudi_arabia',
    category: '餐廳',
    type: 'food',
    description: '吉達老城區的傳統阿拉伯餐廳，在歷史建築內用餐，氛圍獨特。提供傳統海濱地區料理。',
    duration_minutes: 90,
    opening_hours: { open: '12:00', close: '23:00' },
    tags: ['傳統', '吉達', '老城區', '海鮮'],
    notes: '位於阿爾巴拉德老城區內。推薦鮮魚料理。建議傍晚用餐後在老城散步。',
  },
  {
    name: 'Ten Elephants',
    name_en: 'Ten Elephants',
    country_id: 'saudi_arabia',
    category: '餐廳',
    type: 'food',
    description:
      '艾爾奧拉的特色咖啡廳，提供沙漠景觀露台座位。專業咖啡和輕食，是遊覽艾爾奧拉時的絕佳休息站。',
    duration_minutes: 60,
    opening_hours: { open: '07:00', close: '22:00' },
    tags: ['咖啡廳', '艾爾奧拉', '景觀', '休閒'],
    notes: '推薦阿拉伯咖啡和椰棗蛋糕。戶外座位可欣賞沙漠和岩石景觀。',
  },
]

// ========== 清邁特色餐廳 ==========
const chiangmaiRestaurants = [
  {
    name: 'Kiew Kai Ka',
    name_en: 'Kiew Kai Ka',
    country_id: 'thailand',
    region_id: 'other',
    category: '餐廳',
    type: 'food',
    description: '米其林推薦的時尚泰式餐廳，環境現代優雅，提供創意泰北料理。適合約會或商務宴請。',
    duration_minutes: 90,
    opening_hours: { open: '11:00', close: '22:00' },
    tags: ['米其林推薦', '泰北料理', '時尚', '約會'],
    notes: '推薦香料炸雞翅、北泰咖哩。人均約300-500泰銖。建議預約。',
  },
  {
    name: 'Huen Muan Jai',
    name_en: 'Huen Muan Jai',
    country_id: 'thailand',
    region_id: 'other',
    category: '餐廳',
    type: 'food',
    description: '米其林推薦的古城區木屋餐廳，在傳統蘭納木屋內享用道地泰北料理。氛圍溫馨懷舊。',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['米其林推薦', '泰北料理', '傳統', '古城'],
    notes: '必點Khao Soi（咖哩麵）、炸豬皮、青辣椒醬。座位有限建議早到。人均約200-400泰銖。',
  },
  {
    name: 'Ginger Farm Kitchen',
    name_en: 'Ginger Farm Kitchen',
    country_id: 'thailand',
    region_id: 'other',
    category: '餐廳',
    type: 'food',
    description:
      '米其林推薦的尼曼商圈泰北餐廳，使用自家農場有機食材。環境清新，提供Farm to Table體驗。',
    duration_minutes: 90,
    opening_hours: { open: '11:00', close: '22:00' },
    tags: ['米其林推薦', '泰北料理', '有機', '尼曼區'],
    notes: '推薦有機蔬菜沙拉、泰北香料烤雞。位於One Nimman商場內。人均約300-500泰銖。',
  },
  {
    name: 'Khao Soi Samerjai',
    name_en: 'Khao Soi Samerjai',
    country_id: 'thailand',
    region_id: 'other',
    category: '餐廳',
    type: 'food',
    description: '清邁最知名的咖哩麵老店，超過50年歷史。簡單的店面，卻有最正宗的Khao Soi味道。',
    duration_minutes: 45,
    opening_hours: { open: '08:00', close: '15:00', note: '售完為止' },
    tags: ['在地美食', '咖哩麵', '老店', '必吃'],
    notes: 'Khao Soi只要約50泰銖！中午常排隊，建議11點前到。只有泰文菜單，但只點Khao Soi就對了。',
  },
  {
    name: 'Tong Tem Toh',
    name_en: 'Tong Tem Toh',
    country_id: 'thailand',
    region_id: 'other',
    category: '餐廳',
    type: 'food',
    description: '超人氣泰北料理餐廳，價格實惠份量大。營業時間較長，適合宵夜。當地人和遊客都愛。',
    duration_minutes: 60,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['在地美食', '泰北料理', '平價', '宵夜'],
    notes: '推薦Nam Prik Ong（肉末番茄醬）配炸豬皮、Laab（涼拌肉）。多間分店。人均約150-300泰銖。',
  },
  {
    name: 'Ristr8to Coffee',
    name_en: 'Ristr8to Coffee',
    country_id: 'thailand',
    region_id: 'other',
    category: '餐廳',
    type: 'food',
    description: '世界拉花冠軍的咖啡店，提供頂級精品咖啡和精緻拉花藝術。咖啡愛好者必訪。',
    duration_minutes: 60,
    opening_hours: { open: '07:00', close: '18:00' },
    tags: ['咖啡', '世界冠軍', '文青', '尼曼區'],
    notes: '必點招牌拉花咖啡，可欣賞精緻的咖啡藝術。位於尼曼區。咖啡約80-150泰銖。',
  },
  {
    name: '老清邁文化中心帝王宴',
    name_en: 'Old Chiang Mai Cultural Center',
    country_id: 'thailand',
    region_id: 'other',
    category: '餐廳',
    type: 'experience',
    description: '傳統蘭納式帝王宴體驗，席地而坐享用傳統料理，同時欣賞泰北民族歌舞表演。',
    duration_minutes: 180,
    opening_hours: { open: '19:00', close: '22:00' },
    tags: ['體驗', '文化', '表演', '傳統', '晚餐'],
    notes: '帝王宴600泰銖，含晚餐和表演。19:00開始。建議提前預約，可請旅館代訂。',
  },
  {
    name: 'Deck 1 Restaurant',
    name_en: 'Deck 1 Restaurant',
    country_id: 'thailand',
    region_id: 'other',
    category: '餐廳',
    type: 'food',
    description: '濱河餐廳，可欣賞湄濱河景觀。提供泰式和西式料理，氛圍浪漫。日落時分最美。',
    duration_minutes: 90,
    opening_hours: { open: '11:00', close: '23:00' },
    tags: ['景觀餐廳', '河畔', '浪漫', '約會'],
    notes: '建議預約河景座位。日落時分用餐最浪漫。人均約400-800泰銖。',
  },
]

// ========== 曼谷特色餐廳（補充資料庫沒有的）==========
const bangkokRestaurants = [
  {
    name: 'Chocolate Ville',
    name_en: 'Chocolate Ville',
    country_id: 'thailand',
    region_id: 'th_central',
    category: '餐廳',
    type: 'food',
    description:
      '佔地13畝的歐式鄉村庭園餐廳，有風車、小木屋、小橋流水等造景。適合拍照打卡和家庭聚餐。',
    duration_minutes: 120,
    opening_hours: { open: '16:00', close: '00:00', note: '假日14:00開始' },
    tags: ['景觀餐廳', '網紅', '歐式', '拍照'],
    notes: '位於曼谷郊區，需開車前往。推薦豬肋排、德國豬腳。入場費50泰銖可抵餐費。',
  },
  {
    name: '747 Café',
    name_en: '747 Café',
    country_id: 'thailand',
    region_id: 'th_central',
    category: '餐廳',
    type: 'food',
    description:
      '由退役波音747客機改建的主題咖啡廳，保留原始機艙、座椅與駕駛艙。近年曼谷最具話題性的打卡點。',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['主題餐廳', '網紅', '飛機', '拍照', '2024新景點'],
    notes: '可參觀駕駛艙、商務艙。提供咖啡和簡餐。門票200泰銖含飲品一杯。位於郊區需開車。',
  },
  {
    name: 'Savoey',
    name_en: 'Savoey Seafood',
    country_id: 'thailand',
    region_id: 'th_central',
    category: '餐廳',
    type: 'food',
    description: '曼谷知名海鮮連鎖餐廳，以新鮮海鮮和道地泰式料理聞名。價格合理，適合團體用餐。',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['海鮮', '泰式', '連鎖', '家庭'],
    notes: '推薦咖哩蟹、蒜蓉蝦、冬蔭功。Mercury Ville和Terminal 21都有分店。人均約500-800泰銖。',
  },
  {
    name: '王子戲院豬肉粥',
    name_en: 'Joke Prince',
    country_id: 'thailand',
    region_id: 'th_central',
    category: '餐廳',
    type: 'food',
    description: '米其林必比登推薦的百年老店，招牌豬肉粥綿密順口。24小時營業，是曼谷人的深夜食堂。',
    duration_minutes: 45,
    opening_hours: { open: '24小時營業' },
    tags: ['米其林必比登', '老店', '粥', '宵夜', '24小時'],
    notes: '必點豬肉粥配油條和溫泉蛋。位於唐人街附近。人均約60-100泰銖。',
  },
  {
    name: '紅大哥海南雞飯',
    name_en: 'Kuang Heng Pratunam',
    country_id: 'thailand',
    region_id: 'th_central',
    category: '餐廳',
    type: 'food',
    description: '水門區老牌海南雞飯，與粉紅制服海南雞飯隔街相望。雞肉嫩滑，醬料獨特。',
    duration_minutes: 45,
    opening_hours: { open: '06:00', close: '14:00', note: '清晨營業' },
    tags: ['在地美食', '海南雞飯', '老店', '水門區'],
    notes: '與Go-Ang（粉紅）各有支持者，建議都嘗試。人均約60-100泰銖。清晨就開始營業。',
  },
]

// ========== 執行新增 ==========
async function addRestaurants(restaurants, regionName) {
  console.log(`\n🍽️ 正在新增 ${regionName} 餐廳...`)
  let added = 0
  let failed = 0

  for (const restaurant of restaurants) {
    // 先檢查是否已存在
    const { data: existing } = await supabase
      .from('attractions')
      .select('id')
      .eq('country_id', restaurant.country_id)
      .eq('name', restaurant.name)
      .single()

    if (existing) {
      console.log(`  ⏭️ ${restaurant.name} (已存在，跳過)`)
      continue
    }

    const { error } = await supabase.from('attractions').insert(restaurant)

    if (error) {
      console.log(`  ❌ ${restaurant.name}: ${error.message}`)
      failed++
    } else {
      console.log(`  ✅ ${restaurant.name}`)
      added++
    }
  }

  console.log(`\n📊 ${regionName} 新增完成: ${added} 新增, ${failed} 失敗`)
  return { added, failed }
}

async function main() {
  console.log('========================================')
  console.log('特色餐廳批量新增工具')
  console.log('========================================')

  await addRestaurants(egyptRestaurants, '埃及')
  await addRestaurants(saudiRestaurants, '沙烏地阿拉伯')
  await addRestaurants(chiangmaiRestaurants, '清邁')
  await addRestaurants(bangkokRestaurants, '曼谷')

  console.log('\n✅ 所有餐廳新增完成！')
}

main().catch(console.error)
