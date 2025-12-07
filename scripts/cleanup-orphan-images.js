/**
 * 清理 city-backgrounds bucket 中的孤兒圖片
 *
 * 孤兒圖片定義：
 * - 檔名以 itinerary_ 開頭（用戶自訂上傳的封面圖片）
 * - 但沒有被任何 itineraries 表格的 form_data.coverImage 引用
 *
 * 執行方式：
 * node scripts/cleanup-orphan-images.js
 *
 * 加上 --dry-run 參數只列出但不刪除：
 * node scripts/cleanup-orphan-images.js --dry-run
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 讀取 .env.local 取得 API key
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
const supabaseKey = keyMatch ? keyMatch[1].trim() : null;

if (!supabaseKey) {
  console.error('找不到 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabase = createClient(supabaseUrl, supabaseKey);

const isDryRun = process.argv.includes('--dry-run');

async function cleanupOrphanImages() {
  console.log('===========================================');
  console.log('清理 city-backgrounds 孤兒圖片');
  console.log(isDryRun ? '🔍 模式：只檢查（不刪除）' : '🗑️ 模式：檢查並刪除');
  console.log('===========================================\n');

  // 1. 取得 Storage 中所有 itinerary_ 開頭的檔案
  console.log('📂 正在掃描 Storage...');
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from('city-backgrounds')
    .list('', { limit: 1000 });

  if (storageError) {
    console.error('無法讀取 Storage:', storageError);
    return;
  }

  // 過濾出 itinerary_ 開頭的檔案
  const itineraryFiles = storageFiles.filter(f => f.name.startsWith('itinerary_'));
  console.log(`找到 ${itineraryFiles.length} 個 itinerary_ 開頭的檔案\n`);

  if (itineraryFiles.length === 0) {
    console.log('✅ 沒有需要清理的檔案');
    return;
  }

  // 2. 取得所有 itineraries 中使用的圖片 URL
  console.log('📋 正在讀取 itineraries 表格...');
  const { data: itineraries, error: itinerariesError } = await supabase
    .from('itineraries')
    .select('id, cover_image, daily_itinerary');

  if (itinerariesError) {
    console.error('無法讀取 itineraries:', itinerariesError);
    return;
  }

  // 提取所有使用中的圖片檔名
  const usedFileNames = new Set();

  for (const itinerary of itineraries || []) {
    // 檢查 cover_image
    if (itinerary.cover_image) {
      const match = itinerary.cover_image.match(/city-backgrounds\/([^?]+)/);
      if (match && match[1].startsWith('itinerary_')) {
        usedFileNames.add(match[1]);
      }
    }

    // 也檢查每日行程中的圖片
    if (itinerary.daily_itinerary) {
      for (const day of itinerary.daily_itinerary) {
        if (day.images) {
          for (const img of day.images) {
            const imgUrl = typeof img === 'string' ? img : img.url;
            if (imgUrl) {
              const match = imgUrl.match(/city-backgrounds\/([^?]+)/);
              if (match && match[1].startsWith('itinerary_')) {
                usedFileNames.add(match[1]);
              }
            }
          }
        }
      }
    }
  }

  console.log(`itineraries 中使用了 ${usedFileNames.size} 個 itinerary_ 圖片\n`);

  // 3. 找出孤兒檔案
  const orphanFiles = itineraryFiles.filter(f => !usedFileNames.has(f.name));

  console.log('===========================================');
  console.log(`📊 統計結果：`);
  console.log(`   - Storage 中 itinerary_ 檔案: ${itineraryFiles.length}`);
  console.log(`   - 使用中的檔案: ${usedFileNames.size}`);
  console.log(`   - 孤兒檔案: ${orphanFiles.length}`);
  console.log('===========================================\n');

  if (orphanFiles.length === 0) {
    console.log('✅ 沒有孤兒檔案需要清理');
    return;
  }

  // 列出孤兒檔案
  console.log('孤兒檔案列表：');
  let totalSize = 0;
  for (const file of orphanFiles) {
    const sizeKB = Math.round((file.metadata?.size || 0) / 1024);
    totalSize += file.metadata?.size || 0;
    console.log(`  - ${file.name} (${sizeKB} KB) [${file.created_at}]`);
  }
  console.log(`\n總計: ${orphanFiles.length} 個檔案, ${Math.round(totalSize / 1024)} KB\n`);

  // 4. 刪除孤兒檔案
  if (isDryRun) {
    console.log('💡 這是 dry-run 模式，不會實際刪除檔案');
    console.log('   要實際刪除，請執行: node scripts/cleanup-orphan-images.js');
  } else {
    console.log('🗑️ 正在刪除孤兒檔案...');

    const filesToDelete = orphanFiles.map(f => f.name);
    const { error: deleteError } = await supabase.storage
      .from('city-backgrounds')
      .remove(filesToDelete);

    if (deleteError) {
      console.error('刪除失敗:', deleteError);
    } else {
      console.log(`✅ 成功刪除 ${orphanFiles.length} 個孤兒檔案`);
    }
  }
}

cleanupOrphanImages();
