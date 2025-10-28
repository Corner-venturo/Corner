const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createToursTable() {
  console.log('📝 讀取 SQL migration...');

  const sqlFile = path.join(__dirname, '../supabase/migrations/20251025_create_tours_table.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('🔄 執行 SQL migration...');

  // 分割 SQL 語句（按分號分割，但要注意函數定義中的分號）
  const statements = sql
    .split(/;\s*$$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    console.log(`\n執行語句 ${i + 1}/${statements.length}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // 嘗試直接執行
        console.log('使用替代方法執行...');
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok) {
          console.error(`❌ 執行失敗:`, statement.substring(0, 100) + '...');
          console.error('錯誤:', error);
        } else {
          console.log('✅ 成功');
        }
      } else {
        console.log('✅ 成功');
      }
    } catch (err) {
      console.error(`❌ 執行失敗:`, err.message);
    }
  }

  console.log('\n\n📋 請手動在 Supabase Dashboard 執行完整 SQL:');
  console.log('👉 https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql/new');
  console.log('\n或使用以下指令:');
  console.log('psql 連線字串 < supabase/migrations/20251025_create_tours_table.sql');
}

createToursTable().catch(console.error);
