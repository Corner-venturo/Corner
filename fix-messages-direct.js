/**
 * 直接修復 tours 表格 - 新增 created_by 和 updated_by 欄位
 *
 * 執行方式：node fix-messages-direct.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSQL(description, sql) {
  console.log(`\n🔨 ${description}...`);
  const { data, error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.log(`   ❌ 失敗:`, error.message);
    return false;
  } else {
    console.log(`   ✅ 成功`);
    return true;
  }
}

async function main() {
  console.log('🚀 開始修復 tours 表格...\n');

  // Step 1: Add created_by column
  await executeSQL(
    '新增 created_by 欄位',
    `ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.employees(id);`
  );

  // Step 2: Add updated_by column
  await executeSQL(
    '新增 updated_by 欄位',
    `ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.employees(id);`
  );

  // Step 3: Add comments
  await executeSQL(
    '新增 created_by 註解',
    `COMMENT ON COLUMN public.tours.created_by IS '建立者 (員工 ID)';`
  );

  await executeSQL(
    '新增 updated_by 註解',
    `COMMENT ON COLUMN public.tours.updated_by IS '最後更新者 (員工 ID)';`
  );

  console.log('\n✅ 修復完成！');
  console.log('\n💡 接下來：');
  console.log('   1. 重新整理瀏覽器');
  console.log('   2. 再次建立團體測試');
  console.log('   3. 檢查是否能成功同步到 Supabase\n');
}

main().catch((error) => {
  console.error('❌ 執行失敗:', error);
  process.exit(1);
});
