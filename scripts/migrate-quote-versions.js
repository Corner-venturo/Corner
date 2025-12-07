/**
 * 報價單版本結構 Migration
 *
 * 舊結構：
 * - quote.categories = 主版本資料
 * - quote.versions = 其他版本（versions[0], versions[1]...）
 * - 顯示為 "1 版 + versions.length 版"
 *
 * 新結構：
 * - quote.categories = 臨時編輯狀態
 * - quote.versions = 所有版本（versions[0] = 第一版, versions[1] = 第二版...）
 * - quote.current_version_index = 當前編輯的版本索引
 * - 顯示為 "versions.length 版"
 *
 * Migration 邏輯：
 * 1. 如果 quote 有 categories 但沒有 versions，建立 versions[0]
 * 2. 如果 quote 有 categories 和 versions，將 categories 插入為 versions[0]，其他版本順移
 * 3. 設定 current_version_index = 0
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

async function migrateQuoteVersions() {
  console.log('開始報價單版本結構 Migration...\n');

  // 取得所有報價單
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('quote_type', 'standard'); // 只處理標準報價單

  if (error) {
    console.error('取得報價單失敗:', error);
    return;
  }

  console.log(`找到 ${quotes.length} 筆標準報價單\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const quote of quotes) {
    try {
      const hasCategories = quote.categories && quote.categories.length > 0;
      const hasVersions = quote.versions && quote.versions.length > 0;

      // 檢查 versions 是否已經有 name 欄位（表示已經是新結構）
      const alreadyMigrated = hasVersions && quote.versions.some(v => v.name);
      if (alreadyMigrated) {
        console.log(`⏭️  ${quote.code || quote.id}: 已是新結構，跳過`);
        skippedCount++;
        continue;
      }

      // 檢查是否需要 migration
      if (!hasCategories && !hasVersions) {
        console.log(`⏭️  ${quote.code || quote.id}: 無資料，跳過`);
        skippedCount++;
        continue;
      }

      let newVersions = [];
      let updateData = {};

      if (hasCategories) {
        // 建立第一版（從 categories）
        const firstVersion = {
          id: Date.now().toString(),
          version: 1,
          name: quote.customer_name || quote.name || '版本 1',
          categories: quote.categories,
          total_cost: quote.total_cost || 0,
          group_size: quote.group_size,
          accommodation_days: quote.accommodation_days || 0,
          participant_counts: quote.participant_counts || {
            adult: quote.group_size || 1,
            child_with_bed: 0,
            child_no_bed: 0,
            single_room: 0,
            infant: 0,
          },
          selling_prices: quote.selling_prices || {
            adult: 0,
            child_with_bed: 0,
            child_no_bed: 0,
            single_room: 0,
            infant: 0,
          },
          note: '初始版本（從 migration 建立）',
          created_at: quote.created_at,
        };

        newVersions.push(firstVersion);

        // 如果有其他版本，調整版本號並加入
        if (hasVersions) {
          for (let i = 0; i < quote.versions.length; i++) {
            const oldVersion = quote.versions[i];
            const newVersion = {
              ...oldVersion,
              version: i + 2, // 原本的 versions[0] 變成版本 2
              name: oldVersion.name || oldVersion.note || `版本 ${i + 2}`,
            };
            newVersions.push(newVersion);
          }
        }
      } else if (hasVersions) {
        // 只有 versions，確保每個版本都有 name
        newVersions = quote.versions.map((v, i) => ({
          ...v,
          name: v.name || v.note || `版本 ${i + 1}`,
        }));
      }

      // 更新報價單
      updateData = {
        versions: newVersions,
        current_version_index: 0, // 預設編輯第一版
      };

      const { error: updateError } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quote.id);

      if (updateError) {
        console.error(`❌ ${quote.code || quote.id}: 更新失敗`, updateError.message);
        errorCount++;
      } else {
        console.log(`✅ ${quote.code || quote.id}: 成功 (${newVersions.length} 個版本)`);
        migratedCount++;
      }
    } catch (err) {
      console.error(`❌ ${quote.code || quote.id}: 處理失敗`, err.message);
      errorCount++;
    }
  }

  console.log('\n========== Migration 完成 ==========');
  console.log(`✅ 成功: ${migratedCount} 筆`);
  console.log(`⏭️  跳過: ${skippedCount} 筆`);
  console.log(`❌ 失敗: ${errorCount} 筆`);
}

migrateQuoteVersions();
