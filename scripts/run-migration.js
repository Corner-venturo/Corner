#!/usr/bin/env node
/**
 * 直接執行 Migration SQL
 * 繞過 Supabase CLI 的 SSL 問題
 */

const fs = require('fs');
const path = require('path');

// 讀取環境變數
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 缺少環境變數：NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 讀取 migration SQL
const migrationPath = path.join(__dirname, '../supabase/migrations/20251117122000_update_payment_requests_structure.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 讀取 migration 檔案：', migrationPath);
console.log('🔗 連接到：', SUPABASE_URL);
console.log('');

// 使用 fetch 執行 SQL（透過 Supabase REST API）
async function runMigration() {
  try {
    // 分割 SQL 語句（按 ; 分隔，但保留 function 內的分號）
    const statements = sql
      .split(/;\s*(?=\n|$)/)
      .filter(s => {
        const trimmed = s.trim();
        return trimmed &&
               !trimmed.startsWith('--') &&
               !trimmed.startsWith('BEGIN') &&
               !trimmed.startsWith('COMMIT') &&
               !trimmed.startsWith('DO $$');
      });

    console.log(`📊 共有 ${statements.length} 個 SQL 語句待執行\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      // 顯示正在執行的語句（前 80 個字元）
      const preview = statement.substring(0, 80).replace(/\n/g, ' ');
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);

      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: statement }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`  ❌ 執行失敗：${error}`);
          errorCount++;
        } else {
          console.log(`  ✅ 執行成功`);
          successCount++;
        }
      } catch (error) {
        console.error(`  ❌ 執行錯誤：${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ 成功：${successCount} 個語句`);
    console.log(`❌ 失敗：${errorCount} 個語句`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
      console.log('\n⚠️  部分語句執行失敗，請檢查錯誤訊息');
      process.exit(1);
    } else {
      console.log('\n🎉 Migration 執行完成！');
    }

  } catch (error) {
    console.error('❌ 執行失敗：', error);
    process.exit(1);
  }
}

// 執行
runMigration();
