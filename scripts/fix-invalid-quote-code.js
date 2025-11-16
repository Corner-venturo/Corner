// 修正編號為 -Q001 的報價單
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function fix() {
  console.log('\n🔍 查找編號異常的報價單...\n');

  const { data: invalidQuotes, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('code', '-Q001');

  if (error) {
    console.error('❌ 查詢失敗:', error);
    return;
  }

  if (invalidQuotes.length === 0) {
    console.log('✅ 沒有找到編號為 -Q001 的報價單');
    return;
  }

  console.log(`找到 ${invalidQuotes.length} 筆異常報價單\n`);

  for (const quote of invalidQuotes) {
    const displayName = quote.name || quote.customer_name || '(無名稱)';
    console.log(`  報價單: ${displayName}`);
    console.log(`    類型: ${quote.quote_type}`);
    console.log(`    Workspace ID: ${quote.workspace_id}`);

    // 取得 workspace code
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('code')
      .eq('id', quote.workspace_id)
      .single();

    if (!workspace) {
      console.log('    ❌ 找不到對應的 workspace');
      continue;
    }

    // 計算新編號
    let newCode = '';
    if (quote.quote_type === 'standard') {
      // 團體報價單使用 A 系列
      const { data: existingQuotes } = await supabase
        .from('quotes')
        .select('code')
        .eq('quote_type', 'standard')
        .eq('workspace_id', quote.workspace_id)
        .like('code', workspace.code + '-A%');

      const maxNum = existingQuotes.reduce((max, q) => {
        const match = q.code.match(/A(\d{3})/);
        if (match) {
          const num = parseInt(match[1], 10);
          return Math.max(max, num);
        }
        return max;
      }, 0);

      newCode = workspace.code + '-A' + String(maxNum + 1).padStart(3, '0');
    }

    console.log(`    新編號: ${newCode}\n`);

    // 更新編號
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ code: newCode })
      .eq('id', quote.id);

    if (updateError) {
      console.error('    ❌ 更新失敗:', updateError);
    } else {
      console.log('    ✅ 已更新\n');
    }
  }
}

fix().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
