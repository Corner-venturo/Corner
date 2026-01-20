import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function check() {
  // 先找到这个团
  const { data: tour, error: tourError } = await supabase
    .from('tours')
    .select('id, code')
    .ilike('code', '%KIX260220A%')
    .single();

  if (tourError || !tour) {
    console.log('找不到團:', tourError?.message);
    return;
  }

  console.log('團號:', tour.code);
  console.log('團 ID:', tour.id);

  // 找到該團的所有訂單
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('tour_id', tour.id);

  console.log('訂單數:', orders?.length || 0);

  // 也搜尋訂單編號包含團號的訂單
  const { data: ordersByCode } = await supabase
    .from('orders')
    .select('id, order_number, tour_id')
    .ilike('order_number', '%KIX260220A%');

  console.log('透過訂單編號搜尋到的訂單:', ordersByCode?.length || 0);
  if (ordersByCode && ordersByCode.length > 0) {
    ordersByCode.forEach(o => {
      console.log('  -', o.order_number, 'tour_id:', o.tour_id);
    });
  }

  // 合併所有訂單 ID
  const allOrderIds = new Set();
  orders?.forEach(o => allOrderIds.add(o.id));
  ordersByCode?.forEach(o => allOrderIds.add(o.id));

  const orderIds = Array.from(allOrderIds);
  console.log('合併後訂單數:', orderIds.length);

  if (orderIds.length === 0) {
    console.log('找不到任何訂單');
    return;
  }

  // 查詢所有成員
  const { data: members, error: membersError } = await supabase
    .from('order_members')
    .select('id, chinese_name, passport_name, passport_image_url')
    .in('order_id', orderIds)
    .order('created_at', { ascending: true });

  if (membersError) {
    console.log('查詢成員失敗:', membersError.message);
    return;
  }

  console.log('');
  console.log('成員 passport_image_url 狀況:');
  console.log('='.repeat(70));

  members?.forEach((m, i) => {
    const name = m.chinese_name || m.passport_name || '(無名)';
    const hasUrl = m.passport_image_url ? '✓ 有圖片' : '✗ 無圖片';
    console.log(`${(i+1).toString().padStart(2)}. ${name.padEnd(12)} ${hasUrl}`);
    if (m.passport_image_url) {
      console.log(`    URL: ${m.passport_image_url.substring(0, 70)}...`);
    }
  });

  const withUrl = members?.filter(m => m.passport_image_url).length || 0;
  const total = members?.length || 0;
  console.log('='.repeat(70));
  console.log(`總計: ${withUrl}/${total} 位成員有護照圖片`);
}

check();
