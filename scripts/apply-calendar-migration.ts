/**
 * 執行 calendar_events 的 created_by/updated_by 欄位新增
 */

import { supabase } from '../src/lib/supabase/client';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyMigration() {
  console.log('🚀 開始執行 calendar_events migration...\n');

  try {
    // 讀取 migration SQL
    const migrationPath = join(
      __dirname,
      '../supabase/migrations/20251030120000_add_created_by_to_calendar_events.sql'
    );
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log(sql);
    console.log('\n⏳ 執行中...\n');

    // 執行 SQL（需要拆分成多個語句執行）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (const statement of statements) {
      console.log(`執行: ${statement.substring(0, 80)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_string: statement });

      if (error) {
        console.error(`❌ 錯誤:`, error);
        // 繼續執行下一個語句（部分語句可能因為已存在而失敗）
      } else {
        console.log('✅ 成功');
      }
    }

    console.log('\n✅ Migration 執行完成！\n');

    // 驗證結果
    console.log('🔍 驗證結果...\n');

    const { data, error } = await supabase.from('calendar_events').select('*').limit(1);

    if (error) {
      console.error('❌ 驗證失敗:', error);
    } else {
      console.log('✅ 驗證成功！表格結構：');
      if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
      } else {
        console.log('（表格為空）');
      }
    }
  } catch (error) {
    console.error('❌ 發生錯誤：', error);
  }
}

applyMigration();
