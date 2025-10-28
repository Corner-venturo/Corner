import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function runMigration() {
  try {
    console.log('🚀 開始執行 migration...\n');

    // 讀取 migration 檔案
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251026040000_create_user_data_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration 檔案載入成功\n');

    // 分割 SQL 語句並執行
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📊 共有 ${statements.length} 個 SQL 語句需要執行\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\s+/g, ' ');

      console.log(`[${i + 1}/${statements.length}] 執行: ${preview}...`);

      try {
        // 使用 Supabase 的 rpc 來執行原始 SQL
        const { data, error } = await supabase.rpc('exec', {
          sql: statement + ';'
        });

        if (error) {
          // 檢查是否為 "already exists" 錯誤
          if (error.message && (
            error.message.includes('already exists') ||
            error.message.includes('重複的鍵')
          )) {
            console.log(`  ✓ 已存在，跳過`);
            skipCount++;
          } else if (error.code === 'PGRST202') {
            // RPC 函數不存在，改用直接的 SQL 執行
            console.log(`  ⚠ RPC 函數不存在，改用直接執行...`);

            // 嘗試使用 PostgREST 的其他方法
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
              method: 'POST',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify({ query: statement + ';' })
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            console.log(`  ✓ 成功`);
            successCount++;
          } else {
            console.error(`  ✗ 錯誤: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`  ✓ 成功`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ✗ 執行失敗: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('執行結果：');
    console.log(`  成功: ${successCount}`);
    console.log(`  跳過: ${skipCount}`);
    console.log(`  錯誤: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
      console.log('\n⚠️  部分語句執行失敗，請檢查上述錯誤訊息');
      console.log('建議：請到 Supabase Dashboard > SQL Editor 手動執行 migration');
      process.exit(1);
    } else {
      console.log('\n✅ Migration 執行完成！');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Migration 執行失敗:', error.message);
    console.error('\n建議：請到 Supabase Dashboard (https://app.supabase.com) > SQL Editor 手動執行 migration');
    console.error('Migration 檔案位置: supabase/migrations/20251026040000_create_user_data_tables.sql');
    process.exit(1);
  }
}

runMigration();
