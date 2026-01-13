const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function fixEmployeeAuth() {
  // 查詢 E001 員工的詳細資訊，包含 workspace
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, employee_number, email, chinese_name, supabase_user_id, workspace_id')
    .eq('employee_number', 'E001')
    .order('workspace_id');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('所有 E001 員工：');
  console.log('----------------------------');
  for (const emp of employees) {
    // 查詢 workspace 名稱
    const { data: ws } = await supabase
      .from('workspaces')
      .select('name, code')
      .eq('id', emp.workspace_id)
      .single();

    console.log(`${emp.employee_number} | ${emp.chinese_name} | workspace: ${ws?.name} (${ws?.code})`);
    console.log(`  id: ${emp.id}`);
    console.log(`  email: ${emp.email || '(無)'}`);
    console.log(`  supabase_user_id: ${emp.supabase_user_id || '(未設定)'}`);
    console.log('');
  }

  // williamchien.corner@gmail.com 的 auth user id
  const targetAuthUid = '099a709d-ba03-4bcf-afa9-d6c332d7c052';

  // 找到需要更新的員工（William Chien 或角落旅遊的 E001）
  const cornerEmployee = employees.find(e => e.chinese_name === 'William Chien' || e.email === 'william@venturo.internal');

  if (cornerEmployee) {
    console.log('----------------------------');
    console.log(`將更新 ${cornerEmployee.chinese_name} 的 supabase_user_id`);
    console.log(`舊值: ${cornerEmployee.supabase_user_id || '(無)'}`);
    console.log(`新值: ${targetAuthUid}`);

    const { error: updateError } = await supabase
      .from('employees')
      .update({ supabase_user_id: targetAuthUid })
      .eq('id', cornerEmployee.id);

    if (updateError) {
      console.error('更新失敗:', updateError);
    } else {
      console.log('✅ 更新成功！');
    }
  } else {
    console.log('找不到需要更新的員工');
  }
}

fixEmployeeAuth();
