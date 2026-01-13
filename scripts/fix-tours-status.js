const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function fixToursStatus() {
  // 查詢所有直接開團但狀態是「提案」的旅遊團
  const { data: tours, error } = await supabase
    .from('tours')
    .select('id, code, status, proposal_id')
    .is('proposal_id', null)
    .eq('status', '提案');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`找到 ${tours.length} 個需要更新的旅遊團：`);
  console.log('----------------------------');
  tours.forEach(tour => {
    console.log(`${tour.code} | 原狀態: ${tour.status}`);
  });

  if (tours.length === 0) {
    console.log('沒有需要更新的旅遊團');
    return;
  }

  // 更新狀態為「進行中」
  const ids = tours.map(t => t.id);
  const { error: updateError } = await supabase
    .from('tours')
    .update({ status: '進行中' })
    .in('id', ids);

  if (updateError) {
    console.error('更新失敗:', updateError);
  } else {
    console.log('');
    console.log('----------------------------');
    console.log(`✅ 已更新 ${tours.length} 個旅遊團的狀態為「進行中」`);
  }
}

fixToursStatus();
