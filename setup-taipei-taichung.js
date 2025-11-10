const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function setup() {
  console.log('開始設定台北/台中 workspace...\n');
  
  // 1. 建立台北 workspace
  console.log('1. 建立台北辦公室...');
  const { data: taipei, error: taipeiError } = await supabase
    .from('workspaces')
    .insert({
      name: '台北辦公室',
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (taipeiError) {
    console.error('錯誤:', taipeiError.message);
    return;
  }
  console.log('   ✅ 台北辦公室已建立:', taipei.id);
  
  // 2. 建立台中 workspace
  console.log('2. 建立台中辦公室...');
  const { data: taichung, error: taichungError } = await supabase
    .from('workspaces')
    .insert({
      name: '台中辦公室',
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (taichungError) {
    console.error('錯誤:', taichungError.message);
    return;
  }
  console.log('   ✅ 台中辦公室已建立:', taichung.id);
  
  // 3. 取得舊的「總部辦公室」ID
  const { data: oldWorkspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('name', '總部辦公室')
    .single();
  
  if (!oldWorkspace) {
    console.log('\n找不到「總部辦公室」，可能已被刪除');
    return;
  }
  
  console.log('\n3. 將現有資料從「總部辦公室」遷移到「台北辦公室」...');
  console.log('   舊 workspace:', oldWorkspace.id);
  console.log('   新 workspace (台北):', taipei.id);
  
  // 4. 更新所有資料表
  const tables = [
    'tours', 'orders', 'itineraries', 'todos', 'customers',
    'payments', 'payment_requests', 'disbursement_orders',
    'quotes', 'channels', 'messages', 'calendar_events',
    'channel_members', 'channel_groups', 'personal_canvases',
    'rich_documents', 'employees'
  ];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .update({ workspace_id: taipei.id })
      .eq('workspace_id', oldWorkspace.id);
    
    if (error) {
      console.log('   ⚠️  ' + table + ': ' + error.message);
    } else {
      console.log('   ✅ ' + table);
    }
  }
  
  // 5. 刪除舊的「總部辦公室」
  console.log('\n4. 刪除舊的「總部辦公室」...');
  const { error: deleteError } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', oldWorkspace.id);
  
  if (deleteError) {
    console.log('   ⚠️  無法刪除:', deleteError.message);
  } else {
    console.log('   ✅ 已刪除');
  }
  
  console.log('\n=================================');
  console.log('✅ 設定完成！');
  console.log('=================================');
  console.log('台北辦公室 ID:', taipei.id);
  console.log('台中辦公室 ID:', taichung.id);
  console.log('\n所有現有資料已歸屬到台北辦公室');
}

setup();
