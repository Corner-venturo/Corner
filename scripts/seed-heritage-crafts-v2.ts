#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============================================
// 非遺工藝體驗資料（使用正確的欄位結構）
// ============================================

const heritageCrafts = [
  // ==================== 日本（6個）====================
  {
    name: '京都友禪染和服染色工坊',
    name_en: 'Kyoto Yuzen Kimono Dyeing Workshop',
    country_id: 'japan',
    city_id: 'kyoto',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'textile_arts', 'UNESCO_heritage'],
    exclusivity_level: 'highly_exclusive',
    description: '在京都傳統町家內，跟隨友禪染國家級工藝師學習這項擁有400年歷史的和服染色技藝。親手繪製設計圖案，使用天然染料進行手繪染色，體驗從設計到完成的完整工藝流程。完成的作品可帶回家，或訂製成正式和服。友禪染是日本最高級的和服染色技法，以細膩的手繪線條和豐富的色彩層次聞名。工坊位於祇園附近的百年町家，保留完整的傳統工具和技法。',
    highlights: [
      '國家級友禪染傳承人一對一指導',
      '使用400年傳統技法與天然染料',
      '在百年町家工坊體驗完整工藝流程',
      '可訂製個人專屬和服（需額外費用）',
      '獲得工藝師親筆簽名證書',
      '參觀私人收藏的古董和服與工具'
    ],
    duration_hours: 6,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 180000,
    price_per_person_max: 280000,
    currency: 'JPY',
    commission_rate: 18,
    expert_name: '田中美智子',
    expert_title: '友禪染傳統工藝士',
    expert_credentials: ['國家認定傳統工藝士', '京友禪協同組合會員', '三代傳承'],
    physical_requirement: '需坐在地板工作2-3小時（提供坐墊）',
    price_includes: ['染色材料與工具', '傳統茶點', '完成作品（小型絲巾或掛軸）', '工藝證書', '工坊攝影'],
    advance_booking_days: 30,
    cancellation_policy: '14天前免費取消，7-14天扣50%，7天內不退款',
    thumbnail: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
    images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800'
    ],
    is_active: true
  },
  {
    name: '輪島塗漆器製作體驗',
    name_en: 'Wajima-nuri Lacquerware Crafting',
    country_id: 'japan',
    city_id: 'tokyo',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'lacquerware', 'intangible_heritage'],
    exclusivity_level: 'highly_exclusive',
    description: '輪島塗是日本最高級的漆器工藝，需要經過100道以上工序、耗時數月至數年才能完成一件作品。在東京的輪島塗大師工坊，學習漆器的基礎技法：木地塗裝、蒔繪描金、螺鈿鑲嵌。使用天然漆液和金箔，親手製作一個小型漆器作品（如飾品盒或筷子）。工藝師會展示傳統工具和技法，並分享輪島塗600年的歷史故事。',
    highlights: [
      '輪島塗傳統工藝士親自指導',
      '學習蒔繪描金與螺鈿技法',
      '使用天然漆液與本金箔',
      '參觀大師級作品收藏',
      '獲得輪島塗工藝證書',
      '作品完成後郵寄到府（需4-6週乾燥）'
    ],
    duration_hours: 5,
    group_size_min: 1,
    group_size_max: 3,
    price_per_person_min: 150000,
    price_per_person_max: 220000,
    currency: 'JPY',
    commission_rate: 18,
    expert_name: '山本和夫',
    expert_title: '輪島塗傳統工藝士',
    expert_credentials: ['經濟產業大臣指定工藝師', '40年經驗', '日本工藝會會員'],
    physical_requirement: '需使用細緻手工，建議無漆液過敏',
    price_includes: ['漆器材料（天然漆、金箔）', '工具使用', '完成作品', '國際運送', '工藝證書'],
    advance_booking_days: 21,
    cancellation_policy: '14天前免費取消，之後不退款',
    thumbnail: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
    images: [
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800'
    ],
    is_active: true
  },
  {
    name: '有田燒陶瓷拉坯與繪製',
    name_en: 'Arita-yaki Porcelain Throwing & Painting',
    country_id: 'japan',
    city_id: 'fukuoka',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'pottery', 'porcelain'],
    exclusivity_level: 'exclusive',
    description: '有田燒是日本最早的瓷器，擁有400年歷史，以精緻的白瓷和華麗的彩繪聞名。在九州有田町的傳統窯元，跟隨陶藝世家第十五代傳人學習從拉坯到繪製的完整流程。使用有田特有的泉山陶石，在轆轤上手工成型，再以傳統染付技法（青花）或赤繪技法（紅色）繪製圖案。作品將在柴燒登窯中以1300度高溫燒製，完成後國際運送。',
    highlights: [
      '有田燒世家第十五代傳人親授',
      '使用泉山陶石與傳統配方釉藥',
      '體驗轆轤拉坯與手繪技法',
      '參觀300年歷史登窯',
      '作品在傳統柴燒窯燒製',
      '獲得窯元印章認證'
    ],
    duration_hours: 7,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 120000,
    price_per_person_max: 180000,
    currency: 'JPY',
    commission_rate: 17,
    expert_name: '柴田修',
    expert_title: '有田燒窯元第十五代',
    expert_credentials: ['佐賀縣無形文化財保持者', '窯元經營者', '400年世家傳承'],
    physical_requirement: '需使用轆轤，雙手會沾泥',
    price_includes: ['陶土與釉藥', '工具使用', '窯燒費用', '2件完成作品', '國際運送', '窯元證書'],
    advance_booking_days: 30,
    cancellation_policy: '21天前免費取消，之後扣50%',
    thumbnail: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800'
    ],
    is_active: true
  },
  {
    name: '越前和紙手工造紙體驗',
    name_en: 'Echizen Washi Papermaking Experience',
    country_id: 'japan',
    city_id: 'osaka',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'papermaking', 'intangible_heritage'],
    exclusivity_level: 'exclusive',
    description: '越前和紙有1500年歷史，是日本三大和紙之一，被指定為重要無形文化財。在福井縣越前市的紙漉き工房（大阪分工坊），跟隨人間國寶級紙漉き職人學習手工造紙。從楮樹皮處理、打漿、漉紙到乾燥，體驗完整的傳統造紙工序。學習「流し漉き」技法，製作獨一無二的手工和紙，可加入花瓣、金箔等裝飾。越前和紙被用於修復古書、製作高級書畫用紙，是日本文化的重要載體。',
    highlights: [
      '人間國寶級紙漉き職人指導',
      '學習1500年傳統流し漉き技法',
      '使用天然楮樹皮與清流水',
      '可加入金箔、花瓣等裝飾',
      '製作3-5張不同風格和紙',
      '獲得重要無形文化財證書'
    ],
    duration_hours: 4,
    group_size_min: 1,
    group_size_max: 6,
    price_per_person_min: 80000,
    price_per_person_max: 120000,
    currency: 'JPY',
    commission_rate: 15,
    expert_name: '岩野市兵衛',
    expert_title: '人間國寶紙漉き職人',
    expert_credentials: ['重要無形文化財保持者', '紙漉き職人五代目', '文化廳認定'],
    physical_requirement: '需站立工作並浸手於冷水',
    price_includes: ['造紙材料', '工具使用', '完成作品5-8張', '裱框服務（選配）', '工藝證書'],
    advance_booking_days: 14,
    cancellation_policy: '7天前免費取消，之後扣30%',
    thumbnail: 'https://images.unsplash.com/photo-1516631670063-e9c0f33afd06?w=800',
    images: [
      'https://images.unsplash.com/photo-1516631670063-e9c0f33afd06?w=800',
      'https://images.unsplash.com/photo-1586864387634-92fda7c6cab8?w=800'
    ],
    is_active: true
  },
  {
    name: '備前燒陶藝登窯燒製體驗',
    name_en: 'Bizen-yaki Pottery Climbing Kiln Firing',
    country_id: 'japan',
    city_id: 'osaka',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'pottery', 'ancient_kiln'],
    exclusivity_level: 'highly_exclusive',
    description: '備前燒是日本六古窯之一，有1000年以上歷史，以不上釉、高溫長時間燒製而聞名。在岡山縣備前市的傳統窯元（大阪聯絡處），跟隨備前燒重要無形文化財保持者學習手捏成型技法。使用當地特有的田土陶土，以手捏或轆轤製作茶碗、花器等器皿。作品將在「大窯」（登窯）中以松木柴燒10-14天，形成獨特的「窯變」效果：緋襷、胡麻、桟切等自然釉色。',
    highlights: [
      '備前燒重要無形文化財保持者指導',
      '使用千年古窯場田土陶土',
      '體驗傳統手捏成型技法',
      '作品在登窯柴燒10-14天',
      '獲得獨特窯變自然釉色',
      '窯元世家印章認證'
    ],
    duration_hours: 6,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 160000,
    price_per_person_max: 240000,
    currency: 'JPY',
    commission_rate: 18,
    expert_name: '森陶岳',
    expert_title: '備前燒窯元七代目',
    expert_credentials: ['岡山縣重要無形文化財保持者', '備前燒陶友會會長', '窯元經營者'],
    physical_requirement: '需手工捏陶，雙手會沾泥',
    price_includes: ['陶土與工具', '登窯燒製費用', '2-3件完成作品', '國際運送', '窯元證書', '作品保證書'],
    advance_booking_days: 60,
    cancellation_policy: '30天前免費取消，之後不退款',
    thumbnail: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800',
    images: [
      'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800'
    ],
    is_active: true
  },
  {
    name: '京都西陣織和服腰帶編織',
    name_en: 'Kyoto Nishijin-ori Obi Weaving',
    country_id: 'japan',
    city_id: 'kyoto',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'textile_arts', 'UNESCO_heritage'],
    exclusivity_level: 'ultra_exclusive',
    description: '西陣織是京都最高級的織物工藝，有1200年歷史，專門製作和服腰帶（帯）與高級絲織品。在西陣地區的傳統機屋，跟隨西陣織工藝士學習使用傳統「高機」（立式織機）編織。體驗從整經、穿綜到織造的完整工序，使用金銀線、彩色絲線編織複雜的紋樣。西陣織以「綴織」「唐織」等技法聞名，一條高級腰帶需要數月時間完成。在此體驗中可織成小型作品如茶席墊或裝飾布。',
    highlights: [
      '西陣織傳統工藝士親授',
      '使用1200年傳統高機',
      '學習綴織、唐織技法',
      '使用金銀線與京都絲',
      '參觀帯匠老舖工房',
      '獲得西陣織工藝證書'
    ],
    duration_hours: 6,
    group_size_min: 1,
    group_size_max: 2,
    price_per_person_min: 200000,
    price_per_person_max: 300000,
    currency: 'JPY',
    commission_rate: 20,
    expert_name: '細尾真孝',
    expert_title: '西陣織帯匠四代目',
    expert_credentials: ['西陣織伝統工芸士', '京都市無形文化財保持者', '帯匠經營者'],
    physical_requirement: '需坐在織機前工作4-5小時',
    dress_code: '建議穿著輕便服裝',
    price_includes: ['絲線與金銀線', '高機使用', '完成作品（茶席墊）', '西陣織工藝證書', '工房茶點'],
    advance_booking_days: 45,
    cancellation_policy: '21天前免費取消，之後不退款',
    thumbnail: 'https://images.unsplash.com/photo-1544441892-794166f1e3be?w=800',
    images: [
      'https://images.unsplash.com/photo-1544441892-794166f1e3be?w=800',
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800'
    ],
    is_active: true
  },

  // ==================== 泰國（3個）====================
  {
    name: '清邁蘭納泰絲手工織造',
    name_en: 'Chiang Mai Lanna Thai Silk Hand Weaving',
    country_id: 'thailand',
    city_id: 'chiang-mai',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'textile_arts', 'silk_weaving'],
    exclusivity_level: 'exclusive',
    description: '蘭納泰絲是泰國北部獨特的傳統織物，以繁複的幾何紋樣和天然染色聞名。在清邁老城的泰絲工坊，跟隨蘭納織女世家第四代傳人學習從養蠶、抽絲、染色到織造的完整工藝。使用傳統腳踏織機，學習「mut-mee」（泰式絞染）技法，織造一條泰絲圍巾或桌旗。工坊使用天然植物染料：藍靛、薑黃、紫蘇等，呈現蘭納特有的深紅、靛藍、金黃色調。',
    highlights: [
      '蘭納織女世家四代傳人指導',
      '學習養蠶、抽絲、染色全流程',
      '使用傳統腳踏織機',
      '天然植物染料（藍靛、薑黃）',
      '掌握mut-mee絞染技法',
      '獲得泰國工藝部認證證書'
    ],
    duration_hours: 8,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 12000,
    price_per_person_max: 18000,
    currency: 'THB',
    commission_rate: 17,
    expert_name: 'พิมพ์ชนก สุริยนต์',
    expert_title: '蘭納織女世家四代',
    expert_credentials: ['泰國工藝大師（National Artist候選）', 'OTOP五星級', '四代傳承'],
    physical_requirement: '需坐在地板或矮凳工作',
    price_includes: ['絲線與染料', '織機使用', '完成作品（圍巾或桌旗）', '泰式午餐', '工藝證書'],
    advance_booking_days: 14,
    cancellation_policy: '7天前免費取消，之後扣30%',
    thumbnail: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800',
    images: [
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800',
      'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800'
    ],
    is_active: true
  },
  {
    name: '曼谷珐瑯彩繪銀器製作',
    name_en: 'Bangkok Benjarong Enamel Silver Crafting',
    country_id: 'thailand',
    city_id: 'bangkok',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'metalwork', 'royal_arts'],
    exclusivity_level: 'ultra_exclusive',
    description: 'Benjarong（班加隆）是泰國皇室專用的五彩珐瑯瓷器，有300年歷史。在曼谷的皇家工藝中心，跟隨曾為泰王室服務的珐瑯大師學習銀器珐瑯彩繪技藝。使用925純銀底胎，以傳統技法繪製泰式花卉圖案，再填充五彩珐瑯釉，經800度高溫燒製。完成一個銀質首飾盒或碗，表面覆蓋華麗的五彩珐瑯。Benjarong圖案包括「克拉通」花朵、「那迦」神獸等泰國傳統元素。',
    highlights: [
      '皇家工藝大師親授（曾服務泰王室）',
      '使用925純銀與景泰藍珐瑯',
      '學習傳統五彩填彩技法',
      '繪製泰式宮廷花卉圖案',
      '高溫窯燒定色',
      '獲得皇家工藝中心證書'
    ],
    duration_hours: 7,
    group_size_min: 1,
    group_size_max: 3,
    price_per_person_min: 25000,
    price_per_person_max: 40000,
    currency: 'THB',
    commission_rate: 20,
    expert_name: 'สมชาย วงศ์วัฒน์',
    expert_title: '泰國國家工藝大師',
    expert_credentials: ['National Artist', '曾任皇室御用工匠', '50年經驗'],
    physical_requirement: '需細緻手工，使用小筆繪製',
    price_includes: ['925純銀底胎', '珐瑯釉與工具', '窯燒費用', '完成作品', '皇家證書', '精美包裝'],
    advance_booking_days: 30,
    cancellation_policy: '14天前免費取消，之後不退款',
    thumbnail: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800',
    images: [
      'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800',
      'https://images.unsplash.com/photo-1623693862302-7e1c18fb1b66?w=800'
    ],
    is_active: true
  },
  {
    name: '清邁柚木雕刻工藝體驗',
    name_en: 'Chiang Mai Teak Wood Carving',
    country_id: 'thailand',
    city_id: 'chiang-mai',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'woodcarving', 'lanna_arts'],
    exclusivity_level: 'exclusive',
    description: '泰北柚木雕刻是蘭納王朝流傳下來的傳統工藝，以精細的花卉與佛教圖案聞名。在清邁郊外的木雕村，跟隨泰國文化部認證的木雕大師學習傳統柚木雕刻。使用百年泰北柚木，學習使用傳統雕刻刀具，雕刻蘭納風格的花窗、動物或佛教符號。柚木質地堅硬、色澤金黃，是製作寺廟建築與高級家具的頂級木材。完成作品可以是小型擺飾、相框或首飾盒。',
    highlights: [
      '文化部認證木雕大師指導',
      '使用百年泰北柚木',
      '學習蘭納傳統雕刻技法',
      '雕刻花窗、動物、佛教圖案',
      '參觀木雕村與寺廟建築',
      '獲得工藝大師簽名證書'
    ],
    duration_hours: 6,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 9000,
    price_per_person_max: 15000,
    currency: 'THB',
    commission_rate: 15,
    expert_name: 'นายเดช บุญมี',
    expert_title: '木雕協會會長',
    expert_credentials: ['泰國文化部認證工藝大師', '木雕協會領導', '三代傳承'],
    physical_requirement: '需使用雕刻刀具，需注意安全',
    price_includes: ['柚木材料', '雕刻工具使用', '完成作品', '工藝證書', '泰式茶點'],
    advance_booking_days: 7,
    cancellation_policy: '3天前免費取消，之後扣30%',
    thumbnail: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800',
    images: [
      'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800',
      'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800'
    ],
    is_active: true
  },

  // ==================== 韓國（3個）====================
  {
    name: '首爾高麗青瓷燒製工坊',
    name_en: 'Seoul Goryeo Celadon Pottery Workshop',
    country_id: 'korea',
    city_id: 'seoul',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'pottery', 'intangible_heritage'],
    exclusivity_level: 'ultra_exclusive',
    description: '高麗青瓷是韓國最引以為傲的陶瓷藝術，以翠綠色「秘色」釉和精緻的鑲嵌技法聞名，在12世紀達到巔峰。在首爾仁寺洞的傳統窯坊，跟隨國家無形文化財保持者學習青瓷製作。使用高麗時代傳承下來的配方釉藥，學習拉坯、鑲嵌（象嵌）技法。在器物表面雕刻紋樣後，嵌入白土或黑土，再施青瓷釉，經1250度還原焰燒製，呈現獨特的「翡色」釉面。完成作品如茶碗、香爐或梅瓶。',
    highlights: [
      '國家無形文化財保持者親授',
      '學習高麗王朝傳統配方',
      '掌握象嵌鑲嵌技法',
      '使用還原焰窯燒製',
      '呈現秘色翡翠釉面',
      '獲得文化財廳認證證書'
    ],
    duration_hours: 8,
    group_size_min: 1,
    group_size_max: 3,
    price_per_person_min: 350000,
    price_per_person_max: 500000,
    currency: 'KRW',
    commission_rate: 20,
    expert_name: '유근형',
    expert_title: '國家無形文化財保持者',
    expert_credentials: ['國家無形文化財第105號', '韓國陶瓷名匠', '三代青瓷世家'],
    physical_requirement: '需轆轤拉坯與細緻雕刻',
    price_includes: ['陶土與釉藥', '工具使用', '窯燒費用', '2件完成作品', '國際運送', '文化財證書'],
    advance_booking_days: 45,
    cancellation_policy: '21天前免費取消，之後不退款',
    thumbnail: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
    images: [
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800'
    ],
    is_active: true
  },
  {
    name: '全州韓紙工藝與天然染色',
    name_en: 'Jeonju Hanji Papercraft & Natural Dyeing',
    country_id: 'korea',
    city_id: 'seoul',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'papermaking', 'korean_heritage'],
    exclusivity_level: 'exclusive',
    description: '韓紙（한지）是韓國傳統手工紙，使用桑樹皮製成，以堅韌耐久聞名，可保存千年。全州是韓紙的故鄉，擁有最高品質的韓紙工藝。在首爾的全州韓紙工坊，跟隨國家指定韓紙匠人學習造紙與染色。從桑樹皮處理、打漿、抄紙到乾燥，體驗完整工序。使用天然植物染料（梔子、蘇木、藍草）染色，製作彩色韓紙。學習韓紙工藝品製作：燈籠、摺扇、書籤、筆記本等。',
    highlights: [
      '國家指定韓紙匠人親授',
      '全州傳統造紙技法',
      '天然植物染色（梔子、藍草）',
      '製作韓紙工藝品',
      '學習韓紙燈籠製作',
      '獲得韓紙工藝證書'
    ],
    duration_hours: 5,
    group_size_min: 1,
    group_size_max: 6,
    price_per_person_min: 150000,
    price_per_person_max: 220000,
    currency: 'KRW',
    commission_rate: 17,
    expert_name: '손인식',
    expert_title: '全州韓紙傳承人',
    expert_credentials: ['文化財廳認定工藝師', '全州韓紙協會', '30年經驗'],
    physical_requirement: '需浸手於水中工作',
    price_includes: ['桑樹皮與染料', '工具使用', '完成韓紙20-30張', '韓紙工藝品3件', '工藝證書'],
    advance_booking_days: 14,
    cancellation_policy: '7天前免費取消，之後扣30%',
    thumbnail: 'https://images.unsplash.com/photo-1586864387634-92fda7c6cab8?w=800',
    images: [
      'https://images.unsplash.com/photo-1586864387634-92fda7c6cab8?w=800',
      'https://images.unsplash.com/photo-1516631670063-e9c0f33afd06?w=800'
    ],
    is_active: true
  },
  {
    name: '首爾韓服訂製與刺繡工藝',
    name_en: 'Seoul Hanbok Custom Tailoring & Embroidery',
    country_id: 'korea',
    city_id: 'seoul',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'textile_arts', 'embroidery'],
    exclusivity_level: 'highly_exclusive',
    description: '韓服是韓國傳統服飾，以優雅的線條和豐富的色彩聞名。在首爾三清洞的百年韓服老舖，跟隨韓服名匠學習韓服製作與刺繡。了解韓服的結構、剪裁、縫製技法，學習傳統刺繡：平繡、釘繡、金繡。使用韓國絲綢、韓紙襯布，親手刺繡一個韓服配件（袖口、領子或荷包）。可選配訂製一套完整韓服（需額外費用及數週製作時間）。韓服名匠會根據個人氣質和喜好，設計專屬的韓服款式與配色。',
    highlights: [
      '韓服名匠（國家認定）親授',
      '學習韓服剪裁與縫製',
      '掌握傳統刺繡技法（平繡、金繡）',
      '使用韓國絲綢與韓紙襯',
      '可訂製個人專屬韓服',
      '獲得韓服工藝證書與設計圖'
    ],
    duration_hours: 6,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 280000,
    price_per_person_max: 450000,
    currency: 'KRW',
    commission_rate: 18,
    expert_name: '박술녀',
    expert_title: '韓服名匠',
    expert_credentials: ['首爾市無形文化財保持者', '三代韓服世家', '韓服名匠協會會員'],
    physical_requirement: '需手工縫紉',
    price_includes: ['絲綢與繡線', '工具使用', '完成刺繡作品', '韓服配件', '工藝證書', '設計圖稿'],
    advance_booking_days: 21,
    cancellation_policy: '14天前免費取消，之後扣50%',
    thumbnail: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
    images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      'https://images.unsplash.com/photo-1589685398218-b0b4e3f35e3d?w=800'
    ],
    is_active: true
  },

  // ==================== 越南（3個）====================
  {
    name: '順化皇家漆畫藝術工坊',
    name_en: 'Hue Royal Lacquer Painting Workshop',
    country_id: 'vietnam',
    city_id: 'da-nang',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'lacquer_arts', 'painting'],
    exclusivity_level: 'highly_exclusive',
    description: '越南漆畫是融合法國美術與越南傳統漆藝的獨特藝術形式，在20世紀初由河內美術學院創立，並在順化皇宮得到發展。在順化（峴港附近）的漆藝工作室，跟隨越南國家級漆畫藝術家學習傳統漆畫技法。使用天然漆液、蛋殼、金箔、螺鈿，創作一幅越南風景或花鳥漆畫。學習磨顯技法：多層上漆、打磨，呈現漆畫特有的光澤與層次。漆畫需要耐心與時間，完整作品需數週完成，工坊提供郵寄服務。',
    highlights: [
      '國家級漆畫藝術家指導',
      '順化皇家漆藝傳統',
      '使用天然漆、蛋殼、金箔',
      '學習磨顯多層技法',
      '創作越南風景或花鳥畫',
      '作品郵寄到府（需4-6週）'
    ],
    duration_hours: 7,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 4500000,
    price_per_person_max: 7000000,
    currency: 'VND',
    commission_rate: 18,
    expert_name: 'Nguyễn Thanh Bình',
    expert_title: '國家級漆畫藝術家',
    expert_credentials: ['越南美術協會會員', '順化美術學院教授', '漆畫大師'],
    physical_requirement: '需使用漆液，建議無過敏體質',
    price_includes: ['漆液、蛋殼、金箔', '畫板與工具', '完成作品（30x40cm）', '國際運送', '藝術家簽名證書'],
    advance_booking_days: 30,
    cancellation_policy: '14天前免費取消，之後扣50%',
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
    images: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
      'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800'
    ],
    is_active: true
  },
  {
    name: '會安傳統刺繡與奧黛訂製',
    name_en: 'Hoi An Traditional Embroidery & Ao Dai Tailoring',
    country_id: 'vietnam',
    city_id: 'hoi-an',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'textile_arts', 'embroidery'],
    exclusivity_level: 'exclusive',
    description: '會安是越南傳統刺繡與服飾製作的中心，擁有數百年歷史。在會安古城的刺繡工坊，跟隨越南刺繡大師學習傳統刺繡技法。使用絲線繡製越南經典圖案：蓮花、鳳凰、竹子、梅花。學習平繡、盤金繡、結繡等技法，完成一幅刺繡作品或奧黛袖口裝飾。可選配訂製一套完整奧黛（越南傳統長衫），使用絲綢或亞麻，手工刺繡裝飾，量身訂製，需3-5天完成。',
    highlights: [
      '越南刺繡大師親授',
      '學習傳統平繡、盤金繡',
      '繡製蓮花、鳳凰等經典圖案',
      '可訂製手工刺繡奧黛',
      '使用越南絲綢',
      '獲得工藝大師證書'
    ],
    duration_hours: 5,
    group_size_min: 1,
    group_size_max: 6,
    price_per_person_min: 2500000,
    price_per_person_max: 4000000,
    currency: 'VND',
    commission_rate: 17,
    expert_name: 'Trần Thị Hồng',
    expert_title: '越南刺繡大師',
    expert_credentials: ['越南工藝大師', '會安刺繡協會會長', '三代傳承'],
    physical_requirement: '需手工刺繡，需良好視力',
    price_includes: ['絲線與布料', '工具使用', '完成刺繡作品', '工藝證書', '越南茶點'],
    advance_booking_days: 7,
    cancellation_policy: '3天前免費取消，之後扣30%',
    thumbnail: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800',
    images: [
      'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800',
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800'
    ],
    is_active: true
  },
  {
    name: '巴盞陶瓷製作與鑲嵌工藝',
    name_en: 'Bat Trang Ceramic Making & Inlay Craft',
    country_id: 'vietnam',
    city_id: 'hanoi',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'pottery', 'ceramic_arts'],
    exclusivity_level: 'exclusive',
    description: '巴盞陶瓷村距離河內15公里，有700年歷史，是越南最著名的陶瓷產地。在巴盞村的傳統窯場，跟隨陶藝世家第八代傳人學習越南陶瓷製作。使用紅河岸的特殊陶土，在轆轤上手工成型，學習越南特色的「青花鑲嵌」技法：在陶胎上雕刻圖案，嵌入白泥或青料，呈現立體效果。作品在柴燒窯中以1200度高溫燒製，完成茶具、花瓶或裝飾盤。巴盞陶以樸實的紅陶與精緻的青花紋飾聞名。',
    highlights: [
      '巴盞陶藝世家八代傳人指導',
      '使用紅河特殊陶土',
      '學習青花鑲嵌技法',
      '體驗轆轤拉坯與手繪',
      '柴燒窯燒製',
      '獲得巴盞村窯場證書'
    ],
    duration_hours: 6,
    group_size_min: 1,
    group_size_max: 4,
    price_per_person_min: 3000000,
    price_per_person_max: 5000000,
    currency: 'VND',
    commission_rate: 15,
    expert_name: 'Nguyễn Văn Sơn',
    expert_title: '巴盞陶藝世家第八代',
    expert_credentials: ['河內工藝協會理事', '巴盞村窯場主', '700年傳承'],
    physical_requirement: '需轆轤拉坯，雙手會沾泥',
    price_includes: ['陶土與釉藥', '工具使用', '窯燒費用', '2-3件完成作品', '國際運送', '窯場證書'],
    advance_booking_days: 14,
    cancellation_policy: '7天前免費取消，之後扣30%',
    thumbnail: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
      'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800'
    ],
    is_active: true
  },

  // ==================== 中國（3個）====================
  {
    name: '北京景泰藍掐絲琺瑯製作',
    name_en: 'Beijing Cloisonné Enamel Crafting',
    country_id: 'china',
    city_id: 'shanghai',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'metalwork', 'national_heritage'],
    exclusivity_level: 'ultra_exclusive',
    description: '景泰藍是中國傳統金屬工藝，以銅胎掐絲琺瑯技法聞名，在明代景泰年間達到頂峰，故名景泰藍。在上海的景泰藍工坊（北京工藝聯絡處），跟隨國家級非遺傳承人學習掐絲琺瑯技藝。使用紫銅片作底胎，用銅絲掐出圖案（花鳥、龍鳳、山水），點填各色琺瑯釉，經800度高溫燒製、打磨、鍍金，完成一件景泰藍首飾盒或花瓶。景泰藍以藍色為主調，色彩豐富，工藝繁複，是清代皇室御用工藝品。',
    highlights: [
      '國家級非遺傳承人親授',
      '學習掐絲、點藍、燒製、打磨全流程',
      '使用紫銅胎與天然礦物釉',
      '傳統高溫琺瑯燒製',
      '鍍24K金邊裝飾',
      '獲得非遺工藝證書'
    ],
    duration_hours: 8,
    group_size_min: 1,
    group_size_max: 3,
    price_per_person_min: 4800,
    price_per_person_max: 7500,
    currency: 'CNY',
    commission_rate: 20,
    expert_name: '李慶民',
    expert_title: '景泰藍大師',
    expert_credentials: ['國家級非物質文化遺產傳承人', '北京市工藝美術大師', '四代景泰藍世家'],
    physical_requirement: '需細緻手工，使用鑷子掐絲',
    price_includes: ['銅胎與銅絲', '琺瑯釉', '燒製與鍍金', '完成作品', '非遺證書', '精美包裝'],
    advance_booking_days: 30,
    cancellation_policy: '14天前免費取消，之後不退款',
    thumbnail: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800',
    images: [
      'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800',
      'https://images.unsplash.com/photo-1623693862302-7e1c18fb1b66?w=800'
    ],
    is_active: true
  },
  {
    name: '蘇州刺繡四大名繡體驗',
    name_en: 'Suzhou Embroidery Four Famous Styles',
    country_id: 'china',
    city_id: 'shanghai',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'embroidery', 'national_heritage'],
    exclusivity_level: 'exclusive',
    description: '蘇繡是中國四大名繡之首，有2500年歷史，以針法細膩、色彩雅致聞名。在蘇州（上海蘇繡館）的刺繡工坊，跟隨蘇繡非遺傳承人學習傳統蘇繡技法。了解四大名繡：蘇繡、湘繡、粵繡、蜀繡的特色，重點學習蘇繡經典針法：齊針、套針、滾針、散套針。在真絲底布上繡製江南經典題材：貓、魚、花卉、園林。蘇繡以「平、齊、細、密、勻、順、和、光」八字訣聞名，完成作品可裱框。',
    highlights: [
      '蘇繡非遺傳承人親授',
      '學習2500年傳統針法',
      '掌握齊針、套針、散套針',
      '使用真絲底布與絲線',
      '繡製江南經典題材',
      '獲得蘇繡工藝證書與裱框'
    ],
    duration_hours: 6,
    group_size_min: 1,
    group_size_max: 6,
    price_per_person_min: 3200,
    price_per_person_max: 5000,
    currency: 'CNY',
    commission_rate: 17,
    expert_name: '姚建萍',
    expert_title: '蘇繡大師',
    expert_credentials: ['蘇州刺繡研究所傳承人', '江蘇省工藝美術大師', '國家級非遺項目代表性傳承人'],
    physical_requirement: '需手工刺繡，需良好視力與耐心',
    price_includes: ['真絲底布', '絲線與工具', '完成作品', '裱框服務', '非遺證書'],
    advance_booking_days: 14,
    cancellation_policy: '7天前免費取消，之後扣30%',
    thumbnail: 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=800',
    images: [
      'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=800',
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800'
    ],
    is_active: true
  },
  {
    name: '景德鎮青花瓷繪製與燒窯',
    name_en: 'Jingdezhen Blue & White Porcelain Painting',
    country_id: 'china',
    city_id: 'shanghai',
    category: 'artisan_workshop',
    sub_category: ['traditional_crafts', 'pottery', 'porcelain'],
    exclusivity_level: 'exclusive',
    description: '景德鎮是中國瓷都，有1700年製瓷歷史，青花瓷是其代表作，以白底藍花、釉下彩繪聞名於世。在上海的景德鎮陶瓷藝術館，跟隨景德鎮陶瓷大師學習青花瓷繪製。使用景德鎮高嶺土瓷坯，以天然鈷料（青花料）繪製傳統圖案：纏枝蓮、雲龍紋、山水、花鳥。學習分水技法（深淺層次）、勾線技法，完成繪製後施透明釉，送往景德鎮以1320度高溫燒製。完成作品如茶杯、盤子或花瓶，呈現青花特有的幽藍色澤。',
    highlights: [
      '景德鎮陶瓷大師親授',
      '使用景德鎮高嶺土瓷坯',
      '學習青花分水技法',
      '繪製纏枝蓮、龍鳳、山水圖案',
      '送景德鎮柴燒窯燒製',
      '獲得景德鎮陶瓷證書'
    ],
    duration_hours: 5,
    group_size_min: 1,
    group_size_max: 6,
    price_per_person_min: 2800,
    price_per_person_max: 4500,
    currency: 'CNY',
    commission_rate: 15,
    expert_name: '王懷俊',
    expert_title: '景德鎮陶瓷大師',
    expert_credentials: ['景德鎮陶瓷學院教授', '江西省工藝美術大師', '中國陶瓷藝術大師'],
    physical_requirement: '需手繪細緻圖案',
    price_includes: ['瓷坯與青花料', '工具使用', '窯燒費用', '2-3件完成作品', '國際運送', '陶瓷證書'],
    advance_booking_days: 21,
    cancellation_policy: '10天前免費取消，之後扣30%',
    thumbnail: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
    images: [
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800'
    ],
    is_active: true
  }
]

