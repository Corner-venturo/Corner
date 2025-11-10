const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function checkSetup() {
  console.log('檢查 workspace 設定...\n');
  
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at');

  if (wsError) {
    console.error('錯誤:', wsError.message);
    return;
  }

  console.log('現有 Workspaces:');
  workspaces.forEach(workspace => {
    console.log('  - ' + workspace.name + ' (' + workspace.id + ')');
  });
  
  console.log('\n是否需要建立台北/台中 workspace？');
  console.log('目前有 ' + workspaces.length + ' 個 workspace');
  
  console.log('\n---\n');
  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, workspace_id');
  
  console.log('員工的 workspace 分配:');
  employees.forEach(emp => {
    const workspace = workspaces.find(w => w.id === emp.workspace_id);
    console.log('  - ' + emp.name + ': ' + (workspace ? workspace.name : '未分配'));
  });
}

checkSetup();
