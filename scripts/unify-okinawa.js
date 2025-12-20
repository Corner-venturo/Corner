/**
 * 統一沖繩地區城市 ID
 * 1. 把 naha 和沖繩相關 UUID 城市改為 okinawa
 * 2. 合併重複景點
 */

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
);

// 沖繩相關的 UUID 城市
const OKINAWA_UUID_CITIES = [
  '93d7cea0-67ac-406a-a916-c8e0f278c122', // 古宇利島
  '90a2fbf4-0702-4d6e-af28-cd6a924d1b7e', // 殘波岬
  '613b1dcb-49d5-4933-ba9f-839d218a5031', // 沖繩美麗海水族館
];

function getCompletenessScore(attraction) {
  let score = 0;
  if (attraction.description && attraction.description.length > 10) score += 3;
  if (attraction.notes && attraction.notes.length > 10) score += 2;
  if (attraction.images && attraction.images.length > 0) score += 2;
  if (attraction.thumbnail) score += 1;
  if (attraction.duration_minutes) score += 1;
  if (attraction.opening_hours) score += 1;
  if (attraction.tags && attraction.tags.length > 0) score += 1;
  if (attraction.category) score += 1;
  return score;
}

async function main() {
  console.log('🗾 統一沖繩地區城市 ID\n');
  console.log('='.repeat(60) + '\n');

  // 取得所有沖繩相關景點
  const { data: allOkinawa } = await supabase
    .from('attractions')
    .select('*')
    .eq('country_id', 'japan')
    .or(`city_id.eq.naha,city_id.eq.okinawa,city_id.in.(${OKINAWA_UUID_CITIES.join(',')})`);

  console.log(`📊 沖繩相關景點: ${allOkinawa.length} 筆\n`);

  // 統計
  const stats = {};
  allOkinawa.forEach(a => {
    stats[a.city_id] = (stats[a.city_id] || 0) + 1;
  });
  console.log('城市分佈:');
  Object.entries(stats).forEach(([city, count]) => {
    const label = city === 'okinawa' ? '(目標)' : city === 'naha' ? '→ okinawa' : '→ okinawa';
    console.log(`  ${city}: ${count} 筆 ${label}`);
  });

  // ===== 步驟 1: 更新城市 ID =====
  console.log('\n' + '='.repeat(60));
  console.log('【步驟 1】更新城市 ID 為 okinawa');
  console.log('='.repeat(60) + '\n');

  // 更新 naha -> okinawa
  const nahaItems = allOkinawa.filter(a => a.city_id === 'naha');
  if (nahaItems.length > 0) {
    console.log(`更新 naha → okinawa (${nahaItems.length} 筆)...`);
    const { error } = await supabase
      .from('attractions')
      .update({ city_id: 'okinawa' })
      .eq('city_id', 'naha')
      .eq('country_id', 'japan');

    if (error) console.error('❌ 錯誤:', error.message);
    else console.log('✅ 完成');
  }

  // 更新 UUID 城市 -> okinawa
  for (const uuid of OKINAWA_UUID_CITIES) {
    const items = allOkinawa.filter(a => a.city_id === uuid);
    if (items.length > 0) {
      console.log(`更新 ${uuid.slice(0,8)}... → okinawa (${items.length} 筆)...`);
      const { error } = await supabase
        .from('attractions')
        .update({ city_id: 'okinawa' })
        .eq('city_id', uuid);

      if (error) console.error('❌ 錯誤:', error.message);
      else console.log('✅ 完成');
    }
  }

  // ===== 步驟 2: 合併重複景點 =====
  console.log('\n' + '='.repeat(60));
  console.log('【步驟 2】合併重複景點');
  console.log('='.repeat(60) + '\n');

  // 重新取得更新後的沖繩景點
  const { data: okinawaAttractions } = await supabase
    .from('attractions')
    .select('*')
    .eq('city_id', 'okinawa')
    .eq('country_id', 'japan');

  console.log(`沖繩景點總數: ${okinawaAttractions.length} 筆\n`);

  // 按名稱分組找重複
  const nameGroups = {};
  okinawaAttractions.forEach(a => {
    const key = a.name.toLowerCase().replace(/\s+/g, '');
    if (!nameGroups[key]) nameGroups[key] = [];
    nameGroups[key].push(a);
  });

  const duplicates = Object.entries(nameGroups).filter(([_, items]) => items.length > 1);
  console.log(`發現 ${duplicates.length} 組重複:\n`);

  const toDelete = [];

  for (const [key, items] of duplicates) {
    // 按完整度排序
    const scored = items.map(item => ({
      ...item,
      score: getCompletenessScore(item)
    }));
    scored.sort((a, b) => b.score - a.score);

    const keep = scored[0];
    const remove = scored.slice(1);

    console.log(`📍 「${keep.name}」`);
    console.log(`   保留: ID ${keep.id.slice(0,8)}... (完整度: ${keep.score})`);
    remove.forEach(r => {
      console.log(`   刪除: ID ${r.id.slice(0,8)}... (完整度: ${r.score})`);
      toDelete.push(r.id);
    });
    console.log('');
  }

  // 執行刪除
  if (toDelete.length > 0) {
    console.log(`正在刪除 ${toDelete.length} 筆重複資料...`);
    const { error } = await supabase
      .from('attractions')
      .delete()
      .in('id', toDelete);

    if (error) console.error('❌ 錯誤:', error.message);
    else console.log('✅ 刪除完成');
  }

  // ===== 總結 =====
  console.log('\n' + '='.repeat(60));
  console.log('【總結】');
  console.log('='.repeat(60) + '\n');

  const { count: finalCount } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })
    .eq('city_id', 'okinawa');

  console.log(`✅ 沖繩地區統一完成`);
  console.log(`   合併後景點數: ${finalCount} 筆`);
  console.log(`   刪除重複: ${toDelete.length} 筆`);
}

main().catch(console.error);