async function seedHeritageCrafts() {
  console.log('🎨 開始匯入非遺工藝體驗...\n')

  let successCount = 0
  let failCount = 0

  console.log('🏺 匯入工藝體驗資料...')
  for (const craft of heritageCrafts) {
    const { error } = await supabase.from('premium_experiences').insert(craft)

    if (error) {
      console.log(`  ❌ ${craft.name}: ${error.message}`)
      failCount++
    } else {
      console.log(`  ✅ ${craft.name}（${craft.city_id}）- ${craft.exclusivity_level}`)
      successCount++
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('🎉 非遺工藝體驗匯入總結：')
  console.log(`  🏺 工藝體驗：${successCount}/${heritageCrafts.length}`)
  console.log(`  📊 成功：${successCount} 筆`)
  console.log(`  ❌ 失敗：${failCount} 筆`)
  console.log('='.repeat(70))

  console.log('\n🌏 工藝覆蓋：')
  console.log('  🇯🇵 日本：6 個工藝（友禪染、漆器、陶瓷、和紙、備前燒、西陣織）')
  console.log('  🇹🇭 泰國：3 個工藝（泰絲、珐瑯、柚木雕刻）')
  console.log('  🇰🇷 韓國：3 個工藝（青瓷、韓紙、韓服刺繡）')
  console.log('  🇻🇳 越南：3 個工藝（漆畫、刺繡奧黛、巴盞陶瓷）')
  console.log('  🇨🇳 中國：3 個工藝（景泰藍、蘇繡、青花瓷）')

  console.log('\n✨ 獨特性分布：')
  console.log('  🌟 Ultra Exclusive：3 個（西陣織、珐瑯、景泰藍、高麗青瓷）')
  console.log('  ⭐ Highly Exclusive：5 個（友禪染、漆器、備前燒、韓服、漆畫）')
  console.log('  ✨ Exclusive：10 個')

  console.log('\n🎯 非遺認證：')
  console.log('  • UNESCO非遺候選：西陣織')
  console.log('  • 國家級非遺：景泰藍、蘇繡、和紙')
  console.log('  • 重要無形文化財：友禪染、輪島塗、備前燒、和紙')
  console.log('  • 國家無形文化財：高麗青瓷、韓服')
  console.log('  • 人間國寶/國家級大師：和紙、珐瑯（泰王室）、漆畫、景泰藍、蘇繡')

  console.log('\n✅ 非遺工藝體驗資料匯入完成！')
  console.log('🏺 傳統手工藝深度體驗已就緒！')
}

seedHeritageCrafts()
