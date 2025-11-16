const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

(async () => {
  console.log('檢查 quotes 表格結構...\n');
  const { data, error } = await supabase.from('quotes').select('*').limit(1);
  if (error) {
    console.log('❌ Error:', error.message);
  } else if (data.length > 0) {
    console.log('✅ Quotes 欄位:', Object.keys(data[0]).sort());
  }

  console.log('\n檢查缺少 workspace_id 的資料...\n');
  const { data: nullQuotes, error: qError } = await supabase.from('quotes').select('id, code, workspace_id').is('workspace_id', null);
  if (qError) {
    console.log('❌ Error:', qError.message);
  } else if (nullQuotes.length > 0) {
    console.log('❌ Quotes 缺少 workspace_id:');
    nullQuotes.forEach(q => console.log('  -', q.code || q.id));
  } else {
    console.log('✅ 所有 quotes 都有 workspace_id');
  }

  const { data: nullEvents, error: eError } = await supabase.from('calendar_events').select('id, title, workspace_id').is('workspace_id', null);
  if (eError) {
    console.log('\n❌ Error:', eError.message);
  } else if (nullEvents.length > 0) {
    console.log('\n❌ Calendar Events 缺少 workspace_id:');
    nullEvents.forEach(e => console.log('  -', e.title || e.id));
  } else {
    console.log('\n✅ 所有 calendar_events 都有 workspace_id');
  }
})();
