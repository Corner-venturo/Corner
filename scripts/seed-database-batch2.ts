#!/usr/bin/env tsx
/**
 * 第二批資料匯入（修正版）
 * 執行: npx tsx scripts/seed-database-batch2.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// 景點資料（修正欄位名稱）
// ============================================
const attractions = [
  // 東京
  {
    name: '明治神宮',
    name_en: 'Meiji Shrine',
    country_id: 'japan',
    region_id: 'kanto',
    city_id: 'tokyo',
    category: '景點',
    tags: ['文化', '神社', '自然'],
    description: '東京市中心的綠洲，供奉明治天皇',
    duration_minutes: 90,
    is_active: true,
  },
  {
    name: '築地外市場美食街',
    name_en: 'Tsukiji Outer Market',
    country_id: 'japan',
    region_id: 'kanto',
    city_id: 'tokyo',
    category: '餐廳',
    tags: ['美食', '市場', '海鮮'],
    description: '新鮮海產與街頭美食天堂',
    duration_minutes: 120,
    is_active: true,
  },
  // 京都
  {
    name: '嵐山竹林',
    name_en: 'Arashiyama Bamboo Grove',
    country_id: 'japan',
    region_id: 'kansai',
    city_id: 'kyoto',
    category: '景點',
    tags: ['自然', '拍照', '竹林'],
    description: '夢幻竹林步道',
    duration_minutes: 90,
    is_active: true,
  },
  {
    name: '錦市場',
    name_en: 'Nishiki Market',
    country_id: 'japan',
    region_id: 'kansai',
    city_id: 'kyoto',
    category: '購物',
    tags: ['美食', '市場', '購物'],
    description: '京都廚房，400年歷史',
    duration_minutes: 120,
    is_active: true,
  },
  // 大阪
  {
    name: '黑門市場',
    name_en: 'Kuromon Market',
    country_id: 'japan',
    region_id: 'kansai',
    city_id: 'osaka',
    category: '購物',
    tags: ['美食', '市場', '海鮮'],
    description: '大阪廚房，海鮮與和牛',
    duration_minutes: 120,
    is_active: true,
  },
  // 曼谷
  {
    name: '玉佛寺',
    name_en: 'Wat Phra Kaew',
    country_id: 'thailand',
    city_id: 'bangkok',
    category: '景點',
    tags: ['文化', '寺廟', '歷史'],
    description: '泰國最神聖的寺廟',
    duration_minutes: 120,
    is_active: true,
  },
  {
    name: '洽圖洽週末市集',
    name_en: 'Chatuchak Weekend Market',
    country_id: 'thailand',
    city_id: 'bangkok',
    category: '購物',
    tags: ['購物', '市場', '美食'],
    description: '世界最大週末市集，15000個攤位',
    duration_minutes: 240,
    is_active: true,
  },
  {
    name: 'Asiatique河濱夜市',
    name_en: 'Asiatique The Riverfront',
    country_id: 'thailand',
    city_id: 'bangkok',
    category: '購物',
    tags: ['購物', '夜市', '河濱'],
    description: '湄南河畔大型夜市，摩天輪地標',
    duration_minutes: 180,
    is_active: true,
  },
  // 清邁
  {
    name: '雙龍寺',
    name_en: 'Wat Phra That Doi Suthep',
    country_id: 'thailand',
    city_id: 'chiang-mai',
    category: '景點',
    tags: ['文化', '寺廟', '山景'],
    description: '素帖山上的金色佛塔，清邁地標',
    duration_minutes: 120,
    is_active: true,
  },
  {
    name: '寧曼路',
    name_en: 'Nimman Road',
    country_id: 'thailand',
    city_id: 'chiang-mai',
    category: '購物',
    tags: ['購物', '咖啡廳', '文青'],
    description: '文青聚集地，咖啡廳與設計小店',
    duration_minutes: 150,
    is_active: true,
  },
  // 首爾
  {
    name: '北村韓屋村',
    name_en: 'Bukchon Hanok Village',
    country_id: 'korea',
    city_id: 'seoul',
    category: '景點',
    tags: ['文化', '歷史', '韓屋'],
    description: '傳統韓屋聚落',
    duration_minutes: 120,
    is_active: true,
  },
  {
    name: '弘大',
    name_en: 'Hongdae',
    country_id: 'korea',
    city_id: 'seoul',
    category: '景點',
    tags: ['藝術', '夜生活', '年輕'],
    description: '年輕藝術家聚集地，街頭表演與夜生活',
    duration_minutes: 180,
    is_active: true,
  },
  {
    name: '廣藏市場',
    name_en: 'Gwangjang Market',
    country_id: 'korea',
    city_id: 'seoul',
    category: '餐廳',
    tags: ['美食', '市場', '傳統'],
    description: '百年傳統市場，綠豆煎餅與生拌牛肉',
    duration_minutes: 120,
    is_active: true,
  },
  // 上海
  {
    name: '外灘',
    name_en: 'The Bund',
    country_id: 'china',
    city_id: 'shanghai',
    category: '景點',
    tags: ['歷史', '建築', '夜景'],
    description: '萬國建築博覽，黃浦江夜景',
    duration_minutes: 120,
    is_active: true,
  },
  {
    name: '豫園',
    name_en: 'Yuyuan Garden',
    country_id: 'china',
    city_id: 'shanghai',
    category: '景點',
    tags: ['文化', '園林', '歷史'],
    description: '明代古典園林',
    duration_minutes: 90,
    is_active: true,
  },
  {
    name: '田子坊',
    name_en: 'Tianzifang',
    country_id: 'china',
    city_id: 'shanghai',
    category: '購物',
    tags: ['藝術', '購物', '咖啡廳'],
    description: '石庫門弄堂改造的藝術區',
    duration_minutes: 120,
    is_active: true,
  },
  {
    name: '新天地',
    name_en: 'Xintiandi',
    country_id: 'china',
    city_id: 'shanghai',
    category: '購物',
    tags: ['時尚', '購物', '餐廳'],
    description: '時尚石庫門商圈',
    duration_minutes: 150,
    is_active: true,
  },
]

// ============================================
// 米其林餐廳（修正country_id格式）
// ============================================
const michelinRestaurants = [
  // 京都
  {
    name: '菊乃井本店',
    name_en: 'Kikunoi Honten',
    country_id: 'japan',
    region_id: 'kansai',
    city_id: 'kyoto',
    michelin_stars: 3,
    cuisine_type: ['懷石料理', '日本料理'],
    chef_name: '村田吉弘',
    price_range: '¥¥¥¥',
    avg_price_dinner: 30000,
    currency: 'JPY',
    phone: '+81-75-561-0015',
    description: '京都懷石料理代表，130年歷史',
    commission_rate: 8,
    is_active: true,
  },
  {
    name: '吉泉',
    name_en: 'Yoshizumi',
    country_id: 'japan',
    region_id: 'kansai',
    city_id: 'kyoto',
    michelin_stars: 3,
    cuisine_type: ['懷石料理'],
    chef_name: '吉住純一',
    price_range: '¥¥¥¥',
    avg_price_dinner: 28000,
    currency: 'JPY',
    description: '隱密町屋餐廳，僅8個座位',
    commission_rate: 10,
    is_active: true,
  },
  // 大阪
  {
    name: '太庵',
    name_en: 'Taian',
    country_id: 'japan',
    region_id: 'kansai',
    city_id: 'osaka',
    michelin_stars: 3,
    cuisine_type: ['日本料理', '創意料理'],
    chef_name: '岩永歩',
    price_range: '¥¥¥¥',
    avg_price_dinner: 35000,
    currency: 'JPY',
    description: '年輕主廚獲米其林三星',
    commission_rate: 8,
    is_active: true,
  },
  {
    name: 'Hajime',
    name_en: 'Hajime',
    country_id: 'japan',
    region_id: 'kansai',
    city_id: 'osaka',
    michelin_stars: 3,
    cuisine_type: ['法式料理', '創意料理'],
    chef_name: '米田肇',
    price_range: '¥¥¥¥',
    avg_price_dinner: 32000,
    currency: 'JPY',
    description: '藝術與科學的料理實驗室',
    commission_rate: 10,
    is_active: true,
  },
  // 東京
  {
    name: 'Quintessence',
    name_en: 'Quintessence',
    country_id: 'japan',
    region_id: 'kanto',
    city_id: 'tokyo',
    michelin_stars: 3,
    cuisine_type: ['法式料理'],
    chef_name: '岸田周三',
    price_range: '¥¥¥¥',
    avg_price_dinner: 35000,
    currency: 'JPY',
    description: '東京第一家法式米其林三星',
    commission_rate: 8,
    is_active: true,
  },
  {
    name: '神楽坂石かわ',
    name_en: 'Kagurazaka Ishikawa',
    country_id: 'japan',
    region_id: 'kanto',
    city_id: 'tokyo',
    michelin_stars: 3,
    cuisine_type: ['懷石料理'],
    chef_name: '石川秀樹',
    price_range: '¥¥¥¥',
    avg_price_dinner: 30000,
    currency: 'JPY',
    description: '連續15年米其林三星',
    commission_rate: 8,
    is_active: true,
  },
  // 曼谷
  {
    name: 'Sühring',
    name_en: 'Sühring',
    country_id: 'thailand',
    city_id: 'bangkok',
    michelin_stars: 2,
    cuisine_type: ['德國料理', '現代歐洲料理'],
    chef_name: 'Thomas & Mathias Sühring',
    price_range: '฿฿฿',
    avg_price_dinner: 7500,
    currency: 'THB',
    description: '雙胞胎主廚的德國現代料理',
    commission_rate: 12,
    is_active: true,
  },
  {
    name: 'Le Du',
    name_en: 'Le Du',
    country_id: 'thailand',
    city_id: 'bangkok',
    michelin_stars: 2,
    cuisine_type: ['泰式料理', '現代料理'],
    chef_name: 'Ton Tassanakajohn',
    price_range: '฿฿฿',
    avg_price_dinner: 6000,
    currency: 'THB',
    description: '以泰國季節食材重新詮釋泰菜',
    commission_rate: 12,
    is_active: true,
  },
  // 首爾
  {
    name: 'Gaon',
    name_en: 'Gaon',
    country_id: 'korea',
    city_id: 'seoul',
    michelin_stars: 3,
    cuisine_type: ['韓國料理', '宮廷料理'],
    chef_name: 'Kim Byung-jin',
    price_range: '₩₩₩₩',
    avg_price_dinner: 200000,
    currency: 'KRW',
    description: '當代韓國宮廷料理',
    commission_rate: 10,
    is_active: true,
  },
  {
    name: 'Mingles',
    name_en: 'Mingles',
    country_id: 'korea',
    city_id: 'seoul',
    michelin_stars: 2,
    cuisine_type: ['韓國料理', '現代料理'],
    chef_name: 'Kang Min-goo',
    price_range: '₩₩₩',
    avg_price_dinner: 180000,
    currency: 'KRW',
    description: '韓國傳統與西方技法融合',
    commission_rate: 12,
    is_active: true,
  },
]

// ============================================
// 頂級體驗（修正欄位名稱）
// ============================================
const premiumExperiences = [
  // 東京
  {
    name: '築地魚市場晨間VIP拍賣觀摩',
    name_en: 'Tsukiji Fish Market VIP Tuna Auction Experience',
    category: 'exclusive_access',
    country_id: 'japan',
    region_id: 'kanto',
    city_id: 'tokyo',
    exclusivity_level: 'highly_exclusive',
    description: '凌晨4點進入魚市場，觀摩鮪魚拍賣，由壽司職人帶領享用現切早餐',
    highlights: ['鮪魚拍賣第一排觀摩', '壽司職人現場講解', '築地限定早餐', '市場導覽'],
    duration_hours: 3.0,
    group_size_min: 2,
    group_size_max: 6,
    price_per_person_min: 85000,
    price_per_person_max: 120000,
    currency: 'JPY',
    expert_name: '山田健二',
    expert_credentials: ['30年築地職人', '曾為皇室供應海鮮'],
    advance_booking_days: 30,
    commission_rate: 15,
    recommended_for: ['美食愛好者', 'VIP客戶', '文化深度遊'],
    is_active: true,
  },
  {
    name: '東京米其林廚師家庭料理課程',
    name_en: 'Tokyo Michelin Chef Home Cooking Class',
    category: 'culinary_mastery',
    country_id: 'japan',
    region_id: 'kanto',
    city_id: 'tokyo',
    exclusivity_level: 'exclusive',
    description: '在米其林主廚的私人工作室學習日本家庭料理秘訣',
    highlights: ['米其林主廚親授', '學習5道經典日本家庭料理', '品嚐自己的作品', '獲得食譜與證書'],
    duration_hours: 4.0,
    group_size_min: 2,
    group_size_max: 8,
    price_per_person_min: 65000,
    price_per_person_max: 85000,
    currency: 'JPY',
    expert_name: '佐藤美香',
    expert_credentials: ['米其林一星懷石料理主廚'],
    advance_booking_days: 21,
    commission_rate: 15,
    recommended_for: ['美食愛好者', '親子家庭', '料理愛好者'],
    is_active: true,
  },
  // 京都
  {
    name: '京都非公開文化財特別參觀',
    name_en: 'Kyoto Private Cultural Heritage Tour',
    category: 'exclusive_access',
    country_id: 'japan',
    region_id: 'kansai',
    city_id: 'kyoto',
    exclusivity_level: 'highly_exclusive',
    description: '參觀平時不對外開放的京都古寺與私人庭園，由文化財保護專家導覽',
    highlights: ['非公開寺院特別開放', '私人庭園鑑賞', '住持親自接待', '抹茶體驗'],
    duration_hours: 5.0,
    group_size_min: 2,
    group_size_max: 6,
    price_per_person_min: 150000,
    price_per_person_max: 200000,
    currency: 'JPY',
    expert_name: '田中一郎',
    expert_credentials: ['京都文化財保護協會理事', '30年文化財研究'],
    advance_booking_days: 45,
    commission_rate: 18,
    recommended_for: ['VIP客戶', '文化深度遊', '歷史愛好者'],
    is_active: true,
  },
  // 曼谷
  {
    name: '曼谷皇家御廚泰式料理大師班',
    name_en: 'Bangkok Royal Thai Cuisine Masterclass',
    category: 'culinary_mastery',
    country_id: 'thailand',
    city_id: 'bangkok',
    exclusivity_level: 'exclusive',
    description: '由前皇室御廚教授泰國皇家料理，學習宮廷級擺盤與雕刻',
    highlights: ['皇室御廚親授', '學習5道皇家料理', '泰式水果雕刻技巧', '精緻午餐'],
    duration_hours: 5.0,
    group_size_min: 2,
    group_size_max: 8,
    price_per_person_min: 15000,
    price_per_person_max: 22000,
    currency: 'THB',
    expert_name: 'Chef Nooror Somany Steppe',
    expert_credentials: ['泰國皇室御廚30年', 'Blue Elephant創辦人'],
    advance_booking_days: 14,
    commission_rate: 15,
    recommended_for: ['美食愛好者', '料理愛好者', '文化深度遊'],
    is_active: true,
  },
  {
    name: '昭披耶河私人古董柚木船巡遊晚宴',
    name_en: 'Chao Phraya River Private Antique Teak Boat Dinner',
    category: 'luxury_lifestyle',
    country_id: 'thailand',
    city_id: 'bangkok',
    exclusivity_level: 'highly_exclusive',
    description: '搭乘百年柚木古董船，享用米其林主廚特製晚宴，欣賞傳統泰舞',
    highlights: ['百年柚木古董船', '米其林主廚8道式晚宴', '皇家泰舞表演', '私人攝影師'],
    duration_hours: 3.5,
    group_size_min: 2,
    group_size_max: 10,
    price_per_person_min: 25000,
    price_per_person_max: 35000,
    currency: 'THB',
    advance_booking_days: 30,
    commission_rate: 18,
    recommended_for: ['蜜月旅行', 'VIP客戶', '浪漫晚餐'],
    sustainability_rating: 'High',
    is_active: true,
  },
  // 首爾
  {
    name: '青瓦台總統府私人導覽',
    name_en: 'Blue House Presidential Residence Private Tour',
    category: 'exclusive_access',
    country_id: 'korea',
    city_id: 'seoul',
    exclusivity_level: 'ultra_exclusive',
    description: '前總統府官員帶領參觀青瓦台非公開區域，了解韓國政治歷史',
    highlights: ['非公開區域參觀', '前政府官員導覽', '總統辦公室參觀', '韓式宮廷午餐'],
    duration_hours: 4.0,
    group_size_min: 4,
    group_size_max: 8,
    price_per_person_min: 500000,
    price_per_person_max: 650000,
    currency: 'KRW',
    expert_name: '前青瓦台秘書',
    expert_credentials: ['前總統府高級秘書官', '15年政府服務'],
    advance_booking_days: 60,
    commission_rate: 20,
    recommended_for: ['VIP客戶', '政治愛好者', '歷史愛好者'],
    is_active: true,
  },
  {
    name: '首爾宮廷韓服高級訂製體驗',
    name_en: 'Seoul Royal Hanbok Haute Couture Experience',
    category: 'artisan_workshop',
    country_id: 'korea',
    city_id: 'seoul',
    exclusivity_level: 'highly_exclusive',
    description: '由國家級韓服大師為您量身訂製宮廷韓服，並進行專業攝影',
    highlights: ['國家級韓服大師親自量身', '高級絲綢手工訂製', '景福宮專業攝影', '韓服歷史講座'],
    duration_hours: 6.0,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 280000,
    price_per_person_max: 450000,
    currency: 'KRW',
    expert_name: '李英姬',
    expert_credentials: ['國家級重要無形文化財傳承人', '韓服製作50年'],
    advance_booking_days: 45,
    commission_rate: 18,
    recommended_for: ['文化深度遊', '攝影愛好者', 'VIP客戶'],
    is_active: true,
  },
  // 上海
  {
    name: '上海老洋房私宅下午茶',
    name_en: 'Shanghai Historic Villa Private Afternoon Tea',
    category: 'exclusive_access',
    country_id: 'china',
    city_id: 'shanghai',
    exclusivity_level: 'highly_exclusive',
    description: '在1930年代名流私宅中享用精緻下午茶，聆聽老上海故事',
    highlights: ['百年私人洋房', '英式下午茶與中式糕點', '老上海歷史講座', '古董家具鑑賞'],
    duration_hours: 3.0,
    group_size_min: 2,
    group_size_max: 8,
    price_per_person_min: 1200,
    price_per_person_max: 1800,
    currency: 'CNY',
    expert_name: '張太太',
    expert_credentials: ['百年洋房第四代傳人', '上海歷史研究者'],
    advance_booking_days: 21,
    commission_rate: 15,
    recommended_for: ['文化深度遊', 'VIP客戶', '歷史愛好者'],
    is_active: true,
  },
  {
    name: '蘇州園林私人茶道體驗',
    name_en: 'Suzhou Garden Private Tea Ceremony',
    category: 'cultural_immersion',
    country_id: 'china',
    city_id: 'shanghai',
    exclusivity_level: 'exclusive',
    description: '在蘇州古典園林中由茶藝大師教授中國茶道精髓',
    highlights: ['UNESCO世界遺產園林包場', '國家級茶藝大師', '品嚐10款頂級茶葉', '茶具鑑賞'],
    duration_hours: 4.0,
    group_size_min: 2,
    group_size_max: 6,
    price_per_person_min: 2500,
    price_per_person_max: 3500,
    currency: 'CNY',
    expert_name: '陳師傅',
    expert_credentials: ['國家高級茶藝師', '40年茶道研究'],
    advance_booking_days: 30,
    commission_rate: 15,
    recommended_for: ['文化深度遊', '茶藝愛好者', 'VIP客戶'],
    is_active: true,
  },
]

// ============================================
// 執行匯入
// ============================================
async function seedData() {
  console.log('🌟 開始匯入第二批資料...\n')

  // 1. 景點
  console.log('📍 匯入景點資料...')
  let attractionsSuccess = 0
  for (const attraction of attractions) {
    try {
      const { error } = await supabase.from('attractions').insert(attraction)
      if (error) throw error
      attractionsSuccess++
      console.log(`  ✅ ${attraction.name}`)
    } catch (error: any) {
      console.log(`  ❌ ${attraction.name}: ${error.message}`)
    }
  }
  console.log(`\n景點：${attractionsSuccess}/${attractions.length}\n`)

  // 2. 米其林餐廳
  console.log('⭐ 匯入米其林餐廳資料...')
  let restaurantsSuccess = 0
  for (const restaurant of michelinRestaurants) {
    try {
      const { error } = await supabase.from('michelin_restaurants').insert(restaurant)
      if (error) throw error
      restaurantsSuccess++
      console.log(`  ✅ ${restaurant.name} (${'⭐'.repeat(restaurant.michelin_stars)})`)
    } catch (error: any) {
      console.log(`  ❌ ${restaurant.name}: ${error.message}`)
    }
  }
  console.log(`\n米其林餐廳：${restaurantsSuccess}/${michelinRestaurants.length}\n`)

  // 3. 頂級體驗
  console.log('✨ 匯入頂級體驗資料...')
  let experiencesSuccess = 0
  for (const experience of premiumExperiences) {
    try {
      const { error } = await supabase.from('premium_experiences').insert(experience)
      if (error) throw error
      experiencesSuccess++
      console.log(`  ✅ ${experience.name}`)
    } catch (error: any) {
      console.log(`  ❌ ${experience.name}: ${error.message}`)
    }
  }
  console.log(`\n頂級體驗：${experiencesSuccess}/${premiumExperiences.length}\n`)

  // 總結
  console.log('='.repeat(60))
  console.log('🎉 資料匯入總結：')
  console.log(`  📍 景點：${attractionsSuccess}/${attractions.length}`)
  console.log(`  ⭐ 米其林餐廳：${restaurantsSuccess}/${michelinRestaurants.length}`)
  console.log(`  ✨ 頂級體驗：${experiencesSuccess}/${premiumExperiences.length}`)
  console.log(`  📊 總計成功：${attractionsSuccess + restaurantsSuccess + experiencesSuccess} 筆`)
  console.log('='.repeat(60))
}

seedData()
  .then(() => {
    console.log('\n✅ 匯入完成！')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ 匯入失敗:', error)
    process.exit(1)
  })
