#!/usr/bin/env node

/**
 * 批次新增東南亞城市景點（第一批）
 * 菲律賓、泰國、越南熱門城市
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ 需要 SUPABASE_SERVICE_KEY 環境變數');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const attractions = [
  // ========== 菲律賓：長灘島 (boracay) ==========
  {
    id: randomUUID(),
    city_id: 'boracay',
    country_id: 'philippines',
    name: '《白沙灘》- 世界最美海灘',
    name_en: 'White Beach',
    category: '自然景觀',
    description: '長達4公里的《白沙灘》擁有細緻如麵粉的白砂，清澈碧藍的海水在陽光下閃耀。分為三個區域，從悠閒度假村到熱鬧酒吧街，滿足各種旅遊風格。',
    tags: ['海灘', '必遊', '拍照', '水上活動'],
    images: [
      'https://images.unsplash.com/photo-1583260088774-642a6d7b4d76?w=1920&q=85',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85'
    ],
    duration_minutes: 240,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'boracay',
    country_id: 'philippines',
    name: '《風帆日落》- 經典長灘體驗',
    name_en: 'Sunset Sailing',
    category: '體驗活動',
    description: '乘坐傳統《Paraw風帆船》出海，在橘紅色夕陽下緩緩航行。360度無遮蔽海景配上海風輕拂，是長灘島最浪漫的活動，每年吸引數十萬遊客體驗。',
    tags: ['日落', '體驗', '浪漫', '拍照'],
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&q=85'
    ],
    duration_minutes: 90,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'boracay',
    country_id: 'philippines',
    name: '《普卡海灘》- 靜謐貝殼沙灘',
    name_en: 'Puka Shell Beach',
    category: '自然景觀',
    description: '位於島北端的《普卡海灘》以天然貝殼砂聞名，比白沙灘更清幽原始。海浪較大適合衝浪，遊客稀少能享受真正的海島寧靜，是當地人最愛的秘境。',
    tags: ['海灘', '清幽', '貝殼', '衝浪'],
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85'
    ],
    duration_minutes: 120,
    display_order: 3,
    is_active: true
  },

  // ========== 泰國：芭達雅 (pattaya) ==========
  {
    id: randomUUID(),
    city_id: 'pattaya',
    country_id: 'thailand',
    name: '《真理寺》- 全木雕刻奇蹟',
    name_en: 'Sanctuary of Truth',
    category: '歷史文化',
    description: '高達105公尺的《真理寺》完全以柚木手工雕刻建造，融合泰國、高棉、中國、印度建築風格。每一寸牆面都是精緻神話故事，展現人類對真理的追求。',
    tags: ['建築', '藝術', '必遊', '拍照'],
    images: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'
    ],
    duration_minutes: 120,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'pattaya',
    country_id: 'thailand',
    name: '《珊瑚島》- 水上活動天堂',
    name_en: 'Koh Larn',
    category: '體驗活動',
    description: '距離芭達雅僅7公里的《珊瑚島》擁有6個美麗沙灘，提供海底漫步、拖曳傘、水上摩托車等20多種水上活動。清澈見底的海水能見度達10公尺以上。',
    tags: ['海島', '水上活動', '浮潛', '刺激'],
    images: [
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1920&q=85'
    ],
    duration_minutes: 300,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'pattaya',
    country_id: 'thailand',
    name: '《四方水上市場》- 泰式水鄉風情',
    name_en: 'Pattaya Floating Market',
    category: '歷史文化',
    description: '占地10萬平方公尺的《四方水上市場》重現傳統泰式水鄉生活，分為四個區域代表泰國四大流域。超過100家商店販售美食、手工藝品，還能搭船遊運河。',
    tags: ['文化', '美食', '購物', '傳統'],
    images: [
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'
    ],
    duration_minutes: 150,
    display_order: 3,
    is_active: true
  },

  // ========== 泰國：華欣 (hua-hin) ==========
  {
    id: randomUUID(),
    city_id: 'hua-hin',
    country_id: 'thailand',
    name: '《愛與希望之宮》- 海上金色宮殿',
    name_en: 'Maruekhathaiyawan Palace',
    category: '歷史文化',
    description: '建於1923年的《愛與希望之宮》是拉瑪六世的夏日行館，完全以金色柚木建造於海灘上。16棟建築以長廊連接，海風穿堂而過，設計巧妙融合泰西風格。',
    tags: ['皇室', '建築', '歷史', '海景'],
    images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'
    ],
    duration_minutes: 90,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hua-hin',
    country_id: 'thailand',
    name: '《華欣火車站》- 最美皇室車站',
    name_en: 'Hua Hin Railway Station',
    category: '歷史文化',
    description: '建於1926年的《華欣火車站》被譽為泰國最美車站，紅白相間的泰式皇家候車亭精緻典雅。至今仍在使用，是皇室前往海邊度假的重要門戶。',
    tags: ['建築', '拍照', '歷史', '地標'],
    images: [
      'https://images.unsplash.com/photo-1583341612074-ccea5cd64f6a?w=1920&q=85'
    ],
    duration_minutes: 45,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hua-hin',
    country_id: 'thailand',
    name: '《聖托里尼樂園》- 希臘風情小鎮',
    name_en: 'Santorini Park',
    category: '體驗活動',
    description: '《聖托里尼樂園》完整重現希臘白色小鎮風貌，藍白建築、風車、鐘樓排列海邊。除了拍照打卡，還有摩天輪、旋轉木馬等遊樂設施，是親子旅遊好去處。',
    tags: ['主題樂園', '拍照', '親子', '歐風'],
    images: [
      'https://images.unsplash.com/photo-1613395877214-9ae1d0d9c4e6?w=1920&q=85'
    ],
    duration_minutes: 180,
    display_order: 3,
    is_active: true
  },

  // ========== 泰國：喀比 (krabi) ==========
  {
    id: randomUUID(),
    city_id: 'krabi',
    country_id: 'thailand',
    name: '《四島跳島遊》- 安達曼海秘境',
    name_en: 'Four Islands Tour',
    category: '體驗活動',
    description: '《四島跳島遊》串聯塔島、莫島、波達島、雞島等絕美海島。石灰岩峭壁從海中拔起，祖母綠海水清澈見底，浮潛可見熱帶魚群，是喀比必玩行程。',
    tags: ['跳島', '浮潛', '必遊', '海島'],
    images: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85',
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1920&q=85'
    ],
    duration_minutes: 420,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'krabi',
    country_id: 'thailand',
    name: '《翡翠池》- 雨林中的天然溫泉',
    name_en: 'Emerald Pool',
    category: '自然景觀',
    description: '《翡翠池》位於熱帶雨林深處，天然地下溫泉湧出形成碧綠色水池。水溫常年保持30-50度，富含礦物質。周圍原始森林生態豐富，能聽見鳥鳴蟲叫。',
    tags: ['溫泉', '自然', '放鬆', '雨林'],
    images: [
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'
    ],
    duration_minutes: 120,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'krabi',
    country_id: 'thailand',
    name: '《虎窟寺》- 1237階修行聖地',
    name_en: 'Tiger Cave Temple',
    category: '歷史文化',
    description: '《虎窟寺》因洞穴曾有老虎居住而得名。攀登1237級階梯可達山頂佛塔，俯瞰360度喀比全景。沿途有僧侶修行洞窟，山頂風光壯闊令人震撼。',
    tags: ['寺廟', '登山', '挑戰', '景觀'],
    images: [
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'
    ],
    duration_minutes: 150,
    display_order: 3,
    is_active: true
  },

  // ========== 泰國：蘇美島 (koh-samui) ==========
  {
    id: randomUUID(),
    city_id: 'koh-samui',
    country_id: 'thailand',
    name: '《大佛寺》- 12公尺金色地標',
    name_en: 'Big Buddha Temple',
    category: '歷史文化',
    description: '高達12公尺的《大佛》金光閃閃矗立海邊，從飛機上就能看見。建於1972年，是蘇美島最重要地標。登上台階可俯瞰周圍海景，日落時分特別壯麗。',
    tags: ['寺廟', '地標', '海景', '拍照'],
    images: [
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'
    ],
    duration_minutes: 60,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'koh-samui',
    country_id: 'thailand',
    name: '《查汶海灘》- 7公里白沙天堂',
    name_en: 'Chaweng Beach',
    category: '自然景觀',
    description: '《查汶海灘》是蘇美島最熱鬧海灘，綿延7公里的白沙灘配上清澈海水。沿岸密集分布度假村、餐廳、酒吧，白天水上活動、夜晚派對，24小時精彩不間斷。',
    tags: ['海灘', '熱鬧', '水上活動', '夜生活'],
    images: [
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1920&q=85'
    ],
    duration_minutes: 240,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'koh-samui',
    country_id: 'thailand',
    name: '《娜夢瀑布》- 雨林秘境瀑布',
    name_en: 'Na Muang Waterfall',
    category: '自然景觀',
    description: '《娜夢瀑布》分為一號、二號兩層，一號瀑布高18公尺水量豐沛可游泳，二號瀑布高80公尺需健行30分鐘。紫色岩石在陽光下閃耀，周圍雨林生態原始豐富。',
    tags: ['瀑布', '自然', '健行', '游泳'],
    images: [
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'
    ],
    duration_minutes: 120,
    display_order: 3,
    is_active: true
  },

  // ========== 泰國：清萊 (chiang-rai) ==========
  {
    id: randomUUID(),
    city_id: 'chiang-rai',
    country_id: 'thailand',
    name: '《白廟》- 純白藝術殿堂',
    name_en: 'Wat Rong Khun',
    category: '歷史文化',
    description: '《白廟》由泰國藝術家打造的現代佛教藝術傑作，全白建築鑲嵌玻璃在陽光下璀璨奪目。融合傳統佛教與流行文化元素，連地獄場景都充滿創意，是清萊必訪地標。',
    tags: ['寺廟', '藝術', '必遊', '拍照'],
    images: [
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'
    ],
    duration_minutes: 90,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-rai',
    country_id: 'thailand',
    name: '《藍廟》- 湛藍寶石聖殿',
    name_en: 'Wat Rong Suea Ten',
    category: '歷史文化',
    description: '《藍廟》以深邃寶藍色為主色調，金色裝飾點綴其間。2016年才完工的現代寺廟，內部壁畫描繪佛陀生平，色彩鮮豔細膩。與白廟相映成趣，展現不同風格美感。',
    tags: ['寺廟', '藝術', '拍照', '現代'],
    images: [
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'
    ],
    duration_minutes: 60,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-rai',
    country_id: 'thailand',
    name: '《金三角》- 三國交界歷史區',
    name_en: 'Golden Triangle',
    category: '歷史文化',
    description: '《金三角》是泰國、緬甸、寮國三國交界處，湄公河與魯河在此交匯。曾是全球最大鴉片產地，如今設有鴉片博物館展示歷史。登上觀景台可同時眺望三國風光。',
    tags: ['歷史', '景觀', '邊境', '文化'],
    images: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'
    ],
    duration_minutes: 120,
    display_order: 3,
    is_active: true
  },

  // ========== 越南：峴港 (da-nang) ==========
  {
    id: randomUUID(),
    city_id: 'da-nang',
    country_id: 'vietnam',
    name: '《巴拿山》- 雲端上的法國小鎮',
    name_en: 'Ba Na Hills',
    category: '體驗活動',
    description: '《巴拿山》海拔1487公尺，搭乘全球最長纜車（5801公尺）直達山頂法國村。四季花園、復古城堡、哥德式大教堂重現19世紀法國風情，還有世界知名的《黃金橋》。',
    tags: ['纜車', '必遊', '拍照', '歐風'],
    images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85'
    ],
    duration_minutes: 360,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'da-nang',
    country_id: 'vietnam',
    name: '《黃金橋》- 巨手托起的天空步道',
    name_en: 'Golden Bridge',
    category: '自然景觀',
    description: '《黃金橋》由兩隻巨大石手托起，橋身金黃色在山間雲霧中若隱若現。長150公尺的步道海拔1414公尺，360度俯瞰峴港海岸與山脈，2018年開放即成為全球打卡聖地。',
    tags: ['拍照', '必遊', '景觀', '網美'],
    images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'
    ],
    duration_minutes: 60,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'da-nang',
    country_id: 'vietnam',
    name: '《美溪沙灘》- 全球最美海灘之一',
    name_en: 'My Khe Beach',
    category: '自然景觀',
    description: '《美溪沙灘》被《富比士》評為全球六大最美海灘，綿延30公里的白沙細軟如絲。清澈海水適合游泳，周圍椰林搖曳，越戰時期曾是美軍度假勝地，如今遊客眾多但不擁擠。',
    tags: ['海灘', '必遊', '游泳', '放鬆'],
    images: [
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1920&q=85'
    ],
    duration_minutes: 180,
    display_order: 3,
    is_active: true
  },

  // ========== 越南：會安 (hoi-an) ==========
  {
    id: randomUUID(),
    city_id: 'hoi-an',
    country_id: 'vietnam',
    name: '《會安古鎮》- 燈籠之城',
    name_en: 'Hoi An Ancient Town',
    category: '歷史文化',
    description: '《會安古鎮》是15-19世紀東南亞貿易港，保存完整的中式建築、日本橋、法式別墅。每晚數千盞燈籠點亮古街，倒映在秋盆河上如夢似幻，1999年列入世界遺產。',
    tags: ['古鎮', 'UNESCO', '燈籠', '必遊'],
    images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'
    ],
    duration_minutes: 240,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hoi-an',
    country_id: 'vietnam',
    name: '《日本橋》- 400年歷史地標',
    name_en: 'Japanese Covered Bridge',
    category: '歷史文化',
    description: '建於1593年的《日本橋》是會安最具代表性建築，連接日本人街與中國人街。橋身精緻雕刻融合日中越三國風格，橋上供奉北帝玄天上帝，是越南20000盾紙鈔圖案。',
    tags: ['歷史', '地標', '建築', '拍照'],
    images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'
    ],
    duration_minutes: 30,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hoi-an',
    country_id: 'vietnam',
    name: '《安邦海灘》- 寧靜海岸度假區',
    name_en: 'An Bang Beach',
    category: '自然景觀',
    description: '距離古鎮5公里的《安邦海灘》保留原始漁村風貌，細白沙灘人潮稀少。沿岸有特色海鮮餐廳、躺椅出租，遠離喧囂享受悠閒時光，是當地人最愛的海灘。',
    tags: ['海灘', '清幽', '海鮮', '放鬆'],
    images: [
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1920&q=85'
    ],
    duration_minutes: 180,
    display_order: 3,
    is_active: true
  },

  // ========== 越南：芽莊 (nha-trang) ==========
  {
    id: randomUUID(),
    city_id: 'nha-trang',
    country_id: 'vietnam',
    name: '《珍珠島樂園》- 越南迪士尼',
    name_en: 'Vinpearl Land',
    category: '體驗活動',
    description: '《珍珠島樂園》占地20萬平方公尺，搭乘跨海纜車（全長3320公尺）抵達。結合遊樂園、水上樂園、水族館、動物園，還有5星級度假村，是越南最大主題樂園。',
    tags: ['主題樂園', '纜車', '親子', '刺激'],
    images: [
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'
    ],
    duration_minutes: 480,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'nha-trang',
    country_id: 'vietnam',
    name: '《婆那加占婆塔》- 千年印度教遺跡',
    name_en: 'Po Nagar Cham Towers',
    category: '歷史文化',
    description: '建於8世紀的《婆那加占婆塔》是占婆王國遺址，供奉印度教天依女神。四座塔樓矗立山丘上，紅磚建築雕刻精美。登頂可俯瞰芽莊海灣，是了解占婆文化的重要據點。',
    tags: ['歷史', '古蹟', '宗教', '景觀'],
    images: [
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'
    ],
    duration_minutes: 90,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'nha-trang',
    country_id: 'vietnam',
    name: '《芽莊海灘》- 6公里椰林海岸',
    name_en: 'Nha Trang Beach',
    category: '自然景觀',
    description: '《芽莊海灘》綿延6公里，細白沙灘配上碧藍海水，被《國家地理》評為一生必訪海灘。周圍椰樹成林，水溫常年25-28度適合游泳，早晨能看見當地人晨泳做操。',
    tags: ['海灘', '必遊', '游泳', '椰林'],
    images: [
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1920&q=85'
    ],
    duration_minutes: 240,
    display_order: 3,
    is_active: true
  },

  // ========== 越南：下龍灣 (ha-long) ==========
  {
    id: randomUUID(),
    city_id: 'ha-long',
    country_id: 'vietnam',
    name: '《下龍灣遊船》- 海上桂林奇景',
    name_en: 'Ha Long Bay Cruise',
    category: '自然景觀',
    description: '《下龍灣》擁有1969座石灰岩島嶼，搭乘傳統木船穿梭其間，感受「海上桂林」仙境。UNESCO世界遺產，晨霧繚繞時島嶼若隱若現，是越南最具代表性的自然景觀。',
    tags: ['UNESCO', '必遊', '遊船', '仙境'],
    images: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=85',
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'
    ],
    duration_minutes: 480,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'ha-long',
    country_id: 'vietnam',
    name: '《天堂島》- 攀巖觀景秘境',
    name_en: 'Ti Top Island',
    category: '自然景觀',
    description: '《天堂島》因蘇聯太空人Gherman Titov造訪而得名。攀登450級階梯登頂，360度俯瞰下龍灣全景，無數島嶼點綴碧海如同翡翠灑落。島上還有美麗月牙形沙灘可戲水。',
    tags: ['登山', '景觀', '海灘', '拍照'],
    images: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=85'
    ],
    duration_minutes: 120,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'ha-long',
    country_id: 'vietnam',
    name: '《驚訝洞》- 萬年鐘乳石宮殿',
    name_en: 'Sung Sot Cave',
    category: '自然景觀',
    description: '《驚訝洞》是下龍灣最大洞穴，分為三層總面積達12000平方公尺。百萬年形成的鐘乳石千姿百態，燈光投射下如夢似幻。第二層有巨大空間可容納數千人，氣勢磅礴。',
    tags: ['洞穴', '鐘乳石', '奇觀', '地質'],
    images: [
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'
    ],
    duration_minutes: 90,
    display_order: 3,
    is_active: true
  },

  // ========== 越南：富國島 (phu-quoc) ==========
  {
    id: randomUUID(),
    city_id: 'phu-quoc',
    country_id: 'vietnam',
    name: '《長灘》- 越南最美日落海灘',
    name_en: 'Long Beach',
    category: '自然景觀',
    description: '《長灘》綿延20公里是富國島最長海灘，細軟白沙配上清澈海水。每天傍晚上演絕美日落秀，橘紅色天空映照海面，漁船歸港剪影浪漫迷人，沿岸餐廳眾多。',
    tags: ['海灘', '日落', '必遊', '浪漫'],
    images: [
      'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1920&q=85',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&q=85'
    ],
    duration_minutes: 180,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'phu-quoc',
    country_id: 'vietnam',
    name: '《富國跨海纜車》- 全球最長海上纜車',
    name_en: 'Hon Thom Cable Car',
    category: '體驗活動',
    description: '《富國跨海纜車》全長7899.9公尺創金氏世界紀錄，從本島飛越碧海抵達香島。纜車艙透明底板，腳下是湛藍大海與珊瑚礁，15分鐘空中旅程美景震撼。',
    tags: ['纜車', '必遊', '世界紀錄', '景觀'],
    images: [
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'
    ],
    duration_minutes: 240,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'phu-quoc',
    country_id: 'vietnam',
    name: '《富國夜市》- 海鮮美食天堂',
    name_en: 'Phu Quoc Night Market',
    category: '體驗活動',
    description: '《富國夜市》是島上最熱鬧市集，超過100個攤位販售新鮮海鮮、燒烤、越南小吃。現點現烤的龍蝦、螃蟹、扇貝價格實惠，還能買到珍珠、魚露等當地特產。',
    tags: ['夜市', '海鮮', '美食', '購物'],
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'
    ],
    duration_minutes: 120,
    display_order: 3,
    is_active: true
  },

  // ========== 越南：順化 (hue) ==========
  {
    id: randomUUID(),
    city_id: 'hue',
    country_id: 'vietnam',
    name: '《順化皇城》- 越南紫禁城',
    name_en: 'Imperial City of Hue',
    category: '歷史文化',
    description: '《順化皇城》是阮朝(1802-1945)皇宮，仿照北京紫禁城建造。城牆周長10公里，內有宮殿、花園、湖泊。雖部分毀於越戰，仍保留大量建築，1993年列入世界遺產。',
    tags: ['UNESCO', '皇宮', '歷史', '必遊'],
    images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'
    ],
    duration_minutes: 180,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hue',
    country_id: 'vietnam',
    name: '《天姥寺》- 香江畔七層寶塔',
    name_en: 'Thien Mu Pagoda',
    category: '歷史文化',
    description: '建於1601年的《天姥寺》是順化最古老寺廟，標誌性的七層八角塔高21公尺。位於香江河畔，寺內古鐘重2052公斤，還保存1963年僧侶自焚抗議的汽車。',
    tags: ['寺廟', '歷史', '河景', '古蹟'],
    images: [
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'
    ],
    duration_minutes: 90,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hue',
    country_id: 'vietnam',
    name: '《香江遊船》- 詩意皇城水道',
    name_en: 'Perfume River Cruise',
    category: '體驗活動',
    description: '《香江》因上游花卉飄香而得名，搭乘龍船遊覽兩岸風光。途經天姥寺、皇陵、古橋，傍晚時分夕陽映照江面，遠處皇城輪廓朦朧如畫，體驗古都浪漫風情。',
    tags: ['遊船', '河景', '浪漫', '文化'],
    images: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'
    ],
    duration_minutes: 120,
    display_order: 3,
    is_active: true
  }
];

async function main() {
  console.log('🚀 開始新增東南亞城市景點（第一批）...\n');

  let success = 0;
  let failed = 0;

  for (const attraction of attractions) {
    try {
      const { error } = await supabase
        .from('attractions')
        .insert(attraction);

      if (error) throw error;

      console.log(`✅ ${attraction.name}`);
      success++;
    } catch (error) {
      console.error(`❌ ${attraction.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 完成統計:`);
  console.log(`✅ 成功: ${success} 個`);
  console.log(`❌ 失敗: ${failed} 個`);
  console.log(`\n🎉 東南亞景點資料新增完成！`);
}

main().catch(console.error);
