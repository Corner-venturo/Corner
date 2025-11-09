/**
 * 頂級體驗與米其林餐廳種子資料
 * 專業旅行社等級 - 基於現有的日本、泰國、韓國、中國城市
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getCountryAndCity(countryCode: string, cityName: string) {
  const { data: country } = await supabase
    .from('countries')
    .select('id')
    .eq('code', countryCode)
    .single()

  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('name', cityName)
    .eq('country_id', country?.id)
    .single()

  return { country_id: country?.id, city_id: city?.id }
}

async function seedMichelinRestaurants() {
  console.log('🍽️  匯入米其林餐廳資料...')

  const restaurants = [
    // === 日本 - 東京 ===
    {
      name: '数寄屋橋次郎',
      name_en: 'Sukiyabashi Jiro',
      name_local: 'すきやばしじろう',
      michelin_stars: 3,
      michelin_guide_year: 2024,
      country_code: 'JP',
      city_name: '東京',
      address: '東京都中央區銀座4-2-15 塚本大樓地下1樓',
      cuisine_type: ['江戶前壽司', '日本料理'],
      dining_style: 'Fine Dining',
      price_range: '$$$$',
      avg_price_dinner: 40000,
      currency: 'JPY',
      phone: '+81-3-3535-3600',
      description:
        '由壽司之神小野二郎親手製作的江戶前壽司，被譽為全球最難訂位的餐廳。每日僅提供晚餐，座位僅10席，需透過五星級飯店禮賓部預約。',
      chef_name: '小野二郎',
      chef_profile: '95歲高齡的壽司之神，70年壽司職人生涯，2011年紀錄片《壽司之神》主角。',
      signature_dishes: ['赤身', '中トロ', '大トロ', '車海老', '煮蛤'],
      specialties: ['全球最高齡米其林三星主廚', '歐巴馬曾造訪', '僅10個吧台座位'],
      commission_rate: 5.0,
      booking_notes:
        '需透過五星級飯店禮賓部預約，至少提前3個月。強烈建議安排翻譯陪同。用餐時間嚴格控制在30分鐘內。',
      recommended_for: ['once_in_lifetime', 'culinary_pilgrimage', 'vip_client', 'honeymoon'],
    },
    {
      name: '龍吟',
      name_en: 'Nihonryori RyuGin',
      name_local: 'にほんりょうりりゅうぎん',
      michelin_stars: 3,
      michelin_guide_year: 2024,
      country_code: 'JP',
      city_name: '東京',
      cuisine_type: ['現代日本料理', '創意料理'],
      dining_style: 'Fine Dining',
      price_range: '$$$$',
      avg_price_lunch: 25000,
      avg_price_dinner: 35000,
      currency: 'JPY',
      phone: '+81-3-3423-8006',
      description: '世界50最佳餐廳常客，主廚山本征治將傳統日本料理昇華至藝術境界。',
      chef_name: '山本征治',
      signature_dishes: ['蠑螺最中', '鮑魚肝醬', '季節懷石'],
      commission_rate: 8.0,
      group_menu_available: true,
      recommended_for: ['luxury_traveler', 'food_enthusiast', 'business_entertainment'],
    },

    // === 日本 - 京都 ===
    {
      name: '瓢亭',
      name_en: 'Hyotei',
      name_local: 'ひょうてい',
      michelin_stars: 3,
      michelin_guide_year: 2024,
      country_code: 'JP',
      city_name: '京都',
      cuisine_type: ['京懷石', '日本料理'],
      dining_style: 'Fine Dining',
      price_range: '$$$$',
      avg_price_lunch: 18000,
      avg_price_dinner: 40000,
      currency: 'JPY',
      description: '創業450年，15代傳承的京都懷石名店。以「朝粥」聞名，使用京都時令食材。',
      chef_name: '高橋英一',
      chef_profile: '第15代傳人，守護450年傳統的同時注入現代美學。',
      signature_dishes: ['朝粥', '鮎魚', '松茸土瓶蒸'],
      specialties: ['450年歷史', '15代傳承', '庭園美景', '朝粥體驗'],
      commission_rate: 10.0,
      recommended_for: ['culture_enthusiast', 'history_lover', 'luxury_traveler'],
    },

    // === 日本 - 大阪 ===
    {
      name: '弧柳',
      name_en: 'Koryu',
      michelin_stars: 3,
      michelin_guide_year: 2024,
      country_code: 'JP',
      city_name: '大阪',
      cuisine_type: ['日本料理', '懷石'],
      dining_style: 'Fine Dining',
      price_range: '$$$$',
      avg_price_dinner: 35000,
      currency: 'JPY',
      description: '大阪唯一的米其林三星，主廚松尾英明的創意懷石料理。',
      chef_name: '松尾英明',
      commission_rate: 8.0,
      recommended_for: ['food_enthusiast', 'luxury_traveler'],
    },

    // === 泰國 - 曼谷 ===
    {
      name: 'Gaggan Anand',
      name_en: 'Gaggan Anand',
      michelin_stars: 2,
      michelin_guide_year: 2024,
      country_code: 'TH',
      city_name: '曼谷',
      address: '68/1 Soi Langsuan, Lumphini, Pathum Wan, Bangkok',
      cuisine_type: ['印度料理', '分子料理', '創意料理'],
      dining_style: 'Fine Dining',
      price_range: '$$$$',
      avg_price_dinner: 6500,
      currency: 'THB',
      website: 'https://www.gaggananand.com',
      description:
        '曾4度蟬聯亞洲50最佳餐廳冠軍，Gaggan 主廚的全新力作。25道式Emoji菜單，每道菜都是驚喜。',
      chef_name: 'Gaggan Anand',
      chef_profile: '印度裔主廚，將分子料理技法融入印度料理，創造獨一無二的用餐體驗。',
      signature_dishes: ['Lick It Up', 'Charcoal', 'Yogurt Explosion'],
      specialties: ['Emoji菜單', '開放式廚房', 'DJ 現場表演'],
      commission_rate: 12.0,
      recommended_for: ['adventurous_eater', 'luxury_traveler', 'food_enthusiast'],
    },
    {
      name: 'Le Normandie',
      name_en: 'Le Normandie',
      michelin_stars: 2,
      michelin_guide_year: 2024,
      country_code: 'TH',
      city_name: '曼谷',
      cuisine_type: ['法式料理'],
      dining_style: 'Fine Dining',
      price_range: '$$$$',
      avg_price_dinner: 8000,
      currency: 'THB',
      description: '曼谷文華東方酒店的傳奇法式餐廳，俯瞰湄南河美景。',
      chef_name: 'Arnaud Dunand Sauthier',
      specialties: ['河景', '殖民風格建築', '頂級法式'],
      commission_rate: 10.0,
      recommended_for: ['romantic_dinner', 'special_occasion', 'luxury_traveler'],
    },

    // === 韓國 - 首爾 ===
    {
      name: '羅宴',
      name_en: 'La Yeon',
      name_local: '라연',
      michelin_stars: 3,
      michelin_guide_year: 2024,
      country_code: 'KR',
      city_name: '首爾',
      cuisine_type: ['韓定食', '韓國料理'],
      dining_style: 'Fine Dining',
      price_range: '$$$$',
      avg_price_lunch: 150000,
      avg_price_dinner: 250000,
      currency: 'KRW',
      description: '韓國首家米其林三星，位於新羅酒店23樓，將宮廷料理昇華至現代美學。',
      chef_name: '金聖一',
      chef_profile: '將韓國宮廷料理現代化的先驅，堅持使用韓國本土食材。',
      signature_dishes: ['九折板', '神仙爐', '韓牛'],
      specialties: ['首爾市景', '宮廷料理', '韓國瓷器'],
      commission_rate: 10.0,
      recommended_for: ['culture_enthusiast', 'luxury_traveler', 'korean_cuisine_lover'],
    },
    {
      name: 'Mosu Seoul',
      name_en: 'Mosu Seoul',
      michelin_stars: 2,
      michelin_guide_year: 2024,
      country_code: 'KR',
      city_name: '首爾',
      cuisine_type: ['現代韓國料理', '創意料理'],
      dining_style: 'Fine Dining',
      price_range: '$$$$',
      avg_price_dinner: 280000,
      currency: 'KRW',
      description: '韓國料理與現代技法的完美結合，世界50最佳餐廳榜上有名。',
      chef_name: 'Sung Anh',
      commission_rate: 12.0,
      recommended_for: ['food_enthusiast', 'modern_cuisine_lover'],
    },

    // === 中國 - 上海 ===
    {
      name: 'Ultraviolet',
      name_en: 'Ultraviolet',
      michelin_stars: 3,
      michelin_guide_year: 2024,
      country_code: 'CN',
      city_name: '上海',
      cuisine_type: ['法式料理', '感官體驗'],
      dining_style: 'Fine Dining',
      price_range: '$$$$',
      avg_price_dinner: 6000,
      currency: 'CNY',
      description: '全球最獨特的用餐體驗！僅10個座位，結合3D投影、音樂、香氛的多感官餐廳。',
      chef_name: 'Paul Pairet',
      chef_profile: '法國主廚，將用餐提升為藝術與科技的結合。',
      signature_dishes: ['20道式感官體驗'],
      specialties: ['全球唯一多感官餐廳', '僅10個座位', '需提前3個月預約'],
      commission_rate: 15.0,
      booking_notes: '極難預約，需提前3-6個月。接送地點保密到最後一刻。',
      recommended_for: ['once_in_lifetime', 'tech_enthusiast', 'unique_experience'],
    },
  ]

  for (const restaurant of restaurants) {
    try {
      const { country_id, city_id } = await getCountryAndCity(
        restaurant.country_code,
        restaurant.city_name
      )

      if (!country_id || !city_id) {
        console.log(
          `⚠️  跳過 ${restaurant.name}：找不到國家/城市 (${restaurant.country_code}/${restaurant.city_name})`
        )
        continue
      }

      const { country_code, city_name, ...data } = restaurant
      const { error } = await supabase.from('michelin_restaurants').insert({
        ...data,
        country_id,
        city_id,
      })

      if (error) {
        console.error(`❌ 插入失敗 (${restaurant.name}):`, error.message)
      } else {
        console.log(`✅ ${restaurant.name}`)
      }
    } catch (error) {
      console.error(`❌ 錯誤 (${restaurant.name}):`, error)
    }
  }
}

async function seedPremiumExperiences() {
  console.log('\n🎭 匯入頂級體驗資料...')

  const experiences = [
    // === 日本 - 京都：祇園藝伎茶宴 ===
    {
      name: '祇園花街私人藝伎茶宴',
      name_en: 'Private Geisha Tea Ceremony in Gion',
      name_local: 'ぎおんかがいのおざしきあそび',
      tagline: '走入真正的花街世界，與舞伎、藝伎共度私密時光',
      country_code: 'JP',
      city_name: '京都',
      specific_location: '祇園甲部歌舞練場附近的傳統お茶屋',
      category: 'cultural_immersion',
      sub_category: ['traditional_arts', 'exclusive_access', 'cultural_heritage'],
      exclusivity_level: 'highly_exclusive',
      description:
        '這不是觀光表演，而是進入真正藝伎世界的獨特機會。在祇園最古老的茶屋之一，由資深的置屋媽媽桑親自安排，與正牌舞伎或藝伎共度私密茶宴。',
      highlights: [
        '由擁有60年經歷的置屋媽媽桑親自接待',
        '與資深藝伎或新進舞伎面對面交流',
        '品嘗京都傳統懷石料理',
        '觀賞傳統舞蹈與三味線現場演奏',
        '學習日本傳統遊戲「投扇興」',
        '獲得藝伎親筆簽名的精美團扇作為紀念',
      ],
      what_makes_it_special:
        '這是極少數外國旅客能進入真正茶屋的機會。祇園的茶屋採取「一見さんお断り」（拒絕生客）制度。',
      expert_name: '岡本幸代',
      expert_title: '資深置屋媽媽桑',
      expert_credentials: ['經營茶屋60年', '培育過23位藝伎和舞伎', '祇園甲部歌舞會榮譽顧問'],
      duration_hours: 3.0,
      group_size_min: 2,
      group_size_max: 6,
      language_support: ['日語', '英語', '中文'],
      difficulty_level: 'easy',
      advance_booking_days: 45,
      price_per_person_min: 120000,
      price_per_person_max: 150000,
      currency: 'JPY',
      price_includes: ['私人茶屋包場', '懷石料理', '藝伎表演', '專業攝影', '翻譯服務', '紀念團扇'],
      commission_rate: 15.0,
      net_price_per_person: 102000,
      recommended_for: ['once_in_lifetime', 'culture_enthusiast', 'luxury_traveler', 'honeymoon'],
      is_featured: true,
    },

    // === 日本 - 北海道：雪地奢華晚宴 ===
    {
      name: '北海道秘境雪地奢華晚宴',
      name_en: 'Private Luxury Snow Dome Dining in Hokkaido',
      tagline: '在璀璨星空下，於純白雪原中享受頂級法日fusion料理',
      country_code: 'JP',
      city_name: '札幌',
      specific_location: '十勝岳麓秘境雪原',
      category: 'culinary_mastery',
      sub_category: ['exclusive_dining', 'nature_experience', 'luxury'],
      exclusivity_level: 'exclusive',
      description:
        '想像在零下20度的雪原中，坐在溫暖如春的透明圓頂帳篷裡，頭頂是滿天星斗，腳下是皚皚白雪，面前是米其林主廚現場烹調的頂級料理。',
      highlights: [
        '私人透明圓頂帳篷',
        '米其林一星主廚現場烹調',
        '10道式法日fusion晚宴',
        '香檳與北海道葡萄酒無限暢飲',
        '專業星空導覽',
        '豪華車輛接送',
      ],
      duration_hours: 4.0,
      group_size_min: 2,
      group_size_max: 6,
      language_support: ['日語', '英語'],
      difficulty_level: 'easy',
      available_seasons: ['冬'],
      advance_booking_days: 30,
      price_per_person_min: 95000,
      price_per_person_max: 120000,
      currency: 'JPY',
      commission_rate: 18.0,
      recommended_for: ['honeymoon', 'anniversary', 'proposal', 'luxury_traveler', 'romantic'],
      transportation_included: true,
      pickup_service: true,
      is_featured: true,
    },

    // === 泰國 - 曼谷：私人長尾船晚宴 ===
    {
      name: '湄南河私人長尾船星光晚宴',
      name_en: 'Private Long-Tail Boat Dinner on Chao Phraya',
      tagline: '專屬長尾船，穿梭在湄南河的璀璨夜色中',
      country_code: 'TH',
      city_name: '曼谷',
      specific_location: '湄南河（由文華東方碼頭出發）',
      category: 'culinary_mastery',
      sub_category: ['exclusive_dining', 'romantic', 'cultural'],
      exclusivity_level: 'exclusive',
      description:
        '搭乘精心裝飾的傳統長尾船，由經驗豐富的船長駕駛，穿梭在湄南河上。船上配備頂級主廚現場烹調泰式料理，欣賞兩岸寺廟與皇宮的燈光。',
      highlights: [
        '私人包船（含船長與服務人員）',
        '泰國皇家御廚團隊烹調',
        '8道式泰式Fine Dining',
        '經過大皇宮、鄭王廟、臥佛寺等地標',
        '傳統泰式舞蹈表演（船上）',
        '專業攝影師記錄',
      ],
      duration_hours: 3.0,
      group_size_min: 2,
      group_size_max: 8,
      language_support: ['泰語', '英語', '中文'],
      difficulty_level: 'easy',
      advance_booking_days: 21,
      price_per_person_min: 12000,
      price_per_person_max: 18000,
      currency: 'THB',
      commission_rate: 15.0,
      recommended_for: ['romantic', 'honeymoon', 'proposal', 'luxury_traveler'],
      is_featured: true,
    },

    // === 泰國 - 清邁：大象保育中心VIP體驗 ===
    {
      name: '清邁大象自然保護區VIP守護者體驗',
      name_en: 'Chiang Mai Elephant Sanctuary VIP Keeper Experience',
      tagline: '與獲救大象深度互動，支持真正的保育工作',
      country_code: 'TH',
      city_name: '清邁',
      specific_location: '清邁大象自然保護區（距市區45分鐘）',
      category: 'nature_adventure',
      sub_category: ['wildlife', 'eco_tourism', 'exclusive_access'],
      exclusivity_level: 'exclusive',
      description:
        '不是騎大象，而是真正理解並協助大象保育。在專業獸醫和訓練師陪同下，為大象準備食物、餵食、洗澡，並了解每隻大象的救援故事。',
      highlights: [
        '僅接待4人以下小團（確保大象不受干擾）',
        '由獸醫和訓練師全程陪同解說',
        '親手準備大象食物（水果、甘蔗）',
        '與大象一起在河邊戲水（大象最愛）',
        '了解每隻大象的救援故事',
        '獲得保育中心榮譽守護者證書',
        '部分收入直接用於大象醫療與照護',
      ],
      what_makes_it_special:
        '這個保護區不提供騎乘服務，是泰國少數真正以大象福祉為優先的機構。曾獲得WWF認證。',
      duration_hours: 6.0,
      group_size_min: 2,
      group_size_max: 4,
      language_support: ['泰語', '英語'],
      difficulty_level: 'moderate',
      physical_requirement: '需能在水中與大象互動，建議穿著可弄濕的衣物',
      advance_booking_days: 14,
      price_per_person_min: 8000,
      price_per_person_max: 12000,
      currency: 'THB',
      price_includes: ['往返接送', '午餐', '專業嚮導', '保險', '守護者證書'],
      commission_rate: 12.0,
      recommended_for: ['family', 'nature_lover', 'ethical_tourism', 'animal_lover'],
      sustainability_practices: ['無騎乘', '獸醫24小時照護', '自然棲息地', 'WWF認證'],
      supports_local_community: true,
      eco_friendly: true,
      is_featured: true,
    },

    // === 韓國 - 首爾：韓服攝影VIP體驗 ===
    {
      name: '景福宮皇室韓服私人攝影體驗',
      name_en: 'Royal Hanbok Photography at Gyeongbokgung Palace',
      name_local: '경복궁 왕실한복 프라이빗 촬영',
      tagline: '穿上真正的韓國傳統宮廷服飾，在古宮中留下永恆回憶',
      country_code: 'KR',
      city_name: '首爾',
      specific_location: '景福宮（閉館後私人包場）',
      category: 'cultural_immersion',
      sub_category: ['traditional_culture', 'photography', 'exclusive_access'],
      exclusivity_level: 'highly_exclusive',
      description:
        '這不是一般的韓服租借體驗。我們提供的是真正的宮廷級韓服（한복），並在景福宮閉館後私人包場攝影，完全沒有遊客干擾。',
      highlights: [
        '景福宮閉館後私人包場（1.5小時）',
        '專業韓服造型師（曾為韓劇服裝指導）',
        '高級宮廷級韓服（非租借店品質）',
        '專業攝影師（1小時拍攝）',
        '100張精修照片+影片',
        '傳統妝容與髮型設計',
      ],
      what_makes_it_special:
        '一般遊客只能在開放時間與人群中拍照。我們的體驗在閉館後進行，整個宮殿成為您的私人攝影棚。',
      expert_name: '金賢淑',
      expert_title: '韓服造型大師',
      expert_credentials: ['韓劇《大長今》服裝顧問', '20年宮廷服飾研究', '韓國傳統文化大使'],
      duration_hours: 4.0,
      group_size_min: 2,
      group_size_max: 6,
      language_support: ['韓語', '英語', '中文'],
      difficulty_level: 'easy',
      advance_booking_days: 30,
      price_per_person_min: 450000,
      price_per_person_max: 650000,
      currency: 'KRW',
      price_includes: [
        '景福宮私人包場',
        '宮廷級韓服租借',
        '專業造型與妝髮',
        '專業攝影師',
        '100張精修照片',
      ],
      commission_rate: 20.0,
      recommended_for: ['honeymoon', 'anniversary', 'influencer', 'cultural_enthusiast'],
      booking_notes: '需提前30天預約（景福宮許可申請需時）。最佳拍攝時間為日落前1小時。',
      is_featured: true,
    },

    // === 韓國 - 首爾：江南私人K-Pop舞蹈課程 ===
    {
      name: 'SM娛樂御用編舞師私人K-Pop課程',
      name_en: 'Private K-Pop Dance Class with SM Entertainment Choreographer',
      name_local: 'SM 안무가 프라이빗 케이팝 레슨',
      tagline: '跟著真正的K-Pop編舞師學習偶像舞步',
      country_code: 'KR',
      city_name: '首爾',
      specific_location: '江南專業舞蹈工作室',
      category: 'cultural_immersion',
      sub_category: ['kpop', 'dance', 'exclusive_access'],
      exclusivity_level: 'exclusive',
      description:
        '由曾為BLACKPINK、EXO、NCT編舞的專業編舞師親自指導。學習一首完整K-Pop歌曲的舞蹈，並在專業攝影棚錄製MV。',
      highlights: [
        '專業K-Pop編舞師（SM娛樂/YG娛樂御用）',
        '學習完整K-Pop舞蹈（可選曲）',
        '專業舞蹈工作室（鏡子牆+木地板）',
        '錄製專業MV（含後製）',
        '獲得編舞師親筆簽名證書',
        '贈送K-Pop練習服',
      ],
      duration_hours: 3.0,
      group_size_min: 2,
      group_size_max: 8,
      language_support: ['韓語', '英語'],
      difficulty_level: 'moderate',
      physical_requirement: '需有基本體能，建議穿著運動服裝',
      advance_booking_days: 21,
      price_per_person_min: 280000,
      price_per_person_max: 350000,
      currency: 'KRW',
      price_includes: ['私人編舞師', '專業舞蹈室', 'MV錄製與後製', 'K-Pop練習服'],
      commission_rate: 15.0,
      recommended_for: ['kpop_fan', 'youth_traveler', 'family', 'group_activity'],
      is_featured: true,
    },

    // === 中國 - 上海：私人旗袍訂製體驗 ===
    {
      name: '上海灘頂級旗袍大師私人訂製',
      name_en: 'Shanghai Master Qipao Tailoring Experience',
      tagline: '由旗袍國家級非遺傳承人親手為您訂製',
      country_code: 'CN',
      city_name: '上海',
      specific_location: '上海法租界旗袍工作室',
      category: 'artisan_workshop',
      sub_category: ['traditional_crafts', 'fashion', 'exclusive_access'],
      exclusivity_level: 'highly_exclusive',
      description:
        '跟隨國家級非物質文化遺產傳承人，學習旗袍的歷史、裁剪與刺繡技藝。親自挑選絲綢布料，量身訂製專屬旗袍。',
      highlights: [
        '國家級非遺傳承人親自指導',
        '參觀私人旗袍博物館（200件古董旗袍）',
        '學習傳統盤扣製作',
        '親手參與刺繡工序',
        '量身訂製一件高級旗袍（30天後寄送）',
        '專業旗袍攝影（含妝髮）',
      ],
      what_makes_it_special: '這位師傅的旗袍曾被宋美齡、鄧麗君穿著，現為上海博物館御用修復師。',
      expert_name: '褚宏生',
      expert_title: '旗袍製作技藝國家級非遺傳承人',
      expert_credentials: [
        '國家級非遺傳承人',
        '上海博物館文物修復顧問',
        '從業60年',
        '三代傳承（1920年創業）',
      ],
      duration_hours: 4.0,
      group_size_min: 1,
      group_size_max: 4,
      language_support: ['中文', '英語'],
      difficulty_level: 'easy',
      advance_booking_days: 45,
      price_per_person_min: 15000,
      price_per_person_max: 35000,
      currency: 'CNY',
      price_includes: ['大師課程', '博物館參觀', '一件高級訂製旗袍', '專業攝影', '30天後國際郵寄'],
      commission_rate: 18.0,
      recommended_for: [
        'culture_enthusiast',
        'fashion_lover',
        'once_in_lifetime',
        'heritage_lover',
      ],
      certifications: ['國家級非物質文化遺產傳承人'],
      is_featured: true,
    },
  ]

  for (const experience of experiences) {
    try {
      const { country_id, city_id } = await getCountryAndCity(
        experience.country_code,
        experience.city_name
      )

      if (!country_id || !city_id) {
        console.log(
          `⚠️  跳過 ${experience.name}：找不到國家/城市 (${experience.country_code}/${experience.city_name})`
        )
        continue
      }

      const { country_code, city_name, ...data } = experience
      const { error } = await supabase.from('premium_experiences').insert({
        ...data,
        country_id,
        city_id,
      })

      if (error) {
        console.error(`❌ 插入失敗 (${experience.name}):`, error.message)
      } else {
        console.log(`✅ ${experience.name}`)
      }
    } catch (error) {
      console.error(`❌ 錯誤 (${experience.name}):`, error)
    }
  }
}

async function main() {
  console.log('🚀 開始匯入頂級旅遊資料庫...\n')

  try {
    await seedMichelinRestaurants()
    await seedPremiumExperiences()

    console.log('\n✅ 所有資料匯入完成！')
    console.log('\n📊 統計：')

    const { count: restaurantCount } = await supabase
      .from('michelin_restaurants')
      .select('*', { count: 'exact', head: true })
    const { count: experienceCount } = await supabase
      .from('premium_experiences')
      .select('*', { count: 'exact', head: true })

    console.log(`   🍽️  米其林餐廳：${restaurantCount} 間`)
    console.log(`   🎭 頂級體驗：${experienceCount} 個`)
  } catch (error) {
    console.error('\n❌ 發生錯誤：', error)
    process.exit(1)
  }
}

main()
