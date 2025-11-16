// 測試 workspace 載入邏輯
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function test() {
  console.log('\n📦 檢查 Workspaces...\n');

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at');

  if (error) {
    console.error('❌ 查詢失敗:', error);
    return;
  }

  workspaces.forEach(w => {
    console.log(`  ${w.name} (ID: ${w.id})`);
    console.log(`    Code: ${w.code}`);
    console.log('');
  });

  console.log('\n📋 檢查最近的報價單...\n');

  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('id, code, name, customer_name, quote_type, workspace_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (quotesError) {
    console.error('❌ 查詢失敗:', quotesError);
    return;
  }

  quotes.forEach(q => {
    const workspace = workspaces.find(w => w.id === q.workspace_id);
    const displayName = q.quote_type === 'quick' ? q.customer_name : q.name;
    console.log(`  ${q.code} - ${displayName}`);
    console.log(`    類型: ${q.quote_type}`);
    console.log(`    Workspace: ${workspace ? workspace.name : '(無)'}`);
    console.log('');
  });
}

test().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
