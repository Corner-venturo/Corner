const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function checkEmployees() {
  console.log('📋 檢查所有員工權限設定...\n');

  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, employee_number, display_name, english_name, permissions, status')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ 查詢失敗:', error.message);
    return;
  }

  console.log('員工總數:', employees.length);
  console.log('\n權限分佈:\n');

  employees.forEach(emp => {
    const perms = emp.permissions || [];
    const number = (emp.employee_number || '').padEnd(15);
    const name = (emp.display_name || '').padEnd(20);
    console.log(`${number} ${name} 權限: ${JSON.stringify(perms)}`);
  });

  const noPermissions = employees.filter(e => !e.permissions || e.permissions.length === 0);
  console.log(`\n⚠️  沒有權限的員工: ${noPermissions.length} 人`);

  if (noPermissions.length > 0) {
    console.log('\n這些員工沒有任何權限（只能看到首頁）：');
    noPermissions.forEach(emp => {
      console.log(`  • ${emp.employee_number} - ${emp.display_name}`);
    });
  }
}

checkEmployees().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
