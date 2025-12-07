/**
 * 範例行程種子資料腳本
 * 根據百威、晴日、雄獅、旅天下等旅行社的行程資料建立範例
 *
 * 使用方式：
 * node scripts/seed-sample-itineraries.js
 */

const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

// Supabase 連線
const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const supabase = createClient(supabaseUrl, supabaseKey)

// 範例行程資料
const SAMPLE_ITINERARIES = [
  // ========== 日本 - 北海道 ==========
  {
    tagline: '冬季限定',
    title: '北海道破冰船冬之旅',
    subtitle: '札幌雪祭 × 破冰船 × 三大螃蟹',
    description: '體驗北海道冬季獨有的破冰船之旅，欣賞流冰奇景，品嚐鮮美的三大螃蟹盛宴',
    country: 'japan',
    city: 'sapporo',
    tour_code: 'HKD-WINTER-01',
    status: 'published',
    is_template: true,
    price: '51,900',
    price_note: '起',
    features: [
      { icon: 'IconShip', title: '破冰船體驗', description: '搭乘破冰船穿越流冰，近距離觀賞海冰奇景' },
      { icon: 'IconSnowflake', title: '雪祭盛會', description: '札幌雪祭，欣賞壯觀的冰雕藝術作品' },
      { icon: 'IconFish', title: '三大螃蟹', description: '品嚐北海道著名的帝王蟹、毛蟹、松葉蟹' }
    ],
    focus_cards: [
      { title: '破冰船', src: '/images/hokkaido/icebreaker.jpg' },
      { title: '札幌雪祭', src: '/images/hokkaido/snow-festival.jpg' },
      { title: '小樽運河', src: '/images/hokkaido/otaru.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 札幌新千歲機場',
        description: '搭乘豪華客機飛往北海道札幌，抵達後專車接往飯店休息',
        activities: [
          { icon: '✈️', title: '桃園機場出發', description: '搭乘直飛班機前往札幌' },
          { icon: '🏨', title: '入住飯店', description: '札幌市區溫泉飯店' }
        ],
        recommendations: ['新千歲機場購物', '拉麵共和國'],
        meals: { breakfast: '機上輕食', lunch: '機上輕食', dinner: '飯店內享用' },
        accommodation: '札幌溫泉飯店'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: '札幌市區觀光',
        description: '探索札幌市區著名景點，體驗北國都市風情',
        activities: [
          { icon: '🏛️', title: '北海道舊道廳', description: '紅磚建築的歷史象徵' },
          { icon: '🕰️', title: '時計台', description: '札幌地標性建築' },
          { icon: '🛒', title: '狸小路商店街', description: '購物天堂，藥妝美食應有盡有' }
        ],
        recommendations: ['白色戀人公園', '二條市場'],
        meals: { breakfast: '飯店內', lunch: '味噌拉麵', dinner: '成吉思汗烤羊肉' },
        accommodation: '札幌溫泉飯店'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: '網走破冰船之旅',
        description: '搭乘破冰船出海，體驗穿越流冰的震撼',
        activities: [
          { icon: '🚢', title: '極光號破冰船', description: '搭乘破冰船穿越鄂霍次克海流冰' },
          { icon: '🦅', title: '網走監獄博物館', description: '了解北海道開拓歷史' },
          { icon: '♨️', title: '溫泉體驗', description: '享受溫泉放鬆身心' }
        ],
        recommendations: ['流冰館', '天都山展望台'],
        meals: { breakfast: '飯店內', lunch: '海鮮丼飯', dinner: '溫泉會席料理' },
        accommodation: '網走溫泉飯店'
      },
      {
        dayLabel: 'Day 4',
        date: '第四天',
        title: '小樽浪漫遊',
        description: '漫步小樽運河，體驗北國浪漫風情',
        activities: [
          { icon: '🏞️', title: '小樽運河', description: '北海道最浪漫的運河景致' },
          { icon: '🎵', title: '音樂盒堂', description: '精緻音樂盒藝術收藏' },
          { icon: '🍫', title: 'LeTAO甜點', description: '品嚐北海道著名雙層起司蛋糕' }
        ],
        recommendations: ['北一硝子館', '銀之鐘咖啡'],
        meals: { breakfast: '飯店內', lunch: '海鮮壽司', dinner: '三大螃蟹吃到飽' },
        accommodation: '札幌溫泉飯店'
      },
      {
        dayLabel: 'Day 5',
        date: '第五天',
        title: '札幌 → 台北',
        description: '享用早餐後，前往機場搭機返回溫暖的家',
        activities: [
          { icon: '🛒', title: '新千歲機場購物', description: '最後採購伴手禮的機會' },
          { icon: '✈️', title: '返回台北', description: '帶著美好回憶返家' }
        ],
        recommendations: ['Royce巧克力', '白色戀人', '薯條三兄弟'],
        meals: { breakfast: '飯店內', lunch: '機場自理', dinner: '機上輕食' },
        accommodation: '溫暖的家'
      }
    ]
  },

  {
    tagline: '夢幻雪景',
    title: '北海道TOMAMU星野度假村',
    subtitle: '星野渡假村 × 白色燈樹節 × 溫泉美食',
    description: '入住星野TOMAMU度假村，體驗水之教堂、雲海テラス等夢幻景點',
    country: 'japan',
    city: 'sapporo',
    tour_code: 'HKD-TOMAMU-01',
    status: 'published',
    is_template: true,
    price: '45,900',
    price_note: '起',
    features: [
      { icon: 'IconBuilding', title: '星野度假村', description: '入住頂級星野TOMAMU度假村' },
      { icon: 'IconChurch', title: '水之教堂', description: '安藤忠雄設計的夢幻教堂' },
      { icon: 'IconPool', title: '微笑海灘', description: '日本最大室內人工海灘' }
    ],
    focus_cards: [
      { title: '水之教堂', src: '/images/hokkaido/church.jpg' },
      { title: '雲海テラス', src: '/images/hokkaido/unkai.jpg' },
      { title: '微笑海灘', src: '/images/hokkaido/beach.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 新千歲機場 → TOMAMU',
        description: '抵達後直接前往星野TOMAMU度假村',
        activities: [
          { icon: '✈️', title: '直飛札幌', description: '搭乘豪華客機' },
          { icon: '🏨', title: '星野度假村', description: '辦理入住，享受設施' }
        ],
        recommendations: ['微笑海灘', '木林之湯'],
        meals: { breakfast: '機上輕食', lunch: '機上輕食', dinner: '度假村自助餐' },
        accommodation: '星野TOMAMU度假村'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: 'TOMAMU度假村全日體驗',
        description: '全天在度假村內享受各項設施',
        activities: [
          { icon: '⛷️', title: '滑雪體驗', description: '初學者雪道或雪盆戲雪' },
          { icon: '🌊', title: '微笑海灘', description: '日本最大室內人工海灘' },
          { icon: '⛪', title: '水之教堂', description: '參觀安藤忠雄設計的夢幻教堂' }
        ],
        recommendations: ['愛絲冰城', '霧冰テラス'],
        meals: { breakfast: '度假村內', lunch: '度假村內', dinner: '度假村內' },
        accommodation: '星野TOMAMU度假村'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: 'TOMAMU → 富良野 → 札幌',
        description: '前往富良野觀光後返回札幌',
        activities: [
          { icon: '🏔️', title: '富良野滑雪場', description: '北海道知名滑雪勝地' },
          { icon: '🧀', title: '富良野起司工房', description: '品嚐手工起司' },
          { icon: '🌃', title: '札幌夜景', description: '藻岩山夜景' }
        ],
        recommendations: ['精靈露台', '森之時計咖啡'],
        meals: { breakfast: '度假村內', lunch: '富良野午餐', dinner: '札幌湯咖哩' },
        accommodation: '札幌市區飯店'
      },
      {
        dayLabel: 'Day 4',
        date: '第四天',
        title: '札幌 → 小樽 → 札幌',
        description: '小樽一日遊後返回札幌',
        activities: [
          { icon: '🏞️', title: '小樽運河', description: '北海道最浪漫景點' },
          { icon: '🎵', title: '音樂盒堂', description: '精緻音樂盒收藏' },
          { icon: '🛒', title: '狸小路', description: '札幌購物天堂' }
        ],
        recommendations: ['六花亭', '北菓樓'],
        meals: { breakfast: '飯店內', lunch: '小樽壽司', dinner: '三大螃蟹' },
        accommodation: '札幌市區飯店'
      },
      {
        dayLabel: 'Day 5',
        date: '第五天',
        title: '札幌 → 新千歲機場 → 台北',
        description: '帶著美好回憶返回台灣',
        activities: [
          { icon: '🛒', title: '機場購物', description: '最後採購時間' },
          { icon: '✈️', title: '返回台北', description: '結束愉快旅程' }
        ],
        recommendations: ['Royce巧克力', '六花亭'],
        meals: { breakfast: '飯店內', lunch: '機場自理', dinner: '機上輕食' },
        accommodation: '溫暖的家'
      }
    ]
  },

  // ========== 日本 - 九州 ==========
  {
    tagline: '溫泉鐵道',
    title: '九州由布院之森鐵道溫泉之旅',
    subtitle: '由布院之森 × 柳川遊船 × 別府溫泉',
    description: '搭乘人氣觀光列車由布院之森，體驗九州獨特的溫泉文化與美食',
    country: 'japan',
    city: 'fukuoka',
    tour_code: 'KYU-YUFUIN-01',
    status: 'published',
    is_template: true,
    price: '38,900',
    price_note: '起',
    features: [
      { icon: 'IconTrain', title: '由布院之森', description: '九州最人氣的觀光列車' },
      { icon: 'IconShip', title: '柳川遊船', description: '搭乘小舟遊覽水鄉柳川' },
      { icon: 'IconFlame', title: '別府溫泉', description: '日本溫泉之都，體驗地獄溫泉' }
    ],
    focus_cards: [
      { title: '由布院之森', src: '/images/kyushu/yufuin-train.jpg' },
      { title: '金鱗湖', src: '/images/kyushu/kinrinko.jpg' },
      { title: '別府地獄', src: '/images/kyushu/beppu.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 福岡',
        description: '抵達福岡後，享用博多美食',
        activities: [
          { icon: '✈️', title: '飛抵福岡', description: '搭乘直飛班機' },
          { icon: '🍜', title: '博多拉麵', description: '品嚐正宗豚骨拉麵' }
        ],
        recommendations: ['運河城', '天神地下街'],
        meals: { breakfast: '機上輕食', lunch: '機上輕食', dinner: '博多拉麵' },
        accommodation: '福岡市區飯店'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: '福岡 → 由布院',
        description: '搭乘由布院之森列車前往由布院',
        activities: [
          { icon: '🚃', title: '由布院之森', description: '搭乘人氣觀光列車' },
          { icon: '🏞️', title: '金鱗湖', description: '夢幻湖畔散步' },
          { icon: '🛍️', title: '湯之坪街道', description: '特色商店街購物' }
        ],
        recommendations: ['B-speak蛋糕卷', '由布院花卉村'],
        meals: { breakfast: '飯店內', lunch: '列車便當', dinner: '溫泉會席' },
        accommodation: '由布院溫泉旅館'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: '由布院 → 別府 → 熊本',
        description: '遊覽別府地獄溫泉後前往熊本',
        activities: [
          { icon: '🔥', title: '別府地獄巡遊', description: '海地獄、血池地獄等' },
          { icon: '🐻', title: '熊本熊廣場', description: '與熊本熊見面' },
          { icon: '🏯', title: '熊本城', description: '日本三大名城之一' }
        ],
        recommendations: ['地獄蒸工房', '馬肉料理'],
        meals: { breakfast: '旅館內', lunch: '地獄蒸料理', dinner: '熊本馬肉' },
        accommodation: '熊本市區飯店'
      },
      {
        dayLabel: 'Day 4',
        date: '第四天',
        title: '熊本 → 柳川 → 太宰府 → 福岡',
        description: '柳川遊船後參拜太宰府天滿宮',
        activities: [
          { icon: '🛶', title: '柳川遊船', description: '船夫搖櫓穿梭水鄉' },
          { icon: '⛩️', title: '太宰府天滿宮', description: '學問之神，祈求考運' },
          { icon: '🛒', title: '天神購物', description: '福岡最大購物區' }
        ],
        recommendations: ['梅枝餅', '表參道商店街'],
        meals: { breakfast: '飯店內', lunch: '鰻魚飯', dinner: '內臟鍋' },
        accommodation: '福岡市區飯店'
      },
      {
        dayLabel: 'Day 5',
        date: '第五天',
        title: '福岡 → 台北',
        description: '結束美好的九州之旅',
        activities: [
          { icon: '🛒', title: '福岡機場購物', description: '最後採購時間' },
          { icon: '✈️', title: '返回台北', description: '帶著滿滿回憶回家' }
        ],
        recommendations: ['通りもん', '博多の女'],
        meals: { breakfast: '飯店內', lunch: '機場自理', dinner: '機上輕食' },
        accommodation: '溫暖的家'
      }
    ]
  },

  {
    tagline: '主題樂園',
    title: '九州豪斯登堡歡樂之旅',
    subtitle: '豪斯登堡 × 企鵝水族館 × 冬季採草莓',
    description: '暢遊日本最大歐洲主題樂園豪斯登堡，體驗九州獨特魅力',
    country: 'japan',
    city: 'fukuoka',
    tour_code: 'KYU-HUIS-01',
    status: 'published',
    is_template: true,
    price: '42,900',
    price_note: '起',
    features: [
      { icon: 'IconCastle', title: '豪斯登堡', description: '日本最大歐洲主題樂園' },
      { icon: 'IconPenguin', title: '企鵝水族館', description: '長崎企鵝互動體驗' },
      { icon: 'IconStrawberry', title: '採草莓', description: '冬季限定甜蜜體驗' }
    ],
    focus_cards: [
      { title: '豪斯登堡', src: '/images/kyushu/huis.jpg' },
      { title: '企鵝水族館', src: '/images/kyushu/penguin.jpg' },
      { title: '稻佐山夜景', src: '/images/kyushu/inasayama.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 福岡 → 長崎',
        description: '抵達後前往長崎',
        activities: [
          { icon: '✈️', title: '飛抵福岡', description: '搭乘直飛班機' },
          { icon: '🚌', title: '前往長崎', description: '車程約2小時' },
          { icon: '🌃', title: '稻佐山夜景', description: '世界新三大夜景' }
        ],
        recommendations: ['眼鏡橋', '長崎新地中華街'],
        meals: { breakfast: '機上輕食', lunch: '機上輕食', dinner: '長崎強棒麵' },
        accommodation: '長崎市區飯店'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: '豪斯登堡全日暢遊',
        description: '全天暢遊豪斯登堡主題樂園',
        activities: [
          { icon: '🏰', title: '豪斯登堡', description: '荷蘭風情主題樂園' },
          { icon: '🎡', title: '遊樂設施', description: 'VR過山車、鬼屋等' },
          { icon: '🌷', title: '花卉節', description: '季節限定花海' }
        ],
        recommendations: ['光之王國', '起司蛋糕'],
        meals: { breakfast: '飯店內', lunch: '園區內自理', dinner: '園區內自理' },
        accommodation: '豪斯登堡園區飯店'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: '長崎 → 熊本',
        description: '參觀企鵝水族館後前往熊本',
        activities: [
          { icon: '🐧', title: '企鵝水族館', description: '與企鵝近距離互動' },
          { icon: '🍓', title: '採草莓', description: '冬季限定體驗' },
          { icon: '🏯', title: '熊本城', description: '日本三大名城' }
        ],
        recommendations: ['熊本熊廣場', '馬肉刺身'],
        meals: { breakfast: '飯店內', lunch: '佐世保漢堡', dinner: '熊本料理' },
        accommodation: '熊本溫泉飯店'
      },
      {
        dayLabel: 'Day 4',
        date: '第四天',
        title: '熊本 → 太宰府 → 福岡',
        description: '參拜太宰府後返回福岡',
        activities: [
          { icon: '⛩️', title: '太宰府天滿宮', description: '學問之神' },
          { icon: '🍡', title: '梅枝餅', description: '太宰府名物' },
          { icon: '🛒', title: '天神購物', description: '福岡購物天堂' }
        ],
        recommendations: ['星巴克太宰府', '博多運河城'],
        meals: { breakfast: '飯店內', lunch: '太宰府午餐', dinner: '內臟鍋' },
        accommodation: '福岡市區飯店'
      },
      {
        dayLabel: 'Day 5',
        date: '第五天',
        title: '福岡 → 台北',
        description: '帶著美好回憶返回台灣',
        activities: [
          { icon: '🛒', title: '機場購物', description: '最後採購' },
          { icon: '✈️', title: '返回台北', description: '結束旅程' }
        ],
        recommendations: ['明太子', '通りもん'],
        meals: { breakfast: '飯店內', lunch: '機場自理', dinner: '機上輕食' },
        accommodation: '溫暖的家'
      }
    ]
  },

  // ========== 日本 - 沖繩 ==========
  {
    tagline: '海島度假',
    title: '沖繩美麗海水族館親子遊',
    subtitle: '美麗海水族館 × 古宇利島 × 國際通',
    description: '親子首選！欣賞超大鯨鯊水族箱，漫步美麗海灘',
    country: 'japan',
    city: 'naha',
    tour_code: 'OKI-FAMILY-01',
    status: 'published',
    is_template: true,
    price: '26,800',
    price_note: '起',
    features: [
      { icon: 'IconFish', title: '美麗海水族館', description: '超大鯨鯊水族箱，親子必訪' },
      { icon: 'IconBridge', title: '古宇利大橋', description: '沖繩最美跨海大橋' },
      { icon: 'IconShoppingCart', title: '國際通', description: '沖繩最熱鬧購物街' }
    ],
    focus_cards: [
      { title: '鯨鯊水族箱', src: '/images/okinawa/aquarium.jpg' },
      { title: '古宇利大橋', src: '/images/okinawa/kouri.jpg' },
      { title: '美麗海灘', src: '/images/okinawa/beach.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 那霸',
        description: '抵達沖繩，前往國際通',
        activities: [
          { icon: '✈️', title: '飛抵那霸', description: '約1.5小時航程' },
          { icon: '🛍️', title: '國際通', description: '沖繩最熱鬧商店街' },
          { icon: '🍖', title: '阿古豬', description: '沖繩名產黑毛豬' }
        ],
        recommendations: ['第一牧志公設市場', '御菓子御殿'],
        meals: { breakfast: '機上輕食', lunch: '機上輕食', dinner: '阿古豬燒肉' },
        accommodation: '那霸市區飯店'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: '美麗海水族館之旅',
        description: '全天暢遊沖繩最人氣景點',
        activities: [
          { icon: '🐋', title: '美麗海水族館', description: '世界最大鯨鯊水族箱' },
          { icon: '🐬', title: '海豚表演', description: '精彩海豚秀' },
          { icon: '🏖️', title: '翡翠海灘', description: '白沙碧海' }
        ],
        recommendations: ['海洋博公園', '備瀨福木林道'],
        meals: { breakfast: '飯店內', lunch: '水族館餐廳', dinner: '沖繩料理' },
        accommodation: '恩納海濱度假村'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: '古宇利島 × 美國村',
        description: '探訪沖繩最美小島',
        activities: [
          { icon: '🌉', title: '古宇利大橋', description: '沖繩最美跨海大橋' },
          { icon: '🏝️', title: '古宇利海灘', description: '心形岩打卡' },
          { icon: '🎡', title: '美國村', description: '美式風情購物區' }
        ],
        recommendations: ['蝦蝦飯', 'Blue Seal冰淇淋'],
        meals: { breakfast: '飯店內', lunch: '蝦蝦飯', dinner: '美國村BBQ' },
        accommodation: '那霸市區飯店'
      },
      {
        dayLabel: 'Day 4',
        date: '第四天',
        title: '那霸 → 台北',
        description: '自由活動後返回台灣',
        activities: [
          { icon: '🛒', title: 'Outlet購物', description: 'Ashibinaa Outlet' },
          { icon: '✈️', title: '返回台北', description: '結束沖繩之旅' }
        ],
        recommendations: ['沖繩Outlet', '國際通伴手禮'],
        meals: { breakfast: '飯店內', lunch: '自理', dinner: '機上輕食' },
        accommodation: '溫暖的家'
      }
    ]
  },

  // ========== 日本 - 東京 ==========
  {
    tagline: '經典必訪',
    title: '東京富士山經典五日遊',
    subtitle: '東京迪士尼 × 富士山 × 河口湖溫泉',
    description: '暢遊東京迪士尼樂園，近距離欣賞富士山美景',
    country: 'japan',
    city: 'tokyo',
    tour_code: 'TYO-CLASSIC-01',
    status: 'published',
    is_template: true,
    price: '35,900',
    price_note: '起',
    features: [
      { icon: 'IconCastle', title: '東京迪士尼', description: '魔法王國一日暢遊' },
      { icon: 'IconMountain', title: '富士山', description: '日本第一聖山' },
      { icon: 'IconFlame', title: '河口湖溫泉', description: '眺望富士山泡溫泉' }
    ],
    focus_cards: [
      { title: '東京迪士尼', src: '/images/tokyo/disney.jpg' },
      { title: '富士山', src: '/images/tokyo/fuji.jpg' },
      { title: '淺草寺', src: '/images/tokyo/asakusa.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 東京',
        description: '抵達東京，淺草觀光',
        activities: [
          { icon: '✈️', title: '飛抵成田/羽田', description: '約3小時航程' },
          { icon: '⛩️', title: '淺草寺', description: '東京最古老寺廟' },
          { icon: '🗼', title: '晴空塔', description: '東京新地標' }
        ],
        recommendations: ['仲見世通', '雷門'],
        meals: { breakfast: '機上輕食', lunch: '機上輕食', dinner: '淺草天婦羅' },
        accommodation: '東京市區飯店'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: '東京迪士尼樂園',
        description: '全天暢遊魔法王國',
        activities: [
          { icon: '🏰', title: '迪士尼樂園', description: '魔法王國夢幻體驗' },
          { icon: '🎢', title: '人氣設施', description: '太空山、巨雷山等' },
          { icon: '🎆', title: '夜間遊行', description: '燈光花車遊行' }
        ],
        recommendations: ['米奇冰棒', '爆米花桶'],
        meals: { breakfast: '飯店內', lunch: '園區內', dinner: '園區內' },
        accommodation: '東京灣飯店'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: '東京 → 富士山 → 河口湖',
        description: '前往富士山區域觀光',
        activities: [
          { icon: '🏔️', title: '富士山五合目', description: '天氣許可時前往' },
          { icon: '🚡', title: '河口湖纜車', description: '俯瞰富士山全景' },
          { icon: '♨️', title: '溫泉旅館', description: '眺望富士山泡湯' }
        ],
        recommendations: ['忍野八海', '富士急樂園'],
        meals: { breakfast: '飯店內', lunch: '富士山餺飥', dinner: '溫泉會席' },
        accommodation: '河口湖溫泉旅館'
      },
      {
        dayLabel: 'Day 4',
        date: '第四天',
        title: '河口湖 → 東京市區觀光',
        description: '返回東京市區購物觀光',
        activities: [
          { icon: '🛍️', title: '銀座購物', description: '高級購物區' },
          { icon: '📸', title: '澀谷', description: '著名十字路口' },
          { icon: '🌳', title: '明治神宮', description: '東京最大神社' }
        ],
        recommendations: ['表參道', '原宿竹下通'],
        meals: { breakfast: '旅館內', lunch: '銀座午餐', dinner: '燒肉吃到飽' },
        accommodation: '東京市區飯店'
      },
      {
        dayLabel: 'Day 5',
        date: '第五天',
        title: '東京 → 台北',
        description: '自由活動後返回台灣',
        activities: [
          { icon: '🛒', title: '上野阿美橫丁', description: '藥妝採購' },
          { icon: '✈️', title: '返回台北', description: '結束旅程' }
        ],
        recommendations: ['成田機場購物'],
        meals: { breakfast: '飯店內', lunch: '自理', dinner: '機上輕食' },
        accommodation: '溫暖的家'
      }
    ]
  },

  // ========== 越南 - 峴港 ==========
  {
    tagline: '世界遺產',
    title: '越南峴港會安黃金橋五日',
    subtitle: '巴拿山 × 會安古鎮 × 黃金橋',
    description: '探索東方夏威夷峴港，漫步世界遺產會安古鎮',
    country: 'vietnam',
    city: 'danang',
    tour_code: 'VN-DAN-01',
    status: 'published',
    is_template: true,
    price: '26,888',
    price_note: '起',
    features: [
      { icon: 'IconBridge', title: '黃金橋', description: '巴拿山巨手天空步道' },
      { icon: 'IconBuilding', title: '會安古鎮', description: '世界文化遺產' },
      { icon: 'IconBeach', title: '美溪海灘', description: '東方夏威夷' }
    ],
    focus_cards: [
      { title: '黃金橋', src: '/images/vietnam/golden-bridge.jpg' },
      { title: '會安古鎮', src: '/images/vietnam/hoian.jpg' },
      { title: '美溪海灘', src: '/images/vietnam/beach.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 峴港',
        description: '抵達峴港，海灘度假',
        activities: [
          { icon: '✈️', title: '飛抵峴港', description: '約3小時航程' },
          { icon: '🏖️', title: '美溪海灘', description: '東方夏威夷' },
          { icon: '🌉', title: '龍橋夜景', description: '週末噴火表演' }
        ],
        recommendations: ['粉紅教堂', '山茶半島'],
        meals: { breakfast: '機上輕食', lunch: '機上輕食', dinner: '海鮮餐' },
        accommodation: '峴港海景飯店'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: '巴拿山黃金橋',
        description: '全天暢遊巴拿山主題樂園',
        activities: [
          { icon: '🚡', title: '世界最長纜車', description: '5公里纜車體驗' },
          { icon: '✋', title: '黃金橋', description: '巨手托起的天空步道' },
          { icon: '🎢', title: '巴拿山樂園', description: '法式山城主題樂園' }
        ],
        recommendations: ['法國村', '空中花園'],
        meals: { breakfast: '飯店內', lunch: '山上自助餐', dinner: '越式料理' },
        accommodation: '峴港海景飯店'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: '會安古鎮一日遊',
        description: '漫步世界文化遺產古鎮',
        activities: [
          { icon: '🏘️', title: '會安古鎮', description: '世界文化遺產' },
          { icon: '🏮', title: '日本橋', description: '會安地標' },
          { icon: '🛶', title: '迦南島竹籃船', description: '傳統竹籃船體驗' }
        ],
        recommendations: ['燈籠製作', '越式咖啡'],
        meals: { breakfast: '飯店內', lunch: '會安料理', dinner: '河畔餐廳' },
        accommodation: '會安度假村'
      },
      {
        dayLabel: 'Day 4',
        date: '第四天',
        title: '會安 → 峴港市區',
        description: '峴港市區觀光購物',
        activities: [
          { icon: '⛩️', title: '靈應寺', description: '觀世音菩薩像' },
          { icon: '🛒', title: 'VINCOM購物中心', description: '現代購物商場' },
          { icon: '💆', title: 'SPA體驗', description: '越式按摩放鬆' }
        ],
        recommendations: ['韓市場', '峴港大教堂'],
        meals: { breakfast: '飯店內', lunch: '越式河粉', dinner: '龍蝦海鮮' },
        accommodation: '峴港市區飯店'
      },
      {
        dayLabel: 'Day 5',
        date: '第五天',
        title: '峴港 → 台北',
        description: '帶著美好回憶返回台灣',
        activities: [
          { icon: '🛒', title: '機場購物', description: '最後採購' },
          { icon: '✈️', title: '返回台北', description: '結束旅程' }
        ],
        recommendations: ['越南咖啡', '腰果'],
        meals: { breakfast: '飯店內', lunch: '機場自理', dinner: '機上輕食' },
        accommodation: '溫暖的家'
      }
    ]
  },

  // ========== 泰國 - 曼谷 ==========
  {
    tagline: '泰好玩',
    title: '曼谷經典五日遊',
    subtitle: '大皇宮 × 水上市場 × 按摩SPA',
    description: '探索泰國首都曼谷，體驗獨特的泰式文化與美食',
    country: 'thailand',
    city: 'bangkok',
    tour_code: 'TH-BKK-01',
    status: 'published',
    is_template: true,
    price: '22,900',
    price_note: '起',
    features: [
      { icon: 'IconCastle', title: '大皇宮', description: '泰國最神聖的皇家建築' },
      { icon: 'IconShip', title: '水上市場', description: '體驗傳統水上交易' },
      { icon: 'IconSpa', title: 'SPA按摩', description: '正宗泰式按摩體驗' }
    ],
    focus_cards: [
      { title: '大皇宮', src: '/images/thailand/grand-palace.jpg' },
      { title: '水上市場', src: '/images/thailand/floating-market.jpg' },
      { title: '考山路', src: '/images/thailand/khaosan.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 曼谷',
        description: '抵達曼谷，夜遊考山路',
        activities: [
          { icon: '✈️', title: '飛抵曼谷', description: '約4小時航程' },
          { icon: '🍜', title: '考山路', description: '背包客天堂' },
          { icon: '💆', title: '泰式按摩', description: '放鬆疲憊身心' }
        ],
        recommendations: ['芒果糯米', '泰式奶茶'],
        meals: { breakfast: '機上輕食', lunch: '機上輕食', dinner: '泰式料理' },
        accommodation: '曼谷市區飯店'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: '大皇宮 × 玉佛寺',
        description: '參觀曼谷皇家建築群',
        activities: [
          { icon: '🏛️', title: '大皇宮', description: '泰國最神聖建築' },
          { icon: '🙏', title: '玉佛寺', description: '供奉玉佛' },
          { icon: '🛥️', title: '昭披耶河遊船', description: '河畔風光' }
        ],
        recommendations: ['臥佛寺', '鄭王廟'],
        meals: { breakfast: '飯店內', lunch: '河畔餐廳', dinner: '海鮮晚餐' },
        accommodation: '曼谷市區飯店'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: '丹嫩莎朵水上市場',
        description: '體驗傳統水上市場',
        activities: [
          { icon: '🛶', title: '水上市場', description: '傳統木舟購物' },
          { icon: '🍜', title: '船上美食', description: '現煮船麵' },
          { icon: '🛒', title: 'Terminal 21', description: '機場主題商場' }
        ],
        recommendations: ['美功鐵道市場', 'Jodd Fairs夜市'],
        meals: { breakfast: '飯店內', lunch: '水上市場', dinner: '夜市小吃' },
        accommodation: '曼谷市區飯店'
      },
      {
        dayLabel: 'Day 4',
        date: '第四天',
        title: '曼谷自由活動',
        description: '購物或自選行程',
        activities: [
          { icon: '🛍️', title: 'Siam商圈', description: '曼谷購物中心' },
          { icon: '📸', title: '四面佛', description: '有求必應' },
          { icon: '🎡', title: 'ICON SIAM', description: '奢華購物體驗' }
        ],
        recommendations: ['BigC採購', 'MBK Center'],
        meals: { breakfast: '飯店內', lunch: '自理', dinner: '河畔晚餐' },
        accommodation: '曼谷市區飯店'
      },
      {
        dayLabel: 'Day 5',
        date: '第五天',
        title: '曼谷 → 台北',
        description: '返回台灣',
        activities: [
          { icon: '🛒', title: '機場購物', description: 'King Power免稅店' },
          { icon: '✈️', title: '返回台北', description: '結束泰國之旅' }
        ],
        recommendations: ['泰國手標茶', '小老闆海苔'],
        meals: { breakfast: '飯店內', lunch: '機場自理', dinner: '機上輕食' },
        accommodation: '溫暖的家'
      }
    ]
  },

  // ========== 韓國 - 首爾 ==========
  {
    tagline: '韓流追星',
    title: '首爾明洞購物五日遊',
    subtitle: '明洞 × 景福宮 × 北村韓屋村',
    description: '體驗韓國首爾的時尚與傳統，購物美食一次滿足',
    country: 'korea',
    city: 'seoul',
    tour_code: 'KR-SEL-01',
    status: 'published',
    is_template: true,
    price: '25,900',
    price_note: '起',
    features: [
      { icon: 'IconShoppingBag', title: '明洞購物', description: '韓國最大購物區' },
      { icon: 'IconCastle', title: '景福宮', description: '朝鮮王朝正宮' },
      { icon: 'IconCamera', title: '韓服體驗', description: '穿韓服遊古宮' }
    ],
    focus_cards: [
      { title: '景福宮', src: '/images/korea/gyeongbokgung.jpg' },
      { title: '北村韓屋村', src: '/images/korea/bukchon.jpg' },
      { title: '明洞', src: '/images/korea/myeongdong.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 首爾',
        description: '抵達首爾，明洞購物',
        activities: [
          { icon: '✈️', title: '飛抵仁川', description: '約2.5小時' },
          { icon: '🛍️', title: '明洞商圈', description: '韓國最大購物區' },
          { icon: '🍗', title: '韓式炸雞', description: '配啤酒必嚐' }
        ],
        recommendations: ['樂天免稅店', 'LINE Friends Store'],
        meals: { breakfast: '機上輕食', lunch: '機上輕食', dinner: '韓式炸雞' },
        accommodation: '首爾市區飯店'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: '景福宮 × 北村韓屋村',
        description: '體驗韓國傳統文化',
        activities: [
          { icon: '🏯', title: '景福宮', description: '穿韓服免費入場' },
          { icon: '👘', title: '韓服體驗', description: '4小時租借' },
          { icon: '🏘️', title: '北村韓屋村', description: '傳統韓屋巷弄' }
        ],
        recommendations: ['三清洞', '仁寺洞'],
        meals: { breakfast: '飯店內', lunch: '土俗村蔘雞湯', dinner: '烤肉吃到飽' },
        accommodation: '首爾市區飯店'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: '南怡島 × 小法國村',
        description: '經典韓劇拍攝地',
        activities: [
          { icon: '🏝️', title: '南怡島', description: '冬季戀歌拍攝地' },
          { icon: '🏰', title: '小法國村', description: '小王子主題村' },
          { icon: '🚡', title: 'Skyline Luge', description: '斜坡滑車' }
        ],
        recommendations: ['晨靜樹木園', '江村鐵道自行車'],
        meals: { breakfast: '飯店內', lunch: '春川辣炒雞排', dinner: '部隊鍋' },
        accommodation: '首爾市區飯店'
      },
      {
        dayLabel: 'Day 4',
        date: '第四天',
        title: '弘大 × 汝矣島',
        description: '年輕人聚集地',
        activities: [
          { icon: '🎤', title: '弘大商圈', description: '年輕人聚集地' },
          { icon: '🌸', title: '汝矣島', description: '漢江賞景' },
          { icon: '🛒', title: '樂天世界塔', description: '首爾地標' }
        ],
        recommendations: ['益善洞', 'KAKAO Friends'],
        meals: { breakfast: '飯店內', lunch: '弘大美食', dinner: '醬蟹' },
        accommodation: '首爾市區飯店'
      },
      {
        dayLabel: 'Day 5',
        date: '第五天',
        title: '首爾 → 台北',
        description: '返回台灣',
        activities: [
          { icon: '🛒', title: '仁川機場購物', description: '最後採購' },
          { icon: '✈️', title: '返回台北', description: '結束韓國之旅' }
        ],
        recommendations: ['韓國面膜', '零食'],
        meals: { breakfast: '飯店內', lunch: '機場自理', dinner: '機上輕食' },
        accommodation: '溫暖的家'
      }
    ]
  },

  // ========== 法國 - 巴黎 ==========
  {
    tagline: '浪漫之都',
    title: '法國巴黎經典十日遊',
    subtitle: '巴黎鐵塔 × 羅浮宮 × 凡爾賽宮',
    description: '探索浪漫巴黎，遊覽世界級博物館與皇家宮殿',
    country: 'france',
    city: 'paris',
    tour_code: 'FR-PAR-01',
    status: 'published',
    is_template: true,
    price: '128,900',
    price_note: '起',
    features: [
      { icon: 'IconTower', title: '艾菲爾鐵塔', description: '巴黎最著名地標' },
      { icon: 'IconPhoto', title: '羅浮宮', description: '世界三大博物館' },
      { icon: 'IconCrown', title: '凡爾賽宮', description: '法國皇室宮殿' }
    ],
    focus_cards: [
      { title: '艾菲爾鐵塔', src: '/images/france/eiffel.jpg' },
      { title: '羅浮宮', src: '/images/france/louvre.jpg' },
      { title: '凡爾賽宮', src: '/images/france/versailles.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 巴黎',
        description: '飛往浪漫之都巴黎',
        activities: [
          { icon: '✈️', title: '飛往巴黎', description: '約14小時航程' }
        ],
        recommendations: [],
        meals: { breakfast: '機上', lunch: '機上', dinner: '機上' },
        accommodation: '機上'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: '抵達巴黎',
        description: '抵達巴黎，塞納河遊船',
        activities: [
          { icon: '🗼', title: '艾菲爾鐵塔', description: '巴黎地標打卡' },
          { icon: '🛥️', title: '塞納河遊船', description: '欣賞河畔風光' },
          { icon: '🌉', title: '亞歷山大三世橋', description: '巴黎最美橋樑' }
        ],
        recommendations: ['戰神廣場', '夏佑宮'],
        meals: { breakfast: '機上', lunch: '法式午餐', dinner: '遊船晚宴' },
        accommodation: '巴黎市區五星飯店'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: '羅浮宮藝術之旅',
        description: '深度參觀世界三大博物館',
        activities: [
          { icon: '🖼️', title: '羅浮宮', description: '蒙娜麗莎、勝利女神' },
          { icon: '🏛️', title: '杜樂麗花園', description: '皇家花園漫步' },
          { icon: '🛍️', title: '香榭麗舍大道', description: '世界最美大道' }
        ],
        recommendations: ['凱旋門', '老佛爺百貨'],
        meals: { breakfast: '飯店內', lunch: '羅浮宮附近', dinner: '法式餐廳' },
        accommodation: '巴黎市區五星飯店'
      }
    ]
  },

  // ========== 埃及 ==========
  {
    tagline: '古文明探索',
    title: '埃及金字塔尼羅河十日遊',
    subtitle: '金字塔 × 人面獅身 × 尼羅河遊輪',
    description: '探索神秘古埃及文明，搭乘尼羅河豪華遊輪',
    country: 'egypt',
    city: 'cairo',
    tour_code: 'EG-CAI-01',
    status: 'published',
    is_template: true,
    price: '89,900',
    price_note: '起',
    features: [
      { icon: 'IconPyramid', title: '吉薩金字塔', description: '世界七大奇蹟唯一倖存' },
      { icon: 'IconShip', title: '尼羅河遊輪', description: '豪華遊輪五星體驗' },
      { icon: 'IconTemple', title: '盧克索神殿', description: '古埃及神廟群' }
    ],
    focus_cards: [
      { title: '金字塔', src: '/images/egypt/pyramid.jpg' },
      { title: '人面獅身', src: '/images/egypt/sphinx.jpg' },
      { title: '尼羅河', src: '/images/egypt/nile.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 開羅',
        description: '飛往神秘古國埃及',
        activities: [
          { icon: '✈️', title: '飛往開羅', description: '經轉機約15小時' }
        ],
        recommendations: [],
        meals: { breakfast: '機上', lunch: '機上', dinner: '機上' },
        accommodation: '機上'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: '開羅金字塔',
        description: '參觀世界七大奇蹟',
        activities: [
          { icon: '🔺', title: '吉薩金字塔群', description: '古夫、卡夫拉、孟卡拉' },
          { icon: '🦁', title: '人面獅身像', description: '守護金字塔的神獸' },
          { icon: '🐪', title: '沙漠騎駱駝', description: '體驗沙漠風情' }
        ],
        recommendations: ['金字塔聲光秀', '埃及博物館'],
        meals: { breakfast: '飯店內', lunch: '埃及料理', dinner: '飯店晚餐' },
        accommodation: '開羅五星飯店'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: '開羅 → 亞斯旺',
        description: '搭機前往亞斯旺登船',
        activities: [
          { icon: '✈️', title: '國內航班', description: '飛往亞斯旺' },
          { icon: '🛳️', title: '登上遊輪', description: '尼羅河豪華遊輪' },
          { icon: '🌅', title: '河畔夕陽', description: '尼羅河落日' }
        ],
        recommendations: ['亞斯旺大壩', '未完成方尖碑'],
        meals: { breakfast: '飯店內', lunch: '遊輪午餐', dinner: '遊輪晚宴' },
        accommodation: '尼羅河豪華遊輪'
      }
    ]
  },

  // ========== 沙烏地阿拉伯 ==========
  {
    tagline: '神秘國度',
    title: '沙烏地阿拉伯世界遺產十一日',
    subtitle: '黑格拉 × 埃爾奧拉 × 吉達老城',
    description: '探索中東神秘國度，走訪世界文化遺產',
    country: 'saudi',
    city: 'riyadh',
    tour_code: 'SA-RUH-01',
    status: 'published',
    is_template: true,
    price: '168,900',
    price_note: '起',
    features: [
      { icon: 'IconTemple', title: '黑格拉遺址', description: '沙國第一個世界遺產' },
      { icon: 'IconMountain', title: '埃爾奧拉', description: '奇岩地形沙漠觀星' },
      { icon: 'IconBuilding', title: '吉達老城', description: 'UNESCO世界遺產' }
    ],
    focus_cards: [
      { title: '黑格拉', src: '/images/saudi/hegra.jpg' },
      { title: '大象岩', src: '/images/saudi/elephant.jpg' },
      { title: '世界之崖', src: '/images/saudi/edge.jpg' }
    ],
    daily_itinerary: [
      {
        dayLabel: 'Day 1',
        date: '第一天',
        title: '台北 → 利雅德',
        description: '飛往沙烏地阿拉伯首都',
        activities: [
          { icon: '✈️', title: '飛往利雅德', description: '經轉機約14小時' }
        ],
        recommendations: [],
        meals: { breakfast: '機上', lunch: '機上', dinner: '機上' },
        accommodation: '利雅德五星飯店'
      },
      {
        dayLabel: 'Day 2',
        date: '第二天',
        title: '利雅德市區',
        description: '探索現代與傳統交融的首都',
        activities: [
          { icon: '🏙️', title: '王國中心塔', description: '99樓天空橋觀景' },
          { icon: '🏛️', title: '國家博物館', description: '了解沙國歷史' },
          { icon: '🕌', title: 'Masmak堡壘', description: '沙國建國起源地' }
        ],
        recommendations: ['德拉伊耶遺址', '傳統市集'],
        meals: { breakfast: '飯店內', lunch: '阿拉伯料理', dinner: '烤全羊' },
        accommodation: '利雅德五星飯店'
      },
      {
        dayLabel: 'Day 3',
        date: '第三天',
        title: '世界之崖',
        description: '前往世界盡頭絕景',
        activities: [
          { icon: '🚙', title: '四輪驅動車', description: '穿越沙漠' },
          { icon: '🏜️', title: '世界之崖', description: '壯觀懸崖奇景' },
          { icon: '🌅', title: '沙漠日落', description: '金色夕陽' }
        ],
        recommendations: ['沙漠露營', '阿拉伯咖啡'],
        meals: { breakfast: '飯店內', lunch: '沙漠野餐', dinner: '沙漠營地' },
        accommodation: '沙漠帳篷營地'
      }
    ]
  }
]

