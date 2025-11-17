const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function verify() {
  console.log('驗證 workspace 設定...\n');
  
  // 檢查 workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .order('name');
  
  console.log('現有 Workspaces:');
  workspaces.forEach(ws => {
    console.log('  - ' + ws.name + ' (' + ws.id + ')');
  });
  
  // 檢查員工分配
  console.log('\n員工分配:');
  const { data: employees } = await supabase
    .from('employees')
    .select('name, workspace_id');
  
  if (employees && employees.length > 0) {
    employees.forEach(emp => {
      const ws = workspaces.find(w => w.id === emp.workspace_id);
      console.log('  - ' + emp.name + ': ' + (ws ? ws.name : '未分配'));
    });
  }
  
  // 檢查各表格的資料分佈
  console.log('\n資料分佈 (台北/台中):');
  const tables = ['tours', 'orders', 'todos', 'quotes', 'calendar_events', 'messages'];
  
  const taipei = workspaces.find(w => w.name === '台北辦公室');
  const taichung = workspaces.find(w => w.name === '台中辦公室');
  
  for (const table of tables) {
    const { count: taipeiCount } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', taipei.id);
    
    const { count: taichungCount } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', taichung.id);
    
    console.log('  ' + table.padEnd(20) + ' 台北: ' + (taipeiCount || 0) + '  台中: ' + (taichungCount || 0));
  }
}

verify();
