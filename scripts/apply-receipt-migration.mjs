import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 執行收款單 migration...\n');

    // 讀取 migration 檔案
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251101000000_create_receipt_tables.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration 檔案載入成功');
    console.log(`📊 SQL 長度: ${sql.length} 字元\n`);

    // 直接用 fetch 呼叫 Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'text/plain',
      },
      body: sql
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Migration 執行失敗:', errorText);
      console.log('\n💡 建議：請手動到 Supabase Dashboard 執行');
      console.log('   1. 開啟 https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn');
      console.log('   2. 點選 SQL Editor');
      console.log('   3. 複製 supabase/migrations/20251101000000_create_receipt_tables.sql 的內容');
      console.log('   4. 貼上並執行');
      process.exit(1);
    }

    console.log('✅ Migration 執行成功！\n');
    console.log('📊 建立的表格：');
    console.log('   ✓ receipt_orders (收款單主表)');
    console.log('   ✓ receipt_payment_items (收款項目表)');
    console.log('\n🎉 收款單系統已準備就緒！');

  } catch (error) {
    console.error('\n❌ 執行錯誤:', error.message);
    console.log('\n💡 建議：請手動到 Supabase Dashboard 執行');
    console.log('   Dashboard: https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/editor');
    console.log('   Migration: supabase/migrations/20251101000000_create_receipt_tables.sql');
    process.exit(1);
  }
}

applyMigration();