// 新增缺少的城市資料（使用正確的機場代碼，限制 3 字元）
const ADDITIONAL_CITIES = [
  { name: '峴港', nameEn: 'Da Nang', code: 'DAD', countryId: 'vietnam' },
  { name: '河內', nameEn: 'Hanoi', code: 'HAN', countryId: 'vietnam' },
  { name: '胡志明市', nameEn: 'Ho Chi Minh City', code: 'SGN', countryId: 'vietnam' },
  { name: '巴黎', nameEn: 'Paris', code: 'CDG', countryId: 'france' },
  { name: '開羅', nameEn: 'Cairo', code: 'CAI', countryId: 'egypt' },
  { name: '盧克索', nameEn: 'Luxor', code: 'LXR', countryId: 'egypt' },
  { name: '利雅德', nameEn: 'Riyadh', code: 'RUH', countryId: 'saudi_arabia' },
  { name: '吉達', nameEn: 'Jeddah', code: 'JED', countryId: 'saudi_arabia' }
]

// 國家 ID 對應表（已存在的國家使用正確 ID）
const COUNTRY_ID_MAP = {
  japan: 'japan',
  thailand: 'thailand',
  korea: 'korea',
  vietnam: 'vietnam',
  france: 'france',
  egypt: 'egypt',
  saudi: 'saudi_arabia'
}

