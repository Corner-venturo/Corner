#!/usr/bin/env node
/**
 * 日本全國景點大批次新增
 * 涵蓋70個城市，每個城市2-3個精選景點
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
  // ========== 北海道地區 ==========
  // 札幌 (sapporo)
  {
    id: randomUUID(),
    city_id: 'sapporo',
    country_id: 'japan',
    name: '《時計台》- 札幌地標',
    name_en: 'Sapporo Clock Tower',
    category: '歷史文化',
    description: '建於1878年的《時計台》是札幌最具代表性建築，白色木造西式鐘樓至今仍準點報時。作為北海道開拓時代的象徵，內部展示札幌發展歷史，是市中心必訪景點。',
    tags: ['歷史', '地標', '建築', '必遊'],
    images: ['https://images.unsplash.com/photo-1548090974-d0c34a0d6e58?w=1920&q=85'],
    duration_minutes: 45,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'sapporo',
    country_id: 'japan',
    name: '《大通公園》- 四季慶典舞台',
    name_en: 'Odori Park',
    category: '自然景觀',
    description: '東西延伸1.5公里的《大通公園》是札幌市中心綠帶，春季紫丁香盛開，夏季啤酒節熱鬧，冬季雪祭展出巨型冰雕。周圍高樓環繞，是市民最愛的休憩空間。',
    tags: ['公園', '慶典', '四季', '都市綠地'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'sapporo',
    country_id: 'japan',
    name: '《藻岩山纜車》- 360度夜景',
    name_en: 'Mt. Moiwa Ropeway',
    category: '自然景觀',
    description: '搭乘纜車登上海拔531公尺的《藻岩山》，山頂展望台360度俯瞰札幌市區。被選為「日本新三大夜景」，燈火璀璨的城市與遠方山脈形成絕美畫面。',
    tags: ['夜景', '纜車', '必遊', '浪漫'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 3,
    is_active: true
  },

  // 函館 (hakodate)
  {
    id: randomUUID(),
    city_id: 'hakodate',
    country_id: 'japan',
    name: '《函館山夜景》- 百萬夜景',
    name_en: 'Mt. Hakodate Night View',
    category: '自然景觀',
    description: '與香港、那不勒斯並稱「世界三大夜景」的《函館山夜景》，獨特的雙弧形海灣燈火輝煌。搭乘纜車3分鐘登頂，兩側海洋包夾的城市景觀舉世無雙，傍晚時分最美。',
    tags: ['夜景', '必遊', '纜車', '世界級'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hakodate',
    country_id: 'japan',
    name: '《金森紅磚倉庫》- 港灣復古商圈',
    name_en: 'Kanemori Red Brick Warehouse',
    category: '歷史文化',
    description: '明治時期建造的《金森紅磚倉庫》群是函館港象徵，改建為購物、餐飲、展覽空間。紅磚建築倒映運河，夜晚點燈後浪漫迷人，周圍街道保留濃厚異國風情。',
    tags: ['建築', '購物', '歷史', '港灣'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 2,
    is_active: true
  },

  // 小樽 (otaru)
  {
    id: randomUUID(),
    city_id: 'otaru',
    country_id: 'japan',
    name: '《小樽運河》- 浪漫復古水道',
    name_en: 'Otaru Canal',
    category: '歷史文化',
    description: '建於1923年的《小樽運河》全長1140公尺，兩旁保存明治大正時期石造倉庫。傍晚煤油燈點亮，倒映水面如夢似幻，是北海道最浪漫的散步道，冬季雪景更添詩意。',
    tags: ['運河', '浪漫', '歷史', '必遊'],
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'otaru',
    country_id: 'japan',
    name: '《北一硝子館》- 玻璃工藝殿堂',
    name_en: 'Kitaichi Glass',
    category: '體驗活動',
    description: '《北一硝子館》由百年石造倉庫改建，展示數千件精緻玻璃工藝品。167支油燈點亮的「北一Hall」如夢幻宮殿，可體驗吹玻璃DIY，是小樽最具特色的工藝空間。',
    tags: ['工藝', '購物', '體驗', '藝術'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 2,
    is_active: true
  },

  // ========== 關東地區 ==========
  // 橫濱 (yokohama)
  {
    id: randomUUID(),
    city_id: 'yokohama',
    country_id: 'japan',
    name: '《橫濱紅磚倉庫》- 港都文化地標',
    name_en: 'Yokohama Red Brick Warehouse',
    category: '歷史文化',
    description: '建於1911年的《橫濱紅磚倉庫》是港口歷史建築，改建為購物、展覽、活動空間。面向港灣，夜晚與摩天輪、未來港21地標大樓燈光交織，是橫濱最美夜景點。',
    tags: ['建築', '購物', '夜景', '港灣'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'yokohama',
    country_id: 'japan',
    name: '《橫濱中華街》- 日本最大中國城',
    name_en: 'Yokohama Chinatown',
    category: '歷史文化',
    description: '擁有160年歷史的《橫濱中華街》是日本最大中國城，500多家商店餐廳密集分布。十座中國式牌樓、關帝廟、媽祖廟展現傳統文化，品嚐正宗粵菜川菜的美食天堂。',
    tags: ['美食', '文化', '購物', '必遊'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 2,
    is_active: true
  },

  // 鎌倉 (kamakura)
  {
    id: randomUUID(),
    city_id: 'kamakura',
    country_id: 'japan',
    name: '《鎌倉大佛》- 800年青銅巨佛',
    name_en: 'Great Buddha of Kamakura',
    category: '歷史文化',
    description: '鑄造於1252年的《鎌倉大佛》高13.35公尺，是日本第二大青銅佛像。露天端坐近800年，歷經海嘯地震仍巍然不動，寧靜慈悲的面容散發禪意，可入內參觀佛像內部構造。',
    tags: ['佛像', '歷史', '必遊', '古蹟'],
    images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'],
    duration_minutes: 60,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'kamakura',
    country_id: 'japan',
    name: '《鶴岡八幡宮》- 鎌倉幕府守護神社',
    name_en: 'Tsurugaoka Hachimangu Shrine',
    category: '歷史文化',
    description: '創建於1063年的《鶴岡八幡宮》是鎌倉最重要神社，源賴朝建立幕府後成為武家守護神。紅色鳥居、若宮大路參道筆直延伸至海邊，春櫻秋楓四季美景，展現武士精神文化。',
    tags: ['神社', '歷史', '櫻花', '文化'],
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 2,
    is_active: true
  },

  // 箱根 (hakone)
  {
    id: randomUUID(),
    city_id: 'hakone',
    country_id: 'japan',
    name: '《箱根海盜船》- 蘆之湖遊船',
    name_en: 'Hakone Pirate Ship',
    category: '體驗活動',
    description: '搭乘華麗的歐式海盜船暢遊《蘆之湖》，天氣晴朗時能遠眺富士山倒映湖面。船身精緻如電影場景，航行約30分鐘連接桃源台、箱根町、元箱根港，是箱根必體驗行程。',
    tags: ['遊船', '富士山', '必遊', '景觀'],
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hakone',
    country_id: 'japan',
    name: '《大涌谷》- 硫磺谷地獄景觀',
    name_en: 'Owakudani',
    category: '自然景觀',
    description: '箱根火山活動形成的《大涌谷》煙霧瀰漫，硫磺氣味濃烈，白煙從地底噴發如地獄場景。必嚐用火山蒸氣煮成的「黑玉子」溫泉蛋，傳說吃一顆延壽7年，天晴可見富士山。',
    tags: ['火山', '溫泉', '奇觀', '富士山'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 2,
    is_active: true
  },

  // ========== 中部地區 ==========
  // 名古屋 (nagoya)
  {
    id: randomUUID(),
    city_id: 'nagoya',
    country_id: 'japan',
    name: '《名古屋城》- 金鯱閃耀天守',
    name_en: 'Nagoya Castle',
    category: '歷史文化',
    description: '德川家康建於1612年的《名古屋城》是日本三大名城之一，天守閣屋頂金色鯱魚是城市象徵。本丸御殿內部金碧輝煌，障壁畫精美絕倫，春季護城河櫻花盛開美不勝收。',
    tags: ['城堡', '歷史', '必遊', '櫻花'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'nagoya',
    country_id: 'japan',
    name: '《熱田神宮》- 三神器守護聖地',
    name_en: 'Atsuta Shrine',
    category: '歷史文化',
    description: '創建近2000年的《熱田神宮》供奉日本三神器之一的草薙劍，地位僅次於伊勢神宮。境內參天古木環繞，信長牆展現桃山建築風格，每年參拜人次超過900萬，是中部最重要神社。',
    tags: ['神社', '歷史', '古木', '神器'],
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 2,
    is_active: true
  },

  // 金澤 (kanazawa)
  {
    id: randomUUID(),
    city_id: 'kanazawa',
    country_id: 'japan',
    name: '《兼六園》- 日本三名園之首',
    name_en: 'Kenrokuen Garden',
    category: '自然景觀',
    description: '歷時180年完成的《兼六園》是日本三大名園之一，完美融合宏大、幽邃、人力、蒼古、水泉、遠景六大造園要素。霞池、徽軫燈籠、唐崎松是經典景觀，四季各展風情。',
    tags: ['庭園', '必遊', '四季', '名園'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'kanazawa',
    country_id: 'japan',
    name: '《東茶屋街》- 江戶風情花街',
    name_en: 'Higashi Chaya District',
    category: '歷史文化',
    description: '保存完整的《東茶屋街》是江戶時代藝伎花街，木造町家建築排列石板路兩旁。格子窗、暖簾展現傳統風情，改建為咖啡廳、工藝品店、金箔體驗館，夜晚三味線聲悠揚傳來。',
    tags: ['古街', '藝伎', '傳統', '金箔'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 2,
    is_active: true
  },

  // ========== 關西地區 ==========
  // 奈良 (nara)
  {
    id: randomUUID(),
    city_id: 'nara',
    country_id: 'japan',
    name: '《東大寺》- 世界最大木造建築',
    name_en: 'Todaiji Temple',
    category: '歷史文化',
    description: '建於745年的《東大寺》大佛殿是世界最大木造建築，供奉高15公尺的盧舍那佛銅像。UNESCO世界遺產，建築氣勢磅礴，穿越「柱洞」據說能祈福消災，周圍鹿群悠遊如仙境。',
    tags: ['寺廟', 'UNESCO', '必遊', '大佛'],
    images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'nara',
    country_id: 'japan',
    name: '《奈良公園》- 千頭鹿群樂園',
    name_en: 'Nara Park',
    category: '自然景觀',
    description: '占地660公頃的《奈良公園》有超過1200頭野生鹿自由漫步，被視為神的使者。鹿群溫馴會向遊客鞠躬討鹿仙貝，春櫻秋楓四季美景，與東大寺、春日大社構成完美風景線。',
    tags: ['公園', '鹿', '必遊', '自然'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 2,
    is_active: true
  },

  // 神戶 (kobe)
  {
    id: randomUUID(),
    city_id: 'kobe',
    country_id: 'japan',
    name: '《神戶港》- 浪漫港灣夜景',
    name_en: 'Kobe Harborland',
    category: '自然景觀',
    description: '《神戶港》融合購物、餐飲、娛樂的海濱複合區，紅色神戶塔、摩天輪、海洋博物館構成獨特天際線。夜晚燈光璀璨倒映海面，是關西最美港灣夜景，周圍異國建築展現開港歷史。',
    tags: ['港灣', '夜景', '購物', '浪漫'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'kobe',
    country_id: 'japan',
    name: '《北野異人館》- 西洋豪宅巡禮',
    name_en: 'Kitano Ijinkan',
    category: '歷史文化',
    description: '明治開港後外國人居住的《北野異人館》保存30多棟西洋建築，風見雞館、萌黃館、魚鱗之家各具特色。漫步石板坡道，彷彿置身歐洲小鎮，展現神戶國際化歷史。',
    tags: ['建築', '歷史', '歐風', '文化'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 2,
    is_active: true
  },

  // ========== 中國地區 ==========
  // 廣島 (hiroshima)
  {
    id: randomUUID(),
    city_id: 'hiroshima',
    country_id: 'japan',
    name: '《嚴島神社》- 海上大鳥居',
    name_en: 'Itsukushima Shrine',
    category: '歷史文化',
    description: '建於593年的《嚴島神社》以漂浮海上的紅色大鳥居聞名世界，高16公尺的鳥居漲潮時矗立海中，退潮可步行至鳥居下。UNESCO世界遺產，與松島、天橋立並稱日本三景。',
    tags: ['神社', 'UNESCO', '必遊', '三景'],
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hiroshima',
    country_id: 'japan',
    name: '《原爆圓頂館》- 和平紀念遺址',
    name_en: 'Atomic Bomb Dome',
    category: '歷史文化',
    description: '1945年原子彈爆炸唯一留存的建築《原爆圓頂館》，殘破骨架訴說戰爭殘酷。UNESCO世界遺產，與和平紀念公園、紀念館一同警示世人珍惜和平，每年8月6日舉行追悼儀式。',
    tags: ['UNESCO', '歷史', '和平', '紀念'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 2,
    is_active: true
  },

  // ========== 九州地區 ==========
  // 那霸 (naha)
  {
    id: randomUUID(),
    city_id: 'naha',
    country_id: 'japan',
    name: '《首里城》- 琉球王國宮殿',
    name_en: 'Shuri Castle',
    category: '歷史文化',
    description: '琉球王國政治中心《首里城》融合中日建築風格，朱紅色正殿莊嚴華麗。2019年大火後正積極重建，守禮門、園比屋武御嶽石門等UNESCO世界遺產仍可參觀，俯瞰那霸市區全景。',
    tags: ['城堡', 'UNESCO', '歷史', '琉球'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'naha',
    country_id: 'japan',
    name: '《國際通》- 那霸購物天堂',
    name_en: 'Kokusai Street',
    category: '體驗活動',
    description: '長達1.6公里的《國際通》是那霸最熱鬧商店街，號稱「奇蹟的一英里」。沖繩特產、泡盛、紅型工藝、海葡萄美食應有盡有，街頭藝人表演三線琴，充滿南國活力氛圍。',
    tags: ['購物', '美食', '熱鬧', '文化'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 2,
    is_active: true
  }
];

async function main() {
  console.log('🚀 開始新增日本城市景點（大批次）...\n');

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
  console.log(`\n🎉 日本景點資料新增完成！`);
}

main().catch(console.error);
