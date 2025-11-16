// 測試 workspace code 取得邏輯
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function test() {
  // 查詢 workspaces
  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('*');

  if (error) {
    console.error('❌ 查詢失敗:', error);
    return;
  }

  console.log('\n📦 Workspaces:');
  workspaces.forEach(w => {
    console.log(`  - ${w.name} (ID: ${w.id}, Code: ${w.code})`);
  });
}

test().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
