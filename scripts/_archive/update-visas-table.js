/**
 * 直接更新 Supabase visas 表結構
 * 執行方式：node scripts/update-visas-table.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 讀取環境變數
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateVisasTable() {
  console.log('🔧 開始更新 Supabase visas 表結構...\n');

  try {
    // 讀取 SQL 檔案
    const sqlPath = path.join(__dirname, '..', 'supabase-migration-visas-update.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📄 SQL 檔案內容：');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log();

    // 執行 SQL
    console.log('⚡ 執行 SQL migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ 執行失敗:', error);
      console.log('\n⚠️  注意：Supabase 的 anon key 無法直接執行 DDL（CREATE/DROP TABLE）');
      console.log('📝 請手動到 Supabase Dashboard > SQL Editor 執行以下檔案：');
      console.log('   supabase-migration-visas-update.sql\n');
      console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql\n');
      process.exit(1);
    }

    console.log('✅ 更新成功！', data);
  } catch (err) {
    console.error('❌ 錯誤:', err.message);
    console.log('\n⚠️  看起來無法透過程式直接執行 DDL');
    console.log('📝 請手動到 Supabase Dashboard > SQL Editor 執行：\n');
    console.log('   supabase-migration-visas-update.sql\n');
    console.log('🔗 Dashboard 連結：');
    console.log('   https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql\n');
  }
}

updateVisasTable();
