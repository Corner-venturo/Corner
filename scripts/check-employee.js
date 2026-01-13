const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function checkEmployee() {
  // 查詢員工資料
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_number, email, chinese_name, supabase_user_id')
    .order('employee_number');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('員工資料：');
  console.log('----------------------------');
  data.forEach(function(emp) {
    console.log(emp.employee_number + ' | ' + emp.chinese_name + ' | ' + emp.email + ' | supabase_user_id: ' + (emp.supabase_user_id || '(未設定)'));
  });

  // 查詢 auth.users 中 williamchien.corner@gmail.com 的資料
  console.log('');
  console.log('----------------------------');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }

  const williamUser = authUsers.users.find(u => u.email === 'williamchien.corner@gmail.com');
  if (williamUser) {
    console.log('williamchien.corner@gmail.com 的 auth user:');
    console.log('  id:', williamUser.id);
    console.log('  email:', williamUser.email);
    console.log('  created_at:', williamUser.created_at);
  } else {
    console.log('找不到 williamchien.corner@gmail.com 的 auth user');
  }
}

checkEmployee();
