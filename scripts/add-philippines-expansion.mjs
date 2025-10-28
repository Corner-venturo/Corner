#!/usr/bin/env node
/**
 * 菲律賓景點擴充
 * 宿務 6→8、長灘島 3→8
 * 注意：菲律賓城市無 region_id (之前修復時發現)
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const attractions = [
  // ========== 宿務擴充 (6→8個) ==========
  {
    id: randomUUID(),
    city_id: 'cebu',
    country_id: 'philippines',
    region_id: null,
    name: '《麥哲倫十字架》- 殖民地標',
    name_en: 'Magellan\'s Cross',
    category: '歷史文化',
    description: '《麥哲倫十字架》1521年麥哲倫登陸宿霧種下原始十字架，標誌菲律賓基督教化起點。八角亭保護歷史聖物、天花板壁畫描繪受洗場景，聖嬰教堂旁步行可達，宿霧精神象徵。',
    tags: ['歷史', '地標', '殖民', '必遊'],
    images: ['https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1920&q=85'],
    duration_minutes: 60,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'cebu',
    country_id: 'philippines',
    region_id: null,
    name: '《資生堂島跳島》- 海島天堂',
    name_en: 'Shiseido Island Hopping',
    category: '體驗活動',
    description: '《資生堂島跳島》宿霧經典行程，螃蟹船穿梭娜魯蘇安島、希爾圖加島、帕格蘭島。浮潛看海龜珊瑚、沙洲淺灘踏浪、BBQ午餐椰子樹下，菲律賓碧海藍天度假體驗。',
    tags: ['跳島', '浮潛', '海灘', '必玩'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 480,
    display_order: 8,
    is_active: true
  },

  // ========== 長灘島擴充 (3→8個) ==========
  {
    id: randomUUID(),
    city_id: 'boracay',
    country_id: 'philippines',
    region_id: null,
    name: '《白沙灘》- 世界最美',
    name_en: 'White Beach',
    category: '自然景觀',
    description: '《白沙灘》4公里粉末細沙海灘，曾獲全球最美海灘冠軍。S1高級度假村、S2主要商圈、S3衝浪滑翔傘，日落帆船巡航浪漫破表，長灘島精華所在。',
    tags: ['海灘', '日落', '必遊', '世界級'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 300,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'boracay',
    country_id: 'philippines',
    region_id: null,
    name: '《普卡海灘》- 貝殼沙灘',
    name_en: 'Puka Shell Beach',
    category: '自然景觀',
    description: '《普卡海灘》島北端靜謐海灘，特有puka貝殼碎片鋪滿沙灘。遊客稀少適合私密度假、海浪較大衝浪天堂、椰子樹搖曳熱帶風情，白沙灘喧囂外的寧靜選擇。',
    tags: ['海灘', '貝殼', '寧靜', '衝浪'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'boracay',
    country_id: 'philippines',
    region_id: null,
    name: '《星期五海灘》- 懸崖跳水',
    name_en: 'Friday Beach',
    category: '體驗活動',
    description: '《星期五海灘》隱藏海灘需划船進入，懸崖跳水3-15公尺高度挑戰膽量。洞穴探險、水晶般清澈海水、人少秘境感十足，冒險愛好者必訪，長灘島最刺激體驗。',
    tags: ['跳水', '探險', '秘境', '刺激'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'boracay',
    country_id: 'philippines',
    region_id: null,
    name: '《D-Mall》- 購物中心',
    name_en: 'D\'Mall',
    category: '體驗活動',
    description: '《D-Mall》長灘島主要商圈，紀念品店、餐廳、按摩SPA、超市應有盡有。I Love Boracay打卡牌坊、芒果乾伴手禮、Henna紋身體驗，白沙灘S2段步行可達。',
    tags: ['購物', '餐廳', '商圈', '便利'],
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'boracay',
    country_id: 'philippines',
    region_id: null,
    name: '《風帆體驗》- 落日巡航',
    name_en: 'Sunset Sailing',
    category: '體驗活動',
    description: '《風帆體驗》長灘島經典活動，傳統螃蟹船Paraw改裝風帆船優雅破浪。夕陽時分出海天空漸層色彩、海風吹拂浪漫滿分、船夫唱歌助興，蜜月情侶必體驗項目。',
    tags: ['風帆', '日落', '浪漫', '海上'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 8,
    is_active: true
  }
];

async function main() {
  console.log('🚀 開始擴充菲律賓景點...\n');
  console.log('目標：宿務 +2、長灘島 +5\n');

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
  console.log(`\n🎉 菲律賓景點擴充完成！`);
  console.log(`🇵🇭 預計新增: 7 個景點`);
  console.log(`📈 菲律賓總景點數將達: ~16 個`);
  console.log('\n💡 菲律賓目前城市較少 (僅宿務、長灘島)');
  console.log('💡 未來可新增：馬尼拉、巴拉望 (愛妮島)、薄荷島');
}

main().catch(console.error);
