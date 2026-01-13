const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function checkToursStatus() {
  // 查詢所有旅遊團及其狀態
  const { data: tours, error } = await supabase
    .from('tours')
    .select('id, code, status, proposal_id')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('最近 20 個旅遊團：');
  console.log('----------------------------');
  tours.forEach(tour => {
    const isDirectCreate = !tour.proposal_id;
    console.log(`${tour.code} | 狀態: ${tour.status} | ${isDirectCreate ? '(直接開團)' : '(從提案開團)'}`);
  });

  // 統計
  const directCreateTours = tours.filter(t => !t.proposal_id);
  const proposalCount = directCreateTours.filter(t => t.status === '提案').length;
  const inProgressCount = directCreateTours.filter(t => t.status === '進行中').length;

  console.log('');
  console.log('----------------------------');
  console.log(`直接開團中，狀態為"提案"的: ${proposalCount} 個`);
  console.log(`直接開團中，狀態為"進行中"的: ${inProgressCount} 個`);
}

checkToursStatus();
