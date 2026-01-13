const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function checkRLS() {
  // 查詢 todos 表的 RLS policies
  const { data, error } = await supabase.rpc('check_rls_policies', { table_name: 'todos' });
  
  if (error) {
    console.log('無法通過 rpc 查詢，嘗試直接查詢...');
    
    // 直接查詢 pg_policies
    const { data: policies, error: pError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'todos');
    
    if (pError) {
      console.log('pg_policies 查詢失敗:', pError.message);
      
      // 使用 SQL 查詢
      const sql = `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename = 'todos';
      `;
      
      console.log('請手動在 Supabase SQL Editor 執行以下查詢：');
      console.log(sql);
    } else {
      console.log('Policies:', policies);
    }
  } else {
    console.log('RLS Policies:', data);
  }
  
  // 測試 get_current_user_workspace 函數
  console.log('\n測試 get_current_user_workspace 函數...');
  const { data: wsData, error: wsError } = await supabase.rpc('get_current_user_workspace');
  console.log('get_current_user_workspace 結果:', wsData, wsError?.message);
}

checkRLS();
