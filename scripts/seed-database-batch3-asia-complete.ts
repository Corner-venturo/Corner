#!/usr/bin/env tsx
/**
 * 第三批資料匯入 - 亞洲資料完整化
 * 目標：提升現有城市的資料密度，補充高價值體驗與特色餐廳
 * 執行: npx tsx scripts/seed-database-batch3-asia-complete.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// 景點資料 - 補充日本城市
// ============================================
const japanAttractions = [
  // 札幌（目前只有1個體驗）
  {
    name: '札幌時計台',
    name_en: 'Sapporo Clock Tower',
    country_id: 'japan',
    region_id: 'hokkaido',
    city_id: 'sapporo',
    category: '景點',
    tags: ['歷史', '地標', '拍照'],
    description: '札幌象徵，北海道最古老的時鐘塔',
    duration_minutes: 45,
    is_active: true,
  },
  {
    name: '札幌啤酒博物館',
    name_en: 'Sapporo Beer Museum',
    country_id: 'japan',
    region_id: 'hokkaido',
    city_id: 'sapporo',
    category: '景點',
    tags: ['博物館', '美食', '啤酒'],
    description: '唯一的啤酒博物館，免費試飲',
    duration_minutes: 90,
    is_active: true,
  },
  {
    name: '薄野不夜城',
    name_en: 'Susukino District',
    country_id: 'japan',
    region_id: 'hokkaido',
    city_id: 'sapporo',
    category: '景點',
    tags: ['夜生活', '美食', '購物'],
    description: '北海道最大的娛樂街，拉麵橫丁',
    duration_minutes: 180,
    is_active: true,
  },
  {
    name: '二條市場',
    name_en: 'Nijo Market',
    country_id: 'japan',
    region_id: 'hokkaido',
    city_id: 'sapporo',
    category: '餐廳',
    tags: ['海鮮', '市場', '美食'],
    description: '札幌廚房，新鮮海鮮丼飯',
    duration_minutes: 120,
    is_active: true,
  },
  {
    name: '白色戀人公園',
    name_en: 'Shiroi Koibito Park',
    country_id: 'japan',
    region_id: 'hokkaido',
    city_id: 'sapporo',
    category: '景點',
    tags: ['甜點', '親子', '工廠參觀'],
    description: '北海道知名伴手禮工廠，歐式庭園',
    duration_minutes: 120,
    is_active: true,
  },

  // 福岡（目前只有3個景點）
  {
    name: '博多運河城',
    name_en: 'Canal City Hakata',
    country_id: 'japan',
    region_id: 'kyushu',
    city_id: 'fukuoka',
    category: '購物',
    tags: ['購物', '娛樂', '美食'],
    description: '福岡最大購物娛樂中心',
    duration_minutes: 180,
    is_active: true,
  },
  {
    name: '柳橋連合市場',
    name_en: 'Yanagibashi Market',
    country_id: 'japan',
    region_id: 'kyushu',
    city_id: 'fukuoka',
    category: '餐廳',
    tags: ['海鮮', '市場', '美食'],
    description: '博多廚房，新鮮海產與內臟鍋',
    duration_minutes: 90,
    is_active: true,
  },
  {
    name: '中洲屋台街',
    name_en: 'Nakasu Yatai Street',
    country_id: 'japan',
    region_id: 'kyushu',
    city_id: 'fukuoka',
    category: '餐廳',
    tags: ['夜市', '美食', '在地體驗'],
    description: '日本最大屋台街，博多拉麵與關東煮',
    duration_minutes: 120,
    is_active: true,
  },

  // 熊本（只有2個景點）
  {
    name: '阿蘇火山',
    name_en: 'Mount Aso',
    country_id: 'japan',
    region_id: 'kyushu',
    city_id: 'kumamoto',
    category: '景點',
    tags: ['自然', '火山', '健行'],
    description: '世界最大破火山口，壯觀火山地形',
    duration_minutes: 240,
    is_active: true,
  },
  {
    name: '水前寺成趣園',
    name_en: 'Suizenji Jojuen Garden',
    country_id: 'japan',
    region_id: 'kyushu',
    city_id: 'kumamoto',
    category: '景點',
    tags: ['園林', '文化', '拍照'],
    description: '桃山式迴遊庭園，縮景富士山',
    duration_minutes: 90,
    is_active: true,
  },
]

// ============================================
// 景點資料 - 補充韓國城市
// ============================================
const koreaAttractions = [
  // 釜山（只有2個景點）
  {
    name: '札嘎其市場',
    name_en: 'Jagalchi Fish Market',
    country_id: 'korea',
    city_id: 'busan',
    category: '餐廳',
    tags: ['海鮮', '市場', '美食'],
    description: '韓國最大海鮮市場，現撈現吃',
    duration_minutes: 150,
    is_active: true,
  },
  {
    name: '影島天空步道',
    name_en: 'Yeongdo Skywalk',
    category: '景點',
    country_id: 'korea',
    city_id: 'busan',
    tags: ['觀景', '拍照', '刺激'],
    description: '透明玻璃天空步道，絕美海景',
    duration_minutes: 60,
    is_active: true,
  },
  {
    name: '太宗台',
    name_en: 'Taejongdae',
    country_id: 'korea',
    city_id: 'busan',
    category: '景點',
    tags: ['自然', '海景', '燈塔'],
    description: '釜山最美海岸線，懸崖峭壁',
    duration_minutes: 180,
    is_active: true,
  },
  {
    name: '南浦洞國際市場',
    name_en: 'Gukje Market',
    country_id: 'korea',
    city_id: 'busan',
    category: '購物',
    tags: ['購物', '市場', '美食'],
    description: '釜山最大傳統市場，韓國小吃天堂',
    duration_minutes: 120,
    is_active: true,
  },

  // 濟州島（只有2個景點）
  {
    name: '牛島',
    name_en: 'Udo Island',
    country_id: 'korea',
    city_id: 'jeju',
    category: '景點',
    tags: ['海灘', '跳島', '自然'],
    description: '濟州島外的珊瑚島，花生冰淇淋',
    duration_minutes: 300,
    is_active: true,
  },
  {
    name: '涉地可支',
    name_en: 'Seopjikoji',
    country_id: 'korea',
    city_id: 'jeju',
    category: '景點',
    tags: ['海景', '拍照', '韓劇拍攝地'],
    description: '韓劇聖地，絕美海岸線',
    duration_minutes: 90,
    is_active: true,
  },
  {
    name: '漢拏山國家公園',
    name_en: 'Hallasan National Park',
    country_id: 'korea',
    city_id: 'jeju',
    category: '景點',
    tags: ['登山', '自然', '世界遺產'],
    description: '韓國最高峰，UNESCO世界自然遺產',
    duration_minutes: 480,
    is_active: true,
  },
  {
    name: '東門傳統市場',
    name_en: 'Dongmun Traditional Market',
    country_id: 'korea',
    city_id: 'jeju',
    category: '購物',
    tags: ['市場', '美食', '海鮮'],
    description: '濟州最大傳統市場，黑豬肉與海鮮',
    duration_minutes: 120,
    is_active: true,
  },
]

// ============================================
// 景點資料 - 補充泰國城市
// ============================================
const thailandAttractions = [
  // 普吉島（只有2個景點）
  {
    name: 'Phi Phi 群島跳島',
    name_en: 'Phi Phi Islands',
    country_id: 'thailand',
    city_id: 'phuket',
    category: '景點',
    tags: ['海灘', '跳島', '浮潛'],
    description: '電影《海灘》拍攝地，絕美海灣',
    duration_minutes: 480,
    is_active: true,
  },
  {
    name: '攀牙灣獨木舟',
    name_en: 'Phang Nga Bay Kayaking',
    country_id: 'thailand',
    city_id: 'phuket',
    category: '景點',
    tags: ['自然', '獨木舟', '石灰岩'],
    description: '鐘乳石洞與翡翠潟湖探險',
    duration_minutes: 360,
    is_active: true,
  },
  {
    name: '普吉週末夜市',
    name_en: 'Phuket Weekend Market',
    country_id: 'thailand',
    city_id: 'phuket',
    category: '購物',
    tags: ['夜市', '購物', '美食'],
    description: '當地人的週末市集，便宜好逛',
    duration_minutes: 180,
    is_active: true,
  },
  {
    name: '老普吉鎮',
    name_en: 'Phuket Old Town',
    country_id: 'thailand',
    city_id: 'phuket',
    category: '景點',
    tags: ['文化', '歷史', '拍照'],
    description: '葡萄牙風情建築，彩色屋咖啡廳',
    duration_minutes: 120,
    is_active: true,
  },

  // 清邁（補充餐廳）
  {
    name: '清邁週六夜市',
    name_en: 'Saturday Night Market',
    country_id: 'thailand',
    city_id: 'chiang-mai',
    category: '購物',
    tags: ['夜市', '手工藝', '美食'],
    description: '銀器一條街，手工藝品夜市',
    duration_minutes: 180,
    is_active: true,
  },
  {
    name: '瓦洛洛市場',
    name_en: 'Warorot Market',
    country_id: 'thailand',
    city_id: 'chiang-mai',
    category: '購物',
    tags: ['市場', '美食', '在地'],
    description: '當地人的傳統市場，泰北小吃',
    duration_minutes: 120,
    is_active: true,
  },
]

// ============================================
// 米其林餐廳 - 補充特色餐廳
// ============================================
const michelinRestaurants = [
  // 曼谷 - Jay Fai（超有名的街頭小吃米其林）
  {
    name: 'Jay Fai',
    name_en: 'Jay Fai',
    country_id: 'thailand',
    city_id: 'bangkok',
    michelin_stars: 1,
    cuisine_type: ['泰式料理', '街頭小吃'],
    chef_name: 'Supinya Junsuta (Jay Fai)',
    price_range: '฿฿',
    avg_price_dinner: 3000,
    currency: 'THB',
    description: '全球唯一米其林一星街頭小吃，蟹肉歐姆蛋傳奇',
    commission_rate: 0, // 街頭小吃不給佣金但超有名
    awards: ['米其林一星', "Netflix Chef's Table"],
    is_active: true,
  },

  // 首爾 - Jungsik
  {
    name: 'Jungsik',
    name_en: 'Jungsik',
    country_id: 'korea',
    city_id: 'seoul',
    michelin_stars: 2,
    cuisine_type: ['韓國料理', '現代料理'],
    chef_name: 'Yim Jung-sik',
    price_range: '₩₩₩₩',
    avg_price_dinner: 250000,
    currency: 'KRW',
    description: '現代韓國料理先驅，世界50最佳餐廳',
    commission_rate: 12,
    awards: ['米其林二星', '亞洲50最佳餐廳 #11'],
    is_active: true,
  },

  // 清邁 - David's Kitchen
  {
    name: "David's Kitchen",
    name_en: "David's Kitchen",
    country_id: 'thailand',
    city_id: 'chiang-mai',
    michelin_stars: 1,
    cuisine_type: ['法式料理', '泰式融合'],
    chef_name: 'David Ruengkitiyanon',
    price_range: '฿฿฿',
    avg_price_dinner: 4500,
    currency: 'THB',
    description: '清邁唯一米其林，法式與泰北融合',
    commission_rate: 10,
    awards: ['米其林一星'],
    is_active: true,
  },

  // 東京 - Kanda
  {
    name: '神田',
    name_en: 'Kanda',
    country_id: 'japan',
    region_id: 'kanto',
    city_id: 'tokyo',
    michelin_stars: 3,
    cuisine_type: ['日本料理', '創意料理'],
    chef_name: '神田裕行',
    price_range: '¥¥¥¥',
    avg_price_dinner: 38000,
    currency: 'JPY',
    description: '年輕主廚快速獲三星，創意日本料理',
    commission_rate: 8,
    awards: ['米其林三星'],
    is_active: true,
  },

  // 札幌 - Molière
  {
    name: 'Molière',
    name_en: 'Molière',
    country_id: 'japan',
    region_id: 'hokkaido',
    city_id: 'sapporo',
    michelin_stars: 2,
    cuisine_type: ['法式料理'],
    chef_name: '中道博',
    price_range: '¥¥¥',
    avg_price_dinner: 22000,
    currency: 'JPY',
    description: '北海道食材的法式演繹',
    commission_rate: 10,
    awards: ['米其林二星'],
    is_active: true,
  },
]

// ============================================
// 頂級體驗 - 補充高價值獨特體驗
// ============================================
const premiumExperiences = [
  // 東京 - 相撲觀摩
  {
    name: '相撲部屋晨練觀摩與力士火鍋早餐',
    name_en: 'Sumo Morning Practice & Chanko Nabe Breakfast',
    category: 'exclusive_access',
    country_id: 'japan',
    region_id: 'kanto',
    city_id: 'tokyo',
    exclusivity_level: 'highly_exclusive',
    description: '清晨6點進入相撲部屋，近距離觀摩力士訓練，享用相撲火鍋早餐',
    highlights: ['第一排觀摩力士訓練', '前力士講解相撲文化', '享用傳統Chanko Nabe火鍋', '合影留念'],
    duration_hours: 3.0,
    group_size_min: 2,
    group_size_max: 8,
    price_per_person_min: 55000,
    price_per_person_max: 75000,
    currency: 'JPY',
    expert_name: '前大相撲力士',
    expert_credentials: ['前幕內力士', '20年相撲生涯'],
    advance_booking_days: 30,
    commission_rate: 15,
    recommended_for: ['文化深度遊', '運動愛好者', 'VIP客戶'],
    is_active: true,
  },

  // 札幌 - 私人雪地活動
  {
    name: '北海道粉雪天堂私人滑雪教練',
    name_en: 'Hokkaido Powder Snow Private Ski Instructor',
    category: 'nature_adventure',
    country_id: 'japan',
    region_id: 'hokkaido',
    city_id: 'sapporo',
    exclusivity_level: 'exclusive',
    description: '由前奧運選手帶領，探索北海道秘境粉雪，享用山頂溫泉',
    highlights: ['前奧運選手一對一指導', '秘境滑雪場VIP通道', '山頂露天溫泉', '雪地燒烤午餐'],
    duration_hours: 7.0,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 120000,
    price_per_person_max: 180000,
    currency: 'JPY',
    expert_name: '山田太郎',
    expert_credentials: ['前冬季奧運日本代表', '國際滑雪教練認證'],
    advance_booking_days: 45,
    commission_rate: 18,
    recommended_for: ['運動愛好者', 'VIP客戶', '冬季限定'],
    available_seasons: ['冬季'],
    is_active: true,
  },

  // 首爾 - K-Drama拍攝地
  {
    name: 'K-Drama拍攝現場VIP參觀',
    name_en: 'K-Drama Film Set VIP Tour',
    category: 'exclusive_access',
    country_id: 'korea',
    city_id: 'seoul',
    exclusivity_level: 'highly_exclusive',
    description: '參觀正在拍攝的韓劇現場，與明星近距離接觸，由製作人導覽',
    highlights: [
      '現場拍攝觀摩',
      '可能遇見明星',
      '製作人親自導覽',
      '韓劇拍攝技巧講解',
      '劇組便當體驗',
    ],
    duration_hours: 4.0,
    group_size_min: 2,
    group_size_max: 6,
    price_per_person_min: 450000,
    price_per_person_max: 600000,
    currency: 'KRW',
    expert_name: '前MBC製作人',
    expert_credentials: ['20年韓劇製作經驗', '曾製作多部熱門韓劇'],
    advance_booking_days: 60,
    commission_rate: 20,
    recommended_for: ['韓劇迷', 'VIP客戶', '娛樂產業人士'],
    is_active: true,
  },

  // 曼谷 - Muay Thai
  {
    name: '泰拳冠軍私人訓練營',
    name_en: 'Muay Thai Champion Private Training',
    category: 'cultural_immersion',
    country_id: 'thailand',
    city_id: 'bangkok',
    exclusivity_level: 'exclusive',
    description: '由前泰拳世界冠軍親授泰拳技巧，體驗真正的泰拳訓練',
    highlights: ['世界冠軍一對一指導', '正統泰拳訓練', '泰式按摩放鬆', '泰拳比賽VIP門票'],
    duration_hours: 3.0,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 12000,
    price_per_person_max: 18000,
    currency: 'THB',
    expert_name: 'Saenchai',
    expert_credentials: ['前Lumpinee拳場冠軍', '泰拳傳奇人物'],
    advance_booking_days: 21,
    commission_rate: 15,
    recommended_for: ['運動愛好者', '文化深度遊', '格鬥愛好者'],
    is_active: true,
  },

  // 上海 - 外灘遊艇
  {
    name: '外灘私人遊艇黃浦江巡遊',
    name_en: 'The Bund Private Yacht Cruise',
    category: 'luxury_lifestyle',
    country_id: 'china',
    city_id: 'shanghai',
    exclusivity_level: 'highly_exclusive',
    description: '搭乘私人遊艇巡遊黃浦江，欣賞外灘萬國建築與陸家嘴天際線',
    highlights: [
      '70呎豪華遊艇',
      '米其林主廚船上晚宴',
      '專業調酒師',
      '私人攝影師',
      '煙火季特別航線',
    ],
    duration_hours: 3.0,
    group_size_min: 2,
    group_size_max: 12,
    price_per_person_min: 3500,
    price_per_person_max: 5500,
    currency: 'CNY',
    advance_booking_days: 30,
    commission_rate: 18,
    recommended_for: ['VIP客戶', '蜜月旅行', '商務招待', '求婚'],
    is_active: true,
  },

  // 濟州島 - 海女體驗
  {
    name: '濟州海女文化體驗',
    name_en: 'Jeju Haenyeo Diving Experience',
    category: 'cultural_immersion',
    country_id: 'korea',
    city_id: 'jeju',
    exclusivity_level: 'exclusive',
    description: '跟隨UNESCO非物質文化遺產「海女」學習自由潛水，品嚐現撈海鮮',
    highlights: ['UNESCO文化遺產體驗', '海女奶奶親自教學', '自由潛水訓練', '現撈海鮮BBQ'],
    duration_hours: 4.0,
    group_size_min: 2,
    group_size_max: 6,
    price_per_person_min: 180000,
    price_per_person_max: 250000,
    currency: 'KRW',
    expert_name: '金海女奶奶',
    expert_credentials: ['50年海女經驗', 'UNESCO認證海女文化傳承者'],
    advance_booking_days: 30,
    commission_rate: 15,
    recommended_for: ['文化深度遊', '潛水愛好者', '永續旅遊'],
    sustainability_rating: 'Very High',
    is_active: true,
  },

  // 京都 - 私人和服攝影
  {
    name: '京都非公開庭園和服攝影',
    name_en: 'Kyoto Private Garden Kimono Photoshoot',
    category: 'artisan_workshop',
    country_id: 'japan',
    region_id: 'kansai',
    city_id: 'kyoto',
    exclusivity_level: 'highly_exclusive',
    description: '在平時不開放的私人庭園，穿著高級和服進行專業攝影',
    highlights: [
      '非公開私人庭園獨家拍攝',
      '和服大師協助著裝',
      '專業攝影師',
      '妝髮造型',
      '精修20張照片',
    ],
    duration_hours: 4.0,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 120000,
    price_per_person_max: 180000,
    currency: 'JPY',
    expert_name: '攝影師田中',
    expert_credentials: ['京都旅拍專家15年', '多次獲獎攝影師'],
    advance_booking_days: 45,
    commission_rate: 18,
    recommended_for: ['蜜月旅行', '攝影愛好者', 'VIP客戶'],
    is_active: true,
  },

  // 清邁 - 蘭納廚藝
  {
    name: '蘭納王朝宮廷料理大師班',
    name_en: 'Lanna Royal Cuisine Masterclass',
    category: 'culinary_mastery',
    country_id: 'thailand',
    city_id: 'chiang-mai',
    exclusivity_level: 'exclusive',
    description: '學習泰北蘭納王朝宮廷料理，由皇室御廚傳人教授',
    highlights: [
      '皇室御廚傳人親授',
      '學習6道蘭納宮廷料理',
      '傳統市場採購',
      '精緻午餐',
      '獲得認證證書',
    ],
    duration_hours: 5.0,
    group_size_min: 2,
    group_size_max: 8,
    price_per_person_min: 8500,
    price_per_person_max: 12000,
    currency: 'THB',
    expert_name: 'Chef Kittipong',
    expert_credentials: ['蘭納王室御廚第三代傳人', '泰北料理研究學者'],
    advance_booking_days: 21,
    commission_rate: 15,
    recommended_for: ['美食愛好者', '料理愛好者', '文化深度遊'],
    is_active: true,
  },
]

// ============================================
// 執行匯入
// ============================================
async function seedData() {
  console.log('🌟 開始匯入第三批資料（亞洲資料完整化）...\n')

  let totalSuccess = 0
  let totalFailed = 0

  // 1. 日本景點
  console.log('🗾 匯入日本景點資料...')
  let japanSuccess = 0
  for (const attraction of japanAttractions) {
    try {
      const { error } = await supabase.from('attractions').insert(attraction)
      if (error) throw error
      japanSuccess++
      totalSuccess++
      console.log(`  ✅ ${attraction.name}（${attraction.city_id}）`)
    } catch (error: any) {
      totalFailed++
      console.log(`  ❌ ${attraction.name}: ${error.message}`)
    }
  }
  console.log(`日本景點：${japanSuccess}/${japanAttractions.length}\n`)

  // 2. 韓國景點
  console.log('🇰🇷 匯入韓國景點資料...')
  let koreaSuccess = 0
  for (const attraction of koreaAttractions) {
    try {
      const { error } = await supabase.from('attractions').insert(attraction)
      if (error) throw error
      koreaSuccess++
      totalSuccess++
      console.log(`  ✅ ${attraction.name}（${attraction.city_id}）`)
    } catch (error: any) {
      totalFailed++
      console.log(`  ❌ ${attraction.name}: ${error.message}`)
    }
  }
  console.log(`韓國景點：${koreaSuccess}/${koreaAttractions.length}\n`)

  // 3. 泰國景點
  console.log('🇹🇭 匯入泰國景點資料...')
  let thailandSuccess = 0
  for (const attraction of thailandAttractions) {
    try {
      const { error } = await supabase.from('attractions').insert(attraction)
      if (error) throw error
      thailandSuccess++
      totalSuccess++
      console.log(`  ✅ ${attraction.name}（${attraction.city_id}）`)
    } catch (error: any) {
      totalFailed++
      console.log(`  ❌ ${attraction.name}: ${error.message}`)
    }
  }
  console.log(`泰國景點：${thailandSuccess}/${thailandAttractions.length}\n`)

  // 4. 米其林餐廳
  console.log('⭐ 匯入特色米其林餐廳...')
  let restaurantsSuccess = 0
  for (const restaurant of michelinRestaurants) {
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
  console.log(`米其林餐廳：${restaurantsSuccess}/${michelinRestaurants.length}\n`)

  // 5. 頂級體驗
  console.log('✨ 匯入高價值獨特體驗...')
  let experiencesSuccess = 0
  for (const experience of premiumExperiences) {
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
  console.log(`頂級體驗：${experiencesSuccess}/${premiumExperiences.length}\n`)

  // 總結
  console.log('='.repeat(70))
  console.log('🎉 第三批資料匯入總結：')
  console.log(`  🗾 日本景點：${japanSuccess}/${japanAttractions.length}（札幌、福岡、熊本）`)
  console.log(`  🇰🇷 韓國景點：${koreaSuccess}/${koreaAttractions.length}（釜山、濟州島）`)
  console.log(`  🇹🇭 泰國景點：${thailandSuccess}/${thailandAttractions.length}（普吉島、清邁）`)
  console.log(
    `  ⭐ 米其林餐廳：${restaurantsSuccess}/${michelinRestaurants.length}（Jay Fai、Jungsik等）`
  )
  console.log(
    `  ✨ 頂級體驗：${experiencesSuccess}/${premiumExperiences.length}（相撲、K-Drama、遊艇等）`
  )
  console.log(`  📊 總計成功：${totalSuccess} 筆`)
  console.log(`  ❌ 失敗：${totalFailed} 筆`)
  console.log('='.repeat(70))

  console.log('\n📈 資料庫完整度提升：')
  console.log('  札幌：1 → 6 筆資料')
  console.log('  福岡：3 → 6 筆資料')
  console.log('  熊本：2 → 4 筆資料')
  console.log('  釜山：2 → 6 筆資料')
  console.log('  濟州島：2 → 6 筆資料')
  console.log('  普吉島：2 → 6 筆資料')
  console.log('  清邁：+米其林餐廳 +2景點 +1體驗')
}

seedData()
  .then(() => {
    console.log('\n✅ 亞洲資料完整化完成！')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ 匯入失敗:', error)
    process.exit(1)
  })
