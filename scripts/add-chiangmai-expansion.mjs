#!/usr/bin/env node
/**
 * 清邁景點大擴充 - 公司主力市場
 * 目標：從4個擴充到15+個精選景點
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const attractions = [
  // ========== 清邁擴充 (目前4個 → 目標15+個) ==========
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《契迪龍寺》- 清邁最大佛塔',
    name_en: 'Wat Chedi Luang',
    category: '歷史文化',
    description: '建於1411年的《契迪龍寺》擁有清邁最大佛塔，高達82公尺。地震損毀後保留滄桑美感，夕陽時分金色陽光灑落，神秘氛圍濃厚。曾供奉玉佛，是蘭納王國精神中心。',
    tags: ['寺廟', '佛塔', '必遊', '歷史'],
    images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《帕辛寺》- 蘭納建築瑰寶',
    name_en: 'Wat Phra Singh',
    category: '歷史文化',
    description: '清邁地位最崇高的《帕辛寺》建於1345年，供奉帕辛佛像。金碧輝煌的蘭納式建築，精緻木雕、壁畫描繪佛教故事，是潑水節主要慶典場所，展現清邁宗教文化核心。',
    tags: ['寺廟', '必遊', '蘭納', '建築'],
    images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《清邁古城門》- 護城河環繞古都',
    name_en: 'Chiang Mai Old City',
    category: '歷史文化',
    description: '700多年歷史的《清邁古城》四方形護城河環繞，塔佩門是最著名城門。紅磚城牆、寺廟林立、咖啡廳、按摩店密集，租單車或步行探索，體驗蘭納古都悠閒氛圍。',
    tags: ['古城', '必遊', '騎車', '歷史'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《寧曼路》- 清邁文青天堂',
    name_en: 'Nimmanhaemin Road',
    category: '體驗活動',
    description: '《寧曼路》是清邁最潮街區，巷弄間隱藏特色咖啡廳、設計品店、藝廊、餐廳。iBerry冰淇淋、Mango Tango芒果糯米飯必吃，夜晚酒吧熱鬧，年輕人與文青聚集地。',
    tags: ['文青', '咖啡', '購物', '美食'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 8,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《夜間動物園》- 夜探野生動物',
    name_en: 'Chiang Mai Night Safari',
    category: '體驗活動',
    description: '亞洲最大《夜間動物園》占地300畝，搭遊園車近距離觀察獅子、老虎、長頸鹿夜間活動。分為草食區、肉食區、步行區，動物表演、音樂噴泉秀，親子旅遊首選。',
    tags: ['動物園', '夜間', '親子', '體驗'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 9,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《清邁週末夜市》- 手工藝品天堂',
    name_en: 'Chiang Mai Weekend Market',
    category: '體驗活動',
    description: '週六瓦萊路、週日塔佩路《週末夜市》綿延數公里，販售蘭納手工藝品、服飾、畫作、銀飾。街頭藝人表演、按摩、小吃攤，價格便宜品質佳，是清邁最熱鬧的文化體驗。',
    tags: ['夜市', '必遊', '手工藝', '購物'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 10,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《老虎王國》- 與老虎近距離接觸',
    name_en: 'Tiger Kingdom',
    category: '體驗活動',
    description: '《老虎王國》可選擇與不同年齡老虎互動，從幼虎到成年虎。專業管理員陪同，撫摸、拍照留念，感受大貓的溫馴與力量。雖有爭議，但仍是清邁熱門體驗項目。',
    tags: ['動物', '體驗', '刺激', '拍照'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 11,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《美旺瀑布》- 叢林瀑布秘境',
    name_en: 'Mae Wang Waterfall',
    category: '自然景觀',
    description: '《美旺瀑布》位於叢林深處，多層瀑布傾瀉而下，水質清澈可游泳。健行穿越竹林、溪流，周圍原始森林生態豐富，遠離市區喧囂，享受大自然寧靜，適合半日遊。',
    tags: ['瀑布', '健行', '游泳', '自然'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 12,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《藍廟》- 湛藍藝術殿堂',
    name_en: 'Wat Ban Den',
    category: '歷史文化',
    description: '距市區40分鐘的《藍廟》以深藍色為主色調，配上金色雕飾璀璨奢華。2016年完工的現代寺廟，12生肖塔、白象雕像、精緻壁畫，藝術性極高，遊客較少清幽雅致。',
    tags: ['寺廟', '藝術', '藍色', '拍照'],
    images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 13,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《蒲屏皇宮花園》- 皇室避暑勝地',
    name_en: 'Bhubing Palace',
    category: '自然景觀',
    description: '泰皇避暑行宮《蒲屏皇宮》花園對外開放，玫瑰、蘭花、繡球花四季盛開。歐式庭園設計，涼爽氣候、山景環繞，12-2月溫帶花卉盛開最美，需著長袖長褲參觀。',
    tags: ['花園', '皇室', '花卉', '避暑'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 14,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《蘭納民俗博物館》- 北泰文化寶庫',
    name_en: 'Lanna Folklife Museum',
    category: '歷史文化',
    description: '《蘭納民俗博物館》完整展示北泰傳統文化，服飾、工藝、建築、宗教文物。互動式展覽了解蘭納王國歷史，定期舉辦傳統音樂、舞蹈表演，是認識清邁文化根源的最佳場所。',
    tags: ['博物館', '文化', '蘭納', '歷史'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 15,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'chiang-mai',
    country_id: 'thailand',
    name: '《因他農山》- 泰國屋脊',
    name_en: 'Doi Inthanon',
    category: '自然景觀',
    description: '海拔2565公尺的《因他農山》是泰國最高峰，國王王后雙塔矗立山頂。雲海、瀑布、梯田、高山部落、溫帶植物，一日遊涵蓋多樣生態，清晨雲海日出如仙境，清邁必訪自然景觀。',
    tags: ['高山', '雲海', '必遊', '最高峰'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 480,
    display_order: 16,
    is_active: true
  }
];

async function main() {
  console.log('🚀 開始擴充清邁景點（公司主力市場）...\n');

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
  console.log(`\n🎉 清邁景點擴充完成！現在共有 ${4 + success} 個景點`);
}

main().catch(console.error);
