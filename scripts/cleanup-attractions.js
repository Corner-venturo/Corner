/**
 * 景點資料清理腳本
 * 1. 統一名稱格式（移除《》和描述）
 * 2. 合併重複景點（保留最完整資料）
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

// 清理名稱：移除《》和描述
function cleanName(name) {
  if (!name) return name;

  // 移除《》格式和後面的描述
  // 《清水寺》- 懸空舞台奇觀 → 清水寺
  let cleaned = name.replace(/^《(.+?)》.*$/, '$1');

  // 如果沒有《》，但有 - 描述，也移除
  // 某景點 - 描述 → 某景點
  if (cleaned === name && name.includes(' - ')) {
    // 只處理中文景點，保留英文的 - (如 Madam Khanh - The Banh Mi Queen)
    if (/[\u4e00-\u9fa5]/.test(name.split(' - ')[0])) {
      cleaned = name.split(' - ')[0].trim();
    }
  }

  return cleaned.trim();
}

// 計算資料完整度分數
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

// 正規化名稱用於比對
function normalizeForMatch(name) {
  return name
    .replace(/\s+/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[·・]/g, '')
    .toLowerCase();
}

async function main() {
  const DRY_RUN = process.argv.includes('--dry-run');

  console.log('🔧 景點資料清理工具\n');
  console.log(DRY_RUN ? '⚠️  DRY RUN 模式（不會實際修改）\n' : '🚀 執行模式\n');
  console.log('='.repeat(80) + '\n');

  // 取得所有景點
  const { data: attractions, error } = await supabase
    .from('attractions')
    .select('*')
    .order('country_id, city_id, name');

  if (error) {
    console.error('❌ 無法取得景點資料:', error);
    return;
  }

  console.log(`📊 總景點數: ${attractions.length} 筆\n`);

  // ===== 第一步：統一名稱格式 =====
  console.log('='.repeat(80));
  console.log('【步驟 1】統一名稱格式');
  console.log('='.repeat(80) + '\n');

  const nameChanges = [];

  for (const a of attractions) {
    const cleaned = cleanName(a.name);
    if (cleaned !== a.name) {
      nameChanges.push({
        id: a.id,
        oldName: a.name,
        newName: cleaned,
        city: a.city_id,
        country: a.country_id
      });
    }
  }

  console.log(`📝 需要更新名稱: ${nameChanges.length} 筆\n`);

  // 顯示前 30 筆變更
  nameChanges.slice(0, 30).forEach(c => {
    console.log(`  「${c.oldName}」`);
    console.log(`  → 「${c.newName}」\n`);
  });

  if (nameChanges.length > 30) {
    console.log(`  ... 還有 ${nameChanges.length - 30} 筆\n`);
  }

  // 執行名稱更新
  if (!DRY_RUN && nameChanges.length > 0) {
    console.log('正在更新名稱...\n');
    let updated = 0;
    let failed = 0;

    for (const change of nameChanges) {
      const { error } = await supabase
        .from('attractions')
        .update({ name: change.newName })
        .eq('id', change.id);

      if (error) {
        console.error(`❌ 更新失敗: ${change.oldName} - ${error.message}`);
        failed++;
      } else {
        updated++;
      }
    }

    console.log(`✅ 名稱更新完成: ${updated} 筆成功, ${failed} 筆失敗\n`);
  }

  // ===== 第二步：找出並合併重複 =====
  console.log('='.repeat(80));
  console.log('【步驟 2】合併重複景點');
  console.log('='.repeat(80) + '\n');

  // 重新取得更新後的資料
  const { data: updatedAttractions } = await supabase
    .from('attractions')
    .select('*')
    .order('country_id, city_id, name');

  // 按 (country + city + normalized_name) 分組
  const groups = new Map();

  for (const a of updatedAttractions) {
    // 使用清理後的名稱
    const name = DRY_RUN ? cleanName(a.name) : a.name;
    const normalized = normalizeForMatch(name);
    const key = `${a.country_id}|${a.city_id}|${normalized}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push({ ...a, cleanedName: name });
  }

  // 找出重複組
  const duplicateGroups = [];
  groups.forEach((items, key) => {
    if (items.length > 1) {
      duplicateGroups.push({ key, items });
    }
  });

  console.log(`🔍 發現 ${duplicateGroups.length} 組重複\n`);

  const toDelete = [];
  const toUpdate = [];

  for (const { key, items } of duplicateGroups) {
    // 計算每個項目的完整度
    const scored = items.map(item => ({
      ...item,
      score: getCompletenessScore(item)
    }));

    // 按分數排序，保留最高分的
    scored.sort((a, b) => b.score - a.score);

    const keep = scored[0];
    const remove = scored.slice(1);

    console.log(`📍 「${keep.cleanedName}」 @ ${keep.country_id} > ${keep.city_id}`);
    console.log(`   保留: ID ${keep.id.slice(0, 8)}... (完整度: ${keep.score})`);
    remove.forEach(r => {
      console.log(`   刪除: ID ${r.id.slice(0, 8)}... (完整度: ${r.score})`);
      toDelete.push(r.id);
    });
    console.log('');

    // 如果要刪除的項目有更完整的資料，合併到保留項
    for (const r of remove) {
      const updates = {};
      if (!keep.description && r.description) updates.description = r.description;
      if (!keep.notes && r.notes) updates.notes = r.notes;
      if ((!keep.images || keep.images.length === 0) && r.images && r.images.length > 0) {
        updates.images = r.images;
      }
      if (!keep.thumbnail && r.thumbnail) updates.thumbnail = r.thumbnail;
      if (!keep.duration_minutes && r.duration_minutes) updates.duration_minutes = r.duration_minutes;
      if (!keep.opening_hours && r.opening_hours) updates.opening_hours = r.opening_hours;

      if (Object.keys(updates).length > 0) {
        toUpdate.push({ id: keep.id, updates });
      }
    }
  }

  // 執行合併
  if (!DRY_RUN) {
    // 先更新需要合併的資料
    if (toUpdate.length > 0) {
      console.log(`\n正在合併 ${toUpdate.length} 筆資料...\n`);
      for (const { id, updates } of toUpdate) {
        await supabase.from('attractions').update(updates).eq('id', id);
      }
    }

    // 再刪除重複項
    if (toDelete.length > 0) {
      console.log(`正在刪除 ${toDelete.length} 筆重複資料...\n`);

      // 分批刪除
      for (let i = 0; i < toDelete.length; i += 50) {
        const batch = toDelete.slice(i, i + 50);
        const { error } = await supabase
          .from('attractions')
          .delete()
          .in('id', batch);

        if (error) {
          console.error(`❌ 刪除失敗:`, error.message);
        }
      }

      console.log(`✅ 刪除完成: ${toDelete.length} 筆\n`);
    }
  }

  // ===== 總結 =====
  console.log('='.repeat(80));
  console.log('【總結】');
  console.log('='.repeat(80) + '\n');

  console.log(`📊 清理統計:`);
  console.log(`   名稱格式更新: ${nameChanges.length} 筆`);
  console.log(`   重複組數: ${duplicateGroups.length} 組`);
  console.log(`   合併資料: ${toUpdate.length} 筆`);
  console.log(`   刪除重複: ${toDelete.length} 筆`);

  if (DRY_RUN) {
    console.log(`\n⚠️  這是 DRY RUN，沒有實際修改資料`);
    console.log(`   執行 'node scripts/cleanup-attractions.js' 來實際執行`);
  } else {
    // 最終統計
    const { count } = await supabase
      .from('attractions')
      .select('*', { count: 'exact', head: true });

    console.log(`\n✅ 清理完成！目前景點數: ${count} 筆`);
  }
}

main().catch(console.error);
