/**
 * 景點資料清理腳本 V2
 * 修正順序：先刪重複，再改名稱
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

// 清理名稱
function cleanName(name) {
  if (!name) return name;
  let cleaned = name.replace(/^《(.+?)》.*$/, '$1');
  if (cleaned === name && name.includes(' - ')) {
    if (/[\u4e00-\u9fa5]/.test(name.split(' - ')[0])) {
      cleaned = name.split(' - ')[0].trim();
    }
  }
  return cleaned.trim();
}

// 計算完整度
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

// 正規化名稱
function normalizeForMatch(name) {
  return cleanName(name)
    .replace(/\s+/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[·・]/g, '')
    .toLowerCase();
}

async function main() {
  console.log('🔧 景點資料清理工具 V2\n');
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

  // ===== 第一步：找出重複並決定保留/刪除 =====
  console.log('='.repeat(80));
  console.log('【步驟 1】找出重複景點（使用清理後名稱比對）');
  console.log('='.repeat(80) + '\n');

  // 按 (country + city + normalized_name) 分組
  const groups = new Map();

  for (const a of attractions) {
    const normalized = normalizeForMatch(a.name);
    const key = `${a.country_id}|${a.city_id}|${normalized}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(a);
  }

  // 找出重複組並決定保留哪個
  const toDelete = [];
  const toKeep = new Map(); // id -> cleaned name

  groups.forEach((items, key) => {
    if (items.length > 1) {
      // 按完整度排序
      const scored = items.map(item => ({
        ...item,
        score: getCompletenessScore(item),
        cleanedName: cleanName(item.name)
      }));
      scored.sort((a, b) => b.score - a.score);

      const keep = scored[0];
      const remove = scored.slice(1);

      console.log(`📍 「${keep.cleanedName}」 @ ${keep.country_id} > ${keep.city_id}`);
      console.log(`   保留: ${keep.name} (ID: ${keep.id.slice(0, 8)}..., 完整度: ${keep.score})`);

      // 記錄保留項，稍後更新名稱
      toKeep.set(keep.id, keep.cleanedName);

      remove.forEach(r => {
        console.log(`   刪除: ${r.name} (ID: ${r.id.slice(0, 8)}..., 完整度: ${r.score})`);
        toDelete.push(r.id);
      });
      console.log('');
    } else {
      // 單一項目，只需更新名稱
      const item = items[0];
      const cleaned = cleanName(item.name);
      if (cleaned !== item.name) {
        toKeep.set(item.id, cleaned);
      }
    }
  });

  console.log(`🔍 重複組數: ${Array.from(groups.values()).filter(g => g.length > 1).length}`);
  console.log(`📝 需要更新名稱: ${toKeep.size} 筆`);
  console.log(`🗑️  需要刪除: ${toDelete.length} 筆\n`);

  // ===== 第二步：刪除重複 =====
  console.log('='.repeat(80));
  console.log('【步驟 2】刪除重複景點');
  console.log('='.repeat(80) + '\n');

  if (toDelete.length > 0) {
    console.log(`正在刪除 ${toDelete.length} 筆重複資料...\n`);

    // 分批刪除
    let deleted = 0;
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      const { error } = await supabase
        .from('attractions')
        .delete()
        .in('id', batch);

      if (error) {
        console.error(`❌ 刪除失敗:`, error.message);
      } else {
        deleted += batch.length;
      }
    }

    console.log(`✅ 刪除完成: ${deleted} 筆\n`);
  } else {
    console.log('✅ 沒有需要刪除的重複資料\n');
  }

  // ===== 第三步：更新名稱 =====
  console.log('='.repeat(80));
  console.log('【步驟 3】更新名稱格式');
  console.log('='.repeat(80) + '\n');

  // 只更新保留下來且需要改名的
  const needsRename = [];
  for (const [id, newName] of toKeep) {
    if (!toDelete.includes(id)) {
      const original = attractions.find(a => a.id === id);
      if (original && original.name !== newName) {
        needsRename.push({ id, oldName: original.name, newName });
      }
    }
  }

  if (needsRename.length > 0) {
    console.log(`正在更新 ${needsRename.length} 筆名稱...\n`);

    // 顯示前 20 筆
    needsRename.slice(0, 20).forEach(r => {
      console.log(`  「${r.oldName}」 → 「${r.newName}」`);
    });
    if (needsRename.length > 20) {
      console.log(`  ... 還有 ${needsRename.length - 20} 筆\n`);
    }

    let updated = 0;
    let failed = 0;

    for (const { id, newName, oldName } of needsRename) {
      const { error } = await supabase
        .from('attractions')
        .update({ name: newName })
        .eq('id', id);

      if (error) {
        console.error(`❌ ${oldName}: ${error.message}`);
        failed++;
      } else {
        updated++;
      }
    }

    console.log(`\n✅ 名稱更新完成: ${updated} 筆成功, ${failed} 筆失敗\n`);
  } else {
    console.log('✅ 沒有需要更新的名稱\n');
  }

  // ===== 總結 =====
  console.log('='.repeat(80));
  console.log('【總結】');
  console.log('='.repeat(80) + '\n');

  const { count } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 清理統計:`);
  console.log(`   刪除重複: ${toDelete.length} 筆`);
  console.log(`   更新名稱: ${needsRename.length} 筆`);
  console.log(`\n✅ 清理完成！目前景點數: ${count} 筆`);
}

main().catch(console.error);
