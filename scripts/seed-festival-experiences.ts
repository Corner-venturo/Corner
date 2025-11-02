#!/usr/bin/env tsx
/**
 * 深度在地祭典體驗匯入
 * 真正的文化深度體驗，非一般觀光客能參與
 * 執行: npx tsx scripts/seed-festival-experiences.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// 深度在地祭典體驗
// ============================================
const festivalExperiences = [
  // ==================== 日本祭典 ====================

  // 京都 - 祇園祭
  {
    name: '祇園祭宵山私人町家觀禮',
    name_en: 'Gion Matsuri Yoiyama Private Machiya Viewing',
    category: 'cultural_immersion',
    country_id: 'japan',
    region_id: 'kansai',
    city_id: 'kyoto',
    exclusivity_level: 'ultra_exclusive',
    description: '在百年町家私宅中觀賞祇園祭宵山，由祭典世家家族親自接待，體驗真正的京都祭典文化',
    highlights: [
      '祭典世家私人町家包場',
      '家族成員親自講解祇園祭千年歷史',
      '觀賞山鉾巡行（最佳位置）',
      '傳統宴席料理',
      '參與祭典準備儀式',
      '穿著傳統祭典服飾',
      '與町內會成員交流',
    ],
    duration_hours: 8.0,
    group_size_min: 2,
    group_size_max: 6,
    price_per_person_min: 250000,
    price_per_person_max: 350000,
    currency: 'JPY',
    expert_name: '山田家族（祇園祭世家）',
    expert_credentials: ['300年祇園祭傳承家族', '山鉾町保存會成員'],
    advance_booking_days: 90,
    commission_rate: 20,
    recommended_for: ['文化深度遊', 'VIP客戶', '歷史愛好者'],
    available_seasons: ['夏季（7月）'],
    best_time_of_day: '傍晚',
    is_active: true,
  },

  // 東京 - 淺草三社祭
  {
    name: '淺草三社祭神輿擔轎體驗',
    name_en: 'Asakusa Sanja Matsuri Mikoshi Carrying Experience',
    category: 'cultural_immersion',
    country_id: 'japan',
    region_id: 'kanto',
    city_id: 'tokyo',
    exclusivity_level: 'highly_exclusive',
    description: '穿著傳統祭典服裝，與淺草在地町內會成員一起擔神輿，體驗東京最熱血的祭典',
    highlights: [
      '正式加入町內會擔神輿',
      '祭典服飾完整著裝（法被、鉢卷）',
      '跟隨在地職人學習擔神輿技巧',
      '參與祭典前儀式（御神酒、手締め）',
      '祭典後町內會聚餐',
      '獲得參加證書',
    ],
    duration_hours: 6.0,
    group_size_min: 2,
    group_size_max: 8,
    price_per_person_min: 120000,
    price_per_person_max: 180000,
    currency: 'JPY',
    expert_name: '淺草町內會會長',
    expert_credentials: ['50年三社祭參與經驗', '淺草觀光文化大使'],
    advance_booking_days: 60,
    commission_rate: 18,
    recommended_for: ['文化深度遊', '體驗型旅客', '攝影愛好者'],
    available_seasons: ['春季（5月）'],
    physical_requirement: '需有基本體力（神輿約50kg）',
    is_active: true,
  },

  // 青森 - 睡魔祭
  {
    name: '青森睡魔祭跳人隊參與體驗',
    name_en: 'Aomori Nebuta Matsuri Haneto Dancer Experience',
    category: 'cultural_immersion',
    country_id: 'japan',
    region_id: 'tohoku',
    city_id: 'aomori',
    exclusivity_level: 'exclusive',
    description: '成為睡魔祭跳人隊正式成員，學習傳統舞蹈，與數百萬人共舞於青森街頭',
    highlights: [
      '睡魔祭正式跳人服裝租借',
      '專業舞蹈教練指導跳人舞',
      '加入正式跳人隊伍',
      '近距離觀賞巨型睡魔燈籠',
      '參與街頭遊行（2-3小時）',
      '祭典後慶功宴',
      '專業攝影師跟拍',
    ],
    duration_hours: 5.0,
    group_size_min: 1,
    group_size_max: 10,
    price_per_person_min: 80000,
    price_per_person_max: 120000,
    currency: 'JPY',
    expert_name: '青森睡魔祭保存會',
    expert_credentials: ['青森縣認證睡魔祭傳承團體'],
    advance_booking_days: 45,
    commission_rate: 15,
    recommended_for: ['文化深度遊', '家庭旅遊', '攝影愛好者'],
    available_seasons: ['夏季（8月）'],
    physical_requirement: '需能連續跳舞2-3小時',
    is_active: true,
  },

  // 札幌 - 雪祭
  {
    name: '札幌雪祭雪雕製作工作坊',
    name_en: 'Sapporo Snow Festival Sculpture Workshop',
    category: 'artisan_workshop',
    country_id: 'japan',
    region_id: 'hokkaido',
    city_id: 'sapporo',
    exclusivity_level: 'exclusive',
    description: '跟隨自衛隊雪雕師學習大型雪雕製作技術，參與札幌雪祭雪雕創作',
    highlights: [
      '自衛隊專業雪雕師指導',
      '學習大型雪雕製作技術',
      '參與實際雪雕創作',
      '作品展示於雪祭會場',
      '獲得雪雕師證書',
      '暖身甜酒與熱食',
    ],
    duration_hours: 6.0,
    group_size_min: 4,
    group_size_max: 12,
    price_per_person_min: 60000,
    price_per_person_max: 90000,
    currency: 'JPY',
    expert_name: '札幌雪祭製作委員會',
    expert_credentials: ['自衛隊雪雕專業團隊', '50年雪祭製作經驗'],
    advance_booking_days: 60,
    commission_rate: 15,
    recommended_for: ['藝術愛好者', '家庭旅遊', '獨特體驗'],
    available_seasons: ['冬季（2月）'],
    physical_requirement: '需能在零下氣溫工作',
    is_active: true,
  },

  // ==================== 泰國祭典 ====================

  // 清邁 - 水燈節
  {
    name: '清邁水燈節蘭納王族儀式體驗',
    name_en: 'Chiang Mai Loy Krathong Royal Lanna Ceremony',
    category: 'cultural_immersion',
    country_id: 'thailand',
    city_id: 'chiang-mai',
    exclusivity_level: 'highly_exclusive',
    description: '參與蘭納王族後裔主持的傳統水燈節儀式，在私人河畔放天燈與水燈',
    highlights: [
      '蘭納王族後裔親自主持儀式',
      '學習傳統水燈製作（香蕉葉編織）',
      '僧侶祈福儀式',
      '私人河畔施放天燈',
      '傳統蘭納服飾體驗',
      '蘭納王朝晚宴',
      '專業攝影師拍攝',
    ],
    duration_hours: 5.0,
    group_size_min: 2,
    group_size_max: 12,
    price_per_person_min: 18000,
    price_per_person_max: 28000,
    currency: 'THB',
    expert_name: 'Princess Dara（蘭納王族後裔）',
    expert_credentials: ['蘭納王朝皇室後裔', '泰國文化保存協會理事'],
    advance_booking_days: 60,
    commission_rate: 18,
    recommended_for: ['蜜月旅行', 'VIP客戶', '文化深度遊'],
    available_seasons: ['秋季（11月）'],
    is_active: true,
  },

  // 曼谷 - 潑水節
  {
    name: '曼谷宋干節皇家寺廟傳統儀式',
    name_en: 'Bangkok Songkran Royal Temple Traditional Ceremony',
    category: 'cultural_immersion',
    country_id: 'thailand',
    city_id: 'bangkok',
    exclusivity_level: 'highly_exclusive',
    description: '參與皇家寺廟的宋干節傳統儀式，遠離觀光潑水，體驗真正的泰國新年文化',
    highlights: [
      '皇家寺廟非公開儀式參與',
      '為佛像淨身儀式',
      '長者祈福儀式',
      '傳統泰服體驗',
      '僧侶祈福',
      '皇家寺廟素食午餐',
      '避開觀光潑水區',
    ],
    duration_hours: 4.0,
    group_size_min: 2,
    group_size_max: 8,
    price_per_person_min: 12000,
    price_per_person_max: 18000,
    currency: 'THB',
    expert_name: 'Monk Phra Somchai',
    expert_credentials: ['皇家寺廟住持', '40年佛教文化研究'],
    advance_booking_days: 45,
    commission_rate: 15,
    recommended_for: ['文化深度遊', '靈性追尋', '攝影愛好者'],
    available_seasons: ['春季（4月）'],
    dress_code: '需穿著端莊服裝（長袖、長褲/長裙）',
    is_active: true,
  },

  // 普吉島 - 素食節
  {
    name: '普吉島素食節淨身儀式參與',
    name_en: 'Phuket Vegetarian Festival Purification Ceremony',
    category: 'spiritual_wellness',
    country_id: 'thailand',
    city_id: 'phuket',
    exclusivity_level: 'exclusive',
    description: '參與普吉島獨特的素食節淨身儀式，體驗神明附體文化（觀禮非參與穿刺）',
    highlights: [
      '神壇淨身儀式',
      '觀禮扶乩與神明附體',
      '九皇爺祈福儀式',
      '素食料理品嚐',
      '過火儀式觀禮',
      '中泰文化專家講解',
      '傳統白衣穿著',
    ],
    duration_hours: 6.0,
    group_size_min: 2,
    group_size_max: 10,
    price_per_person_min: 10000,
    price_per_person_max: 15000,
    currency: 'THB',
    expert_name: '普吉華人會館主席',
    expert_credentials: ['普吉素食節委員會成員', '中泰文化研究者'],
    advance_booking_days: 30,
    commission_rate: 15,
    recommended_for: ['文化深度遊', '靈性追尋', '獨特體驗'],
    available_seasons: ['秋季（9-10月）'],
    restrictions: ['需遵守素食戒律', '不適合膽小者'],
    is_active: true,
  },

  // ==================== 韓國祭典 ====================

  // 首爾 - 宗廟大祭
  {
    name: '首爾宗廟大祭皇室儀式觀禮',
    name_en: 'Seoul Jongmyo Jerye Royal Ancestral Rite',
    category: 'exclusive_access',
    country_id: 'korea',
    city_id: 'seoul',
    exclusivity_level: 'ultra_exclusive',
    description: 'UNESCO人類非物質文化遺產，參與朝鮮王朝皇室祭祖大典，VIP觀禮席',
    highlights: [
      'VIP第一排觀禮席',
      '韓國文化專家全程講解',
      '觀賞宗廟祭禮樂（UNESCO認證）',
      '朝鮮王朝後裔接待',
      '傳統韓服體驗（宮廷等級）',
      '皇室素宴體驗',
      '宗廟非公開區域參觀',
    ],
    duration_hours: 5.0,
    group_size_min: 2,
    group_size_max: 6,
    price_per_person_min: 350000,
    price_per_person_max: 500000,
    currency: 'KRW',
    expert_name: '朝鮮王朝後裔協會',
    expert_credentials: ['朝鮮王室後裔', 'UNESCO文化遺產保護委員'],
    advance_booking_days: 90,
    commission_rate: 20,
    recommended_for: ['VIP客戶', '文化深度遊', '歷史愿好者'],
    available_seasons: ['春季（5月第一個週日）'],
    dress_code: '需穿著端莊服裝',
    is_active: true,
  },

  // 首爾 - 燃燈會
  {
    name: '首爾燃燈會蓮燈製作與遊行',
    name_en: 'Seoul Lotus Lantern Festival Making & Parade',
    category: 'cultural_immersion',
    country_id: 'korea',
    city_id: 'seoul',
    exclusivity_level: 'exclusive',
    description: '在千年古寺學習傳統蓮燈製作，參與首爾最美夜間遊行',
    highlights: [
      '古寺蓮燈製作工作坊',
      '僧侶指導傳統技法',
      '參與夜間蓮燈遊行',
      '寺廟素齋體驗',
      '佛誕日祈福儀式',
      '專業攝影師跟拍',
    ],
    duration_hours: 6.0,
    group_size_min: 2,
    group_size_max: 12,
    price_per_person_min: 120000,
    price_per_person_max: 180000,
    currency: 'KRW',
    expert_name: '曹溪寺住持',
    expert_credentials: ['首爾最大佛教寺廟住持', '燃燈會組織委員'],
    advance_booking_days: 30,
    commission_rate: 15,
    recommended_for: ['文化深度遊', '家庭旅遊', '攝影愛好者'],
    available_seasons: ['春季（5月佛誕日）'],
    is_active: true,
  },

  // 釜山 - 札嘎其祭典
  {
    name: '釜山札嘎其文化觀光祭海女體驗',
    name_en: 'Busan Jagalchi Festival Haenyeo Experience',
    category: 'cultural_immersion',
    country_id: 'korea',
    city_id: 'busan',
    exclusivity_level: 'exclusive',
    description: '跟隨釜山海女學習傳統漁法，參與札嘎其海鮮祭典',
    highlights: [
      '海女奶奶親自指導',
      '學習傳統自由潛水技巧',
      '參與海鮮祭典遊行',
      '現撈海鮮料理',
      '海女服裝體驗',
      '海女文化講座',
    ],
    duration_hours: 5.0,
    group_size_min: 2,
    group_size_max: 8,
    price_per_person_min: 150000,
    price_per_person_max: 220000,
    currency: 'KRW',
    expert_name: '金海女（60年經驗）',
    expert_credentials: ['釜山海女協會成員', 'UNESCO海女文化傳承者'],
    advance_booking_days: 30,
    commission_rate: 15,
    recommended_for: ['文化深度遊', '海洋愛好者', '獨特體驗'],
    available_seasons: ['秋季（10月）'],
    physical_requirement: '需會游泳',
    is_active: true,
  },

  // ==================== 越南祭典 ====================

  // 河內 - 中秋節
  {
    name: '河內中秋節傳統獅舞隊體驗',
    name_en: 'Hanoi Mid-Autumn Festival Lion Dance Experience',
    category: 'cultural_immersion',
    country_id: 'vietnam',
    city_id: 'hanoi',
    exclusivity_level: 'exclusive',
    description: '加入河內傳統獅舞隊，學習獅頭製作與舞獅技巧，參與中秋遊行',
    highlights: [
      '傳統獅頭製作工作坊',
      '專業舞獅師指導',
      '參與街頭獅舞表演',
      '中秋月餅品嚐',
      '兒童提燈遊行',
      '越南傳統服飾體驗',
    ],
    duration_hours: 4.0,
    group_size_min: 4,
    group_size_max: 10,
    price_per_person_min: 2000000,
    price_per_person_max: 3000000,
    currency: 'VND',
    expert_name: 'Master Nguyen Van Long',
    expert_credentials: ['河內獅舞協會會長', '40年舞獅經驗'],
    advance_booking_days: 30,
    commission_rate: 15,
    recommended_for: ['家庭旅遊', '文化深度遊', '體驗型旅客'],
    available_seasons: ['秋季（農曆8月15日）'],
    is_active: true,
  },

  // 胡志明市 - 端午節
  {
    name: '西貢端午龍舟競賽選手體驗',
    name_en: 'Saigon Dragon Boat Festival Racer Experience',
    category: 'cultural_immersion',
    country_id: 'vietnam',
    city_id: 'ho-chi-minh',
    exclusivity_level: 'exclusive',
    description: '加入西貢龍舟隊訓練，參與西貢河端午龍舟競賽',
    highlights: [
      '專業龍舟隊訓練',
      '參與端午龍舟賽',
      '傳統粽子製作',
      '龍舟文化講座',
      '賽後慶功宴',
      '獲得參賽證書',
    ],
    duration_hours: 6.0,
    group_size_min: 8,
    group_size_max: 20,
    price_per_person_min: 1500000,
    price_per_person_max: 2500000,
    currency: 'VND',
    expert_name: '西貢龍舟協會',
    expert_credentials: ['越南龍舟總會認證', '30年競賽經驗'],
    advance_booking_days: 45,
    commission_rate: 15,
    recommended_for: ['團隊建設', '運動愛好者', '文化深度遊'],
    available_seasons: ['夏季（農曆5月5日）'],
    physical_requirement: '需有基本划船體力',
    is_active: true,
  },

  // 會安 - 元宵節
  {
    name: '會安元宵節燈籠製作與放水燈',
    name_en: 'Hoi An Lantern Festival Making & River Release',
    category: 'artisan_workshop',
    country_id: 'vietnam',
    city_id: 'hoi-an',
    exclusivity_level: 'exclusive',
    description: '跟隨會安燈籠大師學習傳統絲綢燈籠製作，參與古城元宵放水燈儀式',
    highlights: [
      '會安燈籠大師親授',
      '手工絲綢燈籠製作',
      '古城元宵夜遊',
      '秋盆河放水燈',
      '傳統奧黛體驗',
      '帶走自製燈籠',
    ],
    duration_hours: 5.0,
    group_size_min: 2,
    group_size_max: 8,
    price_per_person_min: 3000000,
    price_per_person_max: 4500000,
    currency: 'VND',
    expert_name: 'Master Tran Van Hieu',
    expert_credentials: ['會安燈籠世家第五代', '聯合國教科文組織認證工藝師'],
    advance_booking_days: 21,
    commission_rate: 15,
    recommended_for: ['蜜月旅行', '手工藝愛好者', '攝影愛好者'],
    available_seasons: ['每月農曆14日（滿月）'],
    is_active: true,
  },

  // ==================== 中國祭典 ====================

  // 上海 - 豫園燈會
  {
    name: '上海豫園元宵燈會花燈製作',
    name_en: 'Shanghai Yuyuan Lantern Festival Making Workshop',
    category: 'artisan_workshop',
    country_id: 'china',
    city_id: 'shanghai',
    exclusivity_level: 'exclusive',
    description: '跟隨國家級非遺傳承人學習海派花燈製作，作品展示於豫園燈會',
    highlights: [
      '國家級非遺傳承人指導',
      '學習傳統海派花燈技藝',
      '製作大型花燈',
      '作品展示於豫園',
      '燈會VIP導覽',
      '元宵湯圓品嚐',
    ],
    duration_hours: 6.0,
    group_size_min: 4,
    group_size_max: 12,
    price_per_person_min: 2800,
    price_per_person_max: 4200,
    currency: 'CNY',
    expert_name: '何克明',
    expert_credentials: ['國家級非物質文化遺產傳承人', '上海花燈協會會長'],
    advance_booking_days: 45,
    commission_rate: 18,
    recommended_for: ['文化深度遊', '藝術愛好者', '家庭旅遊'],
    available_seasons: ['春季（元宵節）'],
    is_active: true,
  },
]

// ============================================
// 執行匯入
// ============================================
async function seedData() {
  console.log('🎊 開始匯入深度在地祭典體驗...\n')

  let totalSuccess = 0
  let totalFailed = 0

  console.log('🎭 匯入祭典體驗資料...')

  for (const experience of festivalExperiences) {
    try {
      const { error } = await supabase.from('premium_experiences').insert(experience)
      if (error) throw error
      totalSuccess++
      console.log(
        `  ✅ ${experience.name}（${experience.city_id}）- ${experience.exclusivity_level}`
      )
    } catch (error: any) {
      totalFailed++
      console.log(`  ❌ ${experience.name}: ${error.message}`)
    }
  }

  // 總結
  console.log('\n' + '='.repeat(70))
  console.log('🎉 祭典體驗匯入總結：')
  console.log(`  🎊 祭典體驗：${totalSuccess}/${festivalExperiences.length}`)
  console.log(`  📊 成功：${totalSuccess} 筆`)
  console.log(`  ❌ 失敗：${totalFailed} 筆`)
  console.log('='.repeat(70))

  console.log('\n🌏 祭典覆蓋：')
  console.log('  🇯🇵 日本：4 個祭典（祇園祭、三社祭、睡魔祭、雪祭）')
  console.log('  🇹🇭 泰國：3 個祭典（水燈節、潑水節、素食節）')
  console.log('  🇰🇷 韓國：3 個祭典（宗廟大祭、燃燈會、札嘎其祭）')
  console.log('  🇻🇳 越南：3 個祭典（中秋節、端午節、元宵節）')
  console.log('  🇨🇳 中國：1 個祭典（豫園燈會）')

  console.log('\n✨ 獨特性分布：')
  const ultraExclusive = festivalExperiences.filter(
    e => e.exclusivity_level === 'ultra_exclusive'
  ).length
  const highlyExclusive = festivalExperiences.filter(
    e => e.exclusivity_level === 'highly_exclusive'
  ).length
  const exclusive = festivalExperiences.filter(e => e.exclusivity_level === 'exclusive').length

  console.log(`  🌟 Ultra Exclusive：${ultraExclusive} 個`)
  console.log(`  ⭐ Highly Exclusive：${highlyExclusive} 個`)
  console.log(`  ✨ Exclusive：${exclusive} 個`)

  console.log('\n🎯 特色亮點：')
  console.log('  • UNESCO世界遺產：宗廟大祭、海女文化')
  console.log('  • 百年傳承家族：祇園祭世家、蘭納王族')
  console.log('  • 非遺傳承人：上海花燈、會安燈籠')
  console.log('  • 皇室等級：宗廟大祭、蘭納王族儀式')
  console.log('  • 季節限定：全部體驗都是特定季節限定')
}

seedData()
  .then(() => {
    console.log('\n✅ 祭典體驗資料匯入完成！')
    console.log('🎊 深度在地文化體驗已就緒！')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ 匯入失敗:', error)
    process.exit(1)
  })
