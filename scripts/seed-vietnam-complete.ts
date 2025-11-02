#!/usr/bin/env tsx
/**
 * 越南完整資料匯入
 * 包含：胡志明市、河內、峴港、會安、芽莊、下龍灣
 * 執行: npx tsx scripts/seed-vietnam-complete.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// 越南景點資料
// ============================================
const vietnamAttractions = [
  // 胡志明市（西貢）
  {
    name: '統一宮',
    name_en: 'Independence Palace',
    country_id: 'vietnam',
    city_id: 'ho-chi-minh',
    category: '景點',
    tags: ['歷史', '博物館', '文化'],
    description: '越戰歷史地標，1975年坦克攻入終結戰爭',
    duration_minutes: 90,
    is_active: true,
  },
  {
    name: '檳城市場',
    name_en: 'Ben Thanh Market',
    country_id: 'vietnam',
    city_id: 'ho-chi-minh',
    category: '購物',
    tags: ['市場', '購物', '美食'],
    description: '胡志明最大傳統市場，越南咖啡與河粉',
    duration_minutes: 150,
    is_active: true,
  },
  {
    name: '范五老街',
    name_en: 'Pham Ngu Lao Street',
    country_id: 'vietnam',
    city_id: 'ho-chi-minh',
    category: '景點',
    tags: ['背包客', '夜生活', '美食'],
    description: '背包客天堂，酒吧與街頭小吃',
    duration_minutes: 180,
    is_active: true,
  },
  {
    name: '戰爭遺跡博物館',
    name_en: 'War Remnants Museum',
    country_id: 'vietnam',
    city_id: 'ho-chi-minh',
    category: '景點',
    tags: ['歷史', '博物館', '教育'],
    description: '越戰歷史見證，震撼的戰爭照片',
    duration_minutes: 120,
    is_active: true,
  },
  {
    name: '中央郵局',
    name_en: 'Central Post Office',
    country_id: 'vietnam',
    city_id: 'ho-chi-minh',
    category: '景點',
    tags: ['建築', '歷史', '拍照'],
    description: '法式殖民建築傑作，艾菲爾設計',
    duration_minutes: 45,
    is_active: true,
  },

  // 河內
  {
    name: '還劍湖',
    name_en: 'Hoan Kiem Lake',
    country_id: 'vietnam',
    city_id: 'hanoi',
    category: '景點',
    tags: ['公園', '歷史', '散步'],
    description: '河內心臟，龜塔與玉山祠',
    duration_minutes: 90,
    is_active: true,
  },
  {
    name: '三十六行街',
    name_en: 'Old Quarter (36 Streets)',
    country_id: 'vietnam',
    city_id: 'hanoi',
    category: '購物',
    tags: ['市場', '購物', '文化'],
    description: '千年歷史老街區，每條街賣不同商品',
    duration_minutes: 180,
    is_active: true,
  },
  {
    name: '河內火車街',
    name_en: 'Hanoi Train Street',
    country_id: 'vietnam',
    city_id: 'hanoi',
    category: '景點',
    tags: ['拍照', 'Instagram', '獨特'],
    description: '火車從咖啡廳門口呼嘯而過',
    duration_minutes: 90,
    is_active: true,
  },
  {
    name: '文廟',
    name_en: 'Temple of Literature',
    country_id: 'vietnam',
    city_id: 'hanoi',
    category: '景點',
    tags: ['文化', '歷史', '建築'],
    description: '越南第一所大學，孔廟建築',
    duration_minutes: 90,
    is_active: true,
  },
  {
    name: '升龍水上木偶劇院',
    name_en: 'Thang Long Water Puppet Theatre',
    country_id: 'vietnam',
    city_id: 'hanoi',
    category: '景點',
    tags: ['表演', '文化', '傳統'],
    description: '千年傳統水上木偶戲',
    duration_minutes: 60,
    is_active: true,
  },

  // 峴港
  {
    name: '巴拿山',
    name_en: 'Ba Na Hills',
    country_id: 'vietnam',
    city_id: 'da-nang',
    category: '景點',
    tags: ['纜車', '主題樂園', 'Instagram'],
    description: 'Instagram熱門「黃金手橋」，法式山城',
    duration_minutes: 360,
    is_active: true,
  },
  {
    name: '美溪沙灘',
    name_en: 'My Khe Beach',
    country_id: 'vietnam',
    city_id: 'da-nang',
    category: '景點',
    tags: ['海灘', '水上活動', '放鬆'],
    description: '世界最美海灘之一，Forbes推薦',
    duration_minutes: 180,
    is_active: true,
  },
  {
    name: '龍橋',
    name_en: 'Dragon Bridge',
    country_id: 'vietnam',
    city_id: 'da-nang',
    category: '景點',
    tags: ['地標', '拍照', '夜景'],
    description: '會噴火噴水的龍形大橋',
    duration_minutes: 60,
    is_active: true,
  },
  {
    name: '五行山',
    name_en: 'Marble Mountains',
    country_id: 'vietnam',
    city_id: 'da-nang',
    category: '景點',
    tags: ['自然', '寺廟', '洞穴'],
    description: '五座大理石山，洞穴寺廟群',
    duration_minutes: 150,
    is_active: true,
  },

  // 會安
  {
    name: '會安古城',
    name_en: 'Hoi An Ancient Town',
    country_id: 'vietnam',
    city_id: 'hoi-an',
    category: '景點',
    tags: ['UNESCO', '歷史', '拍照'],
    description: 'UNESCO世界遺產，黃燈籠古城',
    duration_minutes: 240,
    is_active: true,
  },
  {
    name: '日本橋',
    name_en: 'Japanese Covered Bridge',
    country_id: 'vietnam',
    city_id: 'hoi-an',
    category: '景點',
    tags: ['歷史', '地標', '拍照'],
    description: '會安象徵，400年歷史日式橋樑',
    duration_minutes: 30,
    is_active: true,
  },
  {
    name: '會安夜市',
    name_en: 'Hoi An Night Market',
    country_id: 'vietnam',
    city_id: 'hoi-an',
    category: '購物',
    tags: ['夜市', '購物', '美食'],
    description: '黃燈籠夜市，手工藝品與街頭美食',
    duration_minutes: 150,
    is_active: true,
  },
  {
    name: '會安裁縫店',
    name_en: 'Hoi An Tailors',
    country_id: 'vietnam',
    city_id: 'hoi-an',
    category: '購物',
    tags: ['購物', '訂製', '時尚'],
    description: '24小時訂製西裝，便宜又快',
    duration_minutes: 120,
    is_active: true,
  },

  // 芽莊
  {
    name: '珍珠島樂園',
    name_en: 'Vinpearl Land',
    country_id: 'vietnam',
    city_id: 'nha-trang',
    category: '景點',
    tags: ['主題樂園', '親子', '水上樂園'],
    description: '越南迪士尼，跨海纜車',
    duration_minutes: 480,
    is_active: true,
  },
  {
    name: '芽莊海灘',
    name_en: 'Nha Trang Beach',
    country_id: 'vietnam',
    city_id: 'nha-trang',
    category: '景點',
    tags: ['海灘', '潛水', '水上活動'],
    description: '越南馬爾地夫，清澈海水',
    duration_minutes: 240,
    is_active: true,
  },
  {
    name: '芽莊泥漿浴',
    name_en: 'Mud Bath',
    country_id: 'vietnam',
    city_id: 'nha-trang',
    category: '景點',
    tags: ['SPA', '放鬆', '獨特'],
    description: '天然礦物泥漿浴，美容養生',
    duration_minutes: 120,
    is_active: true,
  },

  // 下龍灣
  {
    name: '下龍灣遊船',
    name_en: 'Ha Long Bay Cruise',
    country_id: 'vietnam',
    city_id: 'ha-long',
    category: '景點',
    tags: ['UNESCO', '遊船', '自然'],
    description: 'UNESCO世界遺產，海上桂林',
    duration_minutes: 720,
    is_active: true,
  },
  {
    name: '天堂洞',
    name_en: 'Paradise Cave',
    country_id: 'vietnam',
    city_id: 'ha-long',
    category: '景點',
    tags: ['洞穴', '自然', '探險'],
    description: '世界最美洞穴之一，31公里長',
    duration_minutes: 180,
    is_active: true,
  },
]

// ============================================
// 越南米其林餐廳（目前較少）
// ============================================
const vietnamMichelinRestaurants = [
  // 胡志明市 - Anan Saigon
  {
    name: 'Anan Saigon',
    name_en: 'Anan Saigon',
    country_id: 'vietnam',
    city_id: 'ho-chi-minh',
    michelin_stars: 1,
    cuisine_type: ['越南料理', '現代料理'],
    chef_name: 'Peter Franklin',
    price_range: '₫₫₫',
    avg_price_dinner: 1500000,
    currency: 'VND',
    description: '首間越南米其林一星，現代越南料理',
    commission_rate: 10,
    awards: ['米其林一星', '2024年獲獎'],
    is_active: true,
  },

  // 河內 - Hibana by Koki
  {
    name: 'Hibana by Koki',
    name_en: 'Hibana by Koki',
    country_id: 'vietnam',
    city_id: 'hanoi',
    michelin_stars: 1,
    cuisine_type: ['日本料理', '鐵板燒'],
    chef_name: 'Hiroki Takemura',
    price_range: '₫₫₫',
    avg_price_dinner: 2000000,
    currency: 'VND',
    description: '河內首間米其林，日式鐵板燒',
    commission_rate: 10,
    awards: ['米其林一星'],
    is_active: true,
  },
]

// ============================================
// 越南頂級體驗
// ============================================
const vietnamPremiumExperiences = [
  // 胡志明市 - 河粉烹飪課程
  {
    name: '西貢街頭美食與河粉烹飪大師班',
    name_en: 'Saigon Street Food & Pho Cooking Masterclass',
    category: 'culinary_mastery',
    country_id: 'vietnam',
    city_id: 'ho-chi-minh',
    exclusivity_level: 'exclusive',
    description: '跟隨米其林推薦主廚學習正宗越南河粉，從市場採購到烹飪',
    highlights: [
      '檳城市場清晨採購',
      '學習正宗牛肉河粉Pho Bo',
      '越南咖啡調製',
      '街頭小吃導覽',
      '米其林主廚親授',
    ],
    duration_hours: 5.0,
    group_size_min: 2,
    group_size_max: 8,
    price_per_person_min: 2500000,
    price_per_person_max: 3500000,
    currency: 'VND',
    expert_name: 'Chef Nguyen Thi Lan',
    expert_credentials: ['米其林推薦餐廳主廚', '30年越南料理經驗'],
    advance_booking_days: 14,
    commission_rate: 15,
    recommended_for: ['美食愛好者', '料理愛好者', '文化深度遊'],
    is_active: true,
  },

  // 河內 - 升龍水上木偶VIP
  {
    name: '升龍水上木偶劇後台參觀',
    name_en: 'Thang Long Water Puppet Backstage Tour',
    category: 'exclusive_access',
    country_id: 'vietnam',
    city_id: 'hanoi',
    exclusivity_level: 'highly_exclusive',
    description: '進入水上木偶劇後台，由國寶級藝師親自演示操作技巧',
    highlights: [
      'VIP包廂觀賞演出',
      '後台參觀與操作體驗',
      '國寶級藝師親自指導',
      '了解千年木偶戲歷史',
      '傳統越南晚餐',
    ],
    duration_hours: 3.5,
    group_size_min: 2,
    group_size_max: 6,
    price_per_person_min: 3000000,
    price_per_person_max: 4500000,
    currency: 'VND',
    expert_name: 'Master Tran Van Hung',
    expert_credentials: ['國寶級水上木偶藝師', '50年木偶戲經驗'],
    advance_booking_days: 30,
    commission_rate: 18,
    recommended_for: ['文化深度遊', 'VIP客戶', '藝術愛好者'],
    is_active: true,
  },

  // 下龍灣 - 私人豪華遊艇
  {
    name: '下龍灣私人豪華遊艇過夜之旅',
    name_en: 'Ha Long Bay Private Luxury Yacht Overnight',
    category: 'luxury_lifestyle',
    country_id: 'vietnam',
    city_id: 'ha-long',
    exclusivity_level: 'highly_exclusive',
    description: '私人包船遊覽UNESCO世界遺產下龍灣，頂級船艙過夜體驗',
    highlights: [
      '豪華私人遊艇包船',
      '米其林主廚海鮮晚宴',
      '獨木舟探索秘境洞穴',
      '船上SPA按摩',
      '日出太極課程',
      '頂級船艙住宿',
    ],
    duration_hours: 24.0,
    group_size_min: 2,
    group_size_max: 8,
    price_per_person_min: 12000000,
    price_per_person_max: 18000000,
    currency: 'VND',
    advance_booking_days: 45,
    commission_rate: 20,
    recommended_for: ['蜜月旅行', 'VIP客戶', '家庭旅遊'],
    is_active: true,
  },

  // 會安 - 奧黛訂製
  {
    name: '會安頂級奧黛訂製與古城攝影',
    name_en: 'Hoi An Premium Ao Dai Tailoring & Photoshoot',
    category: 'artisan_workshop',
    country_id: 'vietnam',
    city_id: 'hoi-an',
    exclusivity_level: 'exclusive',
    description: '由會安最頂級裁縫大師訂製奧黛（越南國服），專業攝影師古城拍攝',
    highlights: [
      '頂級裁縫大師量身訂製',
      '使用越南頂級絲綢',
      '會安古城專業攝影',
      '妝髮造型',
      '精修30張照片',
      '48小時完成訂製',
    ],
    duration_hours: 6.0,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 4500000,
    price_per_person_max: 7000000,
    currency: 'VND',
    expert_name: 'Master Tailor Tran',
    expert_credentials: ['會安頂級裁縫40年', '曾為越南第一夫人訂製'],
    advance_booking_days: 21,
    commission_rate: 15,
    recommended_for: ['蜜月旅行', '攝影愛好者', '時尚愛好者'],
    is_active: true,
  },

  // 峴港 - 巴拿山私人VIP
  {
    name: '巴拿山VIP免排隊專屬體驗',
    name_en: 'Ba Na Hills VIP Skip-the-Line Experience',
    category: 'exclusive_access',
    country_id: 'vietnam',
    city_id: 'da-nang',
    exclusivity_level: 'exclusive',
    description: '巴拿山免排隊VIP通道，私人導遊，黃金手橋獨家攝影時段',
    highlights: [
      '免排隊VIP通道',
      '清晨獨家黃金手橋拍攝',
      '私人導遊全程陪同',
      '法式酒窖品酒',
      '頂級法式午餐',
      '專業攝影師跟拍',
    ],
    duration_hours: 8.0,
    group_size_min: 2,
    group_size_max: 6,
    price_per_person_min: 6000000,
    price_per_person_max: 9000000,
    currency: 'VND',
    advance_booking_days: 21,
    commission_rate: 18,
    recommended_for: ['VIP客戶', '攝影愛好者', '蜜月旅行'],
    is_active: true,
  },

  // 芽莊 - 私人島嶼一日遊
  {
    name: '芽莊私人島嶼豪華遊艇一日遊',
    name_en: 'Nha Trang Private Island Luxury Yacht Day Trip',
    category: 'luxury_lifestyle',
    country_id: 'vietnam',
    city_id: 'nha-trang',
    exclusivity_level: 'exclusive',
    description: '私人遊艇探索芽莊秘境小島，浮潛、海鮮BBQ、無人島獨享',
    highlights: [
      '私人遊艇包船',
      '秘境小島浮潛',
      '無人島海鮮BBQ',
      '船上SPA按摩',
      '專業潛水教練',
      '水上活動設備',
    ],
    duration_hours: 8.0,
    group_size_min: 2,
    group_size_max: 10,
    price_per_person_min: 4000000,
    price_per_person_max: 6000000,
    currency: 'VND',
    advance_booking_days: 14,
    commission_rate: 15,
    recommended_for: ['家庭旅遊', '蜜月旅行', '水上活動愛好者'],
    is_active: true,
  },
]

// ============================================
// 執行匯入
// ============================================
async function seedData() {
  console.log('🇻🇳 開始匯入越南完整資料...\n')

  let totalSuccess = 0
  let totalFailed = 0

  // 1. 景點
  console.log('📍 匯入越南景點資料...')
  let attractionsSuccess = 0
  for (const attraction of vietnamAttractions) {
    try {
      const { error } = await supabase.from('attractions').insert(attraction)
      if (error) throw error
      attractionsSuccess++
      totalSuccess++
      console.log(`  ✅ ${attraction.name}（${attraction.city_id}）`)
    } catch (error: any) {
      totalFailed++
      console.log(`  ❌ ${attraction.name}: ${error.message}`)
    }
  }
  console.log(`越南景點：${attractionsSuccess}/${vietnamAttractions.length}\n`)

  // 2. 米其林餐廳
  console.log('⭐ 匯入越南米其林餐廳...')
  let restaurantsSuccess = 0
  for (const restaurant of vietnamMichelinRestaurants) {
    try {
      const { error } = await supabase.from('michelin_restaurants').insert(restaurant)
      if (error) throw error
      restaurantsSuccess++
      totalSuccess++
      console.log(`  ✅ ${restaurant.name} (${'⭐'.repeat(restaurant.michelin_stars)})`)
    } catch (error: any) {
      totalFailed++
      console.log(`  ❌ ${restaurant.name}: ${error.message}`)
    }
  }
  console.log(`越南米其林：${restaurantsSuccess}/${vietnamMichelinRestaurants.length}\n`)

  // 3. 頂級體驗
  console.log('✨ 匯入越南頂級體驗...')
  let experiencesSuccess = 0
  for (const experience of vietnamPremiumExperiences) {
    try {
      const { error } = await supabase.from('premium_experiences').insert(experience)
      if (error) throw error
      experiencesSuccess++
      totalSuccess++
      console.log(`  ✅ ${experience.name}`)
    } catch (error: any) {
      totalFailed++
      console.log(`  ❌ ${experience.name}: ${error.message}`)
    }
  }
  console.log(`越南體驗：${experiencesSuccess}/${vietnamPremiumExperiences.length}\n`)

  // 總結
  console.log('=' .repeat(70))
  console.log('🎉 越南資料匯入總結：')
  console.log(`  📍 景點：${attractionsSuccess}/${vietnamAttractions.length}`)
  console.log(
    `  ⭐ 米其林餐廳：${restaurantsSuccess}/${vietnamMichelinRestaurants.length}`
  )
  console.log(`  ✨ 頂級體驗：${experiencesSuccess}/${vietnamPremiumExperiences.length}`)
  console.log(`  📊 總計成功：${totalSuccess} 筆`)
  console.log(`  ❌ 失敗：${totalFailed} 筆`)
  console.log('=' .repeat(70))

  console.log('\n🌏 越南城市覆蓋：')
  console.log('  🏙️ 胡志明市（Ho Chi Minh）：5 景點 + 1 米其林 + 1 體驗')
  console.log('  🏛️ 河內（Hanoi）：5 景點 + 1 米其林 + 1 體驗')
  console.log('  🌉 峴港（Da Nang）：4 景點 + 1 體驗')
  console.log('  🏮 會安（Hoi An）：4 景點 + 1 體驗')
  console.log('  🏖️ 芽莊（Nha Trang）：3 景點 + 1 體驗')
  console.log('  ⛵ 下龍灣（Ha Long Bay）：2 景點 + 1 體驗')

  console.log('\n✨ 獨特體驗亮點：')
  console.log('  • 下龍灣私人豪華遊艇過夜（UNESCO世界遺產）')
  console.log('  • 升龍水上木偶劇後台參觀（國寶級藝師）')
  console.log('  • 會安奧黛訂製與古城攝影（頂級裁縫大師）')
  console.log('  • 巴拿山VIP免排隊（黃金手橋獨家拍攝）')
  console.log('  • 西貢河粉烹飪大師班（米其林主廚）')
  console.log('  • 芽莊私人島嶼遊艇（秘境浮潛）')
}

seedData()
  .then(() => {
    console.log('\n✅ 越南資料完整化完成！')
    console.log('🇻🇳 Vietnam is ready for travel packages! 🚀')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ 匯入失敗:', error)
    process.exit(1)
  })
