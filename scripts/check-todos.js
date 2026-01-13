const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function checkTodos() {
  // 1. 查詢所有代辦事項
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .limit(20);

  if (error) {
    console.error('查詢 todos 錯誤:', error);
    return;
  }

  console.log('總共有 ' + (todos?.length || 0) + ' 筆代辦事項');
  console.log('----------------------------');

  if (todos && todos.length > 0) {
    todos.forEach(function(todo) {
      console.log('ID: ' + (todo.id?.substring(0, 8) || 'N/A') + '...');
      console.log('  標題: ' + todo.title);
      console.log('  狀態: ' + todo.status);
      console.log('  workspace_id: ' + todo.workspace_id);
      console.log('  assigned_to: ' + todo.assigned_to);
      console.log('  created_by: ' + todo.created_by);
      console.log('');
    });
  }

  // 2. 查詢 William Chien 的員工資料
  var williamId = '35880209-77eb-4827-84e3-c4e2bc013825';
  const { data: employee } = await supabase
    .from('employees')
    .select('id, employee_number, chinese_name, workspace_id, supabase_user_id')
    .eq('id', williamId)
    .single();

  console.log('----------------------------');
  console.log('William Chien 員工資料:');
  console.log('  id: ' + employee?.id);
  console.log('  workspace_id: ' + employee?.workspace_id);
  console.log('  supabase_user_id: ' + employee?.supabase_user_id);

  // 3. 查詢該 workspace 的代辦事項
  if (employee?.workspace_id) {
    const { data: workspaceTodos, error: wsError } = await supabase
      .from('todos')
      .select('*')
      .eq('workspace_id', employee.workspace_id);

    console.log('');
    console.log('----------------------------');
    console.log('該 workspace 的代辦事項: ' + (workspaceTodos?.length || 0) + ' 筆');

    if (wsError) {
      console.error('查詢 workspace todos 錯誤:', wsError);
    }
  }

  // 4. 檢查 todos 表總筆數
  console.log('');
  console.log('----------------------------');
  const { count } = await supabase
    .from('todos')
    .select('*', { count: 'exact', head: true });
  console.log('todos 表總筆數: ' + count);
}

checkTodos();
