/**
 * 檢查 employees 表格 schema
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function check() {
  console.log('檢查 employees 表格欄位...\n');

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ 錯誤:', error.message);
  } else if (data && data.length > 0) {
    console.log('✅ employees 表格欄位:');
    console.log(Object.keys(data[0]).sort().join('\n'));
  } else {
    console.log('⚠️  表格無資料');
  }
}

check();
