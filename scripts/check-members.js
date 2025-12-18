const { createClient } = require('@supabase/supabase-js');
const client = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function checkMembers() {
  // 查看 members 表有多少資料
  const { data: members, count, error } = await client
    .from('members')
    .select('*', { count: 'exact' })
    .limit(10);

  console.log('=== members 表 ===');
  console.log('總筆數:', count);

  if (members && members.length > 0) {
    console.log('範例資料:');
    members.slice(0, 5).forEach(m => {
      console.log('  ID:', (m.id || '').slice(0, 8), '| order_id:', (m.order_id || 'null').slice(0, 8), '| name:', m.chinese_name || m.name || 'N/A');
    });
  } else {
    console.log('(空表)');
  }

  // 查看 order_members 表（可能是另一個表）
  const { data: orderMembers, count: omCount, error: omError } = await client
    .from('order_members')
    .select('*', { count: 'exact' })
    .limit(10);

  console.log('\n=== order_members 表 ===');
  if (omError) {
    console.log('表不存在或無法存取:', omError.message);
  } else {
    console.log('總筆數:', omCount);
    if (orderMembers && orderMembers.length > 0) {
      console.log('範例資料:');
      orderMembers.slice(0, 5).forEach(m => {
        console.log('  ID:', (m.id || '').slice(0, 8), '| order_id:', (m.order_id || 'null').slice(0, 8), '| name:', m.chinese_name || m.name || 'N/A');
      });
    }
  }

  // 特別檢查你說的那個訂單
  console.log('\n=== 查詢特定團 TP-SZX26010701 ===');
  const { data: tour } = await client
    .from('tours')
    .select('id, code, name')
    .eq('code', 'TP-SZX26010701')
    .single();

  if (tour) {
    console.log('找到旅遊團:', tour.code, tour.name);

    // 找該團的訂單
    const { data: tourOrders } = await client
      .from('orders')
      .select('id, member_count')
      .eq('tour_id', tour.id);

    console.log('關聯訂單數:', tourOrders?.length || 0);
    if (tourOrders) {
      for (const order of tourOrders) {
        console.log('  訂單', order.id.slice(0, 8), '| member_count:', order.member_count);

        // 查 members 表
        const { count: memberCount } = await client
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', order.id);
        console.log('    members 表實際人數:', memberCount);

        // 查 order_members 表
        const { count: omMemberCount, error: omErr } = await client
          .from('order_members')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', order.id);
        if (omErr) {
          console.log('    order_members 表: 不存在');
        } else {
          console.log('    order_members 表實際人數:', omMemberCount);
        }
      }
    }
  } else {
    console.log('找不到該旅遊團');
  }
}

checkMembers();