async function main() {
  console.log('🚀 開始匯入範例行程資料...\n')

  try {
    // 1. 新增缺少的城市
    console.log('📍 檢查並新增缺少的城市...')
    for (const city of ADDITIONAL_CITIES) {
      const { data: existing } = await supabase
        .from('cities')
        .select('id')
        .eq('airport_code', city.code)
        .single()

      if (!existing) {
        const { error } = await supabase.from('cities').insert({
          id: crypto.randomUUID(),
          name: city.name,
          name_en: city.nameEn,
          airport_code: city.code,
          country_id: city.countryId,
          display_order: 100,
          is_active: true
        })
        if (error) console.error(`  ❌ 新增城市 ${city.name} 失敗:`, error.message)
        else console.log(`  ✅ 新增城市: ${city.name}`)
      } else {
        console.log(`  ⏭️ 城市已存在: ${city.name}`)
      }
    }

    // 2. 匯入範例行程
    console.log('\n📝 開始匯入範例行程...')
    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const itinerary of SAMPLE_ITINERARIES) {
      // 檢查是否已存在
      const { data: existing } = await supabase
        .from('itineraries')
        .select('id')
        .eq('tour_code', itinerary.tour_code)
        .single()

      if (existing) {
        console.log(`  ⏭️ 行程已存在: ${itinerary.title}`)
        skipCount++
        continue
      }

      // 使用對應表取得正確的國家 ID
      const countryId = COUNTRY_ID_MAP[itinerary.country] || itinerary.country

      // 查詢城市
      const { data: cityData } = await supabase
        .from('cities')
        .select('id')
        .eq('country_id', countryId)
        .ilike('name_en', `%${itinerary.city}%`)
        .single()

      // 插入行程
      const { error } = await supabase.from('itineraries').insert({
        id: crypto.randomUUID(),
        tagline: itinerary.tagline,
        title: itinerary.title,
        subtitle: itinerary.subtitle,
        description: itinerary.description,
        country: countryId,
        city: cityData?.id || null,
        tour_code: itinerary.tour_code,
        status: itinerary.status,
        is_template: itinerary.is_template,
        price: itinerary.price,
        price_note: itinerary.price_note,
        features: itinerary.features,
        focus_cards: itinerary.focus_cards,
        daily_itinerary: itinerary.daily_itinerary,
        departure_date: new Date().toISOString().split('T')[0],
        cover_image: ''
      })

      if (error) {
        console.error(`  ❌ 匯入失敗: ${itinerary.title}`, error.message)
        errorCount++
      } else {
        console.log(`  ✅ 匯入成功: ${itinerary.title}`)
        successCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 匯入結果統計:')
    console.log(`  ✅ 成功: ${successCount} 筆`)
    console.log(`  ⏭️ 跳過: ${skipCount} 筆`)
    console.log(`  ❌ 失敗: ${errorCount} 筆`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ 執行失敗:', error)
    process.exit(1)
  }
}

main()
