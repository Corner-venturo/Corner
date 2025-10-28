#!/usr/bin/env node
/**
 * 泰國 5 大城市景點擴充
 * 曼谷 6→10、普吉島 2→8、華欣 3→8、芭達雅 3→8、蘇美島 3→8
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const attractions = [
  // ========== 曼谷擴充 (6→10個) ==========
  {
    id: randomUUID(),
    city_id: 'bangkok',
    country_id: 'thailand',
    name: '《鄭王廟》- 黎明寺五彩塔',
    name_en: 'Wat Arun',
    category: '歷史文化',
    description: '《鄭王廟》又稱黎明寺，79公尺高佛塔鑲嵌彩色陶瓷與貝殼，陽光下閃閃發光。攀登陡峭階梯俯瞰昭披耶河美景，日落時金色夕陽映照佛塔最夢幻，10泰銖硬幣背面圖案。',
    tags: ['寺廟', '必遊', '夕陽', '地標'],
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'bangkok',
    country_id: 'thailand',
    name: '《考山路》- 背包客天堂',
    name_en: 'Khao San Road',
    category: '體驗活動',
    description: '《考山路》是全球背包客朝聖地，便宜旅館、酒吧、街頭小吃、按摩店、紀念品攤林立。炸蟲子、芒果糯米飯、泰式奶茶、夜晚音樂震耳欲聾，異國旅人交流聚集地。',
    tags: ['背包客', '夜生活', '美食', '國際'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 8,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'bangkok',
    country_id: 'thailand',
    name: '《暹羅商圈》- 曼谷購物天堂',
    name_en: 'Siam Square',
    category: '體驗活動',
    description: '《暹羅商圈》集結Siam Paragon、Central World、MBK等超級購物中心。泰國設計品牌、國際精品、海洋世界水族館、美食街，BTS暹羅站交通便利，曼谷最潮購物區。',
    tags: ['購物', '商場', '美食', '時尚'],
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 9,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'bangkok',
    country_id: 'thailand',
    name: '《昭披耶河遊船》- 夜遊母親河',
    name_en: 'Chao Phraya River Cruise',
    category: '體驗活動',
    description: '《昭披耶河》搭乘傳統柚木船或豪華遊輪，夜晚兩岸大皇宮、鄭王廟、高樓燈火璀璨。船上享用泰式自助晚餐、傳統舞蹈表演，微風徐徐浪漫滿分，曼谷必體驗行程。',
    tags: ['遊船', '夜景', '晚餐', '浪漫'],
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 10,
    is_active: true
  },

  // ========== 普吉島擴充 (2→8個) ==========
  {
    id: randomUUID(),
    city_id: 'phuket',
    country_id: 'thailand',
    name: '《皮皮島》- 天堂海灣',
    name_en: 'Phi Phi Islands',
    category: '自然景觀',
    description: '《皮皮島》瑪雅灣因《海灘》電影爆紅，碧綠海水、白沙灘、峭壁環繞如世外桃源。浮潛看熱帶魚、獨木舟探索洞穴、日落觀景點拍照，搭船一日遊必訪天堂。',
    tags: ['跳島', '浮潛', '必遊', '電影'],
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'],
    duration_minutes: 480,
    display_order: 3,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'phuket',
    country_id: 'thailand',
    name: '《查龍寺》- 普吉島最大寺廟',
    name_en: 'Wat Chalong',
    category: '歷史文化',
    description: '《查龍寺》是普吉島最重要寺廟，供奉兩位高僧雕像。金色佛塔內藏釋迦牟尼佛骨舍利，精緻壁畫、庭園寧靜，當地人祈福聖地，了解南泰佛教文化必訪。',
    tags: ['寺廟', '文化', '舍利', '莊嚴'],
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'phuket',
    country_id: 'thailand',
    name: '《卡塔海灘》- 衝浪者天堂',
    name_en: 'Kata Beach',
    category: '自然景觀',
    description: '《卡塔海灘》比芭東海灘安靜，細白沙灘、清澈海水適合游泳。雨季浪高是衝浪聖地、乾季平靜適合親子，周圍餐廳、按摩店價格合理，度假悠閒氛圍。',
    tags: ['海灘', '衝浪', '悠閒', '親子'],
    images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'phuket',
    country_id: 'thailand',
    name: '《普吉老街》- 中葡混血建築',
    name_en: 'Phuket Old Town',
    category: '歷史文化',
    description: '《普吉老街》色彩繽紛中葡混血建築、19世紀錫礦貿易繁榮遺跡。塔朗路週日步行街擺滿手工藝品攤、街頭藝人表演、咖啡廳、網美牆拍照打卡，感受普吉歷史風情。',
    tags: ['老街', '建築', '文化', '拍照'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'phuket',
    country_id: 'thailand',
    name: '《大佛》- 普吉島地標',
    name_en: 'Big Buddha',
    category: '歷史文化',
    description: '高45公尺的《大佛》矗立山頂，白色大理石雕像莊嚴肅穆。360度俯瞰普吉島、安達曼海、城市全景，日落時刻金光灑落海面最美，許願敲鐘祈福聖地。',
    tags: ['大佛', '俯瞰', '日落', '必訪'],
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'phuket',
    country_id: 'thailand',
    name: '《普吉幻多奇》- 泰國文化主題樂園',
    name_en: 'Phuket FantaSea',
    category: '體驗活動',
    description: '《普吉幻多奇》融合泰國文化、魔術、雜技、動物表演的大型秀。4000人自助晚餐品嚐泰式料理、宮殿村莊場景奢華、大象表演震撼，晚間娛樂首選必看。',
    tags: ['表演', '文化秀', '晚餐', '親子'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 8,
    is_active: true
  },

  // ========== 華欣擴充 (3→8個) ==========
  {
    id: randomUUID(),
    city_id: 'hua-hin',
    country_id: 'thailand',
    name: '《愛與希望之宮》- 全柚木建築',
    name_en: 'Maruekathaiyawan Palace',
    category: '歷史文化',
    description: '《愛與希望之宮》建於1923年，泰皇拉瑪六世避暑行宮。全柚木高腳屋連接長廊、通風設計、海風徐徐，優雅建築面向大海，公主般夢幻場景網美最愛。',
    tags: ['皇宮', '建築', '海景', '拍照'],
    images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hua-hin',
    country_id: 'thailand',
    name: '《聖托里尼公園》- 希臘風情小鎮',
    name_en: 'Santorini Park',
    category: '體驗活動',
    description: '《聖托里尼公園》仿造希臘聖島白色建築、藍頂教堂、風車、鐘塔，異國風情超好拍。摩天輪、旋轉木馬、購物村、餐廳齊全，不用飛希臘也能拍出愛琴海美照。',
    tags: ['主題公園', '拍照', '希臘風', '網美'],
    images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hua-hin',
    country_id: 'thailand',
    name: '《華欣夜市》- 海鮮美食天堂',
    name_en: 'Hua Hin Night Market',
    category: '體驗活動',
    description: '《華欣夜市》綿延數百公尺，碳烤海鮮、螃蟹、龍蝦、扇貝現點現烤價格實惠。泰式炒麵、芒果糯米飯、椰子冰淇淋、手工藝品攤位密集，當地人觀光客都愛逛。',
    tags: ['夜市', '海鮮', '美食', '購物'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hua-hin',
    country_id: 'thailand',
    name: '《華欣火車站》- 泰國最美車站',
    name_en: 'Hua Hin Railway Station',
    category: '歷史文化',
    description: '《華欣火車站》建於1926年，黃紅色泰式宮廷建築、木造候車亭、皇室候車室保存完整。復古氛圍、鐵軌拍照超浪漫，被譽為泰國最美火車站，古典優雅必訪打卡點。',
    tags: ['火車站', '復古', '拍照', '建築'],
    images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&q=85'],
    duration_minutes: 60,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hua-hin',
    country_id: 'thailand',
    name: '《華欣海灘》- 皇室度假勝地',
    name_en: 'Hua Hin Beach',
    category: '自然景觀',
    description: '《華欣海灘》長達5公里，細沙海灘、海水清澈、馬匹漫步海邊浪漫畫面。泰國皇室喜愛度假地、高爾夫球場林立、SPA按摩、海鮮餐廳，悠閒安靜度假氛圍。',
    tags: ['海灘', '皇室', '悠閒', '度假'],
    images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 8,
    is_active: true
  },

  // ========== 芭達雅擴充 (3→8個) ==========
  {
    id: randomUUID(),
    city_id: 'pattaya',
    country_id: 'thailand',
    name: '《真理寺》- 全木雕刻寺廟',
    name_en: 'Sanctuary of Truth',
    category: '歷史文化',
    description: '《真理寺》全由紅木雕刻而成，高達105公尺沒用一根釘子。融合泰、高棉、印度、中國建築風格，精緻雕刻描繪佛教哲學、人生真理，面向海邊氣勢磅礴震撼。',
    tags: ['寺廟', '木雕', '建築', '必遊'],
    images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'pattaya',
    country_id: 'thailand',
    name: '《四方水上市場》- 泰式水鄉體驗',
    name_en: 'Pattaya Floating Market',
    category: '體驗活動',
    description: '《四方水上市場》分東南西北四區代表泰國各地特色，搭小船穿梭運河品嚐小吃、購買手工藝品。泰式按摩、傳統服飾、文化表演，體驗泰國水鄉風情一站滿足。',
    tags: ['水上市場', '美食', '體驗', '文化'],
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'pattaya',
    country_id: 'thailand',
    name: '《老虎動物園》- 與猛獸親密接觸',
    name_en: 'Tiger Park Pattaya',
    category: '體驗活動',
    description: '《老虎動物園》可選擇與幼虎或成年虎互動拍照，專業管理員全程陪同確保安全。撫摸老虎、餵食、合照留念，感受大貓的力量與溫馴，刺激又難忘的體驗。',
    tags: ['動物', '老虎', '體驗', '拍照'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'pattaya',
    country_id: 'thailand',
    name: '《芭達雅觀景台》- 俯瞰海灣全景',
    name_en: 'Pattaya Viewpoint',
    category: '自然景觀',
    description: '《芭達雅觀景台》位於山頂，俯瞰月牙形海灣、城市高樓、海岸線延伸至遠方。日落時刻天空染成橘紅漸層、夜晚燈火璀璨，PATTAYA地標字母拍照打卡必訪。',
    tags: ['觀景台', '俯瞰', '日落', '必訪'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'pattaya',
    country_id: 'thailand',
    name: '《芭達雅步行街》- 夜生活天堂',
    name_en: 'Walking Street',
    category: '體驗活動',
    description: '《芭達雅步行街》夜晚封街變身不夜城，霓虹燈閃爍、酒吧、夜店、人妖秀、成人娛樂密集。音樂震耳欲聾、街頭調酒表演、海鮮燒烤，體驗芭達雅狂野夜生活。',
    tags: ['夜生活', '步行街', '酒吧', '娛樂'],
    images: ['https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 8,
    is_active: true
  },

  // ========== 蘇美島擴充 (3→8個) ==========
  {
    id: randomUUID(),
    city_id: 'koh-samui',
    country_id: 'thailand',
    name: '《大佛寺》- 金色大佛地標',
    name_en: 'Wat Phra Yai',
    category: '歷史文化',
    description: '《大佛寺》金色大佛高12公尺坐鎮小島，從遠處即可看見金光閃閃。雙龍階梯登頂、佛像莊嚴肅穆，俯瞰蘇美島海景，當地人祈福聖地遊客必訪地標。',
    tags: ['大佛', '寺廟', '地標', '海景'],
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'koh-samui',
    country_id: 'thailand',
    name: '《查汶海灘》- 蘇美島最熱鬧海灘',
    name_en: 'Chaweng Beach',
    category: '自然景觀',
    description: '《查汶海灘》長達7公里，細白沙灘、清澈海水、水上活動最豐富。飯店、酒吧、餐廳、商店密集，日光浴、浮潛、香蕉船、夜晚海灘派對，蘇美島最熱鬧區域。',
    tags: ['海灘', '水上活動', '熱鬧', '夜生活'],
    images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85'],
    duration_minutes: 300,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'koh-samui',
    country_id: 'thailand',
    name: '《祖父祖母石》- 奇特岩石景觀',
    name_en: 'Hin Ta Hin Yai',
    category: '自然景觀',
    description: '《祖父祖母石》大自然鬼斧神工雕刻出男女生殖器形狀岩石，當地傳說淒美愛情故事。海浪拍打岩石、周圍攤販販售紀念品，獨特地質景觀成為蘇美島熱門景點。',
    tags: ['奇石', '自然', '傳說', '獨特'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 60,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'koh-samui',
    country_id: 'thailand',
    name: '《安通國家海洋公園》- 跳島浮潛天堂',
    name_en: 'Ang Thong Marine Park',
    category: '自然景觀',
    description: '《安通國家海洋公園》42座石灰岩島嶼散落翡翠綠海面，獨木舟探索洞穴、登高俯瞰翡翠湖、浮潛看珊瑚礁熱帶魚，原始自然美景如人間仙境，一日遊必訪。',
    tags: ['跳島', '浮潛', '國家公園', '必遊'],
    images: ['https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=85'],
    duration_minutes: 480,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'koh-samui',
    country_id: 'thailand',
    name: '《漁人村步行街》- 週五夜市文化',
    name_en: 'Fishermans Village',
    category: '體驗活動',
    description: '《漁人村》保留百年漁村風情，中式木造建築、咖啡廳、精品店。週五夜市封街擺滿手工藝品、服飾、美食攤，街頭藝人表演、泰式按摩，體驗蘇美島悠閒文化。',
    tags: ['漁村', '夜市', '文化', '悠閒'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 8,
    is_active: true
  }
];

async function main() {
  console.log('🚀 開始擴充泰國 5 大城市景點...\n');
  console.log('目標：曼谷 +4、普吉島 +6、華欣 +5、芭達雅 +5、蘇美島 +5\n');

  let success = 0;
  let failed = 0;

  for (const attraction of attractions) {
    try {
      const { error } = await supabase
        .from('attractions')
        .insert(attraction);

      if (error) throw error;

      console.log(`✅ ${attraction.name} (${attraction.city_id})`);
      success++;
    } catch (error) {
      console.error(`❌ ${attraction.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 完成統計:`);
  console.log(`✅ 成功: ${success} 個`);
  console.log(`❌ 失敗: ${failed} 個`);
  console.log(`\n🎉 泰國景點擴充完成！`);
  console.log(`🇹🇭 預計新增: 25 個景點`);
  console.log(`📈 泰國總景點數將達: ~64 個`);
}

main().catch(console.error);
