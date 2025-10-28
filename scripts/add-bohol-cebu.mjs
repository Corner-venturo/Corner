#!/usr/bin/env node
/**
 * 薄荷島 (Bohol) 景點新增
 * 薄荷島與宿務相鄰，是經典搭配行程
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🚀 開始處理薄荷島...\n');

// 步驟 1: 檢查薄荷島城市是否存在
const { data: existingCity } = await supabase
  .from('cities')
  .select('id, name')
  .eq('id', 'bohol')
  .single();

if (!existingCity) {
  console.log('📍 步驟 1: 新增薄荷島城市到資料庫...\n');

  const { error: cityError } = await supabase
    .from('cities')
    .insert({
      id: 'bohol',
      country_id: 'philippines',
      region_id: null, // 菲律賓城市無 region_id
      name: '薄荷島',
      name_en: 'Bohol',
      description: '薄荷島以巧克力山、眼鏡猴、白沙灘聞名，是菲律賓重要旅遊勝地。',
      is_active: true,
      display_order: 3
    });

  if (cityError) {
    console.error('❌ 新增城市失敗:', cityError.message);
    process.exit(1);
  }

  console.log('✅ 薄荷島城市已新增\n');
} else {
  console.log('✅ 薄荷島城市已存在，跳過新增\n');
}

// 步驟 2: 新增薄荷島景點
console.log('📍 步驟 2: 新增薄荷島景點...\n');

const attractions = [
  {
    id: randomUUID(),
    city_id: 'bohol',
    country_id: 'philippines',
    region_id: null,
    name: '《巧克力山》- 地質奇觀',
    name_en: 'Chocolate Hills',
    category: '自然景觀',
    description: '《巧克力山》1,268座圓錐形山丘覆蓋50平方公里，旱季草地枯黃如巧克力得名。登觀景台俯瞰壯觀景象、UNESCO世界自然遺產候選、地質成因至今成謎，薄荷島地標。',
    tags: ['地質', '奇觀', '必遊', '世界級'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 1,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'bohol',
    country_id: 'philippines',
    region_id: null,
    name: '《眼鏡猴保護區》- 迷你靈長類',
    name_en: 'Tarsier Sanctuary',
    category: '體驗活動',
    description: '《眼鏡猴保護區》世界最小靈長類動物，體長10公分、眼睛比腦大、180度轉頭能力驚人。夜行性動物白天睡樹上、極度脆弱需安靜觀察、瀕危物種保育重要基地，薄荷島獨有。',
    tags: ['動物', '保育', '獨特', '必看'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 2,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'bohol',
    country_id: 'philippines',
    region_id: null,
    name: '《羅博河遊船》- 叢林午餐',
    name_en: 'Loboc River Cruise',
    category: '體驗活動',
    description: '《羅博河遊船》竹筏餐廳漂流熱帶河流，自助午餐品嚐菲式料理、現場樂團演奏民謠、兩岸椰林搖曳猴子跳躍。停靠瀑布戲水、小孩跳水表演討小費，悠閒體驗薄荷島風情。',
    tags: ['遊船', '午餐', '音樂', '放鬆'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 3,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'bohol',
    country_id: 'philippines',
    region_id: null,
    name: '《邦勞島白沙灘》- 潛水天堂',
    name_en: 'Panglao Island Beach',
    category: '自然景觀',
    description: '《邦勞島白沙灘》薄荷島南端離島，阿羅娜海灘度假村林立、巴里卡薩島浮潛看海龜珊瑚、處女島沙洲退潮顯現。世界級潛水點巴里卡薩大斷層、海豚追逐、螃蟹船跳島一日遊。',
    tags: ['海灘', '潛水', '跳島', '度假'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 480,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'bohol',
    country_id: 'philippines',
    region_id: null,
    name: '《血盟紀念碑》- 歷史遺跡',
    name_en: 'Blood Compact Monument',
    category: '歷史文化',
    description: '《血盟紀念碑》1565年西班牙探險家與原住民酋長歃血為盟，菲律賓與西方首次友好條約。銅像重現歷史場景、海濱公園眺望保和海、塔比拉蘭市地標，了解薄荷島殖民歷史。',
    tags: ['歷史', '紀念碑', '文化', '海濱'],
    images: ['https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1920&q=85'],
    duration_minutes: 60,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'bohol',
    country_id: 'philippines',
    region_id: null,
    name: '《巴卡容教堂》- 巴洛克建築',
    name_en: 'Baclayon Church',
    category: '歷史文化',
    description: '《巴卡容教堂》建於1596年菲律賓最古老石造教堂之一，珊瑚石與蛋清混合建材、西班牙殖民時期巴洛克風格。教堂博物館展示聖物文物、2013年地震受損修復重開，UNESCO世界遺產候選。',
    tags: ['教堂', '古蹟', '巴洛克', '文化'],
    images: ['https://images.unsplash.com/photo-1528164344705-47542687000d?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'bohol',
    country_id: 'philippines',
    region_id: null,
    name: '《人造森林》- 紅木大道',
    name_en: 'Man-Made Forest',
    category: '自然景觀',
    description: '《人造森林》2公里紅木林蔭大道，1960年代造林計劃種植桃花心木成林。筆直參天樹木陽光灑落夢幻、機車穿越森林涼爽、IG打卡熱點，宿務-薄荷島公路必經景點。',
    tags: ['森林', '公路', '打卡', '清涼'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 30,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'bohol',
    country_id: 'philippines',
    region_id: null,
    name: '《蜜蜂農場》- 有機餐廳',
    name_en: 'Bohol Bee Farm',
    category: '體驗活動',
    description: '《蜜蜂農場》有機農場餐廳海景第一排，自家種植蔬菜、養蜂釀蜜、花粉冰淇淋必吃。懸崖餐廳無敵海景、伴手禮店蜂蜜產品、住宿小屋夢幻、健康養生理念，邦勞島熱門景點。',
    tags: ['農場', '餐廳', '有機', '海景'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 8,
    is_active: true
  }
];

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
console.log(`\n🎉 薄荷島景點新增完成！`);
console.log(`🇵🇭 薄荷島: 8 個景點`);
console.log(`📈 菲律賓總景點數將達: ~24 個`);
console.log(`\n💡 薄荷島與宿務是經典搭配行程：`);
console.log(`   - 宿務進出 (國際機場)`);
console.log(`   - 快船 2 小時到薄荷島`);
console.log(`   - 巧克力山 + 眼鏡猴 + 邦勞島潛水`);
