/**
 * 統一所有景點名稱格式
 * 移除《》、（）等裝飾性符號
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
);

// 清理名稱
function cleanName(name) {
  if (!name) return name;

  let cleaned = name;

  // 1. 移除《》格式和後面的描述
  // 《清水寺》- 懸空舞台奇觀 → 清水寺
  cleaned = cleaned.replace(/^《(.+?)》.*$/, '$1');

  // 2. 如果沒有《》，但有 - 描述（中文景點），也移除
  if (cleaned === name && / - /.test(name)) {
    const parts = name.split(' - ');
    // 只處理中文景點
    if (/[\u4e00-\u9fa5]/.test(parts[0])) {
      cleaned = parts[0].trim();
    }
  }

  return cleaned.trim();
}

async function main() {
  console.log('🔧 統一景點名稱格式\n');
  console.log('='.repeat(60) + '\n');

  // 分批取得所有景點（避免 1000 筆限制）
  let allAttractions = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('attractions')
      .select('id, name, city_id, country_id')
      .order('id')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('取得資料錯誤:', error);
      break;
    }

    if (data.length === 0) break;

    allAttractions = allAttractions.concat(data);
    offset += batchSize;

    if (data.length < batchSize) break;
  }

  console.log(`📊 總景點數: ${allAttractions.length} 筆\n`);

  // 找出需要更新的
  const toUpdate = [];

  for (const a of allAttractions) {
    const cleaned = cleanName(a.name);
    if (cleaned !== a.name) {
      toUpdate.push({
        id: a.id,
        oldName: a.name,
        newName: cleaned,
        cityId: a.city_id,
        countryId: a.country_id
      });
    }
  }

  console.log(`📝 需要更新: ${toUpdate.length} 筆\n`);

  // 顯示前 20 筆
  toUpdate.slice(0, 20).forEach(u => {
    console.log(`  「${u.oldName}」`);
    console.log(`  → 「${u.newName}」\n`);
  });
  if (toUpdate.length > 20) {
    console.log(`  ... 還有 ${toUpdate.length - 20} 筆\n`);
  }

  // 執行更新（先處理不會衝突的）
  console.log('='.repeat(60));
  console.log('開始更新...\n');

  let success = 0;
  let failed = 0;
  const failedItems = [];

  for (const item of toUpdate) {
    const { error } = await supabase
      .from('attractions')
      .update({ name: item.newName })
      .eq('id', item.id);

    if (error) {
      // 如果是 unique constraint 錯誤，記錄下來稍後處理
      if (error.message.includes('unique constraint')) {
        failedItems.push(item);
      } else {
        console.log(`❌ ${item.oldName}: ${error.message}`);
      }
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\n✅ 第一輪更新: ${success} 筆成功, ${failed} 筆衝突\n`);

  // 處理衝突的項目（需要先刪除重複）
  if (failedItems.length > 0) {
    console.log('='.repeat(60));
    console.log(`處理 ${failedItems.length} 筆衝突項目...\n`);

    for (const item of failedItems) {
      // 找出同名的現有項目
      const { data: existing } = await supabase
        .from('attractions')
        .select('id, name, notes, description')
        .eq('name', item.newName)
        .eq('city_id', item.cityId);

      if (existing && existing.length > 0) {
        // 比較資料完整度，決定保留哪個
        const current = await supabase
          .from('attractions')
          .select('notes, description')
          .eq('id', item.id)
          .single();

        const currentScore = (current.data?.notes ? 2 : 0) + (current.data?.description ? 1 : 0);
        const existingScore = (existing[0].notes ? 2 : 0) + (existing[0].description ? 1 : 0);

        if (currentScore > existingScore) {
          // 刪除現有的，保留當前的
          await supabase.from('attractions').delete().eq('id', existing[0].id);
          await supabase.from('attractions').update({ name: item.newName }).eq('id', item.id);
          console.log(`✅ ${item.newName}: 保留較完整資料`);
        } else {
          // 刪除當前的，保留現有的
          await supabase.from('attractions').delete().eq('id', item.id);
          console.log(`✅ ${item.newName}: 刪除重複項`);
        }
      }
    }
  }

  // 最終統計
  console.log('\n' + '='.repeat(60));
  console.log('【完成】\n');

  const { count } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true });

  // 檢查還有多少格式問題
  const { data: remaining } = await supabase
    .from('attractions')
    .select('name')
    .or('name.ilike.%《%,name.ilike.%》%');

  console.log(`📊 目前景點數: ${count} 筆`);
  console.log(`📝 仍有《》格式: ${remaining?.length || 0} 筆`);
}

main().catch(console.error);
