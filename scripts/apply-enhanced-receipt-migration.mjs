#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

console.log('🚀 收款單系統增強 Migration');
console.log('📋 此 migration 將會：');
console.log('   ✓ 新增 receipt_items 表（支援多收款項目）');
console.log('   ✓ 新增批量分配功能到 receipts 表');
console.log('   ✓ 新增離線同步欄位');
console.log('   ✓ 自動遷移現有資料');
console.log('   ✓ 建立便利查詢 View\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    // 讀取 migration 檔案
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251102000000_enhance_receipts_with_items.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration 檔案載入成功');
    console.log(`📊 SQL 長度: ${sql.length} 字元\n`);
    console.log('⏳ 正在執行 migration...\n');

    // 分割 SQL 語句並逐個執行
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ');

      try {
        console.log(`[${i + 1}/${statements.length}] ${preview}...`);

        const { error } = await supabase.rpc('exec', { sql: statement });

        if (error) {
          // 忽略 "already exists" 錯誤
          if (error.message && (
            error.message.includes('already exists') ||
            error.message.includes('duplicate')
          )) {
            console.log('  ⚠️  已存在，跳過');
          } else {
            console.error('  ❌ 錯誤:', error.message);
            errorCount++;
          }
        } else {
          console.log('  ✓');
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ 執行失敗:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('執行結果：');
    console.log(`  成功: ${successCount}`);
    console.log(`  錯誤: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  部分語句執行失敗');
      console.log('\n💡 建議：請手動到 Supabase Dashboard 執行');
      console.log('   1. 開啟 https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/editor');
      console.log('   2. 點選 SQL Editor');
      console.log('   3. 複製 supabase/migrations/20251102000000_enhance_receipts_with_items.sql');
      console.log('   4. 貼上並執行');
      process.exit(1);
    }

    console.log('\n✅ Migration 執行成功！\n');
    console.log('🎉 收款單系統已增強，現在支援：');
    console.log('   ✓ 一張收款單包含多個收款項目');
    console.log('   ✓ 批量分配（一筆款分多訂單）');
    console.log('   ✓ 離線優先同步');
    console.log('   ✓ 收款項目明細查詢');
    console.log('\n📊 新增的表格/View：');
    console.log('   - receipt_items (收款項目表)');
    console.log('   - receipts_with_items (完整視圖)');

  } catch (error) {
    console.error('\n❌ 執行錯誤:', error.message);
    console.log('\n💡 建議：請手動到 Supabase Dashboard 執行');
    console.log('   Dashboard: https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/editor');
    console.log('   Migration: supabase/migrations/20251102000000_enhance_receipts_with_items.sql');
    process.exit(1);
  }
}

applyMigration();
