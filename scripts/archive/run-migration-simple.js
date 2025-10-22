#!/usr/bin/env node

/**
 * Supabase Migration Script (Simple Version)
 * 使用 Supabase JS SDK
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

async function runMigration() {
  console.log('🚀 開始執行 Supabase Migration (Simple Version)...\n');

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 讀取 SQL 檔案
    const sqlPath = path.join(__dirname, '..', 'supabase-migration.sql');
    console.log(`📖 讀取 SQL 檔案...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 將 SQL 分割成多個語句（以分號和換行分割）
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT');

    console.log(`✅ 找到 ${statements.length} 個 SQL 語句\n`);
    console.log('⚙️  開始執行...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // 跳過註解和空行
      if (!statement || statement.startsWith('--')) {
        continue;
      }

      // 顯示進度
      const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';
      process.stdout.write(`   [${i + 1}/${statements.length}] ${preview}\r`);

      try {
        // 使用 rpc 呼叫執行 SQL
        const { data, error } = await supabase.rpc('exec', {
          sql: statement + ';'
        });

        if (error) {
          // 如果是 "relation already exists" 就跳過
          if (error.message.includes('already exists')) {
            process.stdout.write(`   [${i + 1}/${statements.length}] ${preview} ⚠️  已存在，跳過\n`);
            successCount++;
          } else {
            throw error;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`\n   ❌ 錯誤: ${err.message}`);
        errorCount++;

        // 不要因為單一錯誤就停止，繼續執行
        if (err.message.includes('permission denied') || err.message.includes('already exists')) {
          continue;
        }
      }
    }

    console.log(`\n\n✅ Migration 完成！`);
    console.log(`   成功: ${successCount} 個語句`);
    console.log(`   失敗: ${errorCount} 個語句\n`);

    if (errorCount === 0) {
      console.log('🎉 所有資料表已建立！');
    } else {
      console.log('⚠️  有部分語句執行失敗，請檢查錯誤訊息');
    }

    console.log('\n💡 替代方案：');
    console.log('   如果自動執行失敗，請手動執行：');
    console.log('   1. 前往 https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/editor');
    console.log('   2. 點擊 SQL Editor');
    console.log('   3. 複製貼上 supabase-migration.sql');
    console.log('   4. 點擊 Run');

  } catch (error) {
    console.error('❌ 執行失敗：', error.message);
    console.error('\n💡 這個方法需要在 Supabase 建立一個 exec 函數');
    console.error('   或者直接在 Supabase Dashboard 執行 SQL 會更簡單！');

    console.log('\n📝 請手動執行以下步驟：');
    console.log('   1. 前往 https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/editor');
    console.log('   2. 點擊 SQL Editor');
    console.log('   3. 複製貼上專案根目錄的 supabase-migration.sql');
    console.log('   4. 點擊 Run (綠色按鈕)');
    console.log('\n   只需要 30 秒！✨');
  }
}

runMigration();
