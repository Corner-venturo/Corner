#!/usr/bin/env node
/**
 * 日本剩餘城市景點 - 批次2
 * 東北、北陸、中部地區
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const attractions = [
  // ========== 東北地區 ==========
  // 仙台 (sendai)
  {
    id: randomUUID(),
    city_id: 'sendai',
    country_id: 'japan',
    name: '《松島灣遊船》- 日本三景之首',
    name_en: 'Matsushima Bay Cruise',
    category: '自然景觀',
    description: '與天橋立、宮島並稱日本三景的《松島灣》擁有260多座島嶼，搭乘遊覽船穿梭奇岩怪石間。五大堂、瑞巖寺等古蹟點綴，日出日落時刻海面波光粼粼，松樹剪影如畫。',
    tags: ['三景', '遊船', '必遊', '海景'],
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'sendai',
    country_id: 'japan',
    name: '《仙台城跡》- 伊達政宗居城',
    name_en: 'Sendai Castle Ruins',
    category: '歷史文化',
    description: '伊達政宗建造的《仙台城》雖僅存石垣遺跡，但青葉山上伊達政宗騎馬像威風凜凜，俯瞰仙台市區全景。青葉城資料館展示仙台藩歷史，秋季銀杏大道金黃璀璨。',
    tags: ['城跡', '歷史', '景觀', '伊達'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 2,
    is_active: true
  },

  // 青森 (aomori)
  {
    id: randomUUID(),
    city_id: 'aomori',
    country_id: 'japan',
    name: '《弘前城》- 日本最美櫻花城',
    name_en: 'Hirosaki Castle',
    category: '歷史文化',
    description: '《弘前城》是東北唯一現存天守，2600株櫻花樹讓春季弘前公園成為日本最美賞櫻勝地。櫻花隧道、花筏倒映護城河，夜櫻點燈夢幻迷人，秋季紅葉、冬季雪燈籠祭各具魅力。',
    tags: ['城堡', '櫻花', '必遊', '四季'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'aomori',
    country_id: 'japan',
    name: '《奧入瀨溪流》- 日本第一溪',
    name_en: 'Oirase Stream',
    category: '自然景觀',
    description: '《奧入瀨溪流》從十和田湖流出14公里，沿途14座瀑布、激流、深潭，步道穿越原始森林負離子滿滿。秋季紅葉與碧水交織如油畫，被譽為「日本第一溪流」，是攝影天堂。',
    tags: ['溪流', '瀑布', '楓葉', '健行'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 2,
    is_active: true
  },

  // 秋田 (akita)
  {
    id: randomUUID(),
    city_id: 'akita',
    country_id: 'japan',
    name: '《角館武家屋敷》- 陸奧小京都',
    name_en: 'Kakunodate Samurai District',
    category: '歷史文化',
    description: '保存完整武士住宅的《角館》被譽為「陸奧小京都」，黑色板牆、武家宅邸排列，春季枝垂櫻花隧道夢幻無比。青柳家、石黑家等開放參觀，展現江戶時代武士生活文化。',
    tags: ['武家', '古街', '櫻花', '歷史'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'akita',
    country_id: 'japan',
    name: '《田澤湖》- 日本最深之湖',
    name_en: 'Lake Tazawa',
    category: '自然景觀',
    description: '深達423.4公尺的《田澤湖》是日本最深湖泊，寶藍色湖水清澈見底終年不結冰。湖畔金色辰子像訴說傳說，騎單車環湖、划獨木舟、泡溫泉，四季景色變化豐富。',
    tags: ['湖泊', '最深', '騎車', '傳說'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 2,
    is_active: true
  },

  // 盛岡 (morioka)
  {
    id: randomUUID(),
    city_id: 'morioka',
    country_id: 'japan',
    name: '《盛岡城跡公園》- 石垣名城',
    name_en: 'Morioka Castle Site Park',
    category: '歷史文化',
    description: '《盛岡城》石垣保存完整，野面堆砌技法精湛，春櫻秋楓點綴園區。周圍盛岡三大麵（冷麵、炸醬麵、碗子蕎麥麵）餐廳林立，紺屋町番屋、櫻山神社展現城下町風情。',
    tags: ['城跡', '石垣', '櫻花', '美食'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'morioka',
    country_id: 'japan',
    name: '《小岩井農場》- 百年牧場風光',
    name_en: 'Koiwai Farm',
    category: '體驗活動',
    description: '創業1891年的《小岩井農場》占地3000公頃，岩手山為背景的牧場風光如畫。擠牛奶、餵羊、品嚐新鮮霜淇淋、騎馬，春季櫻花、夏季綠地、秋季楓葉、冬季雪景四季宜人。',
    tags: ['農場', '牧場', '親子', '四季'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 2,
    is_active: true
  },

  // ========== 中部地區 ==========
  // 富山 (toyama)
  {
    id: randomUUID(),
    city_id: 'toyama',
    country_id: 'japan',
    name: '《立山黑部雪之大谷》- 20公尺雪牆',
    name_en: 'Tateyama Kurobe Snow Wall',
    category: '自然景觀',
    description: '《立山黑部》每年4-6月開山，積雪最深處達20公尺的《雪之大谷》雪壁兩側聳立，遊客行走其間如穿越雪之峽谷。搭乘6種交通工具登上海拔2450公尺，欣賞北阿爾卑斯山壯麗景觀。',
    tags: ['雪壁', '必遊', '奇觀', '登山'],
    images: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=85'],
    duration_minutes: 480,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'toyama',
    country_id: 'japan',
    name: '《黑部水壩》- 日本第一高壩',
    name_en: 'Kurobe Dam',
    category: '體驗活動',
    description: '高186公尺的《黑部水壩》是日本最高水壩，建造耗時7年犧牲171人生命。6-10月觀光放水每秒10噸水量氣勢磅礴，彩虹橫跨其間，展望台俯瞰立山連峰倒映翡翠色湖面。',
    tags: ['水壩', '壯觀', '彩虹', '工程'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 2,
    is_active: true
  },

  // 高山 (takayama)
  {
    id: randomUUID(),
    city_id: 'takayama',
    country_id: 'japan',
    name: '《高山古街》- 飛驒小京都',
    name_en: 'Sanmachi Suji',
    category: '歷史文化',
    description: '《高山古街》保存江戶時代商家建築，格子窗、暖簾、酒林吊掛，飛驒牛、五平餅、溫泉饅頭香氣四溢。朝市販售新鮮蔬果、工藝品，陣屋、高山祭屋台會館展現飛驒文化。',
    tags: ['古街', '美食', '傳統', '必遊'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'takayama',
    country_id: 'japan',
    name: '《白川鄉合掌村》- 世界遺產童話村',
    name_en: 'Shirakawa-go',
    category: '歷史文化',
    description: 'UNESCO世界遺產《白川鄉》保存114棟合掌造茅草屋，如童話世界般靜謐。登展望台俯瞰村落全景，冬季點燈時白雪覆蓋、暖黃燈光透出，如夢似幻吸引全球攝影師朝聖。',
    tags: ['UNESCO', '合掌造', '必遊', '雪景'],
    images: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 2,
    is_active: true
  },

  // 松本 (matsumoto)
  {
    id: randomUUID(),
    city_id: 'matsumoto',
    country_id: 'japan',
    name: '《松本城》- 黑色國寶天守',
    name_en: 'Matsumoto Castle',
    category: '歷史文化',
    description: '日本五大國寶天守之一的《松本城》以黑色外觀聞名，又稱「烏城」。建於1594年，五重六階天守與紅色埋橋倒映護城河，北阿爾卑斯山為背景，春櫻秋楓如詩如畫。',
    tags: ['城堡', '國寶', '必遊', '櫻花'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'matsumoto',
    country_id: 'japan',
    name: '《上高地》- 神降臨之地',
    name_en: 'Kamikochi',
    category: '自然景觀',
    description: '海拔1500公尺的《上高地》被譽為「神降臨之地」，梓川清流、穗高連峰倒映水面，河童橋是經典拍照點。步道平緩適合健行，大正池、明神池各展風情，秋季紅葉金黃璀璨。',
    tags: ['登山', '健行', '景觀', '河川'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 300,
    display_order: 2,
    is_active: true
  },

  // 日光 (nikko)
  {
    id: randomUUID(),
    city_id: 'nikko',
    country_id: 'japan',
    name: '《東照宮》- 德川家康長眠地',
    name_en: 'Toshogu Shrine',
    category: '歷史文化',
    description: 'UNESCO世界遺產《東照宮》是德川家康陵寢，陽明門、三猿、眠貓等雕刻精美絕倫，5000多件裝飾貼金箔璀璨奢華。「不看日光不稱美」，展現江戶初期建築藝術巔峰。',
    tags: ['UNESCO', '神社', '必遊', '建築'],
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'nikko',
    country_id: 'japan',
    name: '《華嚴瀑布》- 日本三大名瀑',
    name_en: 'Kegon Falls',
    category: '自然景觀',
    description: '高97公尺的《華嚴瀑布》是日本三大名瀑之一，中禪寺湖水從斷崖傾瀉而下氣勢磅礴。搭電梯至觀瀑台近距離感受水霧飛濺，秋季紅葉環繞、冬季冰瀑奇景，四季各具魅力。',
    tags: ['瀑布', '三大名瀑', '必遊', '楓葉'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 2,
    is_active: true
  },

  // 川越 (kawagoe)
  {
    id: randomUUID(),
    city_id: 'kawagoe',
    country_id: 'japan',
    name: '《藏造老街》- 小江戶風情',
    name_en: 'Kurazukuri Street',
    category: '歷史文化',
    description: '《川越藏造老街》保存江戶時期土藏建築，黑漆喰牆、鬼瓦屋頂，被譽為「小江戶」。時之鐘每日四次敲響，冰川神社求戀愛御守，菓子屋橫丁懷舊糖果、烤地瓜香氣撲鼻。',
    tags: ['古街', '江戶', '美食', '拍照'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'kawagoe',
    country_id: 'japan',
    name: '《冰川神社》- 結緣聖地',
    name_en: 'Hikawa Shrine',
    category: '歷史文化',
    description: '創建1500年的《冰川神社》以結緣、夫婦圓滿聞名。夏季「結緣風鈴祭」2000個江戶風鈴隨風搖曳，倒映水面如夢似幻。一年安鯛御守、釣籤等特色祈願吸引無數戀人參拜。',
    tags: ['神社', '結緣', '風鈴', '浪漫'],
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'],
    duration_minutes: 60,
    display_order: 2,
    is_active: true
  },

  // 輕井澤 (karuizawa)
  {
    id: randomUUID(),
    city_id: 'karuizawa',
    country_id: 'japan',
    name: '《舊輕井澤銀座》- 避暑勝地商店街',
    name_en: 'Kyu-Karuizawa Ginza',
    category: '體驗活動',
    description: '《舊輕井澤銀座》是明治時期外國人避暑地，洋風咖啡廳、雜貨店、果醬店沿街而立。沢屋果醬、法式麵包、輕井澤啤酒必買，周圍別墅區森林浴步道清新宜人，夏季氣溫涼爽。',
    tags: ['購物', '美食', '避暑', '洋風'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'karuizawa',
    country_id: 'japan',
    name: '《白絲瀑布》- 清涼水簾洞',
    name_en: 'Shiraito Falls',
    category: '自然景觀',
    description: '高3公尺、寬70公尺的《白絲瀑布》，數百條細流如白絲般垂掛，陽光穿透水霧形成彩虹。夏季避暑聖地涼爽宜人，冬季凍結成冰瀑布，周圍森林負離子滿滿療癒身心。',
    tags: ['瀑布', '避暑', '清涼', '彩虹'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 60,
    display_order: 2,
    is_active: true
  },

  // 伊勢 (ise)
  {
    id: randomUUID(),
    city_id: 'ise',
    country_id: 'japan',
    name: '《伊勢神宮》- 日本神社之首',
    name_en: 'Ise Jingu',
    category: '歷史文化',
    description: '供奉天照大神的《伊勢神宮》是日本神社最高聖地，每20年式年遷宮保持建築永恆。內宮、外宮莊嚴肅穆，五十鈴川清流、千年神木環繞，日本人一生必參拜一次的心靈聖地。',
    tags: ['神社', '必遊', '聖地', '歷史'],
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'ise',
    country_id: 'japan',
    name: '《托福橫丁》- 江戶風情美食街',
    name_en: 'Okage Yokocho',
    category: '體驗活動',
    description: '《托福橫丁》重現江戶時代伊勢參拜道，石板路兩旁伊勢烏龍麵、赤福餅、松阪牛串燒香氣撲鼻。招財貓神社、傳統工藝品店、茶屋林立，穿和服漫步充滿懷舊氛圍。',
    tags: ['美食', '古街', '傳統', '和服'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 2,
    is_active: true
  }
];

async function main() {
  console.log('🚀 開始新增日本剩餘城市景點（批次2）...\n');

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
  console.log(`\n🎉 日本景點資料新增完成（批次2）！`);
}

main().catch(console.error);
