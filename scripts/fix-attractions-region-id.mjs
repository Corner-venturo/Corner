#!/usr/bin/env node
/**
 * 修復景點缺少的 region_id
 * 從 cities 表取得 region_id 並更新到 attractions 表
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🔧 開始修復景點的 region_id...\n');

  // 1. 取得所有景點
  const { data: attractions, error: e1 } = await supabase
    .from('attractions')
    .select('id, city_id, region_id');

  if (e1) {
    console.error('❌ 無法取得景點:', e1);
    return;
  }

  // 2. 取得所有城市的 region_id
  const { data: cities, error: e2 } = await supabase
    .from('cities')
    .select('id, region_id');

  if (e2) {
    console.error('❌ 無法取得城市:', e2);
    return;
  }

  // 建立 city_id -> region_id 對應表
  const cityRegionMap = {};
  cities.forEach(city => {
    cityRegionMap[city.id] = city.region_id;
  });

  // 3. 找出缺少 region_id 的景點
  const missingRegion = attractions.filter(a => !a.region_id);

  console.log(`總景點數: ${attractions.length}`);
  console.log(`缺少 region_id: ${missingRegion.length} 個\n`);

  if (missingRegion.length === 0) {
    console.log('✅ 所有景點都有 region_id！');
    return;
  }

  // 4. 更新缺少 region_id 的景點
  let success = 0;
  let failed = 0;
  let noRegion = 0;

  for (const attraction of missingRegion) {
    const regionId = cityRegionMap[attraction.city_id];

    if (!regionId) {
      console.log(`⚠️  ${attraction.city_id}: 城市本身沒有 region_id`);
      noRegion++;
      continue;
    }

    try {
      const { error } = await supabase
        .from('attractions')
        .update({ region_id: regionId })
        .eq('id', attraction.id);

      if (error) throw error;

      success++;
      if (success % 50 === 0) {
        console.log(`處理中... ${success}/${missingRegion.length}`);
      }
    } catch (error) {
      console.error(`❌ ${attraction.id}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 修復統計:`);
  console.log(`✅ 成功: ${success} 個`);
  console.log(`⚠️  城市無 region_id: ${noRegion} 個`);
  console.log(`❌ 失敗: ${failed} 個`);
  console.log(`\n🎉 修復完成！`);
}

main().catch(console.error);
