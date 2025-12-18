// 同步所有訂單的 member_count
// 根據實際 order_members 數量更新

const { createClient } = require('@supabase/supabase-js');

// 使用 service role key 繞過 RLS
const client = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function syncAllOrders() {
  console.log('開始同步訂單人數...\n');

  // 取得所有訂單
  const { data: orders, error: ordersError } = await client
    .from('orders')
    .select('id, member_count');

  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return;
  }

  console.log('總訂單數:', orders.length);

  let updated = 0;
  let mismatched = [];

  for (const order of orders) {
    // 計算該訂單的實際團員數量（從 order_members 表）
    const { count, error: countError } = await client
      .from('order_members')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', order.id);

    if (countError) {
      console.error('Error counting members for order', order.id, ':', countError);
      continue;
    }

    const actualCount = count || 0;
    const storedCount = order.member_count || 0;

    if (actualCount !== storedCount) {
      mismatched.push({
        orderId: order.id,
        stored: storedCount,
        actual: actualCount
      });

      // 更新訂單的 member_count
      const { error: updateError } = await client
        .from('orders')
        .update({ member_count: actualCount })
        .eq('id', order.id);

      if (updateError) {
        console.error('Error updating order', order.id, ':', updateError);
      } else {
        updated++;
      }
    }
  }

  console.log('\n=== 同步結果 ===');
  console.log('不一致的訂單數:', mismatched.length);
  console.log('成功更新:', updated);

  if (mismatched.length > 0) {
    console.log('\n不一致的訂單明細:');
    mismatched.forEach(m => {
      console.log('  訂單', m.orderId.slice(0, 8) + '...', ': 原本', m.stored, '人 → 實際', m.actual, '人');
    });
  }

  console.log('\n完成！');
}

syncAllOrders();
